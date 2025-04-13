import { z } from 'zod';
import { StackConfig } from '@devx/stack';

/**
 * Options that can be passed to recipe initialization
 */
export type RecipeOptions = Record<string, string>;

/**
 * Recipe interface defining a pre-configured stack template
 */
export interface Recipe {
  /** Name of the recipe */
  name: string;
  /** Description of what the recipe sets up */
  description: string;
  /** Default stack configuration */
  stack: Record<string, any>;
  /** Available options for customization */
  options?: Record<string, RecipeOption>;
}

/**
 * Recipe option for customization
 */
export interface RecipeOption {
  /** Description of the option */
  description: string;
  /** Default value if not specified */
  default?: string;
  /** Available choices for the option */
  choices?: string[];
}

/**
 * Zod schema for Recipe validation
 */
export const RecipeSchema = z.object({
  name: z.string(),
  description: z.string(),
  stack: z.record(z.any()),
  options: z.record(z.object({
    description: z.string(),
    default: z.string().optional(),
    choices: z.array(z.string()).optional(),
  })).optional(),
});

/**
 * Recipe manifest containing all available recipes
 */
export interface RecipeManifest {
  recipes: Recipe[];
}

/**
 * Schema for validating recipe options
 */
export const recipeOptionsSchema = z.record(z.string());

/**
 * Error thrown when recipe initialization fails
 */
export class RecipeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecipeError';
  }
} 