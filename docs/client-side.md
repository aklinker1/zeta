# Client Side

You have two options for creating a type-safe API client:

[[toc]]

## Generate API Client using OpenAPI spec

For example, with <https://openapi-generator.tech>:

```sh
openapi-generator generate \
  -i https://api.example.com/openapi.json \
  -g typescript-fetch \
  -o ./generated-client
```

## Using `@aklinker1/zeta/client`

Zeta provides a type-safe API client out of the box. It only works if your frontend code is in the same project as your backend code.

```ts
import type { app } from '../server/app';
import { createAppClient } from '@aklinker1/zeta/client'

const client = createAppClient<typeof app>({
  // options
})
```

It's a basic wrapper around `fetch`.
