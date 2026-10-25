import Color from "colorjs.io";

export interface SpectralPigment {
  id: string;
  wavelengthNm: number[];
  absorption: number[];
  scattering: number[];
  concentrationBasis: "volume";
}

export interface SpectralViewing {
  wavelengthNm: number[];
  illuminant: number[];
  xBar: number[];
  yBar: number[];
  zBar: number[];
  illuminantId: "D65";
  observerId: "CIE1931-2deg";
  source: string;
}

const insufficient = "Datos de calibración espectral insuficientes";

export function infiniteLayerReflectance(
  absorption: number,
  scattering: number,
): number {
  if (
    !Number.isFinite(absorption) ||
    !Number.isFinite(scattering) ||
    absorption < 0 ||
    scattering <= 0
  )
    throw new Error(insufficient);
  const value = 1 + absorption / scattering;
  return 1 / (value + Math.sqrt(value * value - 1));
}

function validWavelengths(wavelengths: number[]): boolean {
  return (
    wavelengths.length >= 3 &&
    wavelengths.every(
      (wavelength, index) =>
        Number.isFinite(wavelength) &&
        wavelength > 0 &&
        (index === 0 || wavelength > wavelengths[index - 1]),
    )
  );
}

export function mixSpectralReflectance(
  pigments: SpectralPigment[],
  fractions: number[],
): number[] {
  if (
    !pigments.length ||
    pigments.length > 5 ||
    pigments.length !== fractions.length ||
    fractions.some((fraction) => !Number.isFinite(fraction) || fraction < 0) ||
    Math.abs(fractions.reduce((sum, fraction) => sum + fraction, 0) - 1) > 0.001
  )
    throw new Error(insufficient);
  const wavelengths = pigments[0].wavelengthNm;
  if (
    !validWavelengths(wavelengths) ||
    pigments.some(
      (pigment) =>
        pigment.concentrationBasis !== "volume" ||
        pigment.wavelengthNm.length !== wavelengths.length ||
        pigment.wavelengthNm.some(
          (value, index) => value !== wavelengths[index],
        ) ||
        pigment.absorption.length !== wavelengths.length ||
        pigment.scattering.length !== wavelengths.length,
    )
  )
    throw new Error(insufficient);
  return wavelengths.map((_, index) => {
    const absorption = pigments.reduce(
      (sum, pigment, pigmentIndex) =>
        sum + pigment.absorption[index] * fractions[pigmentIndex],
      0,
    );
    const scattering = pigments.reduce(
      (sum, pigment, pigmentIndex) =>
        sum + pigment.scattering[index] * fractions[pigmentIndex],
      0,
    );
    return infiniteLayerReflectance(absorption, scattering);
  });
}

function toHex(color: Color): string {
  const coordinates = color.to("srgb").coords;
  return `#${coordinates
    .map((value) =>
      Math.round(Math.max(0, Math.min(1, value)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function spectralReflectanceToHex(
  wavelengths: number[],
  reflectance: number[],
  viewing: SpectralViewing,
): string {
  const fields = [
    viewing.illuminant,
    viewing.xBar,
    viewing.yBar,
    viewing.zBar,
    reflectance,
  ];
  if (
    !validWavelengths(wavelengths) ||
    !viewing.source ||
    viewing.illuminantId !== "D65" ||
    viewing.observerId !== "CIE1931-2deg" ||
    viewing.wavelengthNm.length !== wavelengths.length ||
    viewing.wavelengthNm.some((value, index) => value !== wavelengths[index]) ||
    fields.some(
      (field) =>
        field.length !== wavelengths.length ||
        field.some((value) => !Number.isFinite(value) || value < 0),
    )
  )
    throw new Error(insufficient);
  const integrate = (values: number[]) =>
    values
      .slice(1)
      .reduce(
        (sum, value, index) =>
          sum +
          ((values[index] + value) *
            (wavelengths[index + 1] - wavelengths[index])) /
            2,
        0,
      );
  const weighted = (observer: number[], withReflectance: boolean) =>
    observer.map(
      (value, index) =>
        value *
        viewing.illuminant[index] *
        (withReflectance ? reflectance[index] : 1),
    );
  const normalizer = integrate(weighted(viewing.yBar, false));
  if (normalizer <= 0 || reflectance.some((value) => value > 1))
    throw new Error(insufficient);
  const xyz = [viewing.xBar, viewing.yBar, viewing.zBar].map(
    (observer) => integrate(weighted(observer, true)) / normalizer,
  ) as [number, number, number];
  return toHex(new Color("xyz-d65", xyz));
}
