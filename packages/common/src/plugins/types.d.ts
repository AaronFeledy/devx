import type { StackConfig } from '../schemas/stack';
/** Status of a DevX managed stack */
export declare enum StackStatus {
    Unknown = "unknown",
    Building = "building",
    Starting = "starting",
    Running = "running",
    Stopping = "stopping",
    Stopped = "stopped",
    Destroying = "destroying",
    Error = "error",
    NotCreated = "not_created"
}
/** Detailed status information for a stack */
export interface StackStatusInfo {
    status: StackStatus;
    message?: string;
    services?: {
        [serviceName: string]: {
            status: string;
            ports?: {
                hostPort: number;
                containerPort: number;
                protocol: string;
            }[];
        };
    };
}
/**
 * Interface for Engine plugins (e.g., Podman, Docker).
 * Manages interaction with the container runtime.
 */
export interface EnginePlugin {
    type: 'engine';
    name: string;
    /** Check if the engine (e.g., podman daemon) is available and responsive. */
    isAvailable(): Promise<boolean>;
    /** Get the current status of the containers belonging to a specific stack. */
    getStackStatus(stackName: string, projectPath: string): Promise<StackStatusInfo>;
}
/**
 * Interface for Builder plugins (e.g., podman-compose, docker-compose).
 * Manages container orchestration based on stack configuration.
 */
export interface BuilderPlugin {
    type: 'builder';
    name: string;
    /** Check if the builder tool (e.g., podman-compose) is available. */
    isAvailable(): Promise<boolean>;
    /**
     * Generate the orchestrator-specific configuration file (e.g., docker-compose.yml).
     * @param config The stack configuration.
     * @param projectPath The root directory of the project containing the stack config.
     * @returns Path to the generated configuration file.
     */
    generateConfig(config: StackConfig, projectPath: string): Promise<string>;
    /**
     * Build the container images for the stack.
     * @param config The stack configuration.
     * @param projectPath The root directory of the project.
     */
    build(config: StackConfig, projectPath: string): Promise<void>;
    /**
     * Start the stack services in detached mode.
     * @param config The stack configuration.
     * @param projectPath The root directory of the project.
     */
    start(config: StackConfig, projectPath: string): Promise<void>;
    /**
     * Stop the stack services.
     * @param config The stack configuration.
     * @param projectPath The root directory of the project.
     */
    stop(config: StackConfig, projectPath: string): Promise<void>;
    /**
     * Stop and remove stack services, networks, and optionally volumes.
     * @param config The stack configuration.
     * @param projectPath The root directory of the project.
     * @param options Options for destruction (e.g., remove volumes).
     */
    destroy(config: StackConfig, projectPath: string, options?: {
        removeVolumes?: boolean;
    }): Promise<void>;
}
/**
 * Interface for defining tasks runnable via DevX.
 */
export interface Task {
    name: string;
    description?: string;
    run(args: string[]): Promise<void>;
}
/**
 * Interface for defining stack recipes.
 */
export interface Recipe {
    name: string;
    description?: string;
    getStackConfig(overrides: Record<string, any>): Promise<Record<string, any>>;
}
/**
 * The main Plugin interface.
 * A single plugin package can provide multiple capabilities.
 */
export interface Plugin {
    name: string;
    version: string;
    description?: string;
    engine?: EnginePlugin;
    builder?: BuilderPlugin;
    tasks?: Task[];
    recipes?: Recipe[];
    initialize?(): Promise<void>;
    terminate?(): Promise<void>;
}
