import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createApp } from '../src/index';

function createMockLogger() {
  return {
    info: () => {},
    error: () => {},
  };
}

describe('REST API Handlers', () => {
  let app;
  let stackManager;
  let logger;

  beforeEach(() => {
    stackManager = {
      listStacks: async () => [{ name: 'a' }],
      getStackStatus: async () => ({ status: 'running' }),
      createStack: async () => 'foo',
      startStack: async () => {},
      stopStack: async () => {},
      destroyStack: async () => {},
    };
    logger = createMockLogger();
    app = createApp({ stackManager, logger });
  });

  it('GET /stacks returns list of stacks', async () => {
    stackManager.listStacks = async () => [{ name: 'a' }];
    const res = await app.handle(new Request('http://localhost:3000/stacks'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([{ name: 'a' }]);
  });

  it('GET /stacks/:id returns stack status', async () => {
    stackManager.getStackStatus = async () => ({ status: 'running' });
    const res = await app.handle(
      new Request('http://localhost:3000/stacks/foo')
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ status: 'running' });
  });

  it('POST /stacks creates a stack', async () => {
    stackManager.createStack = async () => 'foo';
    const body = JSON.stringify({ name: 'foo', services: { web: {} } });
    const res = await app.handle(
      new Request('http://localhost:3000/stacks', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('message');
    expect(json).toHaveProperty('name', 'foo');
  });

  it('POST /stacks/:id/start starts a stack', async () => {
    stackManager.startStack = async () => {};
    const res = await app.handle(
      new Request('http://localhost:3000/stacks/foo/start', { method: 'POST' })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('message');
  });

  it('POST /stacks/:id/stop stops a stack', async () => {
    stackManager.stopStack = async () => {};
    const res = await app.handle(
      new Request('http://localhost:3000/stacks/foo/stop', { method: 'POST' })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('message');
  });

  it('DELETE /stacks/:id destroys a stack', async () => {
    stackManager.destroyStack = async () => {};
    const res = await app.handle(
      new Request('http://localhost:3000/stacks/foo', { method: 'DELETE' })
    );
    expect(res.status).toBe(204);
  });

  it('GET /health returns ok', async () => {
    const res = await app.handle(new Request('http://localhost:3000/health'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ status: 'ok' });
  });

  it('returns 400 on validation error', async () => {
    const body = JSON.stringify({}); // missing required fields
    const res = await app.handle(
      new Request('http://localhost:3000/stacks', { method: 'POST', body })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty('error', 'Validation failed');
  });

  it('returns 500 on internal error', async () => {
    stackManager.listStacks = () => {
      throw new Error('fail');
    };
    const res = await app.handle(new Request('http://localhost:3000/stacks'));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toHaveProperty('error', 'Internal Server Error');
  });
});
