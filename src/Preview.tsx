import type { Token } from "./types";
import { useEffect, useRef, useState } from "preact/hooks";
import { loadBorder } from "./borders";
import { tokenCanvas } from "./export";
export { Preview };
interface PreviewProps {
  image: HTMLImageElement;
  token: Token;
  resolution?: number;
}

function Preview({ image, token, resolution = 160 }: PreviewProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    let active = true;
    setError("");
    async function render(target: HTMLCanvasElement): Promise<void> {
      try {
        const ctx = target.getContext("2d");
        if (!ctx)
          throw new Error(
            "Canvas 2D rendering is unavailable in this browser.",
          );
        ctx.clearRect(0, 0, resolution, resolution);
        const border = await loadBorder(token.border);
        if (!active) return;
        const canvas = tokenCanvas(image, token, resolution, null, border);
        ctx.drawImage(canvas, 0, 0);
      } catch (cause: unknown) {
        if (active)
          setError(
            cause instanceof Error && cause.message
              ? cause.message
              : "The token preview could not be rendered.",
          );
      }
    }
    void render(target);
    return () => {
      active = false;
    };
  }, [image, token, resolution]);
  return (
    <>
      <canvas
        class={`preview${token.border !== "none" ? " border-0 bg-transparent" : ` checker ${token.shape}`}`}
        width={resolution}
        height={resolution}
        ref={ref}
        aria-label={`Preview of token ${token.id}`}
      />
      {error && (
        <small class="preview-error" role="alert">
          {error}
        </small>
      )}
    </>
  );
}
