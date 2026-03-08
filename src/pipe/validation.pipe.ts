/**
 * @nemesisjs/validation - ValidationPipe
 */

import { Injectable, Inject, type PipeTransform, type ArgumentMetadata } from '@nemesisjs/common';
import { VALIDATION_ADAPTER, type IValidationAdapter } from '../interfaces.js';
import { SCHEMA_METADATA_KEY } from '../decorators.js';

@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(
    @Inject(VALIDATION_ADAPTER) private readonly adapter: IValidationAdapter,
  ) {}

  async transform(value: unknown, metadata: ArgumentMetadata): Promise<any> {
    const { metatype, type, target, methodKey, parameterIndex } = metadata;
    
    let schema: any = undefined;

    // Discard any validation if no reflection target exists (can happen on dynamically injected params without method wrapper)
    if (target && methodKey && parameterIndex !== undefined) {
      // Retrive specific schema allocated to this parameter (e.g. Zod or Valibot)
      const schemas = (Reflect as any).getOwnMetadata(SCHEMA_METADATA_KEY, target, methodKey) || {};
      schema = schemas[parameterIndex];
    }

    // Delegate execution to the specific adapter 
    return await this.adapter.validate(value, metatype, schema, type);
  }
}
