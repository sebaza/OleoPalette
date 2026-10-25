import { render, screen } from "@testing-library/react";
import { App } from "./App";
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
