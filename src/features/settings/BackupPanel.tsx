import { useState } from "react";
import { db } from "../../storage/db";
import { makeBackup, parseBackup, type Backup } from "../../storage/backup";
import type { Paint, Recipe } from "../../domain/types";

interface Props {
  paints: Paint[];
  recipes: Recipe[];
  onImported: () => Promise<void>;
}

export function BackupPanel({ paints, recipes, onImported }: Props) {
  const [incoming, setIncoming] = useState<Backup | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function download() {
    const blob = new Blob(
      [JSON.stringify(makeBackup(paints, recipes), null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "oleopalette-respaldo.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function load(file?: File) {
    setError("");
    setMessage("");
    setIncoming(null);
    if (!file) return;
    if (
      file.size > 5_000_000 ||
      (file.type && !["application/json", "text/plain"].includes(file.type))
    ) {
      setError("Elige un archivo JSON de hasta 5 MB.");
      return;
    }
    try {
      setIncoming(parseBackup(await file.text()));
    } catch {
      setError(
        "El archivo no tiene un respaldo compatible y válido. No se cambió ningún dato.",
      );
    }
  }

  async function restore(replace: boolean) {
    if (!incoming) return;
    if (
      replace &&
      !window.confirm(
        "Esto reemplazará tus pinturas y recetas actuales. ¿Continuar?",
      )
    )
      return;
    setError("");
    try {
      const source = incoming;
      await db.transaction("rw", db.paints, db.recipes, async () => {
        if (replace) {
          await db.paints.clear();
          await db.recipes.clear();
        }
        const paintIds = new Set(
          (await db.paints.toArray()).map((paint) => paint.id),
        );
        const recipeIds = new Set(
          (await db.recipes.toArray()).map((recipe) => recipe.id),
        );
        await db.paints.bulkAdd(
          source.paints.filter((paint) => !paintIds.has(paint.id)),
        );
        await db.recipes.bulkAdd(
          source.recipes.filter((recipe) => !recipeIds.has(recipe.id)),
        );
      });
      await onImported();
      setIncoming(null);
      setMessage("Respaldo importado correctamente.");
    } catch {
      setError(
        "No se pudo importar el respaldo. Tus datos anteriores se conservan.",
      );
    }
  }

  return (
    <div className="surface backup-panel">
      <h2>Respaldo local</h2>
      <p>
        Guarda un archivo JSON para no perder tus pinturas y recetas si borras
        los datos del navegador. Las fotos no se incluyen.
      </p>
      <button type="button" className="primary-action" onClick={download}>
        Descargar respaldo
      </button>
      <label className="import-label">
        Importar respaldo
        <input
          type="file"
          accept=".json,application/json"
          onChange={(event) => void load(event.target.files?.[0])}
        />
      </label>
      {incoming && (
        <div className="backup-preview">
          <h3>Vista previa</h3>
          <p>
            {incoming.paints.length} pinturas y {incoming.recipes.length}{" "}
            recetas.
          </p>
          <div className="recipe-actions">
            <button
              type="button"
              className="primary-action"
              onClick={() => void restore(false)}
            >
              Combinar sin duplicar IDs
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => void restore(true)}
            >
              Reemplazar mis datos
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
