import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { logger } from '@devx/common';
import type { StackConfig } from '@devx/common';
import * as StackManager from '@devx/stack';

// --- Elysia/TypeBox Schema Mirroring Zod Schema ---
// Restore full definitions from previous correct state
const PortMappingSchema = t.Union(
  [
    t.RegExp(/^\d+(-\d+)?:\d+(-\d+)?(\/(tcp|udp))?$/, {
      description:
        'Port mapping string (e.g., "8080:80", "8080-8081:80-81/tcp")',
      examples: ['8080:80', '53:53/udp'],
    }),
    t.Integer({
      minimum: 1,
      description: 'Container port number (host port assigned automatically)',
      examples: [80, 443],
    }),
  ],
  { description: 'Defines how ports are mapped between host and container.' }
);

const VolumeMappingSchema = t.RegExp(/^.+:.+(:ro|:rw)?$/, {
  description: 'Volume mapping (e.g., "./local:/app", "my_volume:/data:ro")',
  examples: ['./app:/var/www/html', 'db_data:/var/lib/mysql:ro'],
});

const EnvironmentVariableSchema = t.RegExp(/^[^=]+=.*$/, {
  description: 'Environment variable in KEY=value format',
  examples: ['NODE_ENV=development', 'DB_PASSWORD=secret'],
});

const PluginConfigSchema = t.Object(
  {
    name: t.String({
      description: 'Name of the plugin (e.g., podman, podman-compose)',
    }),
    options: t.Optional(
      t.Record(t.String(), t.Any(), { description: 'Plugin-specific options' })
    ),
  },
  { description: 'Configuration for a builder or engine plugin.' }
);

const ServiceSchema = t.Object(
  {
    image: t.Optional(
      t.String({
        description: 'Container image name and tag',
        examples: ['nginx:latest', 'mysql:8.0'],
      })
    ),
    build: t.Optional(
      t.Union(
        [
          t.String({
            description: 'Path to the build context directory',
            examples: ['./app'],
          }),
          t.Object(
            {
              context: t.String({
                description: 'Path to the build context directory',
              }),
              dockerfile: t.Optional(
                t.String({
                  description: 'Name of the Dockerfile within the context',
                  examples: ['Dockerfile.dev'],
                })
              ),
            },
            { description: 'Detailed build configuration' }
          ),
        ],
        { description: 'Build configuration for the service image.' }
      )
    ),
    ports: t.Optional(
      t.Array(PortMappingSchema, { description: 'Port mappings' })
    ),
    volumes: t.Optional(
      t.Array(VolumeMappingSchema, { description: 'Volume mappings' })
    ),
    environment: t.Optional(
      t.Union(
        [
          t.Record(t.String(), t.String(), {
            description: 'Key-value map of environment variables',
          }),
          t.Array(EnvironmentVariableSchema, {
            description: 'Array of KEY=value environment strings',
          }),
        ],
        { description: 'Environment variables for the container.' }
      )
    ),
    depends_on: t.Optional(
      t.Array(t.String(), {
        description: 'List of service names this service depends on',
        examples: [['db', 'redis']],
      })
    ),
    command: t.Optional(
      t.Union([t.String(), t.Array(t.String())], {
        description: 'Override the default container command',
      })
    ),
    entrypoint: t.Optional(
      t.Union([t.String(), t.Array(t.String())], {
        description: 'Override the default container entrypoint',
      })
    ),
    networks: t.Optional(
      t.Array(t.String(), {
        description: 'Networks to connect this service to',
      })
    ),
  },
  {
    description: 'Configuration for a single service in the stack.',
    additionalProperties: true,
  }
);

const NetworkSchema = t.Object(
  {
    driver: t.Optional(
      t.String({
        description: 'Network driver (e.g., bridge)',
        examples: ['bridge'],
      })
    ),
  },
  {
    description: 'Custom network definition.',
    additionalProperties: true,
  }
);

const VolumeSchema = t.Object(
  {
    driver: t.Optional(t.String({ description: 'Volume driver' })),
  },
  {
    description: 'Named volume definition for persistent storage.',
    additionalProperties: true,
  }
);

