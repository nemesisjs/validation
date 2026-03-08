/**
 * @nemesisjs/validation - Zod Adapter
 *
 * Validates values using Zod schemas attached via `@UseSchema()`.
 * Supports whitelist (strip), forbidNonWhitelisted, and structured error reporting.
 */

import { BadRequestException } from '@nemesisjs/common';
import type { IValidationAdapter, ValidationPipeOptions } from '../interfaces.js';

/** A formatted Zod validation error entry */
interface ZodFieldError {
  /** Dot-notation path to the failing field (e.g. `"address.zip"`) */
  path: string;
  /** Human-readable error message */
  message: string;
  /** Zod error code (e.g. `"invalid_type"`, `"too_small"`) */
  code: string;
}

/**
 * @class ZodValidationAdapter
 * @classdesc Delegates validation to Zod's `parseAsync`. Requires `zod` to be installed.
 */
export class ZodValidationAdapter implements IValidationAdapter {
  async validate(
    value: unknown,
    options: ValidationPipeOptions,
    _targetType?: unknown,
    schema?: unknown,
  ): Promise<unknown> {
    // Without a schema there is nothing to validate
    if (!schema) {
      return value;
    }

    let zod: typeof import('zod');
    try {
      zod = await import('zod');
    } catch {
      throw new Error(
        'Zod is not installed. Run `bun add zod` to use the Zod validation adapter.',
      );
    }

    // Apply whitelist / strip option
    let activeSchema: any = schema;
    if (options.whitelist) {
      if (typeof activeSchema.strip === 'function') {
        activeSchema = activeSchema.strip();
      }
      if (options.forbidNonWhitelisted && typeof activeSchema.strict === 'function') {
        activeSchema = activeSchema.strict();
      }
    }

    try {
      return await activeSchema.parseAsync(value);
    } catch (error: unknown) {
      if (error instanceof zod.ZodError) {
        const fieldErrors: ZodFieldError[] = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));

        throw new BadRequestException(
          options.disableErrorMessages
            ? { message: 'Validation failed' }
            : { message: 'Validation failed', errors: fieldErrors },
        );
      }
      throw error;
    }
  }
}
