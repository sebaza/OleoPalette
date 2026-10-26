import { expect, it } from "vitest";
import { clampPan, fitSize, zoomAt } from "./photoTransform";

it("fits portrait and landscape images without clipping", () => {
  expect(fitSize(400, 800, 320, 300)).toEqual({ width: 150, height: 300 });
  expect(fitSize(800, 400, 320, 300)).toEqual({ width: 320, height: 160 });
});

it("constrains panning to the visible image extent", () => {
  expect(clampPan({ x: 500, y: -500 }, 300, 200, 320, 300, 2)).toEqual({
    x: 140,
    y: -50,
  });
  expect(clampPan({ x: 90, y: 50 }, 150, 300, 320, 300, 1)).toEqual({
    x: 0,
    y: 0,
  });
});

it("zooms around a touch position and returns to centered fit", () => {
  const next = zoomAt(
    { zoom: 1, pan: { x: 0, y: 0 } },
    2,
    { x: 80, y: 150 },
    320,
    300,
    320,
    160,
  );
  expect(next).toEqual({ zoom: 2, pan: { x: 80, y: 0 } });
  expect(zoomAt(next, 1, { x: 80, y: 150 }, 320, 300, 320, 160)).toEqual({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
});
