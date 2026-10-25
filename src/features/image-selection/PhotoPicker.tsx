import { useEffect, useRef, useState } from "react";
import { imagePoint, samplePixels } from "./sampling";

interface Props {
  onPick: (hex: string) => void;
  onReset?: () => void;
}

export function PhotoPicker({ onPick, onReset }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadRequest = useRef(0);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [sampleSize, setSampleSize] = useState(3);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(
    () => () => {
      canvasRef.current
        ?.getContext("2d")
        ?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    },
    [],
  );

  async function load(file?: File) {
    if (!file) return;
    const request = ++loadRequest.current;
    onReset?.();
    setError("");
    setReady(false);
    setPoint(null);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 20 * 1024 * 1024
    ) {
      setError("Elige una foto JPEG, PNG o WebP de hasta 20 MB.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      if (loadRequest.current !== request) {
        bitmap.close();
        return;
      }
      const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
      const canvas = canvasRef.current!;
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas
        .getContext("2d", { willReadFrequently: true })!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setReady(true);
    } catch {
      if (loadRequest.current === request)
        setError("No pudimos abrir la foto. Prueba con otra imagen.");
    }
  }

  function pick(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!ready || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    // getBoundingClientRect already includes the CSS zoom and translation.
    const pixel = imagePoint(
      { clientX, clientY },
      rect,
      canvas.width,
      canvas.height,
    );
    const radius = Math.floor(sampleSize / 2);
    const left = Math.max(0, pixel.x - radius);
    const top = Math.max(0, pixel.y - radius);
    const width = Math.min(canvas.width - left, sampleSize);
    const height = Math.min(canvas.height - top, sampleSize);
    const pixels = canvas
      .getContext("2d", { willReadFrequently: true })!
      .getImageData(left, top, width, height).data;
    try {
      onPick(
        samplePixels(
          pixels,
          width,
          height,
          pixel.x - left,
          pixel.y - top,
          sampleSize,
        ),
      );
      setPoint(pixel);
    } catch {
      setError("Ese punto no tiene un color visible. Elige otro.");
    }
  }

  return (
    <div className="photo-picker">
      <div className="photo-actions">
        <label className="file-button">
          Elegir foto
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void load(event.target.files?.[0])}
          />
        </label>
        <label className="file-button secondary">
          Tomar foto
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(event) => void load(event.target.files?.[0])}
          />
        </label>
      </div>
      <p className="hint">
        La foto se procesa en este dispositivo y no se guarda.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className={`photo-viewport ${ready ? "has-photo" : ""}`}>
        {!ready && (
          <div className="photo-placeholder">
            <span aria-hidden="true">▧</span>
            <p>Tu foto aparecerá aquí</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          role="button"
          tabIndex={ready ? 0 : -1}
          aria-label="Fotografía; toca o pulsa Intro para seleccionar un color"
          onPointerDown={(event) => pick(event.clientX, event.clientY)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              pick(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
          }}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            display: ready ? "block" : "none",
          }}
        />
        {point && ready && (
          <span
            className="selected-point"
            style={{
              left:
                (point.x / (canvasRef.current?.width || 1)) *
                  (canvasRef.current?.clientWidth || 0) *
                  zoom +
                pan.x,
              top:
                (point.y / (canvasRef.current?.width || 1)) *
                  (canvasRef.current?.clientWidth || 0) *
                  zoom +
                pan.y,
            }}
            aria-hidden="true"
          />
        )}
      </div>
      {ready && (
        <div className="photo-controls">
          <label>
            Zoom{" "}
            <input
              type="range"
              min="1"
              max="4"
              step="0.25"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <label>
            Mover horizontalmente{" "}
            <input
              type="range"
              min="-300"
              max="300"
              value={pan.x}
              onChange={(event) =>
                setPan({ ...pan, x: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Mover verticalmente{" "}
            <input
              type="range"
              min="-300"
              max="300"
              value={pan.y}
              onChange={(event) =>
                setPan({ ...pan, y: Number(event.target.value) })
              }
            />
          </label>
          <label>
            Área de muestra{" "}
            <select
              value={sampleSize}
              onChange={(event) => setSampleSize(Number(event.target.value))}
            >
              <option value="1">1 × 1</option>
              <option value="3">3 × 3</option>
              <option value="5">5 × 5</option>
              <option value="9">9 × 9</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
