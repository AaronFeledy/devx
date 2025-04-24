// Main DevX package entrypoint
export * from './config/index.js';
export * from './state/index.js';
export * from './errors.js';
export * from './core.js'; // Export core functions

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

