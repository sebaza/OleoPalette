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
  const beforePick = await canvas.boundingBox();
  await canvas.click({ position: { x: 5, y: 5 } });
  await expect(page.getByText("#B05040")).toBeVisible();
  expect(await canvas.boundingBox()).toEqual(beforePick);
  await expect(
    page.getByRole("status").filter({ hasText: "#B05040" }),
  ).toBeVisible();
  const badge = page.locator(".photo-feedback");
  await expect(badge).toHaveCSS("pointer-events", "none");
  const badgeBox = await badge.boundingBox();
  const photoBox = await page.locator(".photo-viewport").boundingBox();
  expect(badgeBox!.y).toBeGreaterThanOrEqual(photoBox!.y);
  expect(badgeBox!.y + badgeBox!.height).toBeLessThanOrEqual(
    photoBox!.y + photoBox!.height,
  );
  await expect(badge.locator(".photo-feedback-swatch")).toHaveCSS(
    "background-color",
    "rgb(176, 80, 64)",
  );
  await expect(page.getByLabel("Paleta de referencia")).toBeChecked();
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

test("fits a portrait photo and separates mobile pan from color selection", async ({
  page,
}) => {
  await page.goto("/OleoPalette/");
  await page.getByRole("button", { name: "Crear mezcla" }).click();
  const dataUrl = await page.evaluate(() => {
    const image = document.createElement("canvas");
    image.width = 100;
    image.height = 300;
    const context = image.getContext("2d")!;
    context.fillStyle = "#ff0000";
    context.fillRect(0, 0, 100, 150);
    context.fillStyle = "#0000ff";
    context.fillRect(0, 150, 100, 150);
    return image.toDataURL("image/png");
  });
  await page.getByLabel("Elegir foto").setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
  });
  const canvas = page.getByRole("button", { name: /Fotografía; toca/ });
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  const viewport = await page.locator(".photo-viewport").boundingBox();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(viewport!.x - 1);
  expect(box!.y).toBeGreaterThanOrEqual(viewport!.y - 1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(
    viewport!.x + viewport!.width + 1,
  );
  expect(box!.y + box!.height).toBeLessThanOrEqual(
    viewport!.y + viewport!.height + 1,
  );
  const cdp = await page.context().newCDPSession(page);
  const scrollX = viewport!.x + viewport!.width / 2;
  const scrollY = viewport!.y + viewport!.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: scrollX, y: scrollY, id: 1 }],
  });
  for (const offset of [30, 70, 120, 170]) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: scrollX, y: scrollY - offset, id: 1 }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(20);
  await page.evaluate(() => window.scrollTo(0, 0));
  await canvas.click({ position: { x: box!.width / 2, y: 20 } });
  await expect(page.getByText("#FF0000")).toBeVisible();
  await page.getByRole("button", { name: "Ampliar foto" }).click();
  await expect(page.getByText("150 %")).toBeVisible();
  const enlarged = await canvas.boundingBox();
  const beforePan = await canvas.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.mouse.move(
    enlarged!.x + enlarged!.width / 2,
    enlarged!.y + enlarged!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    enlarged!.x + enlarged!.width / 2,
    enlarged!.y + enlarged!.height / 2 - 80,
    { steps: 5 },
  );
  await page.mouse.up();
  const afterPan = await canvas.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  expect(afterPan).not.toBe(beforePan);
  await expect(page.getByText("#FF0000")).toBeVisible();
  await page.getByRole("button", { name: "Reducir foto" }).click();
  await expect(page.getByText("100 %")).toBeVisible();
  await page.getByRole("button", { name: "Restablecer" }).click();
  await expect(page.getByText("100 %")).toBeVisible();
  const fittedBox = await canvas.boundingBox();
  const centerX = fittedBox!.x + fittedBox!.width / 2;
  const centerY = fittedBox!.y + fittedBox!.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: centerX - 25, y: centerY, id: 1 },
      { x: centerX + 25, y: centerY, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: centerX - 70, y: centerY, id: 1 },
      { x: centerX + 70, y: centerY, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByText(/^[2-4]\d\d %$/)).toBeVisible();
  await expect(page.getByText("#FF0000")).toBeVisible();
  const beforeTouchPan = await canvas.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: centerX, y: centerY, id: 3 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: centerX, y: centerY - 60, id: 3 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const afterTouchPan = await canvas.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  expect(afterTouchPan).not.toBe(beforeTouchPan);
  await expect(page.getByText("#FF0000")).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: "Restablecer" }).click();
  const rotatedBox = await canvas.boundingBox();
  const rotatedViewport = await page.locator(".photo-viewport").boundingBox();
  expect(rotatedBox!.x).toBeGreaterThanOrEqual(rotatedViewport!.x - 1);
  expect(rotatedBox!.y).toBeGreaterThanOrEqual(rotatedViewport!.y - 1);
  expect(rotatedBox!.x + rotatedBox!.width).toBeLessThanOrEqual(
    rotatedViewport!.x + rotatedViewport!.width + 1,
  );
  expect(rotatedBox!.y + rotatedBox!.height).toBeLessThanOrEqual(
    rotatedViewport!.y + rotatedViewport!.height + 1,
  );
});

test("keeps an active reference mix consistent after adding a paint elsewhere", async ({
  page,
}) => {
  await page.goto("/OleoPalette/");
  await page.getByRole("button", { name: "Crear mezcla" }).click();
  const dataUrl = await page.evaluate(() => {
    const image = document.createElement("canvas");
    image.width = 10;
    image.height = 10;
    const context = image.getContext("2d")!;
    context.fillStyle = "#b05040";
    context.fillRect(0, 0, 10, 10);
    return image.toDataURL("image/png");
  });
  await page.getByLabel("Elegir foto").setInputFiles({
    name: "reference.png",
    mimeType: "image/png",
    buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
  });
  await page.getByRole("button", { name: /Fotografía; toca/ }).click();
  await expect(page.getByLabel("Paleta de referencia")).toBeChecked();
  await page.getByRole("button", { name: "Buscar cómo prepararlo" }).click();
  await expect(page.getByText("Empieza con colores básicos")).toBeVisible();
  await page.getByRole("button", { name: "Mis pinturas" }).click();
  await page
    .getByRole("textbox", { name: "Nombre", exact: true })
    .fill("Azul de prueba");
  await page.getByRole("button", { name: "Guardar pintura" }).click();
  await page.getByRole("button", { name: "Crear mezcla" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "#B05040" }),
  ).toBeVisible();
  await expect(page.getByLabel("Paleta de referencia")).toBeChecked();
  await expect(page.getByText("Empieza con colores básicos")).toBeVisible();
});
