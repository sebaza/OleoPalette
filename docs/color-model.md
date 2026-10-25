# Color model and scientific limits

The application stores sRGB display references and converts them to linear-light sRGB using Color.js. Its current mixing **heuristic** interpolates per-channel optical density, `d = -ln(max(c, 0.004))`, then converts the resulting display color back to sRGB. This provides a deterministic search surface, **not** a physical pigment prediction, Kubelka–Munk calibration, or a measurement of paint reflectance. No synthetic spectral curves or densities are supplied.

Recipe alternatives use CIEDE2000 differences between **estimated digital display colors**. CIEDE2000 does not certify a real-world mixed paint match. The reference search runs the five-color basic palette independently before the nearest-12-color expanded search, so a distant primary is not accidentally excluded. The first result favors simplicity within that basic palette; up to three subsequent results use different ingredient sets and visually distinct estimates. Personal mode uses only available paints, favors fewer ingredients, and never infers a paint's pigment role from its name. Searches explore singles, eighth-step pairs, and a limited set of eighth-step triples. The reference palette is not manufacturer-specific; its "primary" yellow is a pedagogical RYB choice, not a claim of physical primary status or a measured tube sample.

A physical Kubelka–Munk workflow requires measured wavelength-dependent absorption and scattering of paint formulations, a documented concentration basis, a substrate/layer model, illuminant and observer, and validation against real mixtures. A single photographed RGB swatch cannot recover those parameters. Specifically, reflectance-derived `K/S` does not separately determine `K` and `S`, and a mixture generally uses `(Σ cᵢKᵢ)/(Σ cᵢSᵢ)`, not unqualified interpolation of individual `K/S` ratios. The separate `src/domain/spectral.ts` module implements the optically infinite-layer equation on explicit K and S arrays and numerical reflectance-to-XYZ integration for explicitly supplied D65/CIE 1931 arrays. It assumes a common volume concentration basis and identical wavelength samples. These are **assumptions**, not verified properties of arbitrary tubes. No measured dataset ships with the app, so the UI intentionally remains on the digital heuristic.

Real-mix observations store the recipe snapshot, observed display color, optional lighting, wet/dry state and notes separately from the digital prediction. A previous observation is shown only when the paint identifiers and proportions match closely; it is never treated as a spectral calibration or transferred to unrelated paints.

For practical use, mix a small amount, make a test stroke, and compare under consistent lighting. Camera, screen, varnish, wet/dry state, substrate and layer thickness can all change perceived color. Volume estimates are approximate, and grams are shown only when a user-provided verified density is available for that ingredient.

## References

- [International Color Consortium sRGB registry](https://registry.color.org/rgb-registry/srgb)
- [CIE 1976 L\*a\*b\* colour space](https://www.cie.co.at/publications/colorimetry-part-4-cie-1976-lab-colour-space-1)
- [CIEDE2000 colour-difference formula](https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula-1)
- [Kubelka–Munk theory and applications (IS&T)](https://www.imaging.org/common/uploaded%20files/pdfs/Papers/1999/RP-0-93/1806.pdf)
- [Mixture K/S treatment (Journal of the European Ceramic Society)](https://www.sciencedirect.com/science/article/pii/S0955221909001393)
