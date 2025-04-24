import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  loadStackConfig,
  listStacks,
  getStackMetadata,
  updateStackStatus,
} from '../src/manager';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock the fs module
mock.module('fs', () => ({
  existsSync: mock((path: string) => {
    if (path.includes('nonexistent')) return false;
    if (path.includes('test-stack') || path.includes('another-stack'))
      return true;
    return false;
  }),
  readFileSync: mock((path: string) => {
    if (path.includes('test-stack/.stack.yml')) {
      return `
name: test-stack
services:
  web:
    image: nginx:latest
    ports:
      - '8080:80'
`;
    }
    if (path.includes('another-stack/.stack.yml')) {
      return `
name: another-stack
services:
  api:
    image: node:18
    ports:
      - '3000:3000'
`;
    }
    if (path.includes('invalid-stack/.stack.yml')) {
      return 'invalid: yaml: content';
    }
    throw new Error(`ENOENT: no such file or directory, open '${path}'`);
  }),
  writeFileSync: mock((path: string, content: string) => {
    // Mock successful write
    return;
  }),
  mkdirSync: mock((path: string, options?: any) => {
    // Mock successful directory creation
    return;
  }),
}));

// Mock the fs/promises module
mock.module('fs/promises', () => ({
  readFile: mock(async (path: string) => {
    if (path.includes('test-stack/.stack.yml')) {
      return `
name: test-stack
services:
  web:
    image: nginx:latest
    ports:
      - '8080:80'
`;
    }
    if (path.includes('another-stack/.stack.yml')) {
      return `
name: another-stack
services:
  api:
    image: node:18
    ports:
      - '3000:3000'
`;
    }
    if (path.includes('invalid-stack/.stack.yml')) {
      return 'invalid: yaml: content';
    }
    throw new Error(`ENOENT: no such file or directory, open '${path}'`);
  }),
  writeFile: mock(async (path: string, content: string) => {
    // Mock successful write
    return;
  }),
  mkdir: mock(async (path: string, options?: any) => {
    // Mock successful directory creation
    return;
  }),
}));

describe('Stack Manager', () => {
  const stacksDir = path.join(os.tmpdir(), 'test-stacks');

  describe('loadStackConfig', () => {
    it('should load a valid stack configuration', async () => {
      const config = await loadStackConfig('test-stack/.stack.yml');
      expect(config).toBeDefined();
      expect(config.name).toBe('test-stack');
      expect(config.services.web.image).toBe('nginx:latest');
    });

    it('should throw an error for non-existent stack', async () => {
      await expect(
        loadStackConfig('nonexistent-stack/.stack.yml')
      ).rejects.toThrow();
    });

    it('should throw an error for invalid stack configuration', async () => {
      await expect(
        loadStackConfig('invalid-stack/.stack.yml')
      ).rejects.toThrow();
    });
  });

  describe('listStacks', () => {
    it('should list available stacks', async () => {
      const stacks = await listStacks();
      expect(stacks).toContain('test-stack');
      expect(stacks).toContain('another-stack');
      expect(stacks).not.toContain('nonexistent-stack');
    });
  });

  describe('getStackMetadata', () => {
    it('should return metadata for an existing stack', async () => {
      const metadata = await getStackMetadata('test-stack');
      expect(metadata).toBeDefined();
      expect(metadata?.configPath).toContain('test-stack/.stack.yml');
      expect(metadata?.status).toBe('loaded');
    });

    it('should return null for non-existent stack', async () => {
      const metadata = await getStackMetadata('nonexistent-stack');
      expect(metadata).toBeNull();
    });
  });

  describe('updateStackStatus', () => {
    it('should update stack status successfully', async () => {
      await expect(
        updateStackStatus('test-stack', 'running')
      ).resolves.not.toThrow();
    });

    it('should throw an error for non-existent stack', async () => {
      await expect(
        updateStackStatus('nonexistent-stack', 'running')
      ).rejects.toThrow();
    });
  });
});
