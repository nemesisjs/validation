/**
 * @nemesisjs/validation - ClassValidator Adapter
 */

import { BadRequestException } from '@nemesisjs/common';
import type { IValidationAdapter } from '../interfaces.js';

export class ClassValidatorAdapter implements IValidationAdapter {
  async validate(value: unknown, targetType?: any, _schema?: any): Promise<any> {
    // If a metatype wasn't passed or it's a primitive wrapper, skip validation
    if (!targetType) return value;
    const isPrimitive = [String, Boolean, Number, Array, Object].includes(targetType);
    if (isPrimitive) return value;

    try {
      const { validate } = await import('class-validator');
      const { plainToInstance } = await import('class-transformer');

      // Transform generic Object into the DTO class instance if needed
      const objectToValidate = plainToInstance(targetType, value as any);
      
      const errors = await validate(objectToValidate);

      if (errors.length > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errors.map((err: any) => ({
            property: err.property,
            constraints: err.constraints,
          })),
        });
      }

      return objectToValidate;
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      throw new Error('class-validator or class-transformer is missing. Install them via `bun add class-validator class-transformer`.');
    }
  }
}
