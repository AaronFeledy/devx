import { registerPlugin, type Plugin, type Recipe } from '@devx/common';

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
