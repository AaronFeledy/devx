# rest

This package provides the DevX REST API as an Elysia app factory with dependency injection. It is not a standalone server; instead, you create an app instance by injecting your own dependencies (such as a stack manager and logger).

To install dependencies:

```bash
bun install
```

## Usage

To create an Elysia app instance:

```ts
import { createApp } from '@devx/rest';
import { logger } from '@devx/common';
import * as stackManager from '@devx/stack';

const app = createApp({ stackManager, logger });
app.listen(3000);
```

You must provide implementations for the required dependencies. This makes the API easy to test and integrate in different environments.

## Testing

To run unit tests for this package:

```sh
bun test
```

This will execute all tests in the `test/` directory using Bun's test runner. The tests use dependency injection to provide mock implementations for all dependencies.