const ElysiaStackConfigSchema = t.Object(
  {
    name: t.String({
      minLength: 1,
      description: 'Unique name for the stack',
      examples: ['my-web-app'],
    }),
    version: t.Optional(
      t.String({
        description: 'Stack configuration version (e.g., 3.8)',
        examples: ['3.8'],
      })
    ),
    builder: t.Optional(PluginConfigSchema),
    engine: t.Optional(PluginConfigSchema),
    services: t.Record(t.String(), ServiceSchema, {
      description: 'Map of service names to their configurations',
    }),
    networks: t.Optional(
      t.Record(t.String(), NetworkSchema, {
        description: 'Custom network definitions',
      })
    ),
    volumes: t.Optional(
      t.Record(t.String(), VolumeSchema, {
        description: 'Named volume definitions',
      })
    ),
  },
  {
    description:
      'Defines the overall structure and configuration for a DevX stack.',
    additionalProperties: true,
  }
);

// --- Handlers (Defined BEFORE app) ---
const getStacksHandler = async () => {
  logger.info('GET /stacks');
  return await StackManager.listStacks();
};

const getStackByIdHandler = async ({ params }: { params: { id: string } }) => {
  logger.info(`GET /stacks/${params.id}`);
  const stack = await StackManager.getStackStatus(params.id);
  return stack;
};

const createStackHandler = async ({ body }: { body: StackConfig }) => {
  logger.info('POST /stacks request received', { name: body.name });
  const createdStackName = await StackManager.createStack(body);
  logger.info(`Stack created successfully: ${createdStackName}`);
  return { message: 'Stack created successfully', name: createdStackName };
};

const startStackHandler = async ({ params }: { params: { id: string } }) => {
  logger.info(`POST /stacks/${params.id}/start`);
  await StackManager.startStack(params.id);
  return { message: `Stack ${params.id} starting...` };
};

const stopStackHandler = async ({ params }: { params: { id: string } }) => {
  logger.info(`POST /stacks/${params.id}/stop`);
  await StackManager.stopStack(params.id);
  return { message: `Stack ${params.id} stopping...` };
};

const deleteStackHandler = async ({
  params,
  set,
}: {
  params: { id: string };
  set: any;
}) => {
  logger.info(`DELETE /stacks/${params.id}`);
  await StackManager.destroyStack(params.id);
  set.status = 204;
  return null;
};

// --- Elysia App Setup ---
const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: 'DevX REST API',
          version: '0.1.0',
          description:
            'API for managing DevX development stacks and their lifecycle.',
        },
        tags: [
          {
            name: 'Stacks',
            description:
              'Manage DevX stacks (build, start, stop, status, etc.)',
          },
          { name: 'Health', description: 'API health checks' },
        ],
      },
    })
  )
  .onError(({ code, error, set }) => {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('API Error:', { code, error: message, stack });

    if (code === 'VALIDATION') {
      set.status = 400;
      const validationDetails = (error as any).message || message;
      return { error: 'Validation failed', details: validationDetails };
    }

    set.status = 500;
    return { error: 'Internal Server Error', details: message };
  })
  // --- Routes ---
  .get('/stacks', getStacksHandler, {
    detail: { tags: ['Stacks'], summary: 'List all known stacks' },
  })
  .post('/stacks', createStackHandler, {
    // Use the mirrored Elysia schema
    body: ElysiaStackConfigSchema,
    detail: {
      tags: ['Stacks'],
      summary: 'Create or update a stack from configuration',
    },
  })
  .get('/stacks/:id', getStackByIdHandler, {
    params: t.Object({ id: t.String({ description: 'Stack name or ID' }) }),
    detail: { tags: ['Stacks'], summary: 'Get the current status of a stack' },
  })
  .post('/stacks/:id/start', startStackHandler, {
    params: t.Object({ id: t.String({ description: 'Stack name or ID' }) }),
    detail: { tags: ['Stacks'], summary: 'Start a stopped stack' },
  })
  .post('/stacks/:id/stop', stopStackHandler, {
    params: t.Object({ id: t.String({ description: 'Stack name or ID' }) }),
    detail: { tags: ['Stacks'], summary: 'Stop a running stack' },
  })
  .delete('/stacks/:id', deleteStackHandler, {
    params: t.Object({ id: t.String({ description: 'Stack name or ID' }) }),
    detail: {
      tags: ['Stacks'],
      summary: 'Destroy a stack (stop and remove resources)',
    },
  })
  .get('/health', () => ({ status: 'ok' }), {
    detail: { tags: ['Health'], summary: 'Check API health' },
  })
  .listen(3000);

logger.info(
  `🦊 DevX REST API is running at http://${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
