import { describe, expect, it } from "vitest";
import { estimateMix, findRecipes, spectralAvailability } from "./mixing";
import type { Paint } from "./types";

const paint = (id: string, hex: string): Paint => ({
  id,
  name: id,
  hex,
  available: true,
  createdAt: "",
  updatedAt: "",
});

describe("digital mixing estimate", () => {
  it("returns an input color for a single full-strength ingredient", () => {
    expect(estimateMix([paint("red", "#cc3322")], [1])).toBe("#cc3322");
  });

  it("finds deterministic, bounded recipes using only supplied paints", () => {
    const paints = [
      paint("red", "#b33525"),
      paint("blue", "#274276"),
      paint("white", "#e9e8da"),
    ];
    const first = findRecipes("#813e54", paints);
    expect(first.length).toBeGreaterThan(0);
    expect(first).toEqual(findRecipes("#813e54", paints));
    for (const recipe of first) {
      expect(recipe.ingredients.length).toBeLessThanOrEqual(3);
      expect(
        recipe.ingredients.reduce((sum, item) => sum + item.fraction, 0),
      ).toBeCloseTo(1);
      expect(
        recipe.ingredients.every((item) =>
          paints.some((p) => p.id === item.paint.id),
        ),
      ).toBe(true);
    }
  });

  it("does not fabricate spectral calibration data", () => {
    expect(spectralAvailability()).toEqual({
      available: false,
      reason: "Datos de calibración espectral insuficientes",
    });
  });
});
