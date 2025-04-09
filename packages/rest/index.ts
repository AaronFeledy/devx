import { Elysia, t } from 'elysia';
import * as StackManager from '@devx/stack';
import { logger } from '@devx/common';

// Placeholder for stack management logic (will integrate with @devx/stack)
const stacks = [
  { id: '1', name: 'my-web-app', status: 'running' },
  { id: '2', name: 'another-project', status: 'stopped' },
];

const getStacksHandler = async () => {
  logger.info('GET /stacks');
  return await StackManager.listStacks();
};

const getStackByIdHandler = async (id: string) => {
  logger.info(`GET /stacks/${id}`);
  const stack = await StackManager.getStackStatus(id);
  if (!stack) {
    throw new Error('Stack not found'); // Will be caught by onError
  }
  return stack;
};

// Define expected body schema for createStack
const CreateStackBodySchema = t.Object({
  name: t.String(),
  services: t.Record(t.String(), t.Any()), // Basic validation
  volumes: t.Optional(t.Record(t.String(), t.Any())),
  networks: t.Optional(t.Record(t.String(), t.Any()))
});

const createStackHandler = async (body: StackManager.StackConfig) => {
  logger.info('POST /stacks', body);
  // TODO: Add Zod validation from body using StackConfig schema from @devx/stack when defined
  return await StackManager.createStack(body);
};

const startStackHandler = async (id: string) => {
  logger.info(`POST /stacks/${id}/start`);
  await StackManager.startStack(id); // Let errors propagate
  return { message: `Stack ${id} starting...` };
};

const stopStackHandler = async (id: string) => {
  logger.info(`POST /stacks/${id}/stop`);
  await StackManager.stopStack(id); // Let errors propagate
  return { message: `Stack ${id} stopping...` };
};

const deleteStackHandler = async (id: string) => {
  logger.info(`DELETE /stacks/${id}`);
  await StackManager.destroyStack(id); // Let errors propagate
  // We should return 204 No Content, but Elysia might handle this.
  // Returning the ID or a success message for now.
  return { message: `Stack ${id} destroyed` };
};

const app = new Elysia()
  .onError(({ code, error, set }) => {
    logger.error(`API Error: ${code} - ${error.name} - ${error.message}`);
    
    // Handle specific errors we know about
    if (error.message === 'Stack not found') {
      set.status = 404; // Not Found
      return { error: error.message };
    }
    
    // Handle Elysia's validation errors (example)
    if (code === 'VALIDATION') {
        set.status = 400; // Bad Request
        return { error: 'Invalid request body', details: error.message }; // Provide more details
    }

    // Default internal server error
    set.status = 500;
    return { error: 'Internal Server Error' };
  })
  .get('/stacks', () => getStacksHandler())
  .post('/stacks', ({ body }) => createStackHandler(body as StackManager.StackConfig), {
      body: CreateStackBodySchema // Add validation schema
  })
  .get('/stacks/:id', ({ params: { id } }) => getStackByIdHandler(id))
  .post('/stacks/:id/start', ({ params: { id } }) => startStackHandler(id))
  .post('/stacks/:id/stop', ({ params: { id } }) => stopStackHandler(id))
  .delete('/stacks/:id', ({ params: { id } }) => deleteStackHandler(id))
  .get('/health', () => ({ status: 'ok' }))
  .listen(3000);

logger.info(
  `🦊 DevX REST API is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;