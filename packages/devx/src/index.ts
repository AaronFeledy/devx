// Main DevX package entrypoint

// Core functions
export { build, start, stop, destroy, status } from './core.js';

// Errors
export { DevxCoreError } from './errors.js';

// Config related exports
export * from './config/index.js';
export type { GlobalConfig } from './config/types.js';

// State related exports
export * from './state/types.js';
export * from './state/index.js';

// Re-export types from dependent packages
export type { Plugin } from '@devx/common';
export type { StackConfig, ServiceConfig } from '@devx/common';
export type { StackStatusInfo, StackStatus } from '@devx/common';

export enum StackBuildStatus {
  NotBuilt = 'not_built',
  Building = 'building',
  Built = 'built',
  Error = 'error',
}
