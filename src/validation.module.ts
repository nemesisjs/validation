/**
 * @nemesisjs/validation - ValidationModule
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
   * Configure the global validation module.
   * By default, it uses `class-validator`.
   *
   * @param options Configuration options for the validation module
   */
  static forRoot(options: ValidationModuleOptions = {}): DynamicModule {
    let AdapterClass: Type<IValidationAdapter>;

    if (typeof options.adapter === 'function') {
      AdapterClass = options.adapter;
    } else {
      switch (options.adapter) {
        case 'zod':
          AdapterClass = ZodValidationAdapter;
          break;
        case 'valibot':
          AdapterClass = ValibotValidationAdapter;
          break;
        case 'class-validator':
        default:
          AdapterClass = ClassValidatorAdapter;
          break;
      }
    }

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
        { provide: ValidationPipe, useClass: ValidationPipe as unknown as Type<unknown> }
      ],
      exports: [adapterProvider, ValidationPipe as unknown as Type<unknown>],
      global: true, // Make the pipe and adapter available application-wide
    };
  }
}
