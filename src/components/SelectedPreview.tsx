import { useState } from "preact/hooks";
import { useCustomBorders } from "../hooks/useCustomBorders";
import type { BorderId, ImageSource, Token } from "../types";
import { Preview } from "../Preview";
import { BorderPicker } from "./BorderPicker";

interface SelectedPreviewProps {
  source: ImageSource | null;
  token: Token | undefined;
  onBorderChange: (border: BorderId) => void;
}

export function SelectedPreview({
  source,
  token,
  onBorderChange,
}: SelectedPreviewProps) {
  const [borderPickerOpen, setBorderPickerOpen] = useState(false);
  const library = useCustomBorders();
  return (
    <section class="selected-preview" aria-label="Selected cutout preview">
      <div class="selected-preview-header">
        <h2>
          Preview
          <span class="text-[11px] font-normal text-muted">
            {token ? `Token ${token.id}` : ""}
          </span>
        </h2>
        <button
          class="button subtle"
          type="button"
          disabled={!source || !token || library.loading}
          title={
            library.loading
              ? "Loading saved borders"
              : "Choose a built-in border or upload your own"
          }
          aria-haspopup="dialog"
          aria-expanded={borderPickerOpen}
          aria-describedby="border-compatibility"
          onClick={() => setBorderPickerOpen(true)}
        >
          Border
        </button>
      </div>
      <span id="border-compatibility" class="sr-only">
        Built-in borders fit circle cutouts. Upload a border that matches your
        selected cutout shape.
      </span>
      <div class="selected-preview-image">
        {source && token ? (
          <Preview image={source.image} token={token} resolution={384} />
        ) : (
          <span class="text-center text-[11px] text-muted">No cutout</span>
        )}
      </div>
      {borderPickerOpen && source && token && (
        <BorderPicker
          source={source}
          token={token}
          options={library.options}
          libraryError={library.error}
          onUpload={(file) => library.add(file, token.shape)}
          onSelect={onBorderChange}
          onClose={() => setBorderPickerOpen(false)}
        />
      )}
    </section>
  );
}
