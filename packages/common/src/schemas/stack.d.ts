import { z } from 'zod';
/**
 * Defines the configuration for a single service within the stack,
 * analogous to a service in docker-compose.
 */
declare const ServiceConfigSchema: z.ZodObject<
  {
    /** The Docker image to use for the service. */
    image: z.ZodOptional<z.ZodString>;
    /** Configuration for building the service image from a Dockerfile. */
    build: z.ZodOptional<
      z.ZodUnion<
        [
          z.ZodString,
          z.ZodObject<
            {
              context: z.ZodString;
              dockerfile: z.ZodOptional<z.ZodString>;
            },
            'strip',
            z.ZodTypeAny,
            {
              context?: string;
              dockerfile?: string;
            },
            {
              context?: string;
              dockerfile?: string;
            }
          >,
        ]
      >
    >;
    /** Port mappings between the host and the container. */
    ports: z.ZodOptional<
      z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
    >;
    /** Volume mappings for persistent data or mounting code. */
    volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
    environment: z.ZodOptional<
      z.ZodUnion<
        [z.ZodRecord<z.ZodString, z.ZodString>, z.ZodArray<z.ZodString, 'many'>]
      >
    >;
    /** Services that this service depends on. */
    depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    /** Override the default command for the container. */
    command: z.ZodOptional<
      z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
    >;
    /** Override the default entrypoint for the container. */
    entrypoint: z.ZodOptional<
      z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
    >;
    /** Networks to connect this service to. */
    networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
  },
  'strip',
  z.ZodAny,
  z.objectOutputType<
    {
      /** The Docker image to use for the service. */
      image: z.ZodOptional<z.ZodString>;
      /** Configuration for building the service image from a Dockerfile. */
      build: z.ZodOptional<
        z.ZodUnion<
          [
            z.ZodString,
            z.ZodObject<
              {
                context: z.ZodString;
                dockerfile: z.ZodOptional<z.ZodString>;
              },
              'strip',
              z.ZodTypeAny,
              {
                context?: string;
                dockerfile?: string;
              },
              {
                context?: string;
                dockerfile?: string;
              }
            >,
          ]
        >
      >;
      /** Port mappings between the host and the container. */
      ports: z.ZodOptional<
        z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
      >;
      /** Volume mappings for persistent data or mounting code. */
      volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
      /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
      environment: z.ZodOptional<
        z.ZodUnion<
          [
            z.ZodRecord<z.ZodString, z.ZodString>,
            z.ZodArray<z.ZodString, 'many'>,
          ]
        >
      >;
      /** Services that this service depends on. */
      depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
      /** Override the default command for the container. */
      command: z.ZodOptional<
        z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
      >;
      /** Override the default entrypoint for the container. */
      entrypoint: z.ZodOptional<
        z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
      >;
      /** Networks to connect this service to. */
      networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    },
    z.ZodAny,
    'strip'
  >,
  z.objectInputType<
    {
      /** The Docker image to use for the service. */
      image: z.ZodOptional<z.ZodString>;
      /** Configuration for building the service image from a Dockerfile. */
      build: z.ZodOptional<
        z.ZodUnion<
          [
            z.ZodString,
            z.ZodObject<
              {
                context: z.ZodString;
                dockerfile: z.ZodOptional<z.ZodString>;
              },
              'strip',
              z.ZodTypeAny,
              {
                context?: string;
                dockerfile?: string;
              },
              {
                context?: string;
                dockerfile?: string;
              }
            >,
          ]
        >
      >;
      /** Port mappings between the host and the container. */
      ports: z.ZodOptional<
        z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
      >;
      /** Volume mappings for persistent data or mounting code. */
      volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
      /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
      environment: z.ZodOptional<
        z.ZodUnion<
          [
            z.ZodRecord<z.ZodString, z.ZodString>,
            z.ZodArray<z.ZodString, 'many'>,
          ]
        >
      >;
      /** Services that this service depends on. */
      depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
      /** Override the default command for the container. */
      command: z.ZodOptional<
        z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
      >;
      /** Override the default entrypoint for the container. */
      entrypoint: z.ZodOptional<
        z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
      >;
      /** Networks to connect this service to. */
      networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
    },
    z.ZodAny,
    'strip'
  >
