import { z } from 'zod';
import { StackStatus } from '@devx/common';
/** Placeholder: Represents the build status of a stack. */
export declare enum StackBuildStatus {
    Unknown = "unknown",
    NotBuilt = "not_built",
    Building = "building",
    Built = "built",
    Error = "error"
}
/** Placeholder: Zod schema for StackState */
export declare const StackStateSchema: z.ZodObject<{
    name: z.ZodString;
    configPath: z.ZodString;
    buildStatus: z.ZodNativeEnum<typeof StackBuildStatus>;
    runtimeStatus: z.ZodNativeEnum<typeof StackStatus>;
    lastBuiltAt: z.ZodNullable<z.ZodDate>;
    lastStartedAt: z.ZodNullable<z.ZodDate>;
    manifestPath: z.ZodNullable<z.ZodString>;
    lastError: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    configPath?: string;
    buildStatus?: StackBuildStatus;
    runtimeStatus?: StackStatus;
    lastBuiltAt?: Date;
    lastStartedAt?: Date;
    manifestPath?: string;
    lastError?: string;
}, {
    name?: string;
    configPath?: string;
    buildStatus?: StackBuildStatus;
    runtimeStatus?: StackStatus;
    lastBuiltAt?: Date;
    lastStartedAt?: Date;
    manifestPath?: string;
    lastError?: string;
}>;
/** Placeholder: Represents the state of a single managed stack. */
export type StackState = z.infer<typeof StackStateSchema>;
/** Placeholder: Zod schema for the overall DevX state file */
export declare const DevxStateSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    name: z.ZodString;
    configPath: z.ZodString;
    buildStatus: z.ZodNativeEnum<typeof StackBuildStatus>;
    runtimeStatus: z.ZodNativeEnum<typeof StackStatus>;
    lastBuiltAt: z.ZodNullable<z.ZodDate>;
    lastStartedAt: z.ZodNullable<z.ZodDate>;
    manifestPath: z.ZodNullable<z.ZodString>;
    lastError: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    configPath?: string;
    buildStatus?: StackBuildStatus;
    runtimeStatus?: StackStatus;
    lastBuiltAt?: Date;
    lastStartedAt?: Date;
    manifestPath?: string;
    lastError?: string;
}, {
    name?: string;
    configPath?: string;
    buildStatus?: StackBuildStatus;
    runtimeStatus?: StackStatus;
    lastBuiltAt?: Date;
    lastStartedAt?: Date;
    manifestPath?: string;
    lastError?: string;
}>>;
/** Placeholder: Represents the overall state managed by Devx. */
export type DevxState = z.infer<typeof DevxStateSchema>;
