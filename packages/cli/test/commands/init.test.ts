import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import Init from '../../src/commands/init';
import { existsSync, readFileSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
// Import the real Recipe type for casting, but mock the functions
import type { Recipe } from '@devx/recipes';
import prompts from 'prompts';

// Mock fs operations
mock.module('node:fs', () => ({
  existsSync: mock(() => false), // Default: assume file does not exist
  readFileSync: mock(() => ''), // Default: return empty string
}));
mock.module('node:fs/promises', () => ({
  writeFile: mock(async () => {}),
  mkdir: mock(async () => {}),
}));

// Mock Recipe Data
const mockRecipeData: Recipe = {
  name: 'test-recipe',
  description: 'A test recipe',
  path: '/path/to/test-recipe',
  // Add some mock options for runRecipeInteractiveInit test case
  options: {
    db_version: { description: 'Database Version', default: 'latest' },
    php_version: {
      description: 'PHP Version',
      choices: ['8.1', '8.2'],
      default: '8.2',
    },
  },
  stack: {
    // Base stack config for the recipe
    name: '{{projectName}}', // Example template variable
    version: '1.0',
    services: {
      web: { image: 'nginx:latest' },
    },
  } as any, // Use 'as any' if StackConfig type causes issues here
  files: [
    {
      source: 'docker-compose.yml.hbs',
      destination: 'docker-compose.yml',
    },
  ],
};

// Mock recipes module functions
const mockListRecipes = mock(async (): Promise<Recipe[]> => [mockRecipeData]);
const mockGetRecipe = mock((name: string): Recipe => {
  if (name === 'test-recipe') {
    return mockRecipeData;
  }
  throw new Error(`Recipe "${name}" not found`);
});
mock.module('@devx/recipes', () => ({
  listRecipes: mockListRecipes,
  getRecipe: mockGetRecipe,
  // Keep the Recipe class mock if needed elsewhere, but getRecipe is primary now
  Recipe: function (path: string) {
    return {
      ...mockRecipeData, // Spread mock data
      path,
      getContext: mock(async () => ({ projectName: 'test-project' })),
      renderTemplate: mock(async () => 'rendered content'),
    };
  },
}));

// Mock prompts - Simplified and Corrected
const mockPromptsFn = mock(async (questions: any | any[]) => {
  // Always return a flat object with all potential answers the tests might trigger
  const answers = {
    name: 'test-project', // Use 'name' as shown in init.ts code
    version: '1.0.0', // Add explicit version
    recipeName: 'test-recipe',
    overwrite: true,
    db_version: '15',
    php_version: '8.1',
  };
  console.log('Mock prompts called, returning:', answers); // Add logging
  return answers;
});
mock.module('prompts', () => mockPromptsFn);

// Import prompts AFTER mocking it
import prompts from 'prompts';

describe('Init Command', () => {
  let initCommand: Init;

  beforeEach(() => {
    // Reset mocks
    (existsSync as any).mockClear();
    (writeFile as any).mockClear();
    (mkdir as any).mockClear();
    mockListRecipes.mockClear();
    mockGetRecipe.mockClear(); // Clear the new mock
    mockPromptsFn.mockClear();

    // Reset default implementations
    (existsSync as any).mockReturnValue(false);
    (writeFile as any).mockResolvedValue(undefined);
    (mkdir as any).mockResolvedValue(undefined);
    mockListRecipes.mockResolvedValue([mockRecipeData]);
    mockGetRecipe.mockImplementation((name: string) => {
      // Reset implementation
      if (name === 'test-recipe') return mockRecipeData;
      throw new Error(`Recipe "${name}" not found`);
    });
    mockPromptsFn.mockImplementation(async (questions: any | any[]) => {
      // Reset implementation
      const answers = {
        name: 'test-project',
        version: '1.0.0',
        recipeName: 'test-recipe',
        overwrite: true,
        db_version: '15',
        php_version: '8.1',
      };
      console.log('Mock prompts (reset) called, returning:', answers); // Add logging
      return answers;
    });

    initCommand = new Init();
    initCommand.args = {};
    initCommand.flags = {};
    initCommand.argv = [];
    initCommand.config = {
      root: '/mock/root',
      version: '0.0.0',
      pjson: { name: 'mock-cli', version: '0.0.0' } as any,
    };
  });

  describe('run', () => {
    test('should initialize a new project with default recipe', async () => {
      await initCommand.run();
      // Expect prompts for name and version (from runInteractiveInit)
      expect(prompts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'name' }),
          expect.objectContaining({ name: 'version' }),
        ])
      );
      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('test-project'),
        { recursive: true }
      );
      expect(writeFile).toHaveBeenCalled();
    });

    test('should initialize with a specific recipe', async () => {
      initCommand.flags = { recipe: 'test-recipe' };
      await initCommand.run();
      // Expect prompts for recipe options (db_version, php_version from runRecipeInteractiveInit)
      expect(prompts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'db_version' }),
          expect.objectContaining({ name: 'php_version' }),
        ])
      );
      expect(writeFile).toHaveBeenCalled();
    });

    test('should handle core init failure', async () => {
      (writeFile as any).mockRejectedValue(new Error('Core init failed'));
      // Need to ensure the command setup doesn't cause earlier errors
      // For example, provide necessary args/flags to avoid prompts
      initCommand.flags = { name: 'fail-project' }; // Avoid prompts
      await expect(initCommand.run()).rejects.toThrow('Core init failed');
    });

    test('should handle directory already exists scenario', async () => {
      (existsSync as any).mockReturnValue(true);
      initCommand.flags = { name: 'existing-project' }; // Avoid prompts
      await expect(initCommand.run()).rejects.toThrow(/already exists/);
    });
  });

  describe('flags', () => {
    test('should pass --recipe flag to core init', async () => {
      initCommand.flags = { recipe: 'custom-recipe' };
      await initCommand.run();
      expect(prompts).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'recipeName' })
      );
      expect(writeFile).toHaveBeenCalled();
    });

    test('should pass --dir flag to core init', async () => {
      initCommand.flags = { name: 'custom-dir' };
      await initCommand.run();
      expect(prompts).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'projectName' })
      );
      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('custom-dir'),
        { recursive: true }
      );
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(join('custom-dir', 'docker-compose.yml')),
        'rendered content'
      );
    });

    test('should pass --force flag to core init', async () => {
      initCommand.flags = { force: true };
      await initCommand.run();
      expect(prompts).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'overwrite' })
      );
      expect(writeFile).toHaveBeenCalled();
    });

    test('should handle missing name argument', async () => {
      initCommand.args = {};
      await expect(initCommand.run()).rejects.toThrow('Missing 1 required arg');
    });
  });

  describe('directory handling', () => {
    test('should create directory if it does not exist', async () => {
      await initCommand.run();
      expect(mkdir).toHaveBeenCalledWith(
        expect.stringContaining('test-project'),
        { recursive: true }
      );
    });

    test('should not create directory if --force is used and it exists', async () => {
      (existsSync as any).mockReturnValue(true);
      initCommand.flags = { force: true };
      await initCommand.run();
      expect(mkdir).not.toHaveBeenCalled();
    });
  });
});
