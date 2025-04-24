# @devx/recipes

The recipes package provides a system for creating and managing stack templates in DevX. Recipes allow users to quickly initialize common development environments with configurable options.

## Usage

### Available Recipes

- **LAMP**: Linux, Apache/nginx, MySQL/PostgreSQL, PHP stack
  - Options:
    - `db`: Database type (`mysql` or `postgres`)
      - MySQL uses port 3306 and standard MySQL environment variables
      - PostgreSQL uses port 5432 and standard PostgreSQL environment variables
    - `web`: Web server (`apache` or `nginx`)
      - Apache: Uses PHP with Apache module
      - nginx: Uses PHP-FPM configuration
    - `php`: PHP version (default: `8.2`)
      - Automatically installs required database extensions (pdo_mysql, mysqli for MySQL; pdo_pgsql, pgsql for PostgreSQL)
    - `dbVersion`: Database version (default: `8.0`)
    - `webVersion`: Web server version (default: `2.4`)
  - Features:
    - Automatic database configuration
    - PHP extensions for database connectivity
    - Persistent data storage using Docker volumes
    - Ready-to-use development environment

### Example

```typescript
import { getRecipe } from '@devx/recipes';

// Get the LAMP recipe
const lampRecipe = getRecipe('lamp');

// Initialize with custom options
const stackConfig = await lampRecipe.init({
  db: 'postgres',
  web: 'nginx',
  php: '8.1',
  dbVersion: '14',
  webVersion: '1.25',
});
```

## Creating New Recipes

To create a new recipe:

1. Create a new class implementing the `Recipe` interface
2. Add it to the recipes registry in `src/index.ts`
3. Document the recipe and its options

Example:

```typescript
import { Recipe, RecipeOptions } from './types';

export class MyRecipe implements Recipe {
  name = 'my-recipe';
  description = 'My custom recipe';

  async init(options: RecipeOptions): Promise<StackConfig> {
    // Implementation
  }
}
```

## Error Handling

The package provides a `RecipeError` class for handling recipe-specific errors. All recipes should throw this error type when encountering issues during initialization.
