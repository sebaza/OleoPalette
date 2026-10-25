import { useEffect, useRef, useState } from "react";
import { basicCatalog, catalog } from "../domain/catalog";
import { colorDistance, findRecipes } from "../domain/mixing";
import type { MixObservation, Paint, Recipe } from "../domain/types";
import { PhotoPicker } from "../features/image-selection/PhotoPicker";
import { PaintInventory } from "../features/paint-inventory/PaintInventory";
import { RecipeCard } from "../features/recipes/RecipeCard";
import { BackupPanel } from "../features/settings/BackupPanel";
import { db } from "../storage/db";

const sections = [
  { id: "home", label: "Inicio", symbol: "⌂" },
  { id: "mix", label: "Crear mezcla", symbol: "◉" },
  { id: "paints", label: "Mis pinturas", symbol: "▣" },
  { id: "recipes", label: "Mis recetas", symbol: "▤" },
  { id: "settings", label: "Configuración", symbol: "⚙" },
] as const;

type Section = (typeof sections)[number]["id"];

export function recipeTitle(mode: "mine" | "reference", index: number): string {
  if (index === 0) {
    return mode === "reference"
      ? "Empieza con colores básicos"
      : "Empieza con una mezcla sencilla";
  }
  return mode === "reference"
    ? `Opción más específica ${index + 1}`
    : `Otra mezcla ${index + 1}`;
}