>;
/**
 * Defines the overall structure and configuration for a DevX stack,
 * specified in a `.stack.yml` or `.stack.json` file.
 */
export declare const StackConfigSchema: z.ZodObject<
  {
    /** A unique name for the stack, used for identification and management. */
    name: z.ZodString;
    /** Optional version field, similar to docker-compose, for schema versioning. */
    version: z.ZodOptional<z.ZodString>;
    /** Optional configuration for the builder plugin. */
    builder: z.ZodOptional<
      z.ZodObject<
        {
          /** The name of the plugin to use. */
          name: z.ZodString;
          /** Plugin-specific options. */
          options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        },
        'strip',
        z.ZodTypeAny,
        {
          options?: Record<string, any>;
          name?: string;
        },
        {
          options?: Record<string, any>;
          name?: string;
        }
      >
    >;
    /** Optional configuration for the engine plugin. */
    engine: z.ZodOptional<
      z.ZodObject<
        {
          /** The name of the plugin to use. */
          name: z.ZodString;
          /** Plugin-specific options. */
          options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        },
        'strip',
        z.ZodTypeAny,
        {
          options?: Record<string, any>;
          name?: string;
        },
        {
          options?: Record<string, any>;
          name?: string;
        }
      >
    >;
    /** A map of service names to their configurations. */
    services: z.ZodRecord<
      z.ZodString,
      z.ZodObject<
        {
          /** The Docker image to use for the service. */
          image: z.ZodOptional<z.ZodString>;
          /** Configuration for building the service image from a Dockerfile. */
          build: z.ZodOptional<
            z.ZodUnion<
              [
                z.ZodString,
                z.ZodObject<
                  {
                    context: z.ZodString;
                    dockerfile: z.ZodOptional<z.ZodString>;
                  },
                  'strip',
                  z.ZodTypeAny,
                  {
                    context?: string;
                    dockerfile?: string;
                  },
                  {
                    context?: string;
                    dockerfile?: string;
                  }
                >,
              ]
            >
          >;
          /** Port mappings between the host and the container. */
          ports: z.ZodOptional<
            z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
          >;
          /** Volume mappings for persistent data or mounting code. */
          volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
          environment: z.ZodOptional<
            z.ZodUnion<
              [
                z.ZodRecord<z.ZodString, z.ZodString>,
                z.ZodArray<z.ZodString, 'many'>,
              ]
            >
          >;
          /** Services that this service depends on. */
          depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          /** Override the default command for the container. */
          command: z.ZodOptional<
            z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
          >;
          /** Override the default entrypoint for the container. */
          entrypoint: z.ZodOptional<
            z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
          >;
          /** Networks to connect this service to. */
          networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
        },
        'strip',
        z.ZodAny,
        z.objectOutputType<
          {
            /** The Docker image to use for the service. */
            image: z.ZodOptional<z.ZodString>;
            /** Configuration for building the service image from a Dockerfile. */
            build: z.ZodOptional<
              z.ZodUnion<
                [
                  z.ZodString,
                  z.ZodObject<
                    {
                      context: z.ZodString;
                      dockerfile: z.ZodOptional<z.ZodString>;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      context?: string;
                      dockerfile?: string;
                    },
                    {
                      context?: string;
                      dockerfile?: string;
                    }
                  >,
                ]
              >
            >;
            /** Port mappings between the host and the container. */
            ports: z.ZodOptional<
              z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
            >;
            /** Volume mappings for persistent data or mounting code. */
            volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
            environment: z.ZodOptional<
              z.ZodUnion<
                [
                  z.ZodRecord<z.ZodString, z.ZodString>,
                  z.ZodArray<z.ZodString, 'many'>,
                ]
              >
            >;
            /** Services that this service depends on. */
            depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            /** Override the default command for the container. */
            command: z.ZodOptional<
              z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
            >;
            /** Override the default entrypoint for the container. */
            entrypoint: z.ZodOptional<
              z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
            >;
            /** Networks to connect this service to. */
            networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          },
          z.ZodAny,
          'strip'
        >,
        z.objectInputType<
          {
            /** The Docker image to use for the service. */
            image: z.ZodOptional<z.ZodString>;
            /** Configuration for building the service image from a Dockerfile. */
            build: z.ZodOptional<
              z.ZodUnion<
                [
                  z.ZodString,
                  z.ZodObject<
                    {
                      context: z.ZodString;
                      dockerfile: z.ZodOptional<z.ZodString>;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      context?: string;
                      dockerfile?: string;
                    },
                    {
                      context?: string;
                      dockerfile?: string;
                    }
                  >,
                ]
              >
            >;
            /** Port mappings between the host and the container. */
            ports: z.ZodOptional<
              z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
            >;
            /** Volume mappings for persistent data or mounting code. */
            volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
            environment: z.ZodOptional<
              z.ZodUnion<
                [
                  z.ZodRecord<z.ZodString, z.ZodString>,
                  z.ZodArray<z.ZodString, 'many'>,
                ]
              >
            >;
            /** Services that this service depends on. */
            depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            /** Override the default command for the container. */
            command: z.ZodOptional<
              z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
            >;
            /** Override the default entrypoint for the container. */
            entrypoint: z.ZodOptional<
              z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
            >;
            /** Networks to connect this service to. */
            networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          },
          z.ZodAny,
          'strip'
        >
      >
    >;
    /** Optional definitions for custom networks used by the services. */
    networks: z.ZodOptional<
      z.ZodRecord<
        z.ZodString,
        z.ZodObject<
          {
            /** The network driver to use (e.g., 'bridge'). */
            driver: z.ZodOptional<z.ZodString>;
          },
          'strip',
          z.ZodAny,
          z.objectOutputType<
            {
              /** The network driver to use (e.g., 'bridge'). */
              driver: z.ZodOptional<z.ZodString>;
            },
            z.ZodAny,
            'strip'
          >,
          z.objectInputType<
            {
              /** The network driver to use (e.g., 'bridge'). */
              driver: z.ZodOptional<z.ZodString>;
            },
            z.ZodAny,
            'strip'
          >
        >
      >
    >;
    /** Optional definitions for named volumes used by the services. */
    volumes: z.ZodOptional<
      z.ZodRecord<
        z.ZodString,
        z.ZodObject<
          {
            /** The volume driver to use. */
            driver: z.ZodOptional<z.ZodString>;
          },
          'strip',
          z.ZodAny,
          z.objectOutputType<
            {
              /** The volume driver to use. */
              driver: z.ZodOptional<z.ZodString>;
            },
            z.ZodAny,
            'strip'
          >,
          z.objectInputType<
            {
              /** The volume driver to use. */
              driver: z.ZodOptional<z.ZodString>;
            },
            z.ZodAny,
            'strip'
          >
        >
      >
    >;
  },
  'strip',
  z.ZodAny,
  z.objectOutputType<
    {
      /** A unique name for the stack, used for identification and management. */
      name: z.ZodString;
      /** Optional version field, similar to docker-compose, for schema versioning. */
      version: z.ZodOptional<z.ZodString>;
      /** Optional configuration for the builder plugin. */
      builder: z.ZodOptional<
        z.ZodObject<
          {
            /** The name of the plugin to use. */
            name: z.ZodString;
            /** Plugin-specific options. */
            options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
          },
          'strip',
          z.ZodTypeAny,
          {
            options?: Record<string, any>;
            name?: string;
          },
          {
            options?: Record<string, any>;
            name?: string;
          }
        >
      >;
      /** Optional configuration for the engine plugin. */
      engine: z.ZodOptional<
        z.ZodObject<
          {
            /** The name of the plugin to use. */
            name: z.ZodString;
            /** Plugin-specific options. */
            options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
          },
          'strip',
          z.ZodTypeAny,
          {
            options?: Record<string, any>;
            name?: string;
          },
          {
            options?: Record<string, any>;
            name?: string;
          }
        >
      >;
      /** A map of service names to their configurations. */
      services: z.ZodRecord<
        z.ZodString,
        z.ZodObject<
          {
            /** The Docker image to use for the service. */
            image: z.ZodOptional<z.ZodString>;
            /** Configuration for building the service image from a Dockerfile. */
            build: z.ZodOptional<
              z.ZodUnion<
                [
                  z.ZodString,
                  z.ZodObject<
                    {
                      context: z.ZodString;
                      dockerfile: z.ZodOptional<z.ZodString>;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      context?: string;
                      dockerfile?: string;
                    },
                    {
                      context?: string;
                      dockerfile?: string;
                    }
                  >,
                ]
              >
            >;
            /** Port mappings between the host and the container. */
            ports: z.ZodOptional<
              z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
            >;
            /** Volume mappings for persistent data or mounting code. */
            volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
            environment: z.ZodOptional<
              z.ZodUnion<
                [
                  z.ZodRecord<z.ZodString, z.ZodString>,
                  z.ZodArray<z.ZodString, 'many'>,
                ]
              >
            >;
            /** Services that this service depends on. */
            depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            /** Override the default command for the container. */
            command: z.ZodOptional<
              z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
            >;
            /** Override the default entrypoint for the container. */
            entrypoint: z.ZodOptional<
              z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
            >;
            /** Networks to connect this service to. */
            networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          },
          'strip',
          z.ZodAny,
          z.objectOutputType<
            {
              /** The Docker image to use for the service. */
              image: z.ZodOptional<z.ZodString>;
              /** Configuration for building the service image from a Dockerfile. */
              build: z.ZodOptional<
                z.ZodUnion<
                  [
                    z.ZodString,
                    z.ZodObject<
                      {
                        context: z.ZodString;
                        dockerfile: z.ZodOptional<z.ZodString>;
                      },
                      'strip',
                      z.ZodTypeAny,
                      {
                        context?: string;
                        dockerfile?: string;
                      },
                      {
                        context?: string;
                        dockerfile?: string;
                      }
                    >,
                  ]
                >
              >;
              /** Port mappings between the host and the container. */
              ports: z.ZodOptional<
                z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
              >;
              /** Volume mappings for persistent data or mounting code. */
              volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
              environment: z.ZodOptional<
                z.ZodUnion<
                  [
                    z.ZodRecord<z.ZodString, z.ZodString>,
                    z.ZodArray<z.ZodString, 'many'>,
                  ]
                >
              >;
              /** Services that this service depends on. */
              depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              /** Override the default command for the container. */
              command: z.ZodOptional<
                z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
              >;
              /** Override the default entrypoint for the container. */
              entrypoint: z.ZodOptional<
                z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
              >;
              /** Networks to connect this service to. */
              networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            },
            z.ZodAny,
            'strip'
          >,
          z.objectInputType<
            {
              /** The Docker image to use for the service. */
              image: z.ZodOptional<z.ZodString>;
              /** Configuration for building the service image from a Dockerfile. */
              build: z.ZodOptional<
                z.ZodUnion<
                  [
                    z.ZodString,
                    z.ZodObject<
                      {
                        context: z.ZodString;
                        dockerfile: z.ZodOptional<z.ZodString>;
                      },
                      'strip',
                      z.ZodTypeAny,
                      {
                        context?: string;
                        dockerfile?: string;
                      },
                      {
                        context?: string;
                        dockerfile?: string;
                      }
                    >,
                  ]
                >
              >;
              /** Port mappings between the host and the container. */
              ports: z.ZodOptional<
                z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
              >;
              /** Volume mappings for persistent data or mounting code. */
              volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
              environment: z.ZodOptional<
                z.ZodUnion<
                  [
                    z.ZodRecord<z.ZodString, z.ZodString>,
                    z.ZodArray<z.ZodString, 'many'>,
                  ]
                >
              >;
              /** Services that this service depends on. */
              depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              /** Override the default command for the container. */
              command: z.ZodOptional<
                z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
              >;
              /** Override the default entrypoint for the container. */
              entrypoint: z.ZodOptional<
                z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
              >;
              /** Networks to connect this service to. */
              networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            },
            z.ZodAny,
            'strip'
          >
        >
      >;
      /** Optional definitions for custom networks used by the services. */
      networks: z.ZodOptional<
        z.ZodRecord<
          z.ZodString,
          z.ZodObject<
            {
              /** The network driver to use (e.g., 'bridge'). */
              driver: z.ZodOptional<z.ZodString>;
            },
            'strip',
            z.ZodAny,
            z.objectOutputType<
              {
                /** The network driver to use (e.g., 'bridge'). */
                driver: z.ZodOptional<z.ZodString>;
              },
              z.ZodAny,
              'strip'
            >,
            z.objectInputType<
              {
                /** The network driver to use (e.g., 'bridge'). */
                driver: z.ZodOptional<z.ZodString>;
              },
              z.ZodAny,
              'strip'
            >
          >
        >
      >;
      /** Optional definitions for named volumes used by the services. */
      volumes: z.ZodOptional<
        z.ZodRecord<
          z.ZodString,
          z.ZodObject<
            {
              /** The volume driver to use. */
              driver: z.ZodOptional<z.ZodString>;
            },
            'strip',
            z.ZodAny,
            z.objectOutputType<
              {
                /** The volume driver to use. */
                driver: z.ZodOptional<z.ZodString>;
              },
              z.ZodAny,
              'strip'
            >,
            z.objectInputType<
              {
                /** The volume driver to use. */
                driver: z.ZodOptional<z.ZodString>;
              },
              z.ZodAny,
              'strip'
            >
          >
        >
      >;
    },
    z.ZodAny,
    'strip'
  >,
  z.objectInputType<
    {
      /** A unique name for the stack, used for identification and management. */
      name: z.ZodString;
      /** Optional version field, similar to docker-compose, for schema versioning. */
      version: z.ZodOptional<z.ZodString>;
      /** Optional configuration for the builder plugin. */
      builder: z.ZodOptional<
        z.ZodObject<
          {
            /** The name of the plugin to use. */
            name: z.ZodString;
            /** Plugin-specific options. */
            options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
          },
          'strip',
          z.ZodTypeAny,
          {
            options?: Record<string, any>;
            name?: string;
          },
          {
            options?: Record<string, any>;
            name?: string;
          }
        >
      >;
      /** Optional configuration for the engine plugin. */
      engine: z.ZodOptional<
        z.ZodObject<
          {
            /** The name of the plugin to use. */
            name: z.ZodString;
            /** Plugin-specific options. */
            options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
          },
          'strip',
          z.ZodTypeAny,
          {
            options?: Record<string, any>;
            name?: string;
          },
          {
            options?: Record<string, any>;
            name?: string;
          }
        >
      >;
      /** A map of service names to their configurations. */
      services: z.ZodRecord<
        z.ZodString,
        z.ZodObject<
          {
            /** The Docker image to use for the service. */
            image: z.ZodOptional<z.ZodString>;
            /** Configuration for building the service image from a Dockerfile. */
            build: z.ZodOptional<
              z.ZodUnion<
                [
                  z.ZodString,
                  z.ZodObject<
                    {
                      context: z.ZodString;
                      dockerfile: z.ZodOptional<z.ZodString>;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                      context?: string;
                      dockerfile?: string;
                    },
                    {
                      context?: string;
                      dockerfile?: string;
                    }
                  >,
                ]
              >
            >;
            /** Port mappings between the host and the container. */
            ports: z.ZodOptional<
              z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
            >;
            /** Volume mappings for persistent data or mounting code. */
            volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
            environment: z.ZodOptional<
              z.ZodUnion<
                [
                  z.ZodRecord<z.ZodString, z.ZodString>,
                  z.ZodArray<z.ZodString, 'many'>,
                ]
              >
            >;
            /** Services that this service depends on. */
            depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            /** Override the default command for the container. */
            command: z.ZodOptional<
              z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
            >;
            /** Override the default entrypoint for the container. */
            entrypoint: z.ZodOptional<
              z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
            >;
            /** Networks to connect this service to. */
            networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          },
          'strip',
          z.ZodAny,
          z.objectOutputType<
            {
              /** The Docker image to use for the service. */
              image: z.ZodOptional<z.ZodString>;
              /** Configuration for building the service image from a Dockerfile. */
              build: z.ZodOptional<
                z.ZodUnion<
                  [
                    z.ZodString,
                    z.ZodObject<
                      {
                        context: z.ZodString;
                        dockerfile: z.ZodOptional<z.ZodString>;
                      },
                      'strip',
                      z.ZodTypeAny,
                      {
                        context?: string;
                        dockerfile?: string;
                      },
                      {
                        context?: string;
                        dockerfile?: string;
                      }
                    >,
                  ]
                >
              >;
              /** Port mappings between the host and the container. */
              ports: z.ZodOptional<
                z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
              >;
              /** Volume mappings for persistent data or mounting code. */
              volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
              environment: z.ZodOptional<
                z.ZodUnion<
                  [
                    z.ZodRecord<z.ZodString, z.ZodString>,
                    z.ZodArray<z.ZodString, 'many'>,
                  ]
                >
              >;
              /** Services that this service depends on. */
              depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              /** Override the default command for the container. */
              command: z.ZodOptional<
                z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
              >;
              /** Override the default entrypoint for the container. */
              entrypoint: z.ZodOptional<
                z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
              >;
              /** Networks to connect this service to. */
              networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            },
            z.ZodAny,
            'strip'
          >,
          z.objectInputType<
            {
              /** The Docker image to use for the service. */
              image: z.ZodOptional<z.ZodString>;
              /** Configuration for building the service image from a Dockerfile. */
              build: z.ZodOptional<
                z.ZodUnion<
                  [
                    z.ZodString,
                    z.ZodObject<
                      {
                        context: z.ZodString;
                        dockerfile: z.ZodOptional<z.ZodString>;
                      },
                      'strip',
                      z.ZodTypeAny,
                      {
                        context?: string;
                        dockerfile?: string;
                      },
                      {
                        context?: string;
                        dockerfile?: string;
                      }
                    >,
                  ]
                >
              >;
              /** Port mappings between the host and the container. */
              ports: z.ZodOptional<
                z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNumber]>, 'many'>
              >;
              /** Volume mappings for persistent data or mounting code. */
              volumes: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              /** Environment variables to set within the container. Can be an object or an array of "KEY=value" strings. */
              environment: z.ZodOptional<
                z.ZodUnion<
                  [
                    z.ZodRecord<z.ZodString, z.ZodString>,
                    z.ZodArray<z.ZodString, 'many'>,
                  ]
                >
              >;
              /** Services that this service depends on. */
              depends_on: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              /** Override the default command for the container. */
              command: z.ZodOptional<
                z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
              >;
              /** Override the default entrypoint for the container. */
              entrypoint: z.ZodOptional<
                z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, 'many'>]>
              >;
              /** Networks to connect this service to. */
              networks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
            },
            z.ZodAny,
            'strip'
          >
        >
      >;
      /** Optional definitions for custom networks used by the services. */
      networks: z.ZodOptional<
        z.ZodRecord<
          z.ZodString,
          z.ZodObject<
            {
              /** The network driver to use (e.g., 'bridge'). */
              driver: z.ZodOptional<z.ZodString>;
            },
            'strip',
            z.ZodAny,
            z.objectOutputType<
              {
                /** The network driver to use (e.g., 'bridge'). */
                driver: z.ZodOptional<z.ZodString>;
              },
              z.ZodAny,
              'strip'
            >,
            z.objectInputType<
              {
                /** The network driver to use (e.g., 'bridge'). */
                driver: z.ZodOptional<z.ZodString>;
              },
              z.ZodAny,
              'strip'
            >
          >
        >
      >;
      /** Optional definitions for named volumes used by the services. */
      volumes: z.ZodOptional<
        z.ZodRecord<
          z.ZodString,
          z.ZodObject<
            {
              /** The volume driver to use. */
              driver: z.ZodOptional<z.ZodString>;
            },
            'strip',
            z.ZodAny,
            z.objectOutputType<
              {
                /** The volume driver to use. */
                driver: z.ZodOptional<z.ZodString>;
              },
              z.ZodAny,
              'strip'
            >,
            z.objectInputType<
              {
                /** The volume driver to use. */
                driver: z.ZodOptional<z.ZodString>;
              },
              z.ZodAny,
              'strip'
            >
          >
        >
      >;
    },
    z.ZodAny,
    'strip'
  >
>;
/**
 * Represents the validated configuration of a DevX stack.
 * This type is inferred from the `StackConfigSchema`.
 */
export type StackConfig = z.infer<typeof StackConfigSchema>;
/**
 * Represents the validated configuration of a single service within a stack.
 * This type is inferred from the `ServiceConfigSchema`.
 */
export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;
export {};
