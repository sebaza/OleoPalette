export function imagePoint(
  point: { clientX: number; clientY: number },
  rect: { left: number; top: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
  zoom = 1,
  panX = 0,
  panY = 0,
): { x: number; y: number } {
  const x =
    ((point.clientX - rect.left - panX) / (rect.width * zoom)) * imageWidth;
  const y =
    ((point.clientY - rect.top - panY) / (rect.height * zoom)) * imageHeight;
  return {
    x: Math.max(0, Math.min(imageWidth - 1, Math.floor(x))),
    y: Math.max(0, Math.min(imageHeight - 1, Math.floor(y))),
  };
}

export function samplePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  size = 1,
): string {
  const radius = Math.floor(size / 2);
  let count = 0;
  const sums = [0, 0, 0];
  for (
    let yy = Math.max(0, y - radius);
    yy <= Math.min(height - 1, y + radius);
    yy++
  ) {
    for (
      let xx = Math.max(0, x - radius);
      xx <= Math.min(width - 1, x + radius);
      xx++
    ) {
      const index = (yy * width + xx) * 4;
      if (data[index + 3] < 128) continue;
      for (let channel = 0; channel < 3; channel++)
        sums[channel] += data[index + channel];
      count++;
    }
  }
  if (!count) throw new Error("No opaque pixels in sample");
  return `#${sums
    .map((sum) =>
      Math.round(sum / count)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
