import { expect, it } from "vitest";
import { imagePoint, samplePixels } from "./sampling";

it("maps CSS pixels to real image pixels under zoom and pan", () => {
  expect(
    imagePoint(
      { clientX: 150, clientY: 100 },
      { left: 0, top: 0, width: 200, height: 100 },
      400,
      200,
      2,
      50,
      25,
    ),
  ).toEqual({ x: 100, y: 75 });
});

it("averages a clipped sample area", () => {
  const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]);
  expect(samplePixels(pixels, 2, 1, 0, 0, 3)).toBe("#800080");
});
