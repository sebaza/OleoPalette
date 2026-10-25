import { render, screen } from "@testing-library/react";
import { App, recipeTitle } from "./App";
import { expect, it } from "vitest";

it("has accessible primary navigation and a route into creating a mix", () => {
  render(<App />);
  expect(
    screen.getByRole("navigation", { name: "Navegación principal" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Crear mezcla" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /Tu próximo color/i }),
  ).toBeInTheDocument();
});

it("does not classify personal paints as specialized", () => {
  expect(recipeTitle("mine", 0)).toBe("Empieza con una mezcla sencilla");
  expect(recipeTitle("mine", 1)).toBe("Otra mezcla 2");
  expect(recipeTitle("reference", 1)).toBe("Opción más específica 2");
});
