import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import * as v from 'valibot';
import { ZodValidationAdapter } from '../src/adapters/zod.adapter.js';
import { ValibotValidationAdapter } from '../src/adapters/valibot.adapter.js';
import { ClassValidatorAdapter } from '../src/adapters/class-validator.adapter.js';
import type { ValidationPipeOptions } from '../src/interfaces.js';

const DEFAULT_OPTS: ValidationPipeOptions = {
  whitelist: false,
  forbidNonWhitelisted: false,
  transform: true,
  disableErrorMessages: false,
  skipMissingProperties: true,
};

/** Helper: assert a promise rejects with status 400 */
async function expectBadRequest(promise: Promise<unknown>): Promise<void> {
  try {
    await promise;
    expect(true).toBe(false); // should not reach here
  } catch (err: any) {
    expect(err.getStatus?.()).toBe(400);
  }
}

// ─── Zod Adapter ──────────────────────────────────────────────────────────────

describe('@nemesisjs/validation - ZodValidationAdapter', () => {
  const adapter = new ZodValidationAdapter();

  it('should pass through the value when no schema is provided', async () => {
    const input = { name: 'Alice' };
    const result = await adapter.validate(input, DEFAULT_OPTS);
    expect(result).toBe(input);
  });

  it('should return the parsed value for a valid input', async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const input = { name: 'Alice', age: 30 };
    const result = await adapter.validate(input, DEFAULT_OPTS, undefined, schema);
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('should throw BadRequestException (status 400) for invalid input', async () => {
    const schema = z.object({ email: z.string().email() });
    await expectBadRequest(
      adapter.validate({ email: 'not-an-email' }, DEFAULT_OPTS, undefined, schema),
    );
  });

  it('should include field errors in the exception response', async () => {
    const schema = z.object({
      name: z.string().min(2),
      age: z.number().min(18),
    });
    try {
      await adapter.validate({ name: 'A', age: 10 }, DEFAULT_OPTS, undefined, schema);
      expect(true).toBe(false); // should not reach here
    } catch (err: any) {
      const body = err.getResponse?.() ?? {};
      expect(body.errors).toBeDefined();
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should strip unknown fields when whitelist: true', async () => {
    const schema = z.object({ name: z.string() });
    const result = await adapter.validate(
      { name: 'Alice', extra: 'unwanted' },
      { ...DEFAULT_OPTS, whitelist: true },
      undefined,
      schema,
    );
    expect((result as any).name).toBe('Alice');
    expect((result as any).extra).toBeUndefined();
  });

  it('should hide error details when disableErrorMessages: true', async () => {
    const schema = z.object({ id: z.number() });
    try {
      await adapter.validate(
        { id: 'not-a-number' },
        { ...DEFAULT_OPTS, disableErrorMessages: true },
        undefined,
        schema,
      );
    } catch (err: any) {
      const body = err.getResponse?.() ?? {};
      expect(body.errors).toBeUndefined();
      expect(body.message).toBe('Validation failed');
    }
  });

  it('should handle nested object errors with dot-notation paths', async () => {
    const schema = z.object({
      address: z.object({ zip: z.string().regex(/^\d{5}$/, 'Invalid zip') }),
    });
    try {
      await adapter.validate({ address: { zip: 'ABCDE' } }, DEFAULT_OPTS, undefined, schema);
    } catch (err: any) {
      const body = err.getResponse?.() ?? {};
      expect(body.errors[0].path).toBe('address.zip');
    }
  });
});

// ─── Valibot Adapter ──────────────────────────────────────────────────────────

describe('@nemesisjs/validation - ValibotValidationAdapter', () => {
  const adapter = new ValibotValidationAdapter();

  it('should pass through the value when no schema is provided', async () => {
    const input = { name: 'Bob' };
    const result = await adapter.validate(input, DEFAULT_OPTS);
    expect(result).toBe(input);
  });

  it('should return the parsed value for valid input', async () => {
    const schema = v.object({ name: v.string(), price: v.number() });
    const result = await adapter.validate(
      { name: 'Widget', price: 9.99 },
      DEFAULT_OPTS,
      undefined,
      schema,
    );
    expect(result).toEqual({ name: 'Widget', price: 9.99 });
  });

  it('should throw BadRequestException (status 400) for invalid input', async () => {
    const schema = v.object({ name: v.string(), price: v.number() });
    await expectBadRequest(
      adapter.validate({ name: 'Widget', price: 'not-a-number' }, DEFAULT_OPTS, undefined, schema),
    );
  });

  it('should include structured errors in the exception response', async () => {
    // Valibot v0.x uses array-of-validators syntax: v.string([v.email()])
    const schema = v.object({ email: v.string([v.email('Invalid email')]) });
    try {
      await adapter.validate({ email: 'bad' }, DEFAULT_OPTS, undefined, schema);
      expect(true).toBe(false); // should not reach here
    } catch (err: any) {
      const body = err.getResponse?.() ?? {};
      expect(body.errors).toBeDefined();
      expect(body.errors.length).toBeGreaterThan(0);
      expect(typeof body.errors[0].message).toBe('string');
    }
  });

  it('should hide error details when disableErrorMessages: true', async () => {
    const schema = v.object({ id: v.number() });
    try {
      await adapter.validate(
        { id: 'oops' },
        { ...DEFAULT_OPTS, disableErrorMessages: true },
        undefined,
        schema,
      );
    } catch (err: any) {
      const body = err.getResponse?.() ?? {};
      expect(body.errors).toBeUndefined();
      expect(body.message).toBe('Validation failed');
    }
  });
});

// ─── ClassValidator Adapter ───────────────────────────────────────────────────

describe('@nemesisjs/validation - ClassValidatorAdapter', () => {
  const adapter = new ClassValidatorAdapter();

  it('should pass through when no targetType is given', async () => {
    const input = { anything: true };
    const result = await adapter.validate(input, DEFAULT_OPTS);
    expect(result).toBe(input);
  });

  it('should pass through primitive types (String, Number, Boolean, Array, Object)', async () => {
    for (const PrimitiveType of [String, Boolean, Number, Array, Object]) {
      const result = await adapter.validate('hello', DEFAULT_OPTS, PrimitiveType as any);
      expect(result).toBe('hello');
    }
  });

  it('should skip validation when targetType is undefined', async () => {
    const result = await adapter.validate({ x: 1 }, DEFAULT_OPTS, undefined);
    expect(result).toEqual({ x: 1 });
  });
});
