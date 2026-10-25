import { expect, it } from "vitest";
import { matchingObservation } from "./calibration";
import type { MixObservation, Recipe } from "./types";

const recipe: Recipe = {
  id: "r",
  targetHex: "#223344",
  estimatedHex: "#334455",
  model: "digital-heuristic",
  ingredients: [
    { paint: { id: "p", name: "Blue", hex: "#224466" }, fraction: 1 },
  ],
  deltaE: 2,
  createdAt: "today",
};
const observation: MixObservation = {
  id: "o",
  recipe,
  observedHex: "#445566",
  createdAt: "today",
};

it("uses a prior observation only for the same paint combination and proportions", () => {
  expect(matchingObservation(recipe, [observation])?.observedHex).toBe(
    "#445566",
  );
  expect(
    matchingObservation(
      {
        ...recipe,
        ingredients: [
          {
            ...recipe.ingredients[0],
            paint: { id: "other", name: "Other", hex: "#224466" },
          },
        ],
      },
      [observation],
    ),
  ).toBeNull();
});
