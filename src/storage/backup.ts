import type { Paint, Recipe } from "../domain/types";

export interface Backup {
  version: 1;
  exportedAt: string;
  paints: Paint[];
  recipes: Recipe[];
}

const hex = /^#[0-9a-f]{6}$/i;
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

function validPaint(value: unknown): value is Paint {
  return (
    object(value) &&
    text(value.id) &&
    text(value.name) &&
    text(value.hex) &&
    hex.test(value.hex) &&
    typeof value.available === "boolean" &&
    text(value.createdAt) &&
    text(value.updatedAt) &&
    (value.densityGPerMl === undefined ||
      (typeof value.densityGPerMl === "number" &&
        Number.isFinite(value.densityGPerMl) &&
        value.densityGPerMl > 0))
  );
}

function validRecipe(value: unknown): value is Recipe {
  if (
    !object(value) ||
    !text(value.id) ||
    !text(value.targetHex) ||
    !hex.test(value.targetHex) ||
    !text(value.estimatedHex) ||
    !hex.test(value.estimatedHex) ||
    value.model !== "digital-heuristic" ||
    !text(value.createdAt) ||
    typeof value.deltaE !== "number" ||
    !Number.isFinite(value.deltaE) ||
    value.deltaE < 0 ||
    !Array.isArray(value.ingredients) ||
    value.ingredients.length < 1 ||
    value.ingredients.length > 5
  )
    return false;
  let sum = 0;
  for (const item of value.ingredients) {
    if (
      !object(item) ||
      !object(item.paint) ||
      !text(item.paint.id) ||
      !text(item.paint.name) ||
      !text(item.paint.hex) ||
      !hex.test(item.paint.hex) ||
      typeof item.fraction !== "number" ||
      !Number.isFinite(item.fraction) ||
      item.fraction <= 0 ||
      item.fraction > 1
    )
      return false;
    sum += item.fraction;
  }
  return Math.abs(sum - 1) < 0.001;
}

export function parseBackup(json: string): Backup {
  if (json.length > 5_000_000) throw new Error("Backup is too large");
  const value: unknown = JSON.parse(json);
  if (
    !object(value) ||
    value.version !== 1 ||
    !Array.isArray(value.paints) ||
    !Array.isArray(value.recipes) ||
    !value.paints.every(validPaint) ||
    !value.recipes.every(validRecipe) ||
    value.paints.length > 10_000 ||
    value.recipes.length > 10_000
  )
    throw new Error("Invalid or unsupported backup");
  const paints = value.paints as Paint[];
  const recipes = value.recipes as Recipe[];
  if (
    new Set(paints.map((paint) => paint.id)).size !== paints.length ||
    new Set(recipes.map((recipe) => recipe.id)).size !== recipes.length
  )
    throw new Error("Duplicate record identifiers");
  return {
    version: 1,
    exportedAt: text(value.exportedAt) ? value.exportedAt : "",
    paints,
    recipes,
  };
}

export function makeBackup(paints: Paint[], recipes: Recipe[]): Backup {
  return { version: 1, exportedAt: new Date().toISOString(), paints, recipes };
}
