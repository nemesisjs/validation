/**
 * @nemesisjs/validation - Valibot Adapter
 */

import { BadRequestException } from '@nemesisjs/common';
import type { IValidationAdapter } from '../interfaces.js';

export class ValibotValidationAdapter implements IValidationAdapter {
  async validate(value: unknown, _targetType?: unknown, schema?: any): Promise<any> {
    if (!schema) {
      // If no schema was given via @UseSchema, skip Valibot validation
      return value;
    }

    try {
      const { parseAsync, ValiError } = await import('valibot');
      try {
        return await parseAsync(schema, value);
      } catch (error: any) {
        if (error instanceof ValiError) {
          throw new BadRequestException({
            message: 'Validation failed',
            errors: error.issues,
          });
        }
        throw error;
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new Error('Valibot is not installed or schema is invalid. Please install it using `bun add valibot`.');
    }
  }
}
