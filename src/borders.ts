import type { BorderId, Shape } from "./types";
import mediumUrl from "./assets/borders/fifthed_border_medium.png";
import grayscaleUrl from "./assets/borders/fifthed_border_medium_greyscale.png";
import maskUrl from "./assets/borders/fifthed_border_mask.gif";
import { frameOpeningMask } from "./frameMask";
import { readCustomBorders, saveCustomBorder } from "./customBorderStorage";
import type { CustomBorderRecord } from "./customBorderStorage";

export interface BorderAssets {
  image: HTMLImageElement;
  mask: HTMLCanvasElement;
}

export interface BorderOption {
  id: BorderId;
  label: string;
  shapes: readonly Shape[];
}

const frameUrls: Partial<Record<BorderId, string>> = {
  "classic-5e-medium": mediumUrl,
  "classic-5e-medium-grayscale": grayscaleUrl,
};

export const borderOptions: readonly BorderOption[] = [
  { id: "none", label: "None", shapes: ["circle", "square"] },
  { id: "classic-5e-medium", label: "Classic 5e Medium", shapes: ["circle"] },
  {
    id: "classic-5e-medium-grayscale",
    label: "Classic 5e Medium Grayscale",
    shapes: ["circle"],
  },
];

const noBorder = Promise.resolve(null);
const borders = new Map<BorderId, Promise<BorderAssets | null>>();
let mask: Promise<HTMLCanvasElement> | undefined;
const customBorders = new Map<BorderId, CustomBorderRecord>();
let restoration: Promise<void> | undefined;

function customBorderOption(record: CustomBorderRecord): BorderOption {
  return { id: record.id, label: record.label, shapes: [record.shape] };
}

export async function restoreCustomBorders(): Promise<BorderOption[]> {
  restoration ??= readCustomBorders().then((records) => {
    for (const record of records) customBorders.set(record.id, record);
  });
  await restoration;
  return Array.from(customBorders.values(), customBorderOption);
}

export async function addCustomBorder(
  file: File,
  shape: Shape,
): Promise<BorderOption> {
  const assets = await decodeCustomBorder(file);
  const record: CustomBorderRecord = {
    id: `custom:${crypto.randomUUID()}`,
    label: file.name,
    shape,
    blob: file,
  };
  await saveCustomBorder(record);
  customBorders.set(record.id, record);
  borders.set(record.id, Promise.resolve(assets));
  return customBorderOption(record);
}

async function decodeImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    throw new Error("The local token border image could not be decoded.");
  }
  return image;
}

async function decodeFile(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await decodeImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function decodeCustomBorder(blob: Blob): Promise<BorderAssets> {
  const image = await decodeFile(blob);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("Canvas 2D rendering is unavailable in this browser.");
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  pixels.data.set(frameOpeningMask(canvas.width, canvas.height, pixels.data));
  ctx.putImageData(pixels, 0, 0);
  return { image, mask: canvas };
}

async function loadCustomBorder(id: BorderId): Promise<BorderAssets> {
  if (!customBorders.has(id)) await restoreCustomBorders();
  const record = customBorders.get(id);
  if (!record) throw new Error(`Unknown token border: ${id}`);
  return decodeCustomBorder(record.blob);
}

function loadMask(): Promise<HTMLCanvasElement> {
  mask ??= decodeImage(maskUrl).then((image) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Canvas 2D rendering is unavailable in this browser.");
    // Token Stamp centers the native 500px mask behind the native 256px frame.
    ctx.drawImage(image, 122, 122, 256, 256, 0, 0, 256, 256);
    const pixels = ctx.getImageData(0, 0, 256, 256);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const alpha = pixels.data[i] ?? 0;
      pixels.data[i] = 255;
      pixels.data[i + 1] = 255;
      pixels.data[i + 2] = 255;
      pixels.data[i + 3] = alpha;
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  });
  return mask;
}

export function loadBorder(id: BorderId): Promise<BorderAssets | null> {
  if (id === "none") return noBorder;
  const cached = borders.get(id);
  if (cached) return cached;
  const url = frameUrls[id];
  const pending = url
    ? Promise.all([decodeImage(url), loadMask()]).then(([image, mask]) => ({
        image,
        mask,
      }))
    : id.startsWith("custom:")
      ? loadCustomBorder(id)
      : Promise.reject<BorderAssets>(new Error(`Unknown token border: ${id}`));
  borders.set(id, pending);
  return pending;
}
