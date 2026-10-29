import type { ComponentChildren } from "preact";
import type { BorderId, ImageSource, Shape, Token } from "../types";
import { Icon } from "../Icon";
import { maxTokenSize } from "../tokenGeometry";
import { SelectedPreview } from "./SelectedPreview";

interface TokenSettingsProps {
  source: ImageSource | null;
  currentToken: Token | undefined;
  shape: Shape;
  onShapeChange: (shape: Shape) => void;
  onBorderChange: (border: BorderId) => void;
  onAdd: () => void;
  onResize: (size: number) => void;
  children: ComponentChildren;
}

export function TokenSettings({
  source,
  currentToken,
  shape,
  onShapeChange,
  onBorderChange,
  onAdd,
  onResize,
  children,
}: TokenSettingsProps) {
  const maximumSize =
    source && currentToken ? maxTokenSize(currentToken, source) : 100;

  return (
    <aside class="controls panel">
      <div class="cutout-settings">
        <h2>Cutouts</h2>
        <div class="segmented">
          {(["circle", "square"] as const).map((cutoutShape) => (
            <button
              key={cutoutShape}
              class={shape === cutoutShape ? "active" : ""}
              aria-pressed={shape === cutoutShape}
              onClick={() => onShapeChange(cutoutShape)}
            >
              <Icon name={cutoutShape} />
              {cutoutShape === "circle" ? "Circle" : "Square"}
            </button>
          ))}
        </div>
        {currentToken && <span class="token-id">Token {currentToken.id}</span>}
        <button class="button add" disabled={!source} onClick={() => onAdd()}>
          <Icon name="plus" /> Add cutout
        </button>
        <div class="size-field">
          <label class="field-title" for="size">
            Cutout size{" "}
            <span>
              {currentToken ? `${Math.round(currentToken.size)} px` : "—"}
            </span>
          </label>
          <input
            id="size"
            type="range"
            min={Math.min(8, maximumSize)}
            max={maximumSize}
            value={currentToken?.size ?? 50}
            disabled={!currentToken}
            onInput={(event) => onResize(Number(event.currentTarget.value))}
          />
        </div>
      </div>
      {children}
      <SelectedPreview
        source={source}
        token={currentToken}
        onBorderChange={onBorderChange}
      />
    </aside>
  );
}
