import { useState } from "react";
import type { Paint } from "../../domain/types";

interface Props {
  paints: Paint[];
  onSave: (paint: Paint) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PaintInventory({ paints, onSave, onDelete }: Props) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#ad683e");
  const [brand, setBrand] = useState("");
  const [pigmentCode, setPigmentCode] = useState("");
  const [notes, setNotes] = useState("");
  const [density, setDensity] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Escribe el nombre de la pintura.");
      return;
    }
    if (
      paints.some(
        (paint) =>
          paint.id !== editing &&
          paint.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase() &&
          (paint.brand || "") === brand.trim(),
      )
    ) {
      setError(
        "Ya tienes una pintura con ese nombre y marca. Edítala en la lista.",
      );
      return;
    }
    const existing = paints.find((paint) => paint.id === editing);
    const now = new Date().toISOString();
    try {
      await onSave({
        id: editing || crypto.randomUUID(),
        name: cleanName,
        brand: brand.trim() || undefined,
        pigmentCode: pigmentCode.trim() || undefined,
        notes: notes.trim() || undefined,
        densityGPerMl: density ? Number(density) : undefined,
        hex,
        available: existing?.available ?? true,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      });
      setName("");
      setBrand("");
      setPigmentCode("");
      setNotes("");
      setDensity("");
      setEditing(null);
    } catch {
      setError(
        "No se pudo guardar. Revisa el espacio disponible en tu dispositivo.",
      );
    }
  }

  function edit(paint: Paint) {
    setEditing(paint.id);
    setName(paint.name);
    setBrand(paint.brand || "");
    setPigmentCode(paint.pigmentCode || "");
    setNotes(paint.notes || "");
    setDensity(paint.densityGPerMl?.toString() || "");
    setHex(paint.hex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="inventory">
      <form
        onSubmit={(event) => void submit(event)}
        className="surface form-grid"
      >
        <h2>{editing ? "Editar pintura" : "Agregar una pintura"}</h2>
        <label>
          Nombre
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder="Ej. Azul ultramar"
            required
          />
        </label>
        <label>
          Marca (opcional)
          <input
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            maxLength={80}
          />
        </label>
        <label>
          Color de referencia{" "}
          <input
            type="color"
            value={hex}
            onChange={(event) => setHex(event.target.value)}
          />
        </label>
        <details>
          <summary>Datos opcionales</summary>
          <label>
            Código de pigmento
            <input
              value={pigmentCode}
              onChange={(event) => setPigmentCode(event.target.value)}
              maxLength={30}
              placeholder="Ej. PB29"
            />
          </label>
          <label>
            Densidad verificada (g/mL)
            <input
              type="number"
              min="0.01"
              max="20"
              step="0.01"
              value={density}
              onChange={(event) => setDensity(event.target.value)}
            />
          </label>
          <label>
            Notas
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
            />
          </label>
          <p className="hint">
            Agrega densidad solo si la mediste o cuentas con un dato
            verificable.
          </p>
        </details>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary-action" type="submit">
          {editing ? "Guardar cambios" : "Guardar pintura"}
        </button>
        {editing && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setEditing(null);
              setName("");
            }}
          >
            Cancelar edición
          </button>
        )}
      </form>
      <div className="section-heading">
        <span>TU COLECCIÓN</span>
        <h2>Pinturas registradas</h2>
      </div>
      <label className="search-label">
        Buscar por nombre
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pintura"
        />
      </label>
      <label className="search-label">
        Filtrar por marca
        <select
          value={brandFilter}
          onChange={(event) => setBrandFilter(event.target.value)}
        >
          <option value="">Todas las marcas</option>
          {[...new Set(paints.map((paint) => paint.brand).filter(Boolean))]
            .sort()
            .map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
        </select>
      </label>
      <div className="paint-list">
        {paints
          .filter(
            (paint) =>
              `${paint.name} ${paint.brand || ""}`
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()) &&
              (!brandFilter || paint.brand === brandFilter),
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((paint) => (
            <article className="surface paint-item" key={paint.id}>
              <div className="swatch" style={{ background: paint.hex }} />
              <div>
                <strong>{paint.name}</strong>
                <small>
                  {paint.brand || "Sin marca"} ·{" "}
                  {paint.available ? "Disponible" : "No disponible"}
                </small>
              </div>
              <div className="item-actions">
                <button type="button" onClick={() => edit(paint)}>
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void onSave({
                      ...paint,
                      available: !paint.available,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                >
                  {paint.available ? "Pausar" : "Activar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Eliminar ${paint.name}? Las recetas guardadas conservarán su información.`,
                      )
                    )
                      void onDelete(paint.id);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        {paints.length === 0 && (
          <p className="empty">
            Todavía no registras pinturas. Agrega tu primer color arriba.
          </p>
        )}
      </div>
    </div>
  );
}
