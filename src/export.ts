import type { BorderAssets } from "./borders";
import type { Token } from "./types";

export { tokenCanvas, save };

// Crop from the original image, never from the scaled editor preview.
function tokenCanvas(
  image: HTMLImageElement,
  token: Token,
  resolution: number,
  background?: string | null,
  border: BorderAssets | null = null,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("Canvas 2D rendering is unavailable in this browser.");
  const frame = border;
  ctx.imageSmoothingQuality = "high";
  ctx.save();
  if (token.shape === "circle" && !frame) {
    ctx.beginPath();
    ctx.arc(resolution / 2, resolution / 2, resolution / 2, 0, Math.PI * 2);
    ctx.clip();
  }
  ctx.drawImage(
    image,
    token.x,
    token.y,
    token.size,
    token.size,
    0,
    0,
    resolution,
    resolution,
  );
  if (frame) {
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(frame.mask, 0, 0, resolution, resolution);
  }
  ctx.restore();
  if (frame) ctx.drawImage(frame.image, 0, 0, resolution, resolution);
  if (background) {
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, resolution, resolution);
  }
  return canvas;
}
function save(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  // Append for browsers that require download links to be in the document.
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
