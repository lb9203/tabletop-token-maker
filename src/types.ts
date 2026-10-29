export type Shape = "circle" | "square";
export type ExportFormat = "png" | "jpg" | "webp";
export type DownloadMode = "zip" | "files";
export type Theme = "light" | "dark";
export type Resolution = 128 | 256 | 512 | 1024 | 2048;
export type BorderId =
  | "none"
  | "classic-5e-medium"
  | "classic-5e-medium-grayscale"
  | `custom:${string}`;

export interface ImageDimensions {
  width: number;
  height: number;
}

/** A position measured in original-image pixels. */
export interface ImagePoint {
  x: number;
  y: number;
}

export interface ImageSource extends ImageDimensions {
  image: HTMLImageElement;
  url: string;
  name: string;
}

/** Crop coordinates and size are always measured in original-image pixels. */
export interface Token {
  id: number;
  shape: Shape;
  border: BorderId;
  x: number;
  y: number;
  size: number;
}

export type TokenChanges = Partial<
  Pick<Token, "x" | "y" | "size" | "shape" | "border">
>;
