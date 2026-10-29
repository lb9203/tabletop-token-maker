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
        <h2>
          <Icon name="image" /> Artwork
        </h2>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          <button class="button subtle" onClick={browse}>
            <Icon name="upload" />
            {source ? "Replace image" : "Upload image"}
          </button>
        </div>
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
