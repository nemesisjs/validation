/**
 * @nemesisjs/validation - Core Interfaces
 */

import type { Type, ParamType } from '@nemesisjs/common';

export interface IValidationAdapter {
  /**
   * Validate the input value against a schema or class.
   *
   * @param value The incoming value to be validated
   * @param targetType The class type (for class-validator)
   * @param schema The schema object (for zod, valibot, etc.)
   * @param paramType The type of parameter being validated (e.g., Body, Query)
   * @returns The validated/transformed value or throws an HttpException
   */
  validate(
    value: unknown,
    targetType?: Type<unknown>,
    schema?: any,
    paramType?: ParamType,
  ): Promise<any>;
}

export interface ValidationModuleOptions {
  /**
   * The validation adapter to use.
   * - 'class-validator': Uses class-validator reflection (default)
   * - 'zod': Uses zod schemas
   * - 'valibot': Uses valibot schemas
   * - Type<IValidationAdapter>: A custom adapter class
   */
  adapter?: 'class-validator' | 'zod' | 'valibot' | Type<IValidationAdapter>;
}

export const VALIDATION_OPTIONS = Symbol('VALIDATION_OPTIONS');
export const VALIDATION_ADAPTER = Symbol('VALIDATION_ADAPTER');
