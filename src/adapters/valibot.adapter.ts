/**
 * @nemesisjs/validation - Valibot Adapter
 *
 * Validates values using Valibot schemas attached via `@UseSchema()`.
 * Supports structured error reporting with field paths and messages.
 */

import { BadRequestException } from '@nemesisjs/common';
import type { IValidationAdapter, ValidationPipeOptions } from '../interfaces.js';

/** A formatted Valibot validation error entry */
interface ValibotFieldError {
  /** Dot-notation path to the failing field (e.g. `"user.email"`) */
  path: string;
  /** Human-readable error message */
  message: string;
}

/**
 * @class ValibotValidationAdapter
 * @classdesc Delegates validation to Valibot's `parseAsync`. Requires `valibot` to be installed.
 */
export class ValibotValidationAdapter implements IValidationAdapter {
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

    let valibot: typeof import('valibot');
    try {
      valibot = await import('valibot');
    } catch {
      throw new Error(
        'Valibot is not installed. Run `bun add valibot` to use the Valibot validation adapter.',
      );
    }

    const { parseAsync, ValiError } = valibot;

    try {
      return await parseAsync(schema as any, value);
    } catch (error: unknown) {
      if (error instanceof ValiError) {
        const fieldErrors: ValibotFieldError[] = error.issues.map((issue: any) => ({
          path: Array.isArray(issue.path)
            ? issue.path
                .map((segment: any) =>
                  typeof segment === 'object' ? segment.key ?? '' : segment,
                )
                .filter(Boolean)
                .join('.')
            : '',
          message: issue.message,
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
