import { useState } from "react";
import type { MixObservation, Recipe } from "../../domain/types";
import { PhotoPicker } from "../image-selection/PhotoPicker";

interface Props {
  recipe: Recipe;
  onSave: (observation: MixObservation) => Promise<void>;
}

export function ObservationPanel({ recipe, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [observedHex, setObservedHex] = useState("#aa7755");
  const [lighting, setLighting] = useState("");
  const [paintState, setPaintState] = useState<"wet" | "dry" | "unknown">(
    "unknown",
  );
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await onSave({
        id: crypto.randomUUID(),
        recipe,
        observedHex,
        lighting: lighting.trim() || undefined,
        paintState,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      setMessage("Observación guardada en este dispositivo.");
      setOpen(false);
    } catch {
      setMessage("No se pudo guardar la observación.");
    }
  }

  return (
    <div className="observation-panel">
      <button
        type="button"
        className="text-button"
        onClick={() => setOpen(!open)}
      >
        {open ? "Cerrar observación" : "Registrar resultado real"}
      </button>
      {open && (
        <form onSubmit={(event) => void submit(event)}>
          <h4>¿Cómo resultó la mezcla?</h4>
          <p className="hint">
            Fotografía una muestra con luz uniforme, sin reflejos ni filtros.
            Una foto no mide el espectro del pigmento.
          </p>
          <PhotoPicker onPick={setObservedHex} />
          <label>
            Color observado
            <input
              type="color"
              value={observedHex}
              onChange={(event) => setObservedHex(event.target.value)}
            />
          </label>
          <label>
            Iluminación (opcional)
            <input
              value={lighting}
              maxLength={100}
              onChange={(event) => setLighting(event.target.value)}
              placeholder="Ej. luz de ventana"
            />
          </label>
          <label>
            Estado de la pintura
            <select
              value={paintState}
              onChange={(event) =>
                setPaintState(event.target.value as "wet" | "dry" | "unknown")
              }
            >
              <option value="unknown">No indicado</option>
              <option value="wet">Húmeda</option>
              <option value="dry">Seca</option>
            </select>
          </label>
          <label>
            Notas (opcional)
            <textarea
              value={notes}
              maxLength={1000}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <button type="submit" className="primary-action">
            Guardar observación
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
