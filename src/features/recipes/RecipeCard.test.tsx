import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { RecipeCard } from "./RecipeCard";
import type { Recipe } from "../../domain/types";

const recipe: Recipe = {
  id: "test",
  targetHex: "#855548",
  estimatedHex: "#855548",
  model: "digital-heuristic",
  deltaE: 0,
  createdAt: "",
  ingredients: [
    { paint: { id: "red", name: "Rojo", hex: "#bb4433" }, fraction: 0.75 },
    { paint: { id: "blue", name: "Azul", hex: "#334477" }, fraction: 0.25 },
  ],
};

it("leads with simple parts and keeps measurement controls collapsed", () => {
  render(<RecipeCard recipe={recipe} title="Mezcla simple" />);
  expect(screen.getByText("75 %")).toBeInTheDocument();
  expect(screen.getByText("3 partes relativas")).toBeInTheDocument();
  expect(screen.getByText("1 parte relativa")).toBeInTheDocument();
  const details = screen
    .getByText("Ajustar y medir cantidades")
    .closest("details");
  expect(details).not.toHaveAttribute("open");
  expect(details).toContainElement(
    screen.getByLabelText("Cantidad aproximada (mL)"),
  );
});
