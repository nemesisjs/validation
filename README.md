# @nemesisjs/validation

The official validation module for the NemesisJS ecosystem. It provides a consistent interface to integrate popular validation libraries seamlessly into your controllers and routes.

## Features

- Flexible and unopinionated validation layer.
- Works out-of-the-box with `@nemesisjs/core` routing decorators.
- Supports multiple validation strategies.

## Supported Libraries

Currently, the following validation libraries are compatible via peer dependencies:

- **[Zod](https://zod.dev/)**
- **[Valibot](https://valibot.dev/)**
- **[class-validator](https://github.com/typestack/class-validator) / class-transformer**

## Installation

You can install this package alongside your preferred validation library via your package manager:

```bash
# Using bun
bun add @nemesisjs/validation zod
```

## Usage

You can use the validation primitives in your NemesisJS controllers to automatically validate incoming request bodies, queries, or parameters.

```typescript
import { Controller, Post, Body } from '@nemesisjs/core';
import { Validate } from '@nemesisjs/validation';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8)
});

@Controller('/users')
export class UserController {
  @Post()
  @Validate({ body: CreateUserSchema })
  create(@Body() body: any) {
    // The body structure is guaranteed to match the CreateUserSchema
    return { success: true, data: body };
  }
}
```

## License

MIT
