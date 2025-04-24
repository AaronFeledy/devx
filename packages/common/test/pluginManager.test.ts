import { describe, it, expect, beforeEach } from 'bun:test';
import { pluginManager, registerPlugin } from '../src/plugins/pluginManager';
import type { Plugin } from '../src/plugins/types';

describe('pluginManager', () => {
  beforeEach(() => {
    // Reset the plugin manager's internal state
    // @ts-ignore
    pluginManager.registeredPlugins = new Map();
  });

  it('registers and retrieves a plugin', () => {
    const plugin: Plugin = { name: 'foo', version: '1.0.0' };
    pluginManager.registerPlugin(plugin);
    expect(pluginManager.getPlugin('foo')).toBe(plugin);
  });

  it('throws on duplicate registration', () => {
    const plugin: Plugin = { name: 'bar', version: '1.0.0' };
    pluginManager.registerPlugin(plugin);
    expect(() => pluginManager.registerPlugin(plugin)).toThrow();
  });

  it('returns undefined for missing plugin', () => {
    expect(pluginManager.getPlugin('missing')).toBeUndefined();
  });

  it('returns all registered plugins', () => {
    const a: Plugin = { name: 'a', version: '1.0.0' };
    const b: Plugin = { name: 'b', version: '1.0.0' };
    pluginManager.registerPlugin(a);
    pluginManager.registerPlugin(b);
    expect(pluginManager.getAllPlugins()).toEqual([a, b]);
  });

  it('filters engine plugins', () => {
    const engine = {
      type: 'engine',
      name: 'eng',
      isAvailable: async () => true,
      getStackStatus: async () => ({ status: 'running' }),
    };
    const plugin: Plugin = { name: 'eng', version: '1.0.0', engine };
    pluginManager.registerPlugin(plugin);
    expect(pluginManager.getEnginePlugins()).toEqual([plugin]);
  });

  it('filters builder plugins', () => {
    const builder = {
      type: 'builder',
      name: 'build',
      isAvailable: async () => true,
      generateConfig: async () => '',
      build: async () => {},
      start: async () => {},
      stop: async () => {},
      destroy: async () => {},
    };
    const plugin: Plugin = { name: 'build', version: '1.0.0', builder };
    pluginManager.registerPlugin(plugin);
    expect(pluginManager.getBuilderPlugins()).toEqual([plugin]);
  });

  it('registerPlugin (convenience) works', () => {
    const plugin: Plugin = { name: 'baz', version: '1.0.0' };
    registerPlugin(plugin);
    expect(pluginManager.getPlugin('baz')).toBe(plugin);
  });
});
