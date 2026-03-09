/**
 * @nemesis-js/validation - ClassValidator Adapter
 *
 * Validates DTO class instances using `class-validator` decorators.
 * Uses `class-transformer` to convert plain objects to class instances.
 */

import { BadRequestException } from '@nemesis-js/common';
import type { Type } from '@nemesis-js/common';
import type { IValidationAdapter, ValidationPipeOptions } from '../interfaces.js';

/** Primitive types that should never be passed through class-validator */
const PRIMITIVES = new Set([String, Boolean, Number, Array, Object, Function, Symbol, BigInt]);

/**
 * @class ClassValidatorAdapter
 * @classdesc Delegates validation to `class-validator` + `class-transformer`.
 * Requires both `class-validator` and `class-transformer` to be installed.
 *
 * @example
 * ```typescript
 * import { IsString, IsEmail, MinLength } from 'class-validator';
 *
 * class CreateUserDto {
 *   @IsString()
 *   @MinLength(2)
 *   name: string;
 *
 *   @IsEmail()
 *   email: string;
 * }
 * ```
 */
export class ClassValidatorAdapter implements IValidationAdapter {
  async validate(
    value: unknown,
    options: ValidationPipeOptions,
    targetType?: Type<unknown>,
    _schema?: unknown,
  ): Promise<unknown> {
    // Skip primitives and untyped params
    if (!targetType || PRIMITIVES.has(targetType as any)) {
      return value;
    }

    let classValidator: typeof import('class-validator');
    let classTransformer: typeof import('class-transformer');

    try {
      [classValidator, classTransformer] = await Promise.all([
        import('class-validator'),
        import('class-transformer'),
      ]);
    } catch {
      throw new Error(
        'class-validator or class-transformer is not installed. ' +
          'Run `bun add class-validator class-transformer` to use the ClassValidator adapter.',
      );
    }

    const { validate } = classValidator;
    const { plainToInstance } = classTransformer;

    const instance = options.transform
      ? plainToInstance(targetType as any, value)
      : Object.assign(new (targetType as any)(), value);

    const errors = await validate(instance as object, {
      whitelist: options.whitelist ?? false,
      forbidNonWhitelisted: options.forbidNonWhitelisted ?? false,
      skipMissingProperties: options.skipMissingProperties ?? true,
    });

    if (errors.length > 0) {
      if (options.disableErrorMessages) {
        throw new BadRequestException({ message: 'Validation failed' });
      }

      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors.map((err) => ({
          property: err.property,
          // Flatten nested constraint messages
          constraints: err.constraints ?? {},
          // Recursively collect child errors
          children: err.children?.map((child) => ({
            property: child.property,
            constraints: child.constraints ?? {},
          })),
        })),
      });
    }

    return instance;
  }
}
