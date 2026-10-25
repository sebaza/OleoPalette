import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { PaintInventory } from "./PaintInventory";
import type { Paint } from "../../domain/types";

const existing: Paint = {
  id: "one",
  name: "Azul ultramar",
  brand: "Casa",
  hex: "#223399",
  available: true,
  createdAt: "",
  updatedAt: "",
};

it("prevents accidental duplicate paints before saving", () => {
  const onSave = vi.fn();
  render(
    <PaintInventory paints={[existing]} onSave={onSave} onDelete={vi.fn()} />,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), {
    target: { value: "Azul ultramar" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Marca (opcional)" }), {
    target: { value: "Casa" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar pintura" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Ya tienes una pintura");
  expect(onSave).not.toHaveBeenCalled();
});
