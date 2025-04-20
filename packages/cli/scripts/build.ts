#!/usr/bin/env bun
import { spawnSync } from 'child_process';
import { join } from 'path';

// Run TypeScript compilation
console.log('Running TypeScript compilation...');
const tscResult = spawnSync('tsc', [], { stdio: 'inherit', shell: true });
if (tscResult.status !== 0) {
  console.error('TypeScript compilation failed');
  process.exit(1);
}

// Generate oclif manifest
console.log('Generating oclif manifest...');
const oclifResult = spawnSync('oclif', ['manifest'], { stdio: 'inherit', shell: true });
if (oclifResult.status !== 0) {
  console.error('oclif manifest generation failed');
  process.exit(1);
}

// Bundle with Bun
console.log('Bundling with Bun...');
const entryPoint = join(process.cwd(), 'src', 'index.ts');
const outDir = join(process.cwd(), 'dist');

const bunBuildResult = await Bun.build({
  entrypoints: [entryPoint],
  outdir: outDir,
  target: 'bun',
  minify: true,
  sourcemap: 'inline',
  external: [
    '@oclif/core',
    '@oclif/plugin-legacy'
  ],
  plugins: [
    {
      name: 'devx-plugins',
      setup(build) {
        build.onResolve({ filter: /^@devx\/plugin-.*/ }, args => {
          const pluginPath = require.resolve(args.path);
          return {
            path: pluginPath,
            loader: 'ts',
          };
        });
      },
    },
  ],
});

if (!bunBuildResult.success) {
  console.error('Bundling failed:', bunBuildResult.logs);
  process.exit(1);
}

console.log('Build completed successfully!'); 