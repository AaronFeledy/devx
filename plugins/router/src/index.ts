import { registerPlugin, type Plugin, type Recipe } from '@devx/common';
import { join } from 'path';
import { homedir } from 'os';
import { z } from 'zod';
import { StackConfig } from '@devx/stack';
import { EnginePlugin, BuilderPlugin } from '@devx/common';

const ROUTER_CONFIG_DIR = join(homedir(), '.devx', 'global-stacks', 'router');

/**
 * Router plugin configuration schema
 */
export const RouterConfig = z.object({
  domain: z.string().default('devx.local'),
  port: z.number().default(80),
  ssl: z.boolean().default(false),
  sslPort: z.number().default(443),
  sslCertPath: z.string().optional(),
  sslKeyPath: z.string().optional(),
});

export type RouterConfig = z.infer<typeof RouterConfig>;

/**
 * Traefik-based router plugin for DevX
 */
export class RouterPlugin {
  private config: RouterConfig;
  private engine: EnginePlugin;
  private builder: BuilderPlugin;

  constructor(
    engine: EnginePlugin,
    builder: BuilderPlugin,
    config: Partial<RouterConfig> = {}
  ) {
    this.engine = engine;
    this.builder = builder;
    this.config = RouterConfig.parse(config);
  }

  /**
   * Generate the Traefik router stack configuration
   */
  private generateStackConfig(): StackConfig {
    return {
      name: 'devx-router',
      services: {
        traefik: {
          image: 'traefik:v3.0',
          command: [
            '--api.insecure=true',
            '--providers.docker=true',
            '--providers.docker.exposedbydefault=false',
            '--entrypoints.web.address=:80',
            ...(this.config.ssl
              ? [
                  '--entrypoints.websecure.address=:443',
                  '--entrypoints.websecure.http.tls=true',
                ]
              : []),
          ],
          ports: [
            `${this.config.port}:80`,
            ...(this.config.ssl ? [`${this.config.sslPort}:443`] : []),
            '8080:8080', // Dashboard
          ],
          volumes: [
            '/var/run/podman/podman.sock:/var/run/docker.sock:ro',
            ...(this.config.ssl &&
            this.config.sslCertPath &&
            this.config.sslKeyPath
              ? [
                  `${this.config.sslCertPath}:/etc/ssl/certs/cert.pem:ro`,
                  `${this.config.sslKeyPath}:/etc/ssl/private/key.pem:ro`,
                ]
              : []),
          ],
          labels: {
            'traefik.enable': 'true',
            'traefik.http.routers.dashboard.rule':
              'Host(`traefik.${this.config.domain}`)',
            'traefik.http.routers.dashboard.service': 'api@internal',
          },
        },
      },
      networks: {
        devx: {
          name: 'devx',
          external: true,
        },
      },
    };
  }

  /**
   * Start the router stack
   */
  public async start(): Promise<void> {
    const stackConfig = this.generateStackConfig();
    await this.builder.build(stackConfig, ROUTER_CONFIG_DIR);
    await this.builder.start(stackConfig, ROUTER_CONFIG_DIR);
  }

  /**
   * Stop the router stack
   */
  public async stop(): Promise<void> {
    const stackConfig = this.generateStackConfig();
    await this.builder.stop(stackConfig, ROUTER_CONFIG_DIR);
  }

  /**
   * Get the router status
   */
  public async getStatus(): Promise<string> {
    const stackConfig = this.generateStackConfig();
    const status = await this.engine.getStackStatus(
      stackConfig.name,
      ROUTER_CONFIG_DIR
    );
    return status.status;
  }

  /**
   * Configure a service to be routed through Traefik
   */
  public configureService(
    serviceName: string,
    config: {
      host: string;
      port: number;
      ssl?: boolean;
    }
  ): Record<string, string> {
    const labels: Record<string, string> = {
      'traefik.enable': 'true',
      [`traefik.http.routers.${serviceName}.rule`]: `Host(\`${config.host}.${this.config.domain}\`)`,
      [`traefik.http.services.${serviceName}.loadbalancer.server.port`]:
        config.port.toString(),
    };

    if (config.ssl) {
      labels[`traefik.http.routers.${serviceName}.entrypoints`] = 'websecure';
    } else {
      labels[`traefik.http.routers.${serviceName}.entrypoints`] = 'web';
    }

    return labels;
  }
}

// Placeholder for a potential Traefik recipe
const traefikRecipe: Recipe = {
  name: 'traefik-router',
  description: 'Sets up a basic Traefik reverse proxy service.',
  async getStackConfig(
    overrides: Record<string, any>
  ): Promise<Record<string, any>> {
    // In a real scenario, this would load a YAML template, merge overrides,
    // and return the resulting stack configuration object.
    console.log(
      'Generating stack config for traefik-router with overrides:',
      overrides
    );
    return {
      name: overrides.name || 'global-router',
      services: {
        traefik: {
          image: 'traefik:v2.10', // Example image
          command: [
            '--api.insecure=true',
            '--providers.docker.exposedbydefault=false',
            // Add other Traefik args
          ],
          ports: ['80:80', '443:443', '8080:8080'], // Map ports
          volumes: [
            '/var/run/docker.sock:/var/run/docker.sock:ro', // Adjust for Podman if needed
          ],
          // Add network config, labels, etc.
        },
      },
      // Define volumes, networks if needed
    };
  },
};

/**
 * The main Router plugin definition.
 * Initially, it might just provide recipes or tasks.
 */
const routerPlugin: Plugin = {
  name: '@devx/plugin-router',
  version: '0.1.0',
  description: 'Provides router (e.g., Traefik) related recipes and tasks',
  recipes: [traefikRecipe],
  // tasks: [], // Add tasks later if needed

  async initialize(): Promise<void> {
    console.log(
      `Router plugin initialized. Provided recipes: ${this.recipes
        ?.map((r) => r.name)
        .join(', ')}`
    );
  },
};

// Register the plugin
registerPlugin(routerPlugin);

export { routerPlugin };
