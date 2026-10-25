import type { MixObservation, Paint, Recipe } from "../domain/types";

export interface Backup {
  version: 2;
  exportedAt: string;
  paints: Paint[];
  recipes: Recipe[];
  observations: MixObservation[];
}

const hex = /^#[0-9a-f]{6}$/i;
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;
const optionalText = (value: unknown): boolean =>
  value === undefined || typeof value === "string";
const optionalDensity = (value: unknown): boolean =>
  value === undefined ||
  (typeof value === "number" && Number.isFinite(value) && value > 0);

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
    optionalText(value.brand) &&
    optionalText(value.pigmentCode) &&
    optionalText(value.notes) &&
    optionalDensity(value.densityGPerMl)
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
      !optionalText(item.paint.brand) ||
      !optionalDensity(item.paint.densityGPerMl) ||
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

function validObservation(value: unknown): value is MixObservation {
  return (
    object(value) &&
    text(value.id) &&
    validRecipe(value.recipe) &&
    text(value.observedHex) &&
    hex.test(value.observedHex) &&
    text(value.createdAt) &&
    optionalText(value.lighting) &&
    optionalText(value.notes) &&
    (value.paintState === undefined ||
      value.paintState === "wet" ||
      value.paintState === "dry" ||
      value.paintState === "unknown")
  );
}

export function parseBackup(json: string): Backup {
  if (json.length > 5_000_000) throw new Error("Backup is too large");
  const value: unknown = JSON.parse(json);
  if (
    !object(value) ||
    (value.version !== 1 && value.version !== 2) ||
    !Array.isArray(value.paints) ||
    !Array.isArray(value.recipes) ||
    !value.paints.every(validPaint) ||
    !value.recipes.every(validRecipe) ||
    (value.version === 2 &&
      (!Array.isArray(value.observations) ||
        !value.observations.every(validObservation) ||
        value.observations.length > 10_000)) ||
    value.paints.length > 10_000 ||
    value.recipes.length > 10_000
  )
    throw new Error("Invalid or unsupported backup");
  const paints = value.paints as Paint[];
  const recipes = value.recipes as Recipe[];
  const observations =
    value.version === 2 ? (value.observations as MixObservation[]) : [];
  if (
    new Set(paints.map((paint) => paint.id)).size !== paints.length ||
    new Set(recipes.map((recipe) => recipe.id)).size !== recipes.length ||
    new Set(observations.map((observation) => observation.id)).size !==
      observations.length
  )
    throw new Error("Duplicate record identifiers");
  return {
    version: 2,
    exportedAt: text(value.exportedAt) ? value.exportedAt : "",
    paints,
    recipes,
    observations,
  };
}

export function makeBackup(
  paints: Paint[],
  recipes: Recipe[],
  observations: MixObservation[],
): Backup {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    paints,
    recipes,
    observations,
  };
}
