import { describe, it, expect, beforeEach } from 'bun:test';
import { Controller, Body, Param, Injectable } from '@nemesis-js/common';
import type { RequestContext } from '@nemesis-js/http';
import { UseSchema, getParamSchema, SCHEMA_METADATA_KEY } from '../src/decorators.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeSchema = { _brand: 'FakeSchema', parse: () => {} };
const anotherSchema = { _brand: 'AnotherSchema', parse: () => {} };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('@nemesis-js/validation - Decorators', () => {
  describe('@UseSchema', () => {
    it('should store a schema on a body parameter', () => {
      @Injectable()
      @Controller('/')
      class TestController {
        handler(@Body() @UseSchema(fakeSchema) _body: unknown, _ctx: RequestContext) {}
      }

      const schema = getParamSchema(TestController, 'handler', 0);
      expect(schema).toBe(fakeSchema);
    });

    it('should store schemas independently for each parameter', () => {
      @Injectable()
      @Controller('/')
      class MultiParamController {
        handler(
          @Body() @UseSchema(fakeSchema) _body: unknown,
          @Param('id') @UseSchema(anotherSchema) _id: string,
          _ctx: RequestContext,
        ) {}
      }

      const bodySchema = getParamSchema(MultiParamController, 'handler', 0);
      const paramSchema = getParamSchema(MultiParamController, 'handler', 1);

      expect(bodySchema).toBe(fakeSchema);
      expect(paramSchema).toBe(anotherSchema);
    });

    it('should scope schemas to the method they are on', () => {
      @Injectable()
      @Controller('/')
      class ScopedController {
        createUser(@Body() @UseSchema(fakeSchema) _body: unknown, _ctx: RequestContext) {}
        updateUser(@Body() @UseSchema(anotherSchema) _body: unknown, _ctx: RequestContext) {}
      }

      const createSchema = getParamSchema(ScopedController, 'createUser', 0);
      const updateSchema = getParamSchema(ScopedController, 'updateUser', 0);

      expect(createSchema).toBe(fakeSchema);
      expect(updateSchema).toBe(anotherSchema);
    });

    it('should not throw when applied to a constructor parameter (graceful skip)', () => {
      // @UseSchema on a constructor param is invalid — it should be a no-op
      expect(() => {
        const decorator = UseSchema(fakeSchema);
        decorator({} as object, undefined, 0);
      }).not.toThrow();
    });

    it('should return undefined for a parameter without @UseSchema', () => {
      @Injectable()
      @Controller('/')
      class NoSchemaController {
        handler(@Body() _body: unknown, _ctx: RequestContext) {}
      }

      const schema = getParamSchema(NoSchemaController, 'handler', 1);
      expect(schema).toBeUndefined();
    });
  });

  describe('getParamSchema', () => {
    it('should return undefined for a class with no schemas registered', () => {
      class PlainClass {}
      const schema = getParamSchema(PlainClass as any, 'nonExistentMethod', 0);
      expect(schema).toBeUndefined();
    });

    it('should read back the metadata stored via the SCHEMA_METADATA_KEY', () => {
      @Controller('/')
      class DirectMetaController {
        create(@Body() @UseSchema(fakeSchema) _body: unknown, _ctx: RequestContext) {}
      }

      const raw = Reflect.getOwnMetadata(SCHEMA_METADATA_KEY, DirectMetaController, 'create');
      expect(raw).toBeDefined();
      expect(raw[0]).toBe(fakeSchema);
    });
  });
});
