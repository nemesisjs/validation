/**
 * @nemesis-js/validation - Public API
 *
 * Validation library for NemesisJS supporting Zod, Valibot, and class-validator.
 */

// ─── Interfaces & Types ───────────────────────────────────────────────────────
export type {
  IValidationAdapter,
  ValidationModuleOptions,
  ValidationPipeOptions,
} from './interfaces.js';
export { VALIDATION_ADAPTER, VALIDATION_OPTIONS } from './interfaces.js';

// ─── Decorators ──────────────────────────────────────────────────────────────
export { UseSchema, getParamSchema, SCHEMA_METADATA_KEY } from './decorators.js';

// ─── Pipe ─────────────────────────────────────────────────────────────────────
export { ValidationPipe } from './pipe/validation.pipe.js';

// ─── Module ───────────────────────────────────────────────────────────────────
export { ValidationModule } from './validation.module.js';

// ─── Adapters (for custom adapter creation or extension) ─────────────────────
export { ClassValidatorAdapter } from './adapters/class-validator.adapter.js';
export { ZodValidationAdapter } from './adapters/zod.adapter.js';
export { ValibotValidationAdapter } from './adapters/valibot.adapter.js';
