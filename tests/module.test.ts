import { describe, it, expect } from 'bun:test';
import { ValidationModule } from '../src/validation.module.js';
import { VALIDATION_ADAPTER, VALIDATION_OPTIONS } from '../src/interfaces.js';
import { ValidationPipe } from '../src/pipe/validation.pipe.js';
import { ZodValidationAdapter } from '../src/adapters/zod.adapter.js';
import { ValibotValidationAdapter } from '../src/adapters/valibot.adapter.js';
import { ClassValidatorAdapter } from '../src/adapters/class-validator.adapter.js';

describe('@nemesisjs/validation - ValidationModule', () => {
  describe('forRoot()', () => {
    it('should return a valid DynamicModule object', () => {
      const module = ValidationModule.forRoot({ adapter: 'zod' });
      expect(module).toBeDefined();
      expect(module.module).toBe(ValidationModule);
      expect(Array.isArray(module.providers)).toBe(true);
      expect(Array.isArray(module.exports)).toBe(true);
    });

    it('should use ZodValidationAdapter when adapter is "zod"', () => {
      const module = ValidationModule.forRoot({ adapter: 'zod' });
      const adapterProvider = module.providers!.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === VALIDATION_ADAPTER,
      ) as any;
      expect(adapterProvider?.useClass).toBe(ZodValidationAdapter);
    });

    it('should use ValibotValidationAdapter when adapter is "valibot"', () => {
      const module = ValidationModule.forRoot({ adapter: 'valibot' });
      const adapterProvider = module.providers!.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === VALIDATION_ADAPTER,
      ) as any;
      expect(adapterProvider?.useClass).toBe(ValibotValidationAdapter);
    });

    it('should use ClassValidatorAdapter when adapter is "class-validator"', () => {
      const module = ValidationModule.forRoot({ adapter: 'class-validator' });
      const adapterProvider = module.providers!.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === VALIDATION_ADAPTER,
      ) as any;
      expect(adapterProvider?.useClass).toBe(ClassValidatorAdapter);
    });

    it('should default to ClassValidatorAdapter when no adapter is specified', () => {
      const module = ValidationModule.forRoot();
      const adapterProvider = module.providers!.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === VALIDATION_ADAPTER,
      ) as any;
      expect(adapterProvider?.useClass).toBe(ClassValidatorAdapter);
    });

    it('should accept a custom adapter class', () => {
      class MyCustomAdapter {
        async validate(value: unknown) {
          return value;
        }
      }
      const module = ValidationModule.forRoot({ adapter: MyCustomAdapter as any });
      const adapterProvider = module.providers!.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === VALIDATION_ADAPTER,
      ) as any;
      expect(adapterProvider?.useClass).toBe(MyCustomAdapter);
    });

    it('should register ValidationPipe as a provider', () => {
      const module = ValidationModule.forRoot({ adapter: 'zod' });
      const hasPipe = module.providers!.some((p) => p === ValidationPipe);
      expect(hasPipe).toBe(true);
    });

    it('should export the adapter provider and ValidationPipe', () => {
      const module = ValidationModule.forRoot({ adapter: 'zod' });
      const exports = module.exports as unknown[];
      const exportsValidationPipe = exports.some((e) => e === ValidationPipe);
      const exportsAdapter = exports.some(
        (e) => typeof e === 'object' && e !== null && 'provide' in e && (e as any).provide === VALIDATION_ADAPTER,
      );
      expect(exportsValidationPipe).toBe(true);
      expect(exportsAdapter).toBe(true);
    });

    it('should store module options under VALIDATION_OPTIONS', () => {
      const pipeOptions = { whitelist: true, transform: false };
      const module = ValidationModule.forRoot({ adapter: 'zod', pipeOptions });
      const optionsProvider = module.providers!.find(
        (p) => typeof p === 'object' && 'provide' in p && p.provide === VALIDATION_OPTIONS,
      ) as any;
      expect(optionsProvider?.useValue?.pipeOptions).toEqual(pipeOptions);
    });

    it('should set global: true when isGlobal is true', () => {
      const module = ValidationModule.forRoot({ isGlobal: true });
      expect(module.global).toBe(true);
    });

    it('should set global: false by default', () => {
      const module = ValidationModule.forRoot();
      expect(module.global).toBe(false);
    });
  });
});
