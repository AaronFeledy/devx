import { Recipe, RecipeOption, RecipeManifest, RecipeSchema } from './types';
import { lampRecipe } from './recipes/lamp';

/**
 * Registry of available recipes
 */
export const recipes = {
  lamp: lampRecipe,
} as const;

/**
 * Get a recipe by name
 * @param name - Name of the recipe to get
 * @returns The recipe instance
 * @throws Error if the recipe is not found
 */
export function getRecipe(name: string) {
  const recipe = recipes[name as keyof typeof recipes];
  if (!recipe) {
    throw new Error(`Recipe "${name}" not found`);
  }
  return recipe;
} 