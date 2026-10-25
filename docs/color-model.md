# Color model and scientific limits

The application stores sRGB display references and converts them to linear-light sRGB using Color.js. Its current mixing **heuristic** interpolates per-channel optical density, `d = -ln(max(c, 0.004))`, then converts the resulting display color back to sRGB. This provides a deterministic search surface, **not** a physical pigment prediction, Kubelka–Munk calibration, or a measurement of paint reflectance. No synthetic spectral curves or densities are supplied.

Recipe alternatives use CIEDE2000 differences between **estimated digital display colors**. CIEDE2000 does not certify a real-world mixed paint match. Optimizer work is bounded by selecting at most 12 input colors, exploring singles, eighth-step pairs, and a limited set of eighth-step triples. It favors simpler recipes when digital differences are similar. It uses only paints marked available in personal mode. The reference palette is not manufacturer-specific.

A physical Kubelka–Munk workflow would require measured wavelength-dependent absorption and scattering of paint formulations, a documented concentration basis, a substrate/layer model, illuminant and observer, and validation against real mixtures. A single photographed RGB swatch cannot recover those parameters. Specifically, reflectance-derived `K/S` does not separately determine `K` and `S`, and a mixture generally uses `(Σ cᵢKᵢ)/(Σ cᵢSᵢ)`, not unqualified interpolation of individual `K/S` ratios. Thus the spectral path is intentionally unavailable until sufficient measured calibration inputs exist.

For practical use, mix a small amount, make a test stroke, and compare under consistent lighting. Camera, screen, varnish, wet/dry state, substrate and layer thickness can all change perceived color. Volume estimates are approximate, and grams are shown only when a user-provided verified density is available for that ingredient.

## References

- [International Color Consortium sRGB registry](https://registry.color.org/rgb-registry/srgb)
- [CIE 1976 L\*a\*b\* colour space](https://www.cie.co.at/publications/colorimetry-part-4-cie-1976-lab-colour-space-1)
- [CIEDE2000 colour-difference formula](https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula-1)
- [Kubelka–Munk theory and applications (IS&T)](https://www.imaging.org/common/uploaded%20files/pdfs/Papers/1999/RP-0-93/1806.pdf)
- [Mixture K/S treatment (Journal of the European Ceramic Society)](https://www.sciencedirect.com/science/article/pii/S0955221909001393)
