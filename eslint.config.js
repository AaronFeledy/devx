import globals from 'globals';
import * as tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  {
    // Configures files to be linted
    files: [
      'packages/*/src/**/*.ts',
      'packages/*/test/**/*.ts',
      'plugins/*/src/**/*.ts',
      'plugins/*/test/**/*.ts',
      '**/__tests__/**/*.ts',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: [
          './packages/builder/tsconfig.json',
          './packages/cli/tsconfig.json',
          './packages/common/tsconfig.json',
          './packages/devx/tsconfig.json',
          './packages/engine/tsconfig.json',
          './packages/global-stacks/tsconfig.json',
          './packages/recipes/tsconfig.json',
          './packages/rest/tsconfig.json',
          './packages/stack/tsconfig.json',
          './packages/tasks/tsconfig.json',
          './plugins/podman/tsconfig.json',
          './plugins/podman-compose/tsconfig.json',
          './plugins/router/tsconfig.json',
        ],
      },
      globals: {
        ...globals.node,
        ...globals.jest, // Add Jest globals for test files
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'unused-imports': unusedImports,
    },
    rules: {
      ...tseslint.configs.eslintRecommended.rules,
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/test/**/__mocks__/**',
      '**/test/**/__fixtures__/**',
      'packages/cli/oclif.manifest.json',
      'bun.lockb',
      '**/bun.lockb',
      '**/tsconfig.tsbuildinfo',
      './index.ts',
      '**/*.d.ts', // Ignore declaration files
      '**/*.js', // Ignore JavaScript files
    ],
  }
);
