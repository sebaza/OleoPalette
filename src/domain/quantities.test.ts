import { expect, it } from "vitest";
import { ingredientQuantity, rebalance } from "./quantities";

it("rebalances other ingredients without changing the total", () => {
  const result = rebalance([0.5, 0.3, 0.2], 0, 0.6);
  expect(result[0]).toBeCloseTo(0.6);
  expect(result[1]).toBeCloseTo(0.24);
  expect(result[2]).toBeCloseTo(0.16);
});

it("does not estimate grams without a measured density", () => {
  expect(ingredientQuantity(0.25, 20, undefined)).toEqual({
    ml: 5,
    tsp: 1,
    tbsp: 0.33,
    grams: null,
  });
});
