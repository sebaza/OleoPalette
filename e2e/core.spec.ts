import { expect, test } from "@playwright/test";

test("keeps an added paint after reload on a narrow screen", async ({
  page,
}) => {
  await page.goto("/OleoPalette/");
  await page.getByRole("button", { name: "Mis pinturas" }).click();
  await page
    .getByRole("textbox", { name: "Nombre", exact: true })
    .fill("Azul de prueba");
  await page.getByRole("button", { name: "Guardar pintura" }).click();
  await expect(page.getByText("Azul de prueba")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Mis pinturas" }).click();
  await expect(page.getByText("Azul de prueba")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("samples a photo color and proposes a reference recipe", async ({
  page,
}) => {
  await page.goto("/OleoPalette/");
  await page.getByRole("button", { name: "Crear mezcla" }).click();
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 10;
    canvas.height = 10;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#b05040";
    context.fillRect(0, 0, 10, 10);
    return canvas.toDataURL("image/png");
  });
  await page.getByLabel("Elegir foto").setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
  });
  const canvas = page.getByRole("button", { name: /Fotografía; toca/ });
  await expect(canvas).toBeVisible();
  await canvas.click({ position: { x: 5, y: 5 } });
  await expect(page.getByText("#B05040")).toBeVisible();
  await page.getByLabel("Paleta de referencia").check();
  await page.getByRole("button", { name: "Buscar cómo prepararlo" }).click();
  const firstRecipe = page.locator(".recipe-card").first();
  await expect(
    firstRecipe.getByRole("heading", { name: "Empieza con colores básicos" }),
  ).toBeVisible();
  await expect(
    firstRecipe.locator(".recipe-ingredients strong").first(),
  ).toContainText("%");
  await expect(firstRecipe.getByText(/parte relativa/).first()).toBeVisible();
  await expect(firstRecipe.locator(".recipe-details")).not.toHaveAttribute(
    "open",
  );
  expect(
    await firstRecipe.locator(".recipe-ingredients li").allTextContents(),
  ).toEqual(
    expect.arrayContaining([
      expect.stringMatching(
        /(Rojo cadmio|Amarillo primario|Azul ultramar|Blanco de titanio|Negro marfil)/,
      ),
    ]),
  );
  await page
    .getByRole("button", { name: "Registrar resultado real" })
    .first()
    .click();
  await page.getByRole("button", { name: "Guardar observación" }).click();
  await expect(page.getByText(/Color observado antes:/).first()).toBeVisible();
  await page.getByLabel("Con mis pinturas").check();
  await expect(page.getByText("Empieza con colores básicos")).toHaveCount(0);
  await page.getByLabel("Paleta de referencia").check();
  await page.getByRole("button", { name: "Buscar cómo prepararlo" }).click();
  await expect(page.getByText("Empieza con colores básicos")).toBeVisible();
  await page.getByLabel("Elegir foto").setInputFiles({
    name: "sample-two.png",
    mimeType: "image/png",
    buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
  });
  await expect(page.getByText("COLOR SELECCIONADO")).toHaveCount(0);
  await expect(page.getByText("Empieza con colores básicos")).toHaveCount(0);
});
