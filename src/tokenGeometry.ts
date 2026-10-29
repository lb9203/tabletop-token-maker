import type { ImageDimensions, Token } from "./types";

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

// Token coordinates and deltas are original-image pixels, not preview pixels.
export function moveToken(
  token: Token,
  dx: number,
  dy: number,
  source: ImageDimensions,
): Pick<Token, "x" | "y"> {
  return {
    x: clamp(token.x + dx, 0, source.width - token.size),
    y: clamp(token.y + dy, 0, source.height - token.size),
  };
}

// The nearest image edge limits growth without moving the crop's center.
export function maxTokenSize(token: Token, source: ImageDimensions): number {
  const centerX = token.x + token.size / 2;
  const centerY = token.y + token.size / 2;
  return (
    2 *
    Math.min(centerX, centerY, source.width - centerX, source.height - centerY)
  );
}

export function resizeToken(
  token: Token,
  requestedSize: number,
  source: ImageDimensions,
): Pick<Token, "x" | "y" | "size"> {
  const maximum = maxTokenSize(token, source);
  const size = clamp(requestedSize, Math.min(8, maximum), maximum);
  const offset = (token.size - size) / 2;
  return { x: token.x + offset, y: token.y + offset, size };
}
