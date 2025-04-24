import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  parseStackFile,
  parseStackConfigFile,
  loadStackConfig,
  StackParseError,
} from '../src/parser';
import { existsSync, readFileSync } from 'fs';
import { readFile } from 'fs/promises';

// Mock the fs module
mock.module('fs', () => ({
  existsSync: mock((path: string) => {
    if (path.includes('nonexistent')) return false;
    return true;
  }),
  readFileSync: mock((path: string) => {
    if (path === '.stack.yml') {
      return `
name: test-stack
services:
  web:
    image: nginx:latest
    ports:
      - '8080:80'
    volumes:
      - ./app:/usr/share/nginx/html
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: testdb
volumes:
  db_data: {}
`;
    }
    if (path === '.stack.json') {
      return JSON.stringify({
        name: 'json-stack',
        services: {
          api: {
            image: 'node:18',
            ports: ['3000:3000'],
          },
        },
      });
    }
    if (path === 'invalid.yml') {
      return 'invalid: - yaml: content';
    }
    if (path === 'invalid.json') {
      return '{ invalid json content }';
    }
    throw new Error(`ENOENT: no such file or directory, open '${path}'`);
  }),
}));

// Mock the fs/promises module
mock.module('fs/promises', () => ({
  readFile: mock(async (path: string) => {
    if (path === '.stack.yml') {
      return `
name: test-stack
services:
  web:
    image: nginx:latest
    ports:
      - '8080:80'
    volumes:
      - ./app:/usr/share/nginx/html
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: testdb
volumes:
  db_data: {}
`;
    }
    if (path === '.stack.json') {
      return JSON.stringify({
        name: 'json-stack',
        services: {
          api: {
            image: 'node:18',
            ports: ['3000:3000'],
          },
        },
      });
    }
    if (path === 'invalid.yml') {
      return 'invalid: - yaml: content';
    }
    if (path === 'invalid.json') {
      return '{ invalid json content }';
    }
    throw new Error(`ENOENT: no such file or directory, open '${path}'`);
  }),
}));

describe('Stack Configuration Parser', () => {
  describe('parseStackConfigFile', () => {
    it('should parse valid YAML content', () => {
      const content = `
name: test-stack
services:
  web:
    image: nginx:latest
`;
      const config = parseStackConfigFile(content, 'test.yml');
      expect(config).toBeDefined();
      expect(config.name).toBe('test-stack');
      expect(config.services.web.image).toBe('nginx:latest');
    });

    it('should parse valid JSON content', () => {
      const content =
        '{"name":"test-stack","services":{"web":{"image":"nginx:latest"}}}';
      const config = parseStackConfigFile(content, 'test.json');
      expect(config).toBeDefined();
      expect(config.name).toBe('test-stack');
      expect(config.services.web.image).toBe('nginx:latest');
    });

    it('should throw StackParseError for invalid YAML', () => {
      const content = 'invalid: - yaml: content';
      expect(() => parseStackConfigFile(content, 'test.yml')).toThrow(
        StackParseError
      );
    });

    it('should throw StackParseError for invalid JSON', () => {
      const content = '{ invalid json }';
      expect(() => parseStackConfigFile(content, 'test.json')).toThrow(
        StackParseError
      );
    });

    it('should validate required fields', () => {
      const content = `
services:
  web:
    image: nginx:latest
`;
      expect(() => parseStackConfigFile(content, 'test.yml')).toThrow(
        'Required'
      );
    });

    it('should validate service configuration', () => {
      const content = `
name: test-stack
services:
  web:
    invalid_field: value
`;
      expect(() => parseStackConfigFile(content, 'test.yml')).toThrow(
        StackParseError
      );
    });
  });

  describe('loadStackConfig', () => {
    it('should load and parse YAML file', () => {
      const config = loadStackConfig('.stack.yml');
      expect(config).toBeDefined();
      expect(config.name).toBe('test-stack');
      expect(config.services.web.image).toBe('nginx:latest');
      expect(config.services.db.environment).toBeDefined();
    });

    it('should load and parse JSON file', () => {
      const config = loadStackConfig('.stack.json');
      expect(config).toBeDefined();
      expect(config.name).toBe('json-stack');
      expect(config.services.api.image).toBe('node:18');
    });

    it('should throw for non-existent file', () => {
      expect(() => loadStackConfig('nonexistent.yml')).toThrow('not found');
    });

    it('should throw for invalid YAML file', () => {
      expect(() => loadStackConfig('invalid.yml')).toThrow(StackParseError);
    });

    it('should throw for invalid JSON file', () => {
      expect(() => loadStackConfig('invalid.json')).toThrow(StackParseError);
    });
  });

  describe('parseStackFile', () => {
    it('should parse a valid stack configuration', async () => {
      const config = await parseStackFile('.stack.yml');
      expect(config).toBeDefined();
      expect(config.name).toBe('test-stack');
      expect(config.services).toBeDefined();
      expect(config.services.web).toBeDefined();
      expect(config.services.web.image).toBe('nginx:latest');
      expect(config.services.web.ports).toEqual(['8080:80']);
      expect(config.services.db).toBeDefined();
      expect(config.services.db.environment).toBeDefined();
      expect(config.volumes).toBeDefined();
      expect(config.volumes.db_data).toBeDefined();
    });

    it('should throw an error for missing required fields', async () => {
      mock.module('fs/promises', () => ({
        readFile: mock(
          async () => `
services:
  web:
    image: nginx:latest
`
        ),
      }));

      await expect(parseStackFile('.stack.yml')).rejects.toThrow('Required');
    });

    it('should throw an error for invalid YAML', async () => {
      await expect(parseStackFile('invalid.yml')).rejects.toThrow(
        StackParseError
      );
    });

    it('should throw an error for non-existent file', async () => {
      await expect(parseStackFile('nonexistent.yml')).rejects.toThrow(
        'not found'
      );
    });

    it('should handle complex service configurations', async () => {
      mock.module('fs/promises', () => ({
        readFile: mock(
          async () => `
name: complex-stack
services:
  web:
    image: nginx:latest
    ports:
      - '8080:80'
      - '443:443'
    volumes:
      - ./app:/usr/share/nginx/html
      - ./certs:/etc/nginx/certs
    environment:
      NODE_ENV: production
      DEBUG: 'false'
  db:
    image: postgres:13
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: myapp
    volumes:
      - db_data:/var/lib/postgresql/data
volumes:
  db_data:
    driver: local
`
        ),
      }));

      const config = await parseStackFile('.stack.yml');
      expect(config).toBeDefined();
      expect(config.name).toBe('complex-stack');
      expect(config.services.web.ports).toHaveLength(2);
      expect(config.services.web.volumes).toHaveLength(2);
      expect(config.services.web.environment).toBeDefined();
      expect(config.services.db.environment.POSTGRES_USER).toBe('admin');
      expect(config.volumes.db_data.driver).toBe('local');
    });
  });
});
