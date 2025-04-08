import { z } from 'zod';

// Basic types for ports, volumes, environment variables
const PortMappingSchema = z.union([
  z.string().regex(/^\d+(-\d+)?:\d+(-\d+)?(\/(tcp|udp))?$/, 'Invalid port mapping format'), // "8080:80", "8080-8081:80-81", "53:53/udp"
  z.number().int().positive(), // Just the container port
]);

const VolumeMappingSchema = z.string().regex(/^.+:.+(:ro|:rw)?$/, 'Invalid volume mapping format'); // "local/path:container/path", "volume_name:/data:ro"

const EnvironmentVariableSchema = z.string().regex(/^[^=]+=.*$/, 'Invalid environment variable format'); // "KEY=value"

// Service definition schema
const ServiceSchema = z.object({
  image: z.string().optional(),
  build: z.union([z.string(), z.object({ context: z.string(), dockerfile: z.string().optional() })]).optional(),
  ports: z.array(PortMappingSchema).optional(),
  volumes: z.array(VolumeMappingSchema).optional(),
  environment: z.union([z.record(z.string()), z.array(EnvironmentVariableSchema)]).optional(),
  depends_on: z.array(z.string()).optional(),
  command: z.union([z.string(), z.array(z.string())]).optional(),
  entrypoint: z.union([z.string(), z.array(z.string())]).optional(),
  networks: z.array(z.string()).optional(),
  // Add other common docker-compose fields as needed
}).catchall(z.any()); // Allow extra fields for extensibility

// Network definition schema (basic)
const NetworkSchema = z.object({
  driver: z.string().optional(),
  // Add other network options as needed
}).catchall(z.any());

// Volume definition schema (basic)
const VolumeSchema = z.object({
  driver: z.string().optional(),
  // Add other volume options as needed
}).catchall(z.any());


// Top-level stack configuration schema
export const StackConfigSchema = z.object({
  name: z.string().min(1, 'Stack name is required'),
  version: z.string().optional(), // Optional version field, like docker-compose
  services: z.record(ServiceSchema),
  networks: z.record(NetworkSchema).optional(),
  volumes: z.record(VolumeSchema).optional(),
  // Add other top-level Lando-like or custom fields if necessary
}).catchall(z.any()); // Allow extra fields

// Infer the TypeScript type from the schema
export type StackConfig = z.infer<typeof StackConfigSchema>;
export type ServiceConfig = z.infer<typeof ServiceSchema>; 