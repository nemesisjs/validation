/**
 * @nemesisjs/validation - Decorators
 *
 * Provides `@UseSchema()` for attaching Zod / Valibot schemas to parameters,
 * and convenience method-level decorators `@ValidateBody()` / `@ValidateQuery()`.
 */

export const SCHEMA_METADATA_KEY = 'nemesis:validation:schema';

/**
 * Attaches a validation schema (Zod, Valibot, or any compatible library) to a
 * specific route parameter. Must be combined with a parameter decorator such as
 * `@Body()`, `@Query()`, or `@Param()`.
 *
 * The `ValidationPipe` reads this schema at request time and delegates validation
 * to the active adapter.
 *
 * @param schema - The schema object (e.g. `z.object({...})` or `v.object({...})`)
 * @returns {ParameterDecorator}
 *
 * @example
 * ```typescript
 * const createUserSchema = z.object({ name: z.string(), email: z.string().email() });
 *
 * @Post('/users')
 * createUser(@Body() @UseSchema(createUserSchema) body: CreateUserDto, ctx: RequestContext) { ... }
 * ```
 */
export function UseSchema(schema: unknown): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) return;

    const existing: Record<number, unknown> =
      Reflect.getOwnMetadata(SCHEMA_METADATA_KEY, (target as any).constructor, propertyKey) ?? {};
    existing[parameterIndex] = schema;
    Reflect.defineMetadata(
      SCHEMA_METADATA_KEY,
      existing,
      (target as any).constructor,
      propertyKey,
    );
  };
}

/**
 * Retrieve the schema attached to a specific parameter via `@UseSchema()`.
 *
 * @param target - The controller class constructor
 * @param methodKey - The method name
 * @param parameterIndex - The zero-based parameter index
 * @returns The stored schema, or `undefined` if none was attached
 */
export function getParamSchema(
  target: new (...args: unknown[]) => unknown,
  methodKey: string | symbol,
  parameterIndex: number,
): unknown {
  const schemas: Record<number, unknown> =
    Reflect.getOwnMetadata(SCHEMA_METADATA_KEY, target, methodKey) ?? {};
  return schemas[parameterIndex];
}
