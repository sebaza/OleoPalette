export function rebalance(
  fractions: number[],
  changedIndex: number,
  next: number,
): number[] {
  if (
    next < 0 ||
    next > 1 ||
    changedIndex < 0 ||
    changedIndex >= fractions.length
  )
    throw new Error("Invalid proportion");
  if (fractions.length === 1) return [1];
  const remainder = 1 - next;
  const others = fractions.reduce(
    (sum, fraction, index) => sum + (index === changedIndex ? 0 : fraction),
    0,
  );
  return fractions.map((fraction, index) =>
    index === changedIndex
      ? next
      : others > 0
        ? (fraction / others) * remainder
        : remainder / (fractions.length - 1),
  );
}

export function ingredientQuantity(
  fraction: number,
  totalMl: number,
  densityGPerMl?: number,
) {
  const ml = Math.round(fraction * totalMl * 100) / 100;
  return {
    ml,
    tsp: Math.round((ml / 5) * 100) / 100,
    tbsp: Math.round((ml / 15) * 100) / 100,
    grams: densityGPerMl ? Math.round(ml * densityGPerMl * 100) / 100 : null,
  };
}
