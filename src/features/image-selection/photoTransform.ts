export interface Pan {
  x: number;
  y: number;
}
export interface View {
  zoom: number;
  pan: Pan;
}

export function fitSize(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const scale = Math.min(
    viewportWidth / imageWidth,
    viewportHeight / imageHeight,
  );
  return { width: imageWidth * scale, height: imageHeight * scale };
}

export function clampPan(
  pan: Pan,
  fitWidth: number,
  fitHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
): Pan {
  const maxX = Math.max(0, (fitWidth * zoom - viewportWidth) / 2);
  const maxY = Math.max(0, (fitHeight * zoom - viewportHeight) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, pan.x)),
    y: Math.max(-maxY, Math.min(maxY, pan.y)),
  };
}

export function zoomAt(
  view: View,
  zoom: number,
  anchor: Pan,
  viewportWidth: number,
  viewportHeight: number,
  fitWidth: number,
  fitHeight: number,
): View {
  const nextZoom = Math.max(1, Math.min(4, zoom));
  const ratio = nextZoom / view.zoom;
  const pan = {
    x:
      (view.pan.x - (anchor.x - viewportWidth / 2)) * ratio +
      (anchor.x - viewportWidth / 2),
    y:
      (view.pan.y - (anchor.y - viewportHeight / 2)) * ratio +
      (anchor.y - viewportHeight / 2),
  };
  return {
    zoom: nextZoom,
    pan: clampPan(
      pan,
      fitWidth,
      fitHeight,
      viewportWidth,
      viewportHeight,
      nextZoom,
    ),
  };
}
