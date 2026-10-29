import { useLayoutEffect, useRef, useState } from "preact/hooks";
import type { BorderOption } from "../borders";
import { Preview } from "../Preview";
import type { BorderId, ImageSource, Token } from "../types";

interface BorderPickerProps {
  source: ImageSource;
  token: Token;
  options: readonly BorderOption[];
  onUpload: (file: File) => Promise<BorderId>;
  libraryError: string;
  onSelect: (border: BorderId) => void;
  onClose: () => void;
}

export function BorderPicker({
  source,
  token,
  options,
  onUpload,
  libraryError,
  onSelect,
  onClose,
}: BorderPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const uploadInFlight = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const matchingOptions = options.filter((option) =>
    option.shapes.includes(token.shape),
  );
  const error = uploadError || libraryError;

  function close(): void {
    if (!mounted.current) return;
    mounted.current = false;
    onClose();
  }

  async function upload(file: File): Promise<void> {
    if (!mounted.current || uploadInFlight.current) return;
    uploadInFlight.current = true;
    setUploading(true);
    setUploadError("");
    try {
      const id = await onUpload(file);
      if (!mounted.current) return;
      onSelect(id);
      close();
    } catch (cause: unknown) {
      if (mounted.current) {
        setUploadError(
          cause instanceof Error && cause.message
            ? cause.message
            : "Could not add this border. Choose a transparent border image with an enclosed opening, then try again.",
        );
      }
    } finally {
      uploadInFlight.current = false;
      if (mounted.current) setUploading(false);
    }
  }

  useLayoutEffect(() => {
    mounted.current = true;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      mounted.current = false;
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      class="border-picker"
      aria-labelledby="border-picker-title"
      onClose={close}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          close();
        }
      }}
    >
      <div class="border-picker-header">
        <h2 id="border-picker-title">Choose a border</h2>
        <button
          class="button subtle"
          type="button"
          aria-label="Close border picker"
          onClick={close}
        >
          Close
        </button>
      </div>
      <div class="border-picker-upload">
        <button
          class="button subtle"
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Saving border…" : "Upload border"}
        </button>
        <span>Saved in this browser</span>
        <input
          ref={fileInputRef}
          id="custom-border-file"
          aria-label="Upload custom border"
          type="file"
          accept="image/png,image/webp"
          hidden
          disabled={uploading}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void upload(file);
          }}
        />
      </div>
      <p class="border-picker-hint">
        Choose a transparent border image with an enclosed opening that matches
        your {token.shape} cutout.
      </p>
      {error && (
        <p class="border-picker-error" role="alert">
          {error}
        </p>
      )}
      <p class="border-picker-count" role="status" aria-live="polite">
        {matchingOptions.length} borders
      </p>
      <div class="border-picker-options">
        {matchingOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            class="border-picker-option"
            aria-pressed={token.border === option.id}
            disabled={uploading}
            onClick={() => {
              onSelect(option.id);
              close();
            }}
          >
            <Preview
              image={source.image}
              token={{ ...token, border: option.id }}
              resolution={192}
            />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      {matchingOptions.length === 0 && (
        <p class="border-picker-empty">
          No borders are available for this cutout shape.
        </p>
      )}
      <p class="border-picker-attribution">
        Built-in border artwork by{" "}
        <a
          href="https://rolladvantage.com/tokenstamp/"
          target="_blank"
          rel="noreferrer"
        >
          RollAdvantage
        </a>
        {" · "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 4.0
        </a>
      </p>
    </dialog>
  );
}
