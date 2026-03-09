/**
 * @nemesis-js/validation - Core Interfaces
 */

import type { Type, ParamType } from '@nemesis-js/common';

// ─── Validation Adapter ───────────────────────────────────────────────────────

/**
 * Contract that every validation adapter must implement.
 * Adapters translate library-specific validation (Zod, Valibot, class-validator)
 * into NemesisJS's unified exception format.
 */
export interface IValidationAdapter {
  /**
   * Validate and optionally transform the incoming value.
   *
   * @param value - The raw incoming value (body, query param, etc.)
   * @param options - Active pipe options
   * @param targetType - The TypeScript class type inferred via reflection (class-validator path)
   * @param schema - An explicit schema object attached via `@UseSchema()` (Zod / Valibot path)
   * @param paramType - The parameter source (body, query, param…)
   * @returns The validated — and optionally transformed — value
   * @throws {BadRequestException} When validation fails
   */
  validate(
    value: unknown,
    options: ValidationPipeOptions,
    targetType?: Type<unknown>,
    schema?: unknown,
    paramType?: ParamType,
  ): Promise<unknown>;
}

// ─── Pipe Options ─────────────────────────────────────────────────────────────

/**
 * Options for `ValidationPipe`.
 */
export interface ValidationPipeOptions {
  /**
   * Strip properties not included in the DTO / schema.
   * For Zod uses `.strip()`, for Valibot uses `stripUnknown`, for class-validator sets `whitelist: true`.
   * @default false
   */
  whitelist?: boolean;

  /**
   * Throw a `BadRequestException` if non-whitelisted properties are present.
   * Only relevant when `whitelist` is also true.
   * @default false
   */
  forbidNonWhitelisted?: boolean;

  /**
   * Transform plain objects into DTO class instances.
   * Requires class-transformer for the class-validator adapter.
   * @default true
   */
  transform?: boolean;

  /**
   * Omit validation error details from the response body.
   * Useful in production to avoid leaking schema information.
   * @default false
   */
  disableErrorMessages?: boolean;

  /**
   * Skip validation for primitive types (String, Number, Boolean, Array).
   * @default true
   */
  skipMissingProperties?: boolean;
}

// ─── Module Options ───────────────────────────────────────────────────────────

/**
 * Options passed to `ValidationModule.forRoot()`.
 */
export interface ValidationModuleOptions {
  /**
   * The validation adapter to use:
   * - `'zod'` — Zod schemas via `@UseSchema()`
   * - `'valibot'` — Valibot schemas via `@UseSchema()`
   * - `'class-validator'` — class-validator decorators on DTO classes (default)
   * - A custom `Type<IValidationAdapter>` class
   */
  adapter?: 'class-validator' | 'zod' | 'valibot' | Type<IValidationAdapter>;

  /**
   * Register as a global module so you don't need to import it in every feature module.
   * @default false
   */
  isGlobal?: boolean;

  /**
   * Default options forwarded to every `ValidationPipe` instance created by this module.
   */
  pipeOptions?: ValidationPipeOptions;
}

// ─── DI Tokens ────────────────────────────────────────────────────────────────

/** Injection token for the active `IValidationAdapter` */
export const VALIDATION_ADAPTER = Symbol('VALIDATION_ADAPTER');

/** Injection token for the `ValidationModuleOptions` */
export const VALIDATION_OPTIONS = Symbol('VALIDATION_OPTIONS');
