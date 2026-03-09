import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import { Injectable, Controller, Body } from '@nemesis-js/common';
import type { ArgumentMetadata, Type } from '@nemesis-js/common';
import type { RequestContext } from '@nemesis-js/http';
import { ValidationPipe } from '../src/pipe/validation.pipe.js';
import { UseSchema } from '../src/decorators.js';
import { ZodValidationAdapter } from '../src/adapters/zod.adapter.js';
import type { IValidationAdapter, ValidationPipeOptions } from '../src/interfaces.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMetadata(overrides: Partial<ArgumentMetadata> = {}): ArgumentMetadata {
  return { type: 'body', ...overrides };
}

function makePipe(pipeOptions: ValidationPipeOptions = {}): ValidationPipe {
  const adapter = new ZodValidationAdapter();
  // Bypass DI by constructing directly
  return new (ValidationPipe as any)(adapter, { pipeOptions });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('@nemesis-js/validation - ValidationPipe', () => {
  describe('Schema resolution via @UseSchema', () => {
    it('should validate a body param against a @UseSchema schema', async () => {
      const schema = z.object({ name: z.string() });

      @Injectable()
      @Controller('/')
      class SomeController {
        create(@Body() @UseSchema(schema) _body: unknown, _ctx: RequestContext) {}
      }

      const pipe = makePipe();
      const result = await pipe.transform({ name: 'Alice' }, {
        type: 'body',
        target: SomeController,
        methodKey: 'create',
        parameterIndex: 0,
      });
      expect(result).toEqual({ name: 'Alice' });
    });

    it('should throw on invalid data against a @UseSchema schema', async () => {
      const schema = z.object({ age: z.number().min(18) });

      @Injectable()
      @Controller('/')
      class AgeController {
        register(@Body() @UseSchema(schema) _body: unknown, _ctx: RequestContext) {}
      }

      const pipe = makePipe();
      try {
        await pipe.transform({ age: 10 }, {
          type: 'body',
          target: AgeController,
          methodKey: 'register',
          parameterIndex: 0,
        });
        expect(true).toBe(false); // should not reach here
      } catch (err: any) {
        expect(err.getStatus?.()).toBe(400);
      }
    });

    it('should pass through when target/methodKey/parameterIndex are not provided', async () => {
      const pipe = makePipe();
      const input = { anything: true };
      const result = await pipe.transform(input, makeMetadata());
      // No schema → pass through
      expect(result).toEqual(input);
    });
  });

  describe('Options forwarding', () => {
    it('should forward whitelist: true to the adapter', async () => {
      const schema = z.object({ name: z.string() });

      @Injectable()
      @Controller('/')
      class WhitelistController {
        handler(@Body() @UseSchema(schema) _body: unknown, _ctx: RequestContext) {}
      }

      const pipe = makePipe({ whitelist: true });
      const result = await pipe.transform({ name: 'Alice', extra: 'stripped' }, {
        type: 'body',
        target: WhitelistController,
        methodKey: 'handler',
        parameterIndex: 0,
      });
      expect((result as any).name).toBe('Alice');
      expect((result as any).extra).toBeUndefined();
    });

    it('should use default options when no pipeOptions provided', async () => {
      // Default: transform: true, skipMissingProperties: true, etc.
      const pipe = makePipe(); // no options
      // Passes through when no schema
      const result = await pipe.transform(42, makeMetadata({ type: 'query' }));
      expect(result).toBe(42);
    });
  });

  describe('Custom adapter', () => {
    it('should use a custom adapter when provided', async () => {
      let calledWith: unknown[] = [];

      const customAdapter: IValidationAdapter = {
        async validate(value) {
          calledWith = [value];
          return value;
        },
      };

      const pipe = new (ValidationPipe as any)(customAdapter, {});
      await pipe.transform('test', makeMetadata());
      expect(calledWith[0]).toBe('test');
    });
  });
});
