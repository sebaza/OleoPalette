import { expect, it } from "vitest";
import { infiniteLayerReflectance, mixSpectralReflectance } from "./spectral";

it("computes infinite-layer reflectance from an explicitly supplied K/S ratio", () => {
  expect(infiniteLayerReflectance(1, 1)).toBeCloseTo(2 - Math.sqrt(3), 10);
  expect(infiniteLayerReflectance(0, 1)).toBe(1);
});

it("refuses missing or mismatched spectral calibration", () => {
  expect(() =>
    mixSpectralReflectance(
      [
        {
          id: "a",
          wavelengthNm: [400, 500, 600],
          absorption: [1],
          scattering: [1, 1, 1],
          concentrationBasis: "volume",
        },
      ],
      [1],
    ),
  ).toThrow("Datos de calibración espectral insuficientes");
});

it("mixes absorption and scattering separately, not K/S ratios", () => {
  const wavelengthNm = [400, 500, 600];
  const output = mixSpectralReflectance(
    [
      {
        id: "a",
        wavelengthNm,
        absorption: [1, 1, 1],
        scattering: [1, 1, 1],
        concentrationBasis: "volume",
      },
      {
        id: "b",
        wavelengthNm,
        absorption: [0, 0, 0],
        scattering: [3, 3, 3],
        concentrationBasis: "volume",
      },
    ],
    [0.5, 0.5],
  );
  expect(output[0]).toBeCloseTo(infiniteLayerReflectance(0.5, 2), 10);
});
