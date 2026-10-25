import { expect, it } from "vitest";
import { parseBackup } from "./backup";

it("rejects unsupported versions and invalid proportions", () => {
  expect(() => parseBackup('{"version":2,"paints":[],"recipes":[]}')).toThrow();
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
