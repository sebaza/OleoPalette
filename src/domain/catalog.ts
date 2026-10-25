import type { Paint } from "./types";

// Illustrative screen swatches chosen for broad hue coverage, not measured tube colors.
const entries = [
  ["white", "Blanco de titanio", "#eee9d8"],
  ["black", "Negro marfil", "#292c29"],
  ["yellow", "Amarillo ocre", "#c29a43"],
  ["primary-yellow", "Amarillo primario", "#efd22f"],
  ["red", "Rojo cadmio", "#bc4f38"],
  ["blue", "Azul ultramar", "#354d8a"],
  ["green", "Verde ftalo", "#20685f"],
  ["sienna", "Siena tostada", "#8f5738"],
  ["umber", "Sombra natural", "#685b45"],
] as const;

export const catalog: Paint[] = entries.map(([id, name, hex]) => ({
  id: `reference-${id}`,
  name,
  hex,
  available: true,
  createdAt: "",
  updatedAt: "",
}));

const basicIds = ["red", "primary-yellow", "blue", "white", "black"];
export const basicCatalog = basicIds.map((id) =>
  catalog.find((paint) => paint.id === `reference-${id}`)!,
);
