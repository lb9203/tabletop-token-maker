import assert from "node:assert/strict";
import { test } from "node:test";
import { frameOpeningMask } from "./frameMask.ts";

function pixels(
  width: number,
  height: number,
  alphaAt: (x: number, y: number) => number,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      result[offset] = 200;
      result[offset + 1] = 150;
      result[offset + 2] = 90;
      result[offset + 3] = alphaAt(x, y);
    }
  }
  return result;
}

function alpha(
  mask: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
): number | undefined {
  return mask[(y * width + x) * 4 + 3];
}

test("polygon opening is filled without filling clipped corners or exterior", () => {
  const inside = (x: number, y: number, inset: number) => {
    const dx = Math.abs(x - 23.5);
    const dy = Math.abs(y - 23.5);
    return dx <= 20 - inset && dy <= 20 - inset && dx + dy <= 32 - inset * 2;
  };
  const frame = pixels(48, 48, (x, y) =>
    inside(x, y, 0) && !inside(x, y, 4) ? 255 : 0,
  );
  const original = frame.slice();
  const mask = frameOpeningMask(48, 48, frame);
  assert.equal(alpha(mask, 48, 24, 24), 255);
  assert.equal(alpha(mask, 48, 7, 7), 0);
  assert.equal(alpha(mask, 48, 0, 24), 0);
  assert.equal(alpha(mask, 48, 47, 47), 0);
  assert.deepEqual(
    frame,
    original,
    "the original frame pixels must not be modified",
  );
});

test("largest enclosed opening wins over smaller holes in decorations", () => {
  const frame = pixels(40, 40, (x, y) => {
    if (x < 2 || x > 37 || y < 2 || y > 37) return 0;
    if (x >= 5 && x <= 22 && y >= 5 && y <= 34) return 0;
    if (x >= 28 && x <= 32 && y >= 17 && y <= 21) return 0;
    return 255;
  });
  const mask = frameOpeningMask(40, 40, frame);
  assert.equal(alpha(mask, 40, 12, 20), 255);
  assert.equal(alpha(mask, 40, 30, 19), 0);
  assert.equal(alpha(mask, 40, 0, 20), 0);
});

test("an opening connected to the exterior is not treated as enclosed", () => {
  const frame = pixels(32, 32, (x, y) => {
    if (x === 16 && y <= 16) return 0;
    return x >= 3 &&
      x <= 28 &&
      y >= 3 &&
      y <= 28 &&
      !(x >= 6 && x <= 25 && y >= 6 && y <= 25)
      ? 255
      : 0;
  });
  assert.throws(() => frameOpeningMask(32, 32, frame), Error);
});

test("fully opaque and fully transparent images cannot silently become masks", () => {
  for (const opacity of [0, 255]) {
    assert.throws(
      () =>
        frameOpeningMask(
          8,
          8,
          pixels(8, 8, () => opacity),
        ),
      Error,
    );
  }
});
