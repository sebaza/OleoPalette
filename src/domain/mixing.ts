import Color from "colorjs.io";
import type { Ingredient, Paint, Recipe } from "./types";

// A digital, per-channel optical-density heuristic. This is not a physical oil-paint model.
function channels(hex: string): number[] {
  return new Color(hex).to("srgb-linear").coords as number[];
}

function toHex(linear: number[]): string {
  const coordinates = new Color(
    "srgb-linear",
    linear as [number, number, number],
  ).to("srgb").coords;
  return `#${coordinates
    .map((value) =>
      Math.round(Math.max(0, Math.min(1, value)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function estimateMix(
  paints: Pick<Paint, "hex">[],
  fractions: number[],
): string {
  if (paints.length === 0 || paints.length !== fractions.length)
    throw new Error("Invalid mix");
  const sum = fractions.reduce((total, fraction) => total + fraction, 0);
  if (sum <= 0 || fractions.some((fraction) => fraction < 0))
    throw new Error("Invalid proportions");
  const optical = paints.map((paint) =>
    channels(paint.hex).map((value) => -Math.log(Math.max(value, 0.004))),
  );
  return toHex(
    [0, 1, 2].map((index) =>
      Math.exp(
        -optical.reduce(
          (total, row, i) => total + (row[index] * fractions[i]) / sum,
          0,
        ),
      ),
    ),
  );
}

export function colorDistance(a: string, b: string): number {
  return new Color(a).deltaE2000(new Color(b));
}

export function spectralAvailability(): { available: false; reason: string } {
  return {
    available: false,
    reason: "Datos de calibración espectral insuficientes",
  };
}

interface Candidate {
  ingredients: Ingredient[];
  estimatedHex: string;
  deltaE: number;
  score: number;
}

function candidatesFor(targetHex: string, pool: Paint[]): Candidate[] {
  const candidates: Candidate[] = [];
  const add = (selected: Paint[], weights: number[]) => {
    const estimatedHex = estimateMix(selected, weights);
    const deltaE = colorDistance(targetHex, estimatedHex);
    const ingredients = selected.map((paint, index) => ({
      paint: {
        id: paint.id,
        name: paint.name,
        brand: paint.brand,
        hex: paint.hex,
        densityGPerMl: paint.densityGPerMl,
      },
      fraction: weights[index],
    }));
    candidates.push({
      ingredients,
      estimatedHex,
      deltaE,
      score: deltaE + (selected.length - 1) * 1.5,
    });
  };
  for (let a = 0; a < pool.length; a++) {
    add([pool[a]], [1]);
    for (let b = a + 1; b < pool.length; b++) {
      for (let i = 1; i < 8; i++) add([pool[a], pool[b]], [i / 8, 1 - i / 8]);
      for (let c = b + 1; c < pool.length; c++) {
        for (let i = 1; i <= 4; i++)
          for (let j = 1; j <= 4; j++) {
            const k = 8 - i - j;
            if (k >= 1 && k <= 4)
              add([pool[a], pool[b], pool[c]], [i / 8, j / 8, k / 8]);
          }
      }
    }
  }
  return candidates.sort(
    (a, b) =>
      a.score - b.score ||
      a.ingredients
        .map(({ paint }) => paint.id)
        .join()
        .localeCompare(b.ingredients.map(({ paint }) => paint.id).join()),
  );
}

function compositionKey(candidate: Candidate): string {
  return candidate.ingredients
    .map(({ paint }) => paint.id)
    .sort()
    .join("|");
}

export function findRecipes(
  targetHex: string,
  paints: Paint[],
  options: { basicPaintIds?: string[] } = {},
): Recipe[] {
  new Color(targetHex);
  const unique = [
    ...new Map(
      paints
        .filter((paint) => paint.available)
        .map((paint) => [paint.id, paint]),
    ).values(),
  ];
  if (!unique.length) return [];
  const basicIds = new Set(options.basicPaintIds ?? []);
  const basicPool = unique.filter((paint) => basicIds.has(paint.id));
  const pool = unique
    .map((paint) => ({ paint, distance: colorDistance(targetHex, paint.hex) }))
    .sort(
      (a, b) => a.distance - b.distance || a.paint.id.localeCompare(b.paint.id),
    )
    .slice(0, 12)
    .map((item) => item.paint);
  // Basic paints must be searched independently; a target-distance prefilter can omit them.
  const basics = basicPool.length ? candidatesFor(targetHex, basicPool) : [];
  const expanded = candidatesFor(targetHex, pool).filter(
    (candidate) =>
      !basicPool.length ||
      candidate.ingredients.some(({ paint }) => !basicIds.has(paint.id)),
  );
  const distinct: Candidate[] = [];
  const first = basics[0] ?? expanded[0];
  if (first) distinct.push(first);
  for (const candidate of expanded) {
    if (distinct.length >= 4) break;
    if (
      distinct.some(
        (other) =>
          compositionKey(other) === compositionKey(candidate) ||
          colorDistance(other.estimatedHex, candidate.estimatedHex) < 2,
      )
    )
      continue;
    distinct.push(candidate);
  }
  return distinct.map((candidate, index) => ({
    id: `proposal-${index}`,
    targetHex,
    estimatedHex: candidate.estimatedHex,
    model: "digital-heuristic",
    ingredients: candidate.ingredients,
    deltaE: candidate.deltaE,
    createdAt: new Date(0).toISOString(),
  }));
}
