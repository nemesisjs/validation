/**
 * @nemesisjs/validation - ValidationPipe
 *
 * A global pipe that intercepts every decorated parameter and runs it through
 * the active validation adapter (Zod, Valibot, or class-validator).
 */

import { Injectable, Inject, type PipeTransform, type ArgumentMetadata } from '@nemesisjs/common';
import {
  VALIDATION_ADAPTER,
  VALIDATION_OPTIONS,
  type IValidationAdapter,
  type ValidationModuleOptions,
  type ValidationPipeOptions,
} from '../interfaces.js';
import { SCHEMA_METADATA_KEY } from '../decorators.js';

/** Default options applied when none are explicitly provided */
const DEFAULT_OPTIONS: Required<ValidationPipeOptions> = {
  whitelist: false,
  forbidNonWhitelisted: false,
  transform: true,
  disableErrorMessages: false,
  skipMissingProperties: true,
};

/**
 * @class ValidationPipe
 * @classdesc Reads the schema attached via `@UseSchema()` or the reflected metatype
 * and delegates validation to the configured adapter. Works as a global pipe via
 * `app.useGlobalPipes(app.get(ValidationPipe))` or as a method/parameter-level pipe.
 *
 * @example Global usage
 * ```typescript
 * const app = await createHttpApp(AppModule);
 * app.useGlobalPipes(app.get(ValidationPipe));
 * ```
 *
 * @example Manual instantiation with options
 * ```typescript
 * app.useGlobalPipes(new ValidationPipe(adapter, { whitelist: true, transform: true }));
 * ```
 */
@Injectable()
export class ValidationPipe implements PipeTransform {
  private readonly options: Required<ValidationPipeOptions>;

  constructor(
    @Inject(VALIDATION_ADAPTER) private readonly adapter: IValidationAdapter,
    @Inject(VALIDATION_OPTIONS) moduleOptions?: ValidationModuleOptions,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...(moduleOptions?.pipeOptions ?? {}) };
  }

  /**
   * Transform and validate a single parameter value.
   *
   * @param value - The raw parameter value extracted from the request
   * @param metadata - Metadata about the parameter (type, metatype, decorators, etc.)
   * @returns The validated — and optionally transformed — value
   */
  async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    const { metatype, type, target, methodKey, parameterIndex } = metadata;

    // Retrieve the schema attached via @UseSchema(), if any
    let schema: unknown = undefined;
    if (target && methodKey && parameterIndex !== undefined) {
      const schemas: Record<number, unknown> =
        Reflect.getOwnMetadata(SCHEMA_METADATA_KEY, target, methodKey) ?? {};
      schema = schemas[parameterIndex];
    }

    return this.adapter.validate(value, this.options, metatype, schema, type);
  }
}
