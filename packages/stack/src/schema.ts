import { z } from 'zod';

/** Represents a port mapping, can be a simple container port or a host:container mapping. */
const PortMappingSchema = z.union([
  z.string().regex(/^\d+(-\d+)?:\d+(-\d+)?(\/(tcp|udp))?$/, 'Invalid port mapping format (e.g., "8080:80", "8080-8081:80-81", "53:53/udp")'), // "8080:80", "8080-8081:80-81", "53:53/udp"
  z.number().int().positive(), // Just the container port
]);

/** Represents a volume mapping, linking a host path or named volume to a container path. */
const VolumeMappingSchema = z.string().regex(/^.+:.+(:ro|:rw)?$/, 'Invalid volume mapping format (e.g., "./local:/app", "my_volume:/data:ro")'); // "local/path:container/path", "volume_name:/data:ro"

/** Represents an environment variable definition in KEY=value format. */
const EnvironmentVariableSchema = z.string().regex(/^[^=]+=.*$/, 'Invalid environment variable format (e.g., "NODE_ENV=development")'); // "KEY=value"

/**
 * Defines the configuration for a single service within the stack,
 * analogous to a service in docker-compose.
 */
const ServiceSchema = z.object({
  /** The Docker image to use for the service. */
  image: z.string().optional(),
  /** Configuration for building the service image from a Dockerfile. */
  build: z.union([z.string(), z.object({ context: z.string(), dockerfile: z.string().optional() })]).optional(),
  /** Port mappings between the host and the container. */
  ports: z.array(PortMappingSchema).optional(),
  /** Volume mappings for persistent data or mounting code. */
  volumes: z.array(VolumeMappingSchema).optional(),
  /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
  environment: z.union([z.record(z.string()), z.array(EnvironmentVariableSchema)]).optional(),
  /** Services that this service depends on. */
  depends_on: z.array(z.string()).optional(),
  /** Override the default command for the container. */
  command: z.union([z.string(), z.array(z.string())]).optional(),
   /** Override the default entrypoint for the container. */
  entrypoint: z.union([z.string(), z.array(z.string())]).optional(),
  /** Networks to connect this service to. */
  networks: z.array(z.string()).optional(),
  // Add other common docker-compose fields as needed
}).catchall(z.any()); // Allow extra fields for extensibility and plugins

/**
 * Defines a custom network configuration for the stack.
 */
const NetworkSchema = z.object({
  /** The network driver to use (e.g., 'bridge'). */
  driver: z.string().optional(),
  // Add other network options as needed
}).catchall(z.any()); // Allow extra fields

/**
 * Defines a named volume for persistent storage.
 */
const VolumeSchema = z.object({
   /** The volume driver to use. */
  driver: z.string().optional(),
  // Add other volume options as needed
}).catchall(z.any()); // Allow extra fields


/**
 * Defines the overall structure and configuration for a DevX stack,
 * specified in a `.stack.yml` or `.stack.json` file.
 */
export const StackConfigSchema = z.object({
  /** A unique name for the stack, used for identification and management. */
  name: z.string().min(1, 'Stack name is required'),
  /** Optional version field, similar to docker-compose, for schema versioning. */
  version: z.string().optional(),
  /** A map of service names to their configurations. */
  services: z.record(ServiceSchema),
  /** Optional definitions for custom networks used by the services. */
  networks: z.record(NetworkSchema).optional(),
  /** Optional definitions for named volumes used by the services. */
  volumes: z.record(VolumeSchema).optional(),
  /** Add other top-level Lando-like or custom fields if necessary */
  // Example: tooling: { ... } for defining custom commands
}).catchall(z.any()); // Allow extra fields at the top level

/**
 * Represents the validated configuration of a DevX stack.
 * This type is inferred from the `StackConfigSchema`.
 */
export type StackConfig = z.infer<typeof StackConfigSchema>;

/**
 * Represents the validated configuration of a single service within a stack.
 * This type is inferred from the `ServiceSchema`.
 */
export type ServiceConfig = z.infer<typeof ServiceSchema>; 