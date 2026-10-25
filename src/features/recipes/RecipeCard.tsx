import { useState } from "react";
import { colorDistance, estimateMix } from "../../domain/mixing";
import { matchingObservation } from "../../domain/calibration";
import { ingredientQuantity, rebalance } from "../../domain/quantities";
import type { MixObservation, Recipe } from "../../domain/types";
import { ObservationPanel } from "../calibration/ObservationPanel";

interface Props {
  recipe: Recipe;
  title: string;
  onSave?: (recipe: Recipe) => Promise<void>;
  observations?: MixObservation[];
  onObserve?: (observation: MixObservation) => Promise<void>;
}

export function RecipeCard({
  recipe,
  title,
  onSave,
  observations = [],
  onObserve,
}: Props) {
  const original = recipe.ingredients.map((ingredient) => ingredient.fraction);
  const [fractions, setFractions] = useState(original);
  const [amount, setAmount] = useState(20);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const estimatedHex = estimateMix(
    recipe.ingredients.map((ingredient) => ingredient.paint),
    fractions,
  );
  const difference = colorDistance(recipe.targetHex, estimatedHex);
  const currentRecipe: Recipe = {
    ...recipe,
    estimatedHex,
    deltaE: difference,
    ingredients: recipe.ingredients.map((ingredient, index) => ({
      ...ingredient,
      fraction: fractions[index],
    })),
  };
  const priorObservation = matchingObservation(currentRecipe, observations);
  const smallestFraction = Math.min(...fractions);

  async function save() {
    if (!onSave) return;
    setError("");
    try {
      await onSave({
        ...currentRecipe,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      setSaved(true);
    } catch {
      setError("No se pudo guardar la receta en este dispositivo.");
    }
  }

  return (
    <article className="surface recipe-card">
      <h3>{title}</h3>
      <div className="comparison">
        <div>
          <div
            className="color-block"
            style={{ background: recipe.targetHex }}
          />
          <span>Objetivo · {recipe.targetHex}</span>
        </div>
        <div>
          <div className="color-block" style={{ background: estimatedHex }} />
          <span>Estimado · {estimatedHex}</span>
        </div>
      </div>
      {priorObservation && (
        <div className="prior-observation">
          <div
            className="swatch"
            style={{ background: priorObservation.observedHex }}
          />
          <div>
            <strong>
              Color observado antes: {priorObservation.observedHex}
            </strong>
            <p className="hint">
              Mismos pigmentos y proporciones aproximadas. Fotografía previa, no
              predicción del modelo; la iluminación puede cambiar el resultado.
            </p>
          </div>
        </div>
      )}
      <p className="hint">
        Diferencia digital estimada ΔE00: {difference.toFixed(1)}. No predice
        con certeza el color físico del óleo.
      </p>
      <ol className="recipe-ingredients">
        {recipe.ingredients.map((ingredient, index) => {
          const parts =
            Math.round((fractions[index] / smallestFraction) * 10) / 10;
          return (
            <li key={ingredient.paint.id}>
              <div className="ingredient-name">
                <span
                  className="mini-swatch"
                  style={{ background: ingredient.paint.hex }}
                />
                {ingredient.paint.name}{" "}
                <strong>{Math.round(fractions[index] * 1000) / 10} %</strong>
              </div>
              <small>
                {parts} {parts === 1 ? "parte relativa" : "partes relativas"}
              </small>
            </li>
          );
        })}
      </ol>
      <p>
        Coloca primero el ingrediente de mayor proporción. Añade los demás poco
        a poco y compara una pequeña muestra bajo la misma luz.
      </p>
      <details className="recipe-details">
        <summary>Ajustar y medir cantidades</summary>
        <label className="amount-label">
          Cantidad aproximada (mL)
          <input
            type="number"
            min="1"
            max="500"
            value={amount}
            onChange={(event) =>
              setAmount(
                Math.max(1, Math.min(500, Number(event.target.value) || 1)),
              )
            }
          />
        </label>
        <ul className="measurement-list">
          {recipe.ingredients.map((ingredient, index) => {
            const quantity = ingredientQuantity(
              fractions[index],
              amount,
              ingredient.paint.densityGPerMl,
            );
            return (
              <li key={ingredient.paint.id}>
                <strong>{ingredient.paint.name}</strong>
                {fractions.length > 1 && (
                  <input
                    type="range"
                    min="5"
                    max="95"
                    step="1"
                    aria-label={`Porcentaje de ${ingredient.paint.name}`}
                    value={Math.round(fractions[index] * 100)}
                    onChange={(event) => {
                      setFractions(
                        rebalance(
                          fractions,
                          index,
                          Number(event.target.value) / 100,
                        ),
                      );
                      setSaved(false);
                    }}
                  />
                )}
                <small>
                  {quantity.ml} mL aprox. · {quantity.tsp} cucharaditas o{" "}
                  {quantity.tbsp} cucharadas medidoras
                  {quantity.grams !== null
                    ? ` · ${quantity.grams} g estimados`
                    : ""}
                </small>
              </li>
            );
          })}
        </ul>
        <p className="hint">
          1 cucharadita medidora = 5 mL; 1 cucharada medidora = 15 mL. Para
          cantidades pequeñas, usa partes reproducibles en vez de gotas.
        </p>
        {recipe.ingredients.some(({ paint }) => !paint.densityGPerMl) && (
          <p className="hint">
            Los gramos requieren la densidad verificada de cada pintura.
          </p>
        )}
        <button
          className="text-button"
          onClick={() => {
            setFractions(original);
            setSaved(false);
          }}
        >
          Restaurar proporciones
        </button>
      </details>
      <div className="recipe-actions">
        {onSave && (
          <button className="primary-action" onClick={() => void save()}>
            {saved ? "Guardada" : "Guardar receta"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {onObserve && (
        <ObservationPanel recipe={currentRecipe} onSave={onObserve} />
      )}
    </article>
  );
}
