import { Recipe, RecipeOption, RecipeManifest } from './types.js';
import { lampRecipe } from './recipes/lamp.js';

export type { Recipe, RecipeOption, RecipeManifest };

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

/**
 * Lists available recipes.
 * @returns An array of Recipe objects.
 */
export function listRecipes(): Recipe[] {
  return Object.values(recipes);
}
