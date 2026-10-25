import { expect, it } from "vitest";
import { parseBackup } from "./backup";

it("rejects unsupported versions and invalid proportions", () => {
  expect(() => parseBackup('{"version":3,"paints":[],"recipes":[]}')).toThrow();
  expect(() =>
    parseBackup(
      JSON.stringify({
        version: 1,
        paints: [],
        recipes: [{ id: "x", ingredients: [{ fraction: -1 }] }],
      }),
    ),
  ).toThrow();
});

it("migrates v1 backups without observations", () => {
  expect(
    parseBackup('{"version":1,"paints":[],"recipes":[]}').observations,
  ).toEqual([]);
});

it("rejects malformed v2 observations", () => {
  expect(() =>
    parseBackup(
      JSON.stringify({
        version: 2,
        paints: [],
        recipes: [],
        observations: [{ id: "bad", observedHex: "#123456" }],
      }),
    ),
  ).toThrow();
});

it("rejects malformed optional fields before React can render them", () => {
  const paint = {
    id: "p",
    name: "Blue",
    hex: "#123456",
    available: true,
    createdAt: "today",
    updatedAt: "today",
    brand: { invalid: true },
  };
  expect(() =>
    parseBackup(JSON.stringify({ version: 1, paints: [paint], recipes: [] })),
  ).toThrow();
});
