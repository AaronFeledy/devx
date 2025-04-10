const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    // Configures files to be linted
    files: ['**/*.ts'], // Adjust glob patterns if necessary for your project structure
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Use projectService for better monorepo/project reference support
        projectService: true,
        tsconfigRootDir: __dirname, // Explicitly set root directory
      },
      globals: {
        ...globals.node, // Adds Node.js global variables
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Base ESLint recommended rules
      ...tseslint.configs.eslintRecommended.rules,
      // TypeScript-specific recommended rules
      ...tseslint.configs.recommended.rules,
      // Add any project-specific rule overrides here
      // Example:
      // "@typescript-eslint/no-unused-vars": "warn",
      // "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // Global ignores
    ignores: [
      'node_modules/**',
      'dist/**',
      'packages/*/dist/**',
      'packages/cli/oclif.manifest.json',
      'plugins/*/dist/**',
      'bun.lockb',
      'packages/*/bun.lockb',
      'tsconfig.tsbuildinfo',
      'packages/*/tsconfig.tsbuildinfo',
      './index.ts', // Ignore root index.ts
    ],
  }
);
