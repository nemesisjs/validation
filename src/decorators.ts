/**
 * @nemesisjs/validation - Decorators
 */
import 'reflect-metadata';

export const SCHEMA_METADATA_KEY = 'nemesis:validation:schema';

/**
 * Assigns a specific validation schema (e.g., Zod or Valibot) to a route parameter.
 * Should be used in conjunction with @Body(), @Query(), or @Param().
 *
 * @param schema The validation schema object from your library of choice
 *
 * @example
 * ```typescript
 *  @Post('/users')
 *  createUser(
 *    @Body() @UseSchema(createUserSchema) body: any
 *  ) { ... }
 * ```
 */
export function UseSchema(schema: any): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) return;
    
    // We store the schema securely per parameter index on the method.
    const schemas = (Reflect as any).getOwnMetadata(SCHEMA_METADATA_KEY, target.constructor, propertyKey) || {};
    schemas[parameterIndex] = schema;
    (Reflect as any).defineMetadata(SCHEMA_METADATA_KEY, schemas, target.constructor, propertyKey);
  };
}
