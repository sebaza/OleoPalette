import { useEffect, useRef, useState } from "react";
import { imagePoint, samplePixels } from "./sampling";
import { clampPan, fitSize, zoomAt, type View } from "./photoTransform";

interface Props {
  onPick: (hex: string) => void;
  onReset?: () => void;
}

type Touch = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
};
const FIT_VIEW: View = { zoom: 1, pan: { x: 0, y: 0 } };
const FEEDBACK_HEIGHT = 44;

export function PhotoPicker({ onPick, onReset }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const loadRequest = useRef(0);
  const touches = useRef(new Map<number, Touch>());
  const viewRef = useRef<View>(FIT_VIEW);
  const [view, setView] = useState<View>(FIT_VIEW);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [sampleSize, setSampleSize] = useState(3);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [pickedHex, setPickedHex] = useState<string | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      setSize({ width: viewport.clientWidth, height: viewport.clientHeight });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      const canvas = canvasRef.current;
      canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    },
    [],
  );

  const canvas = canvasRef.current;
  const imageAreaHeight = Math.max(1, size.height - FEEDBACK_HEIGHT);
  const fitted =
    canvas && size.width && size.height
      ? fitSize(canvas.width, canvas.height, size.width, imageAreaHeight)
      : { width: 0, height: 0 };
  const shownView = {
    zoom: view.zoom,
    pan: clampPan(
      view.pan,
      fitted.width,
      fitted.height,
      size.width,
      imageAreaHeight,
      view.zoom,
    ),
  };

  useEffect(() => {
    if (!ready || !size.width || !size.height) return;
    const nextPan = clampPan(
      viewRef.current.pan,
      fitted.width,
      fitted.height,
      size.width,
      imageAreaHeight,
      viewRef.current.zoom,
    );
    if (
      nextPan.x !== viewRef.current.pan.x ||
      nextPan.y !== viewRef.current.pan.y
    ) {
      updateView({ ...viewRef.current, pan: nextPan });
    }
  }, [
    ready,
    size.width,
    size.height,
    imageAreaHeight,
    fitted.width,
    fitted.height,
  ]);

  function updateView(next: View) {
    viewRef.current = next;
    setView(next);
  }

  async function load(file?: File) {
    if (!file) return;
    const request = ++loadRequest.current;
    onReset?.();
    setError("");
    setReady(false);
    setPoint(null);
    setPickedHex(null);
    touches.current.clear();
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
      const target = canvasRef.current!;
      target.width = Math.max(1, Math.round(bitmap.width * scale));
      target.height = Math.max(1, Math.round(bitmap.height * scale));
      target
        .getContext("2d", { willReadFrequently: true })!
        .drawImage(bitmap, 0, 0, target.width, target.height);
      bitmap.close();
      updateView(FIT_VIEW);
      setReady(true);
    } catch {
      if (loadRequest.current === request)
        setError("No pudimos abrir la foto. Prueba con otra imagen.");
    }
  }

  function pickPixel(pixel: { x: number; y: number }) {
    const target = canvasRef.current;
    if (!ready || !target) return;
    const radius = Math.floor(sampleSize / 2);
    const left = Math.max(0, pixel.x - radius);
    const top = Math.max(0, pixel.y - radius);
    const width = Math.min(target.width - left, sampleSize);
    const height = Math.min(target.height - top, sampleSize);
    const pixels = target
      .getContext("2d", { willReadFrequently: true })!
      .getImageData(left, top, width, height).data;
    try {
      const hex = samplePixels(
        pixels,
        width,
        height,
        pixel.x - left,
        pixel.y - top,
        sampleSize,
      );
      onPick(hex);
      setPickedHex(hex);
      setPoint(pixel);
    } catch {
      setError("Ese punto no tiene un color visible. Elige otro.");
    }
  }

  function pick(clientX: number, clientY: number) {
    const target = canvasRef.current;
    if (!ready || !target) return;
    const rect = target.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX >= rect.right ||
      clientY < rect.top ||
      clientY >= rect.bottom
    )
      return;
    pickPixel(
      imagePoint({ clientX, clientY }, rect, target.width, target.height),
    );
  }

  function anchor(clientX: number, clientY: number) {
    const rect = viewportRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function changeZoom(zoom: number) {
    updateView(
      zoomAt(
        viewRef.current,
        zoom,
        { x: size.width / 2, y: imageAreaHeight / 2 },
        size.width,
        imageAreaHeight,
        fitted.width,
        fitted.height,
      ),
    );
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
      <div
        ref={viewportRef}
        className={`photo-viewport ${ready ? "has-photo" : ""} ${view.zoom > 1 ? "is-zoomed" : ""}`}
        onPointerDown={(event) => {
          if (!ready) return;
          touches.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
            startX: event.clientX,
            startY: event.clientY,
            moved: false,
          });
          if (
            viewRef.current.zoom > 1 ||
            event.pointerType !== "touch" ||
            touches.current.size > 1
          )
            event.currentTarget.setPointerCapture(event.pointerId);
          if (touches.current.size > 1)
            for (const touch of touches.current.values()) touch.moved = true;
        }}
        onPointerMove={(event) => {
          const touch = touches.current.get(event.pointerId);
          if (!touch) return;
          const dx = event.clientX - touch.x;
          const dy = event.clientY - touch.y;
          const others = [...touches.current.entries()].filter(
            ([id]) => id !== event.pointerId,
          );
          if (others.length) {
            const other = others[0][1];
            const oldDistance = Math.hypot(
              touch.x - other.x,
              touch.y - other.y,
            );
            const newDistance = Math.hypot(
              event.clientX - other.x,
              event.clientY - other.y,
            );
            const oldCenter = anchor(
              (touch.x + other.x) / 2,
              (touch.y + other.y) / 2,
            );
            const next = zoomAt(
              viewRef.current,
              viewRef.current.zoom * (newDistance / Math.max(1, oldDistance)),
              oldCenter,
              size.width,
              imageAreaHeight,
              fitted.width,
              fitted.height,
            );
            next.pan = clampPan(
              { x: next.pan.x + dx / 2, y: next.pan.y + dy / 2 },
              fitted.width,
              fitted.height,
              size.width,
              imageAreaHeight,
              next.zoom,
            );
            updateView(next);
          } else {
            if (
              Math.hypot(
                event.clientX - touch.startX,
                event.clientY - touch.startY,
              ) > 7
            )
              touch.moved = true;
            if (touch.moved && viewRef.current.zoom > 1)
              updateView({
                ...viewRef.current,
                pan: clampPan(
                  {
                    x: viewRef.current.pan.x + dx,
                    y: viewRef.current.pan.y + dy,
                  },
                  fitted.width,
                  fitted.height,
                  size.width,
                  imageAreaHeight,
                  viewRef.current.zoom,
                ),
              });
          }
          touch.x = event.clientX;
          touch.y = event.clientY;
        }}
        onPointerUp={(event) => {
          const touch = touches.current.get(event.pointerId);
          touches.current.delete(event.pointerId);
          if (touch && !touch.moved && touches.current.size === 0)
            pick(event.clientX, event.clientY);
        }}
        onPointerCancel={(event) => touches.current.delete(event.pointerId)}
        onPointerLeave={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId))
            touches.current.delete(event.pointerId);
        }}
      >
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
          aria-label="Fotografía; toca para seleccionar un color, arrastra para mover, pellizca para ampliar; usa las flechas e Intro con teclado"
          onKeyDown={(event) => {
            const target = canvasRef.current;
            if (!target) return;
            const step = event.shiftKey ? 10 : 1;
            if (
              ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            ) {
              event.preventDefault();
              const current = point ?? {
                x: Math.floor(target.width / 2),
                y: Math.floor(target.height / 2),
              };
              pickPixel({
                x: Math.max(
                  0,
                  Math.min(
                    target.width - 1,
                    current.x +
                      (event.key === "ArrowRight"
                        ? step
                        : event.key === "ArrowLeft"
                          ? -step
                          : 0),
                  ),
                ),
                y: Math.max(
                  0,
                  Math.min(
                    target.height - 1,
                    current.y +
                      (event.key === "ArrowDown"
                        ? step
                        : event.key === "ArrowUp"
                          ? -step
                          : 0),
                  ),
                ),
              });
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              pickPixel(
                point ?? {
                  x: Math.floor(target.width / 2),
                  y: Math.floor(target.height / 2),
                },
              );
            }
          }}
          style={{
            width: fitted.width,
            height: fitted.height,
            transform: `translate(-50%, -50%) translate(${shownView.pan.x}px, ${shownView.pan.y}px) scale(${shownView.zoom})`,
            display: ready ? "block" : "none",
          }}
        />
        {point && ready && (
          <span
            className="selected-point"
            style={{
              left:
                size.width / 2 +
                shownView.pan.x +
                (point.x / (canvasRef.current?.width || 1) - 0.5) *
                  fitted.width *
                  shownView.zoom,
              top:
                imageAreaHeight / 2 +
                shownView.pan.y +
                (point.y / (canvasRef.current?.height || 1) - 0.5) *
                  fitted.height *
                  shownView.zoom,
            }}
            aria-hidden="true"
          />
        )}
        {ready && (
          <div className="photo-feedback" role="status">
            {pickedHex ? (
              <>
                <span
                  className="photo-feedback-swatch"
                  style={{ background: pickedHex }}
                  aria-hidden="true"
                />
                <span>COLOR SELECCIONADO</span>
                <strong>{pickedHex.toUpperCase()}</strong>
              </>
            ) : (
              <span>Toca la foto para elegir un color</span>
            )}
          </div>
        )}
      </div>
      {ready && (
        <div className="photo-controls">
          <p className="hint">
            Toca un color. Arrastra con un dedo y pellizca con dos para
            acercarte.
          </p>
          <div className="photo-zoom-buttons">
            <button
              type="button"
              aria-label="Reducir foto"
              disabled={view.zoom <= 1}
              onClick={() => changeZoom(viewRef.current.zoom / 1.5)}
            >
              −
            </button>
            <span aria-live="polite">{Math.round(view.zoom * 100)} %</span>
            <button
              type="button"
              aria-label="Ampliar foto"
              disabled={view.zoom >= 4}
              onClick={() => changeZoom(viewRef.current.zoom * 1.5)}
            >
              +
            </button>
            <button type="button" onClick={() => updateView(FIT_VIEW)}>
              Restablecer
            </button>
          </div>
          <details className="photo-precision">
            <summary>Precisión de muestra</summary>
            <label>
              Área de muestra
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
          </details>
        </div>
      )}
    </div>
  );
}
