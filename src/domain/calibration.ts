import type { MixObservation, Recipe } from "./types";

// A prior observation is shown separately from the model, never extrapolated to another mix.
export function matchingObservation(
  recipe: Recipe,
  observations: MixObservation[],
): MixObservation | null {
  return (
    [...observations]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .find((observation) => {
        if (observation.recipe.ingredients.length !== recipe.ingredients.length)
          return false;
        return recipe.ingredients.every((ingredient) => {
          const prior = observation.recipe.ingredients.find(
            (item) => item.paint.id === ingredient.paint.id,
          );
          return (
            prior && Math.abs(prior.fraction - ingredient.fraction) <= 0.01
          );
        });
      }) || null
  );
}
