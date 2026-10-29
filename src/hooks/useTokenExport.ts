import { useEffect, useRef, useState } from "preact/hooks";
import { tokenCanvas, save } from "../export";
import { loadBorder } from "../borders";
import type {
  DownloadMode,
  ExportFormat,
  ImageSource,
  Resolution,
  Token,
} from "../types";

const formats: Record<ExportFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

interface TokenExportOptions {
  source: ImageSource | null;
  tokens: Token[];
  format: ExportFormat;
  resolution: Resolution;
}

interface TokenExportControls {
  busy: boolean;
  error: string;
  clearError: () => void;
  downloadToken: (token: Token | undefined) => Promise<void>;
  downloadAll: (mode: DownloadMode) => Promise<void>;
}

export function useTokenExport({
  source,
  tokens,
  format,
  resolution,
}: TokenExportOptions): TokenExportControls {
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const exporting = useRef<boolean>(false);
  const mounted = useRef<boolean>(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function clearError(): void {
    if (mounted.current) setError("");
  }

  async function download(items: Token[], mode: DownloadMode): Promise<void> {
    if (!mounted.current || exporting.current || !source || !items.length)
      return;
    exporting.current = true;
    setBusy(true);
    setError("");
    try {
      const files: Record<string, Uint8Array<ArrayBuffer>> | null =
        mode === "zip" ? {} : null;
      for (const item of items) {
        const border = await loadBorder(item.border);
        const canvas = tokenCanvas(
          source.image,
          item,
          resolution,
          format === "jpg" ? "#ffffff" : null,
          border,
        );
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, formats[format], 0.94),
        );
        if (!blob || blob.type !== formats[format]) {
          throw new Error(
            `Your browser does not support ${format.toUpperCase()} export. Please choose PNG or JPEG.`,
          );
        }
        const name = `${source.name}-token-${item.id}.${format}`;
        if (!files) save(blob, name);
        else files[name] = new Uint8Array(await blob.arrayBuffer());
      }
      if (files) {
        const { zipSync } = await import("fflate");
        const archive = zipSync(files, { level: 0 });
        // Blob requires ArrayBuffer-backed bytes, not a possible SharedArrayBuffer.
        const bytes =
          archive.buffer instanceof ArrayBuffer
            ? new Uint8Array(
                archive.buffer,
                archive.byteOffset,
                archive.byteLength,
              )
            : new Uint8Array(archive);
        save(
          new Blob([bytes], { type: "application/zip" }),
          `${source.name}-tokens.zip`,
        );
      }
    } catch (cause: unknown) {
      if (mounted.current)
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : "Download failed. Please try again.",
        );
    } finally {
      exporting.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function downloadToken(token: Token | undefined): Promise<void> {
    return token ? download([token], "files") : Promise.resolve();
  }

  function downloadAll(mode: DownloadMode): Promise<void> {
    return download(tokens, mode);
  }

  return { busy, error, clearError, downloadToken, downloadAll };
}
