import { describe, expect, it } from "vitest";
import { estimateMix, findRecipes, spectralAvailability } from "./mixing";
import { basicCatalog, catalog } from "./catalog";
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

  it("starts reference results with basic red, primary yellow, blue, white and black", () => {
    expect(basicCatalog.map(({ id }) => id)).toEqual([
      "reference-red",
      "reference-primary-yellow",
      "reference-blue",
      "reference-white",
      "reference-black",
    ]);
    const recipes = findRecipes("#228070", catalog, {
      basicPaintIds: basicCatalog.map(({ id }) => id),
    });
    expect(recipes.length).toBeGreaterThan(1);
    expect(
      recipes[0].ingredients.every(({ paint }) =>
        basicCatalog.some(({ id }) => id === paint.id),
      ),
    ).toBe(true);
    expect(
      recipes
        .slice(1)
        .some((recipe) =>
          recipe.ingredients.some(
            ({ paint }) => !basicCatalog.some(({ id }) => id === paint.id),
          ),
        ),
    ).toBe(true);
    expect(
      recipes[0].ingredients.reduce((sum, item) => sum + item.fraction, 0),
    ).toBeCloseTo(1);
    expect(recipes).toEqual(
      findRecipes("#228070", catalog, {
        basicPaintIds: basicCatalog.map(({ id }) => id),
      }),
    );
  });

  it("uses only available personal paints and returns distinct compositions", () => {
    const paints = [
      paint("a", "#cc3322"),
      paint("b", "#254677"),
      paint("c", "#e9e8da"),
      paint("d", "#236f61"),
      { ...paint("absent", "#368076"), available: false },
    ];
    const recipes = findRecipes("#398076", paints);
    expect(recipes[0].ingredients.length).toBeLessThanOrEqual(3);
    for (const recipe of recipes) {
      expect(
        recipe.ingredients.every(({ paint }) => paint.id !== "absent"),
      ).toBe(true);
      expect(
        recipe.ingredients.reduce((sum, item) => sum + item.fraction, 0),
      ).toBeCloseTo(1);
    }
    expect(
      new Set(
        recipes.map((recipe) =>
          recipe.ingredients.map(({ paint }) => paint.id).join(","),
        ),
      ).size,
    ).toBe(recipes.length);
  });
});
