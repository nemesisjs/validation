/**
 * @nemesisjs/validation - ValidationModule
 *
 * Dynamic module that configures the validation adapter, registers the
 * `ValidationPipe`, and exports everything needed to validate request params.
 */

import { Module, type DynamicModule, type Provider, type Type } from '@nemesisjs/common';
import {
  type IValidationAdapter,
  type ValidationModuleOptions,
  VALIDATION_ADAPTER,
  VALIDATION_OPTIONS,
} from './interfaces.js';
import { ValidationPipe } from './pipe/validation.pipe.js';
import { ZodValidationAdapter } from './adapters/zod.adapter.js';
import { ValibotValidationAdapter } from './adapters/valibot.adapter.js';
import { ClassValidatorAdapter } from './adapters/class-validator.adapter.js';

@Module({})
export class ValidationModule {
  /**
   * Configure the validation module for the application.
   *
   * @param options - Adapter selection, global flag, and default pipe options
   * @returns A `DynamicModule` ready to be added to `AppModule.imports`
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     ValidationModule.forRoot({
   *       adapter: 'zod',
   *       isGlobal: true,
   *       pipeOptions: { whitelist: true, transform: true },
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(options: ValidationModuleOptions = {}): DynamicModule {
    const AdapterClass = ValidationModule.resolveAdapter(options.adapter);

    const adapterProvider: Provider = {
      provide: VALIDATION_ADAPTER,
      useClass: AdapterClass,
    };

    const optionsProvider: Provider = {
      provide: VALIDATION_OPTIONS,
      useValue: options,
    };

    return {
      module: ValidationModule,
      providers: [
        optionsProvider,
        adapterProvider,
        ValidationPipe,
      ],
      exports: [adapterProvider, ValidationPipe],
      global: options.isGlobal ?? false,
    };
  }

  // ─── Private ─────────────────────────────────────────────────────────

  /**
   * Resolve the adapter string/class to an `IValidationAdapter` class.
   *
   * @param adapter - The adapter option from `ValidationModuleOptions`
   * @returns The adapter class constructor
   */
  private static resolveAdapter(
    adapter: ValidationModuleOptions['adapter'],
  ): Type<IValidationAdapter> {
    if (typeof adapter === 'function') {
      return adapter;
    }

    switch (adapter) {
      case 'zod':
        return ZodValidationAdapter;
      case 'valibot':
        return ValibotValidationAdapter;
      case 'class-validator':
      default:
        return ClassValidatorAdapter;
    }
  }
}
