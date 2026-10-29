const transparencyCutoff = 128;

/** Keep only the largest transparent region enclosed by the original frame. */
export function frameOpeningMask(
  width: number,
  height: number,
  rgba: Uint8ClampedArray,
): Uint8ClampedArray<ArrayBuffer> {
  const pixelCount = width * height;
  const components = new Uint32Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  let largestComponent = 0;
  let largestSize = 0;

  for (let start = 0; start < pixelCount; start++) {
    if (
      components[start] !== 0 ||
      (rgba[start * 4 + 3] ?? 0) >= transparencyCutoff
    ) {
      continue;
    }

    const component = start + 1;
    components[start] = component;
    queue[0] = start;
    let queued = 1;
    let touchesBoundary = false;

    // Four-connected flood filling separates enclosed openings from exterior gaps.
    for (let next = 0; next < queued; next++) {
      const pixel = queue[next] ?? 0;
      const column = pixel % width;
      if (
        pixel < width ||
        pixel >= pixelCount - width ||
        column === 0 ||
        column === width - 1
      ) {
        touchesBoundary = true;
      }

      if (
        column > 0 &&
        components[pixel - 1] === 0 &&
        (rgba[(pixel - 1) * 4 + 3] ?? 0) < transparencyCutoff
      ) {
        components[pixel - 1] = component;
        queue[queued++] = pixel - 1;
      }
      if (
        column < width - 1 &&
        components[pixel + 1] === 0 &&
        (rgba[(pixel + 1) * 4 + 3] ?? 0) < transparencyCutoff
      ) {
        components[pixel + 1] = component;
        queue[queued++] = pixel + 1;
      }
      if (
        pixel >= width &&
        components[pixel - width] === 0 &&
        (rgba[(pixel - width) * 4 + 3] ?? 0) < transparencyCutoff
      ) {
        components[pixel - width] = component;
        queue[queued++] = pixel - width;
      }
      if (
        pixel < pixelCount - width &&
        components[pixel + width] === 0 &&
        (rgba[(pixel + width) * 4 + 3] ?? 0) < transparencyCutoff
      ) {
        components[pixel + width] = component;
        queue[queued++] = pixel + width;
      }
    }

    if (!touchesBoundary && queued > largestSize) {
      largestComponent = component;
      largestSize = queued;
    }
  }

  if (largestComponent === 0) {
    throw new Error(
      "The token frame has no enclosed transparent artwork opening.",
    );
  }

  const mask = new Uint8ClampedArray(pixelCount * 4);
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    let inside = components[pixel] === largestComponent;
    if (!inside && (rgba[pixel * 4 + 3] ?? 0) >= transparencyCutoff) {
      // Tuck artwork one pixel beneath the frame, never into transparent exterior.
      const column = pixel % width;
      const row = Math.floor(pixel / width);
      const left = Math.max(0, column - 1);
      const right = Math.min(width - 1, column + 1);
      const bottom = Math.min(height - 1, row + 1);
      for (let y = Math.max(0, row - 1); y <= bottom && !inside; y++) {
        for (let x = left; x <= right; x++) {
          if (components[y * width + x] === largestComponent) {
            inside = true;
            break;
          }
        }
      }
    }
    if (inside) {
      const offset = pixel * 4;
      mask[offset] = 255;
      mask[offset + 1] = 255;
      mask[offset + 2] = 255;
      mask[offset + 3] = 255;
    }
  }
  return mask;
}
