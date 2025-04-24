import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { BuilderManager } from '../src/builderManager';
import { pluginManager } from '@devx/common';
import { logger } from '@devx/common';

describe('BuilderManager', () => {
  let builderManager: BuilderManager;
  const mockBuilder = {
    name: 'mock-builder',
    isAvailable: async () => true,
    generateConfig: async () => '',
    build: async () => {},
    start: async () => {},
    stop: async () => {},
    destroy: async () => {},
  };
  const mockPlugin = { name: 'mock', version: '1.0.0', builder: mockBuilder };

  let origGetPlugin: any;
  let origGetBuilderPlugins: any;
  let origLoggerError: any;

  beforeEach(() => {
    builderManager = new BuilderManager();
    origGetPlugin = pluginManager.getPlugin;
    origGetBuilderPlugins = pluginManager.getBuilderPlugins;
    origLoggerError = logger.error;
  });

  afterEach(() => {
    pluginManager.getPlugin = origGetPlugin;
    pluginManager.getBuilderPlugins = origGetBuilderPlugins;
    logger.error = origLoggerError;
  });

  test('should retrieve a builder plugin by name', () => {
    pluginManager.getPlugin = () => mockPlugin;
    const builder = builderManager.getPlugin('mock');
    expect(builder).toBe(mockBuilder);
  });

  test('should throw if plugin is not registered', () => {
    pluginManager.getPlugin = () => undefined;
    let errorMsg = '';
    logger.error = (msg: string) => {
      errorMsg = msg;
    };
    expect(() => builderManager.getPlugin('missing')).toThrow(
      "Builder plugin 'missing' not registered."
    );
    expect(errorMsg).toBe("Builder plugin 'missing' not registered.");
  });

  test('should throw if plugin does not provide a builder', () => {
    pluginManager.getPlugin = () => ({ name: 'bad', version: '1.0.0' });
    let errorMsg = '';
    logger.error = (msg: string) => {
      errorMsg = msg;
    };
    expect(() => builderManager.getPlugin('bad')).toThrow(
      "Registered plugin 'bad' does not provide a builder implementation."
    );
    expect(errorMsg).toBe(
      "Registered plugin 'bad' does not provide a builder implementation."
    );
  });

  test('should retrieve the default builder plugin', () => {
    pluginManager.getPlugin = () => mockPlugin;
    const builder = builderManager.getDefaultPlugin();
    expect(builder).toBe(mockBuilder);
  });

  test('should throw if default builder plugin is missing', () => {
    pluginManager.getPlugin = () => {
      throw new Error('not found');
    };
    let called = false;
    logger.error = () => {
      called = true;
    };
    expect(() => builderManager.getDefaultPlugin()).toThrow(
      "Default builder plugin 'podman-compose' could not be loaded."
    );
    expect(called).toBe(true);
  });

  test('should list all registered builder plugin names', () => {
    pluginManager.getBuilderPlugins = () => [
      { builder: { name: 'a' } },
      { builder: { name: 'b' } },
    ];
    const names = builderManager.listPlugins();
    expect(names).toEqual(['a', 'b']);
  });
});
