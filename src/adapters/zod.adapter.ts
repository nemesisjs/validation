/**
 * @nemesisjs/validation - Zod Adapter
 */

import { BadRequestException } from '@nemesisjs/common';
import type { IValidationAdapter } from '../interfaces.js';

export class ZodValidationAdapter implements IValidationAdapter {
  async validate(value: unknown, _targetType?: unknown, schema?: any): Promise<any> {
    if (!schema) {
      // If no schema was given via @UseSchema, skip Zod validation
      return value;
    }

    try {
      const { ZodError } = await import('zod');
      try {
        return await schema.parseAsync(value);
      } catch (error: any) {
        if (error instanceof ZodError) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: error.errors,
          });
        }
        throw error;
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new Error('Zod is not installed or schema is invalid. Please install it using `bun add zod`.');
    }
  }
}