export function App() {
  const [section, setSection] = useState<Section>("home");
  const [paints, setPaints] = useState<Paint[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [observations, setObservations] = useState<MixObservation[]>([]);
  const [targetHex, setTargetHex] = useState<string | null>(null);
  const [mode, setMode] = useState<"mine" | "reference">("mine");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [working, setWorking] = useState(false);
  const [storageError, setStorageError] = useState("");
  const recipeRequest = useRef(0);

  useEffect(() => {
    void Promise.all([
      db.paints.toArray(),
      db.recipes.toArray(),
      db.observations.toArray(),
    ])
      .then(([storedPaints, storedRecipes, storedObservations]) => {
        setPaints(storedPaints);
        setSavedRecipes(storedRecipes);
        setObservations(storedObservations);
      })
      .catch(() =>
        setStorageError("No se pudo abrir el almacenamiento local."),
      );
  }, []);
  async function savePaint(paint: Paint) {
    await db.paints.put(paint);
    setPaints(await db.paints.toArray());
  }
  async function deletePaint(id: string) {
    await db.paints.delete(id);
    setPaints(await db.paints.toArray());
  }
  async function saveRecipe(recipe: Recipe) {
    await db.recipes.put(recipe);
    setSavedRecipes(await db.recipes.toArray());
  }
  async function saveObservation(observation: MixObservation) {
    await db.observations.put(observation);
    setObservations(await db.observations.toArray());
  }
  function invalidateRecipes() {
    recipeRequest.current += 1;
    setRecipes([]);
    setWorking(false);
  }
  function makeRecipes() {
    if (!targetHex) return;
    const request = ++recipeRequest.current;
    setWorking(true);
    window.setTimeout(() => {
      if (recipeRequest.current !== request) return;
      setRecipes(
        findRecipes(
          targetHex,
          mode === "mine" ? paints.filter((paint) => paint.available) : catalog,
          mode === "reference"
            ? { basicPaintIds: basicCatalog.map(({ id }) => id) }
            : {},
        ),
      );
      setWorking(false);
    }, 20);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">O</div>
        <div className="brand">
          <strong>OleoPalette</strong>
          <span>TU TALLER DE COLOR</span>
        </div>
        <div className="topbar-accent" aria-hidden="true">
          ✦
        </div>
      </header>
      <main id="main-content" className="content">
        {section === "home" && (
          <section className="home">
            <div className="eyebrow">EL COLOR EMPIEZA AQUÍ</div>
            <h1>
              Tu próximo color,
              <br />
              <em>mezclado por ti.</em>
            </h1>
            <p className="intro">
              Elige un tono de tu foto y descubre cómo acercarte a él con las
              pinturas que tienes.
            </p>
            <button
              className="primary-action"
              onClick={() => setSection("mix")}
            >
              Crear una mezcla <span aria-hidden="true">→</span>
            </button>
            <div className="hero-card" aria-hidden="true">
              <div className="paint-stroke stroke-1" />
              <div className="paint-stroke stroke-2" />
              <div className="paint-stroke stroke-3" />
              <div className="palette-circle">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="section-heading">
              <span>ASÍ DE SIMPLE</span>
              <h2>De la inspiración al lienzo</h2>
            </div>
            <div className="steps">
              <article>
                <b>01</b>
                <h3>Encuentra el color</h3>
                <p>Elige una foto y toca el tono que te inspira.</p>
              </article>
              <article>
                <b>02</b>
                <h3>Explora mezclas</h3>
                <p>Busca con tus pinturas o una paleta sugerida.</p>
              </article>
              <article>
                <b>03</b>
                <h3>Pinta a tu manera</h3>
                <p>Prepara una pequeña muestra y ajusta a ojo.</p>
              </article>
            </div>
          </section>
        )}
        {section === "mix" && (
          <section className="page">
            <div className="eyebrow">CREAR MEZCLA</div>
            <h1>Encuentra tu color</h1>
            <p className="intro">
              Sube una foto y toca el color que quieres pintar.
            </p>
            <PhotoPicker
              onReset={() => {
                setTargetHex(null);
                invalidateRecipes();
              }}
              onPick={(hex) => {
                invalidateRecipes();
                setTargetHex(hex);
              }}
            />
            {targetHex && (
              <div className="surface target-summary">
                <div
                  className="swatch large"
                  style={{ background: targetHex }}
                />
                <div>
                  <small>COLOR SELECCIONADO</small>
                  <strong>{targetHex.toUpperCase()}</strong>
                  <p>Color aparente de la fotografía</p>
                </div>
              </div>
            )}
            <p className="hint">
              La luz, la cámara y la pantalla pueden alterar el color. La mezcla
              final requiere una prueba real.
            </p>
            {targetHex && (
              <div className="surface choice">
                <h2>¿Qué pinturas quieres usar?</h2>
                <label>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "mine"}
                    onChange={() => {
                      setMode("mine");
                      invalidateRecipes();
                    }}
                  />{" "}
                  Con mis pinturas (
                  {paints.filter((paint) => paint.available).length}{" "}
                  disponibles)
                </label>
                <label>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "reference"}
                    onChange={() => {
                      setMode("reference");
                      invalidateRecipes();
                    }}
                  />{" "}
                  Paleta de referencia
                </label>
                <p className="hint">
                  Los colores del catálogo son muestras digitales ilustrativas,
                  no mediciones de tubos reales.
                </p>
                <button
                  type="button"
                  className="primary-action"
                  onClick={makeRecipes}
                  disabled={
                    working ||
                    (mode === "mine" &&
                      !paints.some((paint) => paint.available))
                  }
                >
                  {working ? "Buscando…" : "Buscar cómo prepararlo"}
                </button>
                {mode === "mine" &&
                  !paints.some((paint) => paint.available) && (
                    <p className="hint">
                      Primero agrega una pintura disponible en Mis pinturas, o
                      utiliza la paleta de referencia.
                    </p>
                  )}
              </div>
            )}
            {recipes.length > 0 && (
              <div className="results">
                <div className="section-heading">
                  <span>RESULTADOS ORIENTATIVOS</span>
                  <h2>Prueba estas mezclas</h2>
                </div>
                <p className="hint">
                  {mode === "reference"
                    ? "Primero, una mezcla de la paleta básica: rojo, amarillo primario, azul, blanco y negro. Después, opciones con pigmentos más específicos. El parecido digital no garantiza el resultado físico."
                    : "Primero una mezcla sencilla con tus pinturas disponibles; después, alternativas distintas. No se deducen pigmentos por el nombre del tubo."}
                </p>
                {mode === "reference" &&
                  recipes
                    .slice(1)
                    .some((recipe) => recipe.deltaE < recipes[0].deltaE) && (
                    <p className="hint">
                      La primera opción prioriza pinturas básicas; alguna
                      alternativa puede acercarse más al color de la foto en la
                      estimación digital.
                    </p>
                  )}
                {mode === "mine" &&
                  Math.min(...recipes.map((recipe) => recipe.deltaE)) > 10 && (
                    <p className="error">
                      Con tus pinturas, la mejor alternativa digital todavía
                      difiere bastante del objetivo. Compárala en una muestra
                      real. Un color cercano para explorar sería{" "}
                      {catalog
                        .filter(
                          (reference) =>
                            !paints.some(
                              (paint) =>
                                paint.name.toLocaleLowerCase() ===
                                reference.name.toLocaleLowerCase(),
                            ),
                        )
                        .sort(
                          (a, b) =>
                            colorDistance(targetHex!, a.hex) -
                            colorDistance(targetHex!, b.hex),
                        )[0]?.name || "otra pintura de un tono cercano"}
                      ; no hay garantía de que un tubo de ese nombre se mezcle
                      igual.
                    </p>
                  )}
                {recipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    title={recipeTitle(mode, index)}
                    onSave={saveRecipe}
                    observations={observations}
                    onObserve={saveObservation}
                  />
                ))}
              </div>
            )}
          </section>
        )}
        {section === "paints" && (
          <section className="page">
            <div className="eyebrow">MIS PINTURAS</div>
            <h1>Tu caja de color</h1>
            <p className="intro">
              Registra tus tubos para crear mezclas con lo que realmente tienes.
            </p>
            {storageError && (
              <p role="alert" className="error">
                {storageError}
              </p>
            )}
            <PaintInventory
              paints={paints}
              onSave={savePaint}
              onDelete={deletePaint}
            />
          </section>
        )}
        {section === "recipes" && (
          <section className="page">
            <div className="eyebrow">MIS RECETAS</div>
            <h1>Mezclas guardadas</h1>
            <p className="intro">
              Vuelve a probar una mezcla o elimínala cuando ya no la necesites.
            </p>
            {savedRecipes.length === 0 && (
              <div className="surface empty">
                Todavía no guardas recetas. Crea una mezcla para empezar.
              </div>
            )}
            {[...savedRecipes]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((recipe) => (
                <div key={recipe.id}>
                  <RecipeCard
                    recipe={recipe}
                    observations={observations}
                    onObserve={saveObservation}
                    title={new Date(recipe.createdAt).toLocaleDateString(
                      "es-CL",
                    )}
                  />
                  <button
                    className="text-button"
                    onClick={() => {
                      if (window.confirm("¿Eliminar esta receta?"))
                        void db.recipes
                          .delete(recipe.id)
                          .then(async () =>
                            setSavedRecipes(await db.recipes.toArray()),
                          );
                    }}
                  >
                    Eliminar receta
                  </button>
                </div>
              ))}
          </section>
        )}
        {section === "settings" && (
          <section className="page">
            <div className="eyebrow">CONFIGURACIÓN</div>
            <h1>Tu taller, tus datos</h1>
            <div className="surface">
              <h2>Privacidad y método</h2>
              <p>
                Las fotos se procesan en tu navegador. Tus pinturas, recetas y
                observaciones se guardan en este dispositivo mediante IndexedDB;
                pueden perderse si borras los datos del navegador.
              </p>
              <p>
                OleoPalette utiliza una heurística digital, no una simulación
                física calibrada.{" "}
                {`Datos de calibración espectral insuficientes`} para un modelo
                espectral fiable.
              </p>
              <p>No se envían tus fotos ni tu inventario a un servidor.</p>
            </div>
            <BackupPanel
              paints={paints}
              recipes={savedRecipes}
              observations={observations}
              onImported={async () => {
                setPaints(await db.paints.toArray());
                setSavedRecipes(await db.recipes.toArray());
                setObservations(await db.observations.toArray());
              }}
            />
            <div className="surface">
              <h2>Observaciones de mezclas</h2>
              <p>
                {observations.length} observaciones guardadas. Solo se muestran
                como referencia para una mezcla con los mismos pigmentos y
                proporciones; no se extrapolan a otras pinturas.
              </p>
              {observations.length > 0 && (
                <button
                  className="danger-button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "¿Eliminar todas las observaciones de mezclas?",
                      )
                    )
                      void db.observations
                        .clear()
                        .then(() => setObservations([]));
                  }}
                >
                  Eliminar observaciones
                </button>
              )}
            </div>
          </section>
        )}
      </main>
      <nav className="bottom-nav" aria-label="Navegación principal">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={section === item.id ? "page" : undefined}
            onClick={() => setSection(item.id)}
          >
            <span className="nav-symbol" aria-hidden="true">
              {item.symbol}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
