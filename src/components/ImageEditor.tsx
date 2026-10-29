import type { JSX } from "preact";
import type { ImagePoint, ImageSource, Token, TokenChanges } from "../types";
import { useEffect, useRef, useState } from "preact/hooks";
import { Icon } from "../Icon";
import { CropOverlay } from "./CropOverlay";
import { ThemeToggle } from "./ThemeToggle";

function UploadPrompt({ onBrowse }: { onBrowse: () => void }) {
  return (
    <button class="upload-zone" onClick={onBrowse}>
      <Icon name="upload" width="28" height="28" />
      <strong>Drop an image or browse files</strong>
      <span>PNG, JPEG, WebP</span>
    </button>
  );
}

interface ImageEditorProps {
  source: ImageSource | null;
  tokens: Token[];
  selectedId: number | null;
  onUpload: (file: File | undefined) => void;
  onSelect: (token: Token) => void;
  onUpdate: (id: number, changes: TokenChanges) => void;
  onAddAt: (center: ImagePoint) => void;
}

/** Handles file selection and artwork presentation, not decoding or token state. */
export function ImageEditor({
  source,
  tokens,
  selectedId,
  onUpload,
  onSelect,
  onUpdate,
  onAddAt,
}: ImageEditorProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const imageArea = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imageArea.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setArea({ width, height });
    });
    observer.observe(imageArea.current);
    return () => observer.disconnect();
  }, []);

  const imageWidth = source
    ? Math.min(area.width, (area.height * source.width) / source.height)
    : 0;

  function browse() {
    input.current?.click();
  }

  function drop(event: JSX.TargetedDragEvent<HTMLElement>) {
    event.preventDefault();
    setDragOver(false);
    onUpload(event.dataTransfer?.files[0]);
  }

  function addAtPointer(event: JSX.TargetedMouseEvent<HTMLDivElement>) {
    if (!source) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    onAddAt({
      x: ((event.clientX - bounds.left) * source.width) / bounds.width,
      y: ((event.clientY - bounds.top) * source.height) / bounds.height,
    });
  }

  return (
    <section
      class="editor panel"
      aria-label="Image editor"
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        )
          setDragOver(false);
      }}
      onDrop={drop}
    >
      <input
        ref={input}
        type="file"
        accept="image/*"
        class="sr-only"
        aria-label="Upload artwork"
        onChange={(event) => {
          onUpload(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <div class="panel-header">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <h2 class="min-w-0">
            <span class="truncate">Tabletop Token Maker</span>
          </h2>
          <div class="flex shrink-0 items-center gap-1">
            <a
              class="button subtle no-underline text-ink"
              href="https://github.com/lb9203/tabletop-token-maker"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
              title="GitHub repository"
            >
              <svg
                class="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .297a12 12 0 0 0-3.797 23.382c.6.111.82-.261.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.304-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.004-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.91 1.235 3.221 0 4.608-2.807 5.624-5.479 5.921.43.372.814 1.102.814 2.222v3.293c0 .319.216.694.825.576A12.001 12.001 0 0 0 12 .297" />
              </svg>
            </a>
            <ThemeToggle />
          </div>
        </div>
        <button
          class="button subtle shrink-0"
          aria-label={source ? "Replace image" : "Upload image"}
          onClick={browse}
        >
          <Icon name="upload" />
          <span class="image-upload-label">
            {source ? "Replace image" : "Upload image"}
          </span>
        </button>
      </div>
      <div
        ref={imageArea}
        class={`image-area ${dragOver ? "dragover" : ""} ${source ? "loaded" : ""}`}
      >
        {source ? (
          <div
            key={source.url}
            class="image-stage"
            onDblClick={addAtPointer}
            style={{
              width: `${imageWidth}px`,
              height: `${(imageWidth * source.height) / source.width}px`,
            }}
          >
            <img src={source.url} alt="Uploaded artwork" draggable={false} />
            {tokens.map((token) => (
              <CropOverlay
                key={token.id}
                source={source}
                token={token}
                selected={selectedId === token.id}
                onSelect={onSelect}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        ) : (
          <UploadPrompt onBrowse={browse} />
        )}
        {dragOver && <div class="drop-overlay">Drop to open artwork</div>}
      </div>
      <div class="editor-footer">
        <span>
          {source
            ? `${source.width} × ${source.height} px · ${tokens.length} cutout${tokens.length === 1 ? "" : "s"}`
            : "No image"}
        </span>
        <span>
          {source
            ? "Double-click to add · Drag to move · Corner to resize"
            : "Images stay on your device"}
        </span>
      </div>
    </section>
  );
}
