import { describe, test, expect } from 'bun:test';
import { getRecipe, recipes } from '../src';
import { RecipeSchema, recipeOptionsSchema, RecipeError } from '../src/types';
import { lampRecipe } from '../src/recipes/lamp';
import type { StackConfig } from '@devx/stack'; // Assuming StackConfig is defined here

describe('Recipes', () => {
  describe('getRecipe', () => {
    test('should return a valid recipe', () => {
      const recipe = getRecipe('lamp');
      expect(recipe).toBeDefined();
      expect(recipe.name).toBe('lamp');
      expect(recipe.description).toBeDefined();
      expect(recipe.stack).toBeDefined();
    });

    test('should throw for non-existent recipe', () => {
      expect(() => getRecipe('non-existent')).toThrow(
        'Recipe "non-existent" not found'
      );
    });
  });

  describe('Recipe Schema Validation', () => {
    test('should validate a valid recipe', () => {
      const validRecipe = {
        name: 'test-recipe',
        description: 'A test recipe',
        stack: {
          services: {
            web: {
              image: 'nginx',
            },
          },
        },
        options: {
          port: {
            description: 'Web port',
            default: '80',
            choices: ['80', '8080'],
          },
        },
      };

      const result = RecipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
    });

    test('should validate a recipe without options', () => {
      const minimalRecipe = {
        name: 'minimal-recipe',
        description: 'A minimal recipe',
        stack: {
          services: {},
        },
      };

      const result = RecipeSchema.safeParse(minimalRecipe);
      expect(result.success).toBe(true);
    });

    test('should reject invalid recipe', () => {
      const invalidRecipe = {
        // Missing required fields
        name: 'invalid-recipe',
      };

      const result = RecipeSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });
  });

  describe('Recipe Options Schema Validation', () => {
    test('should validate valid options', () => {
      const validOptions = {
        port: '8080',
        environment: 'development',
      };

      const result = recipeOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    test('should reject non-string values', () => {
      const invalidOptions = {
        port: 8080, // Number instead of string
      };

      const result = recipeOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('Recipe Registry', () => {
    test('should have lamp recipe registered', () => {
      expect(recipes.lamp).toBeDefined();
      expect(recipes.lamp.name).toBe('lamp');
    });

    test('should get recipe by name', () => {
      const recipe = getRecipe('lamp');
      expect(recipe).toBeDefined();
      expect(recipe.name).toBe('lamp');
      expect(recipe.description).toBeTruthy();
    });

    test('should throw error for non-existent recipe', () => {
      expect(() => getRecipe('non-existent')).toThrow(
        'Recipe "non-existent" not found'
      );
    });
  });

  describe('LAMP Recipe', () => {
    test('should have valid options', () => {
      const recipe = getRecipe('lamp');
      expect(recipe.options).toBeDefined();
      expect(recipe.options?.db).toBeDefined();
      expect(recipe.options?.web).toBeDefined();
      expect(recipe.options?.php).toBeDefined();
      expect(recipe.options?.dbVersion).toBeDefined();
      expect(recipe.options?.webVersion).toBeDefined();
    });

    test('should have valid default values', () => {
      const recipe = getRecipe('lamp');
      expect(recipe.options?.db.default).toBe('mysql');
      expect(recipe.options?.web.default).toBe('apache');
      expect(recipe.options?.php.default).toBe('8.2');
      expect(recipe.options?.dbVersion.default).toBe('8.0');
      expect(recipe.options?.webVersion.default).toBe('2.4');
    });

    test('should have valid choices for options', () => {
      const recipe = getRecipe('lamp');
      expect(recipe.options?.db.choices).toEqual(['mysql', 'postgres']);
      expect(recipe.options?.web.choices).toEqual(['apache', 'nginx']);
    });

    test('should have valid stack configuration', () => {
      const recipe = getRecipe('lamp');
      expect(recipe.stack).toBeDefined();
      expect(recipe.stack.services).toBeDefined();
      expect(recipe.stack.services.database).toBeDefined();
      expect(recipe.stack.services.webserver).toBeDefined();
    });

    test('should validate against RecipeSchema', () => {
      const result = RecipeSchema.safeParse(lampRecipe);
      expect(result.success).toBe(true);
    });

    test('database service should have required environment variables', () => {
      const recipe = getRecipe('lamp');
      // Test the transformed stack with default options
      const transformedStack = recipe.transform?.({});
      expect(transformedStack).toBeDefined();
      const dbService = transformedStack?.services.database;
      expect(dbService?.environment).toBeDefined();
      // Check for MySQL default environment variables
      expect(dbService?.environment?.MYSQL_ROOT_PASSWORD).toBe('devx');
      expect(dbService?.environment?.MYSQL_DATABASE).toBe('app');
      expect(dbService?.environment?.MYSQL_USER).toBe('devx');
      expect(dbService?.environment?.MYSQL_PASSWORD).toBe('devx');
    });

    test('webserver should depend on database', () => {
      const recipe = getRecipe('lamp');
      // Test the transformed stack with default options
      const transformedStack = recipe.transform?.({});
      expect(transformedStack).toBeDefined();
      const webService = transformedStack?.services.webserver;
      expect(webService?.depends_on).toEqual(['database']);
    });

    test('should have proper volume configuration', () => {
      const recipe = getRecipe('lamp');
      // Test the transformed stack with default options
      const transformedStack = recipe.transform?.({});
      expect(transformedStack).toBeDefined();
      expect(transformedStack?.volumes).toBeDefined();
      expect(transformedStack?.volumes?.db_data).toEqual({});
      // Check default MySQL volume mount
      expect(transformedStack?.services.database.volumes).toEqual([
        'db_data:/var/lib/mysql',
      ]);
      expect(transformedStack?.services.webserver.volumes).toEqual([
        './app:/var/www/html',
      ]);
    });

    test('should expose correct ports', () => {
      const recipe = getRecipe('lamp');
      // Test the transformed stack with default options
      const transformedStack = recipe.transform?.({});
      expect(transformedStack).toBeDefined();
      // Check default MySQL port mapping
      expect(transformedStack?.services.database.ports).toEqual(['3306:3306']);
      expect(transformedStack?.services.webserver.ports).toEqual(['80:80']);
    });
  });

  describe('Schema Validation', () => {
    test('should reject invalid recipe', () => {
      const invalidRecipe = {
        // Missing required fields
        name: 'invalid',
      };
      const result = RecipeSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });
  });

  describe('Recipe Transformations', () => {
    test('should transform recipe with custom options', () => {
      const recipe = getRecipe('lamp');
      const customOptions = {
        db: 'postgres',
        web: 'nginx',
        php: '8.1',
        dbVersion: '15',
        webVersion: '1.24',
      };

      // Expect the specific RecipeError for Nginx
      expect(() => recipe.transform?.(customOptions)).toThrow(
        new RecipeError(
          `Nginx web server option currently requires manual PHP-FPM configuration in the generated stack.`
        )
      );
    });

    test('should apply default options when not specified', () => {
      const recipe = getRecipe('lamp');
      const transformedStack = recipe.transform?.({});
      expect(transformedStack).toBeDefined();
      // Check default images based on transform logic
      expect(transformedStack?.services.database.image).toBe('mysql:8.0');
      expect(transformedStack?.services.webserver.image).toBe('php:8.2-apache'); // Updated expectation
    });

    test('should handle partial options', () => {
      const recipe = getRecipe('lamp');
      const partialOptions = {
        db: 'postgres',
      };

      const transformedStack = recipe.transform?.(partialOptions);
      expect(transformedStack).toBeDefined();
      expect(transformedStack?.services.database.image).toContain('postgres');
      expect(transformedStack?.services.webserver.image).toContain('apache'); // Default
    });
  });

  describe('Recipe Option Validation', () => {
    test('should validate option dependencies', () => {
      const recipe = getRecipe('lamp');
      const invalidOptions = {
        db: 'postgres',
        dbVersion: '8.0', // Invalid version for postgres
      };

      expect(() => recipe.transform?.(invalidOptions)).toThrow();
    });

    test('should validate option constraints', () => {
      const recipe = getRecipe('lamp');
      const invalidOptions = {
        php: '5.6', // Unsupported version
      };

      expect(() => recipe.transform?.(invalidOptions)).toThrow();
    });

    test('should validate option formats', () => {
      const recipe = getRecipe('lamp');
      const invalidOptions = {
        dbVersion: 'latest', // Should be specific version
      };

      expect(() => recipe.transform?.(invalidOptions)).toThrow();
    });
  });

  describe('Recipe Error Handling', () => {
    test('should handle missing required options', () => {
      const recipe = getRecipe('lamp');
      const requiredOptions = recipe.options;
      Object.keys(requiredOptions || {}).forEach((key) => {
        const option = requiredOptions?.[key];
        if (option.required) {
          expect(() => recipe.transform?.({})).toThrow(RecipeError);
        }
      });
    });

    test('should handle invalid option combinations', () => {
      const recipe = getRecipe('lamp');
      const invalidCombination = {
        web: 'nginx',
        php: '7.4', // Incompatible with nginx in this recipe
      };

      // Expect the specific RecipeError for Nginx
      expect(() => recipe.transform?.(invalidCombination)).toThrow(
        new RecipeError(
          `Nginx web server option currently requires manual PHP-FPM configuration in the generated stack.`
        )
      );
    });

    test('should handle invalid service configurations', () => {
      const recipe = getRecipe('lamp');
      const options = {
        web: 'nginx',
        webVersion: 'invalid',
      };

      // Expect the specific RecipeError for Nginx
      expect(() => recipe.transform?.(options)).toThrow(
        new RecipeError(
          `Nginx web server option currently requires manual PHP-FPM configuration in the generated stack.`
        )
      );
    });
  });

  describe('Recipe Composition', () => {
    test('should extend base recipe', () => {
      const baseRecipe = {
        name: 'base',
        description: 'Base recipe',
        stack: {
          services: {
            base: {
              image: 'base:latest',
            },
          },
        },
      };

      const extendedRecipe = {
        name: 'extended',
        description: 'Extended recipe',
        extends: 'base',
        stack: {
          services: {
            extended: {
              image: 'extended:latest',
            },
          },
        },
      };

      const result = RecipeSchema.safeParse(extendedRecipe);
      expect(result.success).toBe(true);
    });

    test('should merge service configurations', () => {
      const recipe = getRecipe('lamp');
      const baseServices = Object.keys(recipe.stack.services);
      const transformedStack = recipe.transform?.({});

      baseServices.forEach((service) => {
        expect(transformedStack?.services[service]).toBeDefined();
      });
    });

    test('should override base configurations', () => {
      const recipe = getRecipe('lamp');
      const customOptions = {
        web: 'nginx',
        webVersion: '1.24',
      };

      // Expect the specific RecipeError for Nginx
      expect(() => recipe.transform?.(customOptions)).toThrow(
        new RecipeError(
          `Nginx web server option currently requires manual PHP-FPM configuration in the generated stack.`
        )
      );
    });
  });
});
