import type { JSX } from "preact";
import type { ImageSource, Token, TokenChanges } from "../types";
import { useRef } from "preact/hooks";
import { moveToken, resizeToken } from "../tokenGeometry";

const arrowDirections: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

interface CropOverlayProps {
  source: ImageSource;
  token: Token;
  selected: boolean;
  onSelect: (token: Token) => void;
  onUpdate: (id: number, changes: TokenChanges) => void;
}

interface Gesture {
  mode: "move" | "resize";
  startX: number;
  startY: number;
  token: Token;
  scale: number;
}

/** Owns one crop's pointer/keyboard interaction; token data stays with its parent. */
export function CropOverlay({
  source,
  token,
  selected,
  onSelect,
  onUpdate,
}: CropOverlayProps) {
  const overlay = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);

  function begin(
    event: JSX.TargetedPointerEvent<HTMLElement>,
    mode: Gesture["mode"],
  ) {
    const parent = overlay.current?.parentElement;
    if (event.button !== 0 || !parent) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(token);
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      token,
      scale: source.width / parent.getBoundingClientRect().width,
    };
  }

  function move(event: JSX.TargetedPointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start) return;
    // Convert display movement to source pixels, measured from the gesture start.
    const dx = (event.clientX - start.startX) * start.scale;
    const dy = (event.clientY - start.startY) * start.scale;
    const changes =
      start.mode === "move"
        ? moveToken(start.token, dx, dy, source)
        : resizeToken(
            start.token,
            // A circle's 45° handle moves by radius / √2 on each axis.
            start.token.size +
              (dx + dy) * (start.token.shape === "circle" ? Math.SQRT2 : 1),
            source,
          );
    onUpdate(token.id, changes);
  }

  function end() {
    gesture.current = null;
  }

  function nudge(event: JSX.TargetedKeyboardEvent<HTMLDivElement>) {
    const direction = arrowDirections[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    onUpdate(
      token.id,
      moveToken(token, direction[0] * step, direction[1] * step, source),
    );
  }

  return (
    <div
      ref={overlay}
      class={`cutout ${token.shape} ${selected ? "selected" : ""}`}
      style={{
        left: `${(token.x / source.width) * 100}%`,
        top: `${(token.y / source.height) * 100}%`,
        width: `${(token.size / source.width) * 100}%`,
        height: `${(token.size / source.height) * 100}%`,
      }}
      role="button"
      tabIndex={0}
      aria-label={`Move token ${token.id}. Use arrow keys to position.`}
      onFocus={() => onSelect(token)}
      onKeyDown={nudge}
      onPointerDown={(event) => begin(event, "move")}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <span class="token-number">{token.id}</span>
      <span class="crosshair">+</span>
      <button
        class="resize-handle"
        aria-label={`Resize token ${token.id} by dragging; or use the size slider`}
        onPointerDown={(event) => begin(event, "resize")}
        onDblClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
