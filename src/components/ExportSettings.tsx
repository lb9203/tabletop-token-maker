import type { DownloadMode, ExportFormat, Resolution } from "../types";
import { Icon } from "../Icon";

interface ExportSettingsProps {
  format: ExportFormat;
  resolution: Resolution;
  tokenCount: number;
  busy: boolean;
  onFormatChange: (format: ExportFormat) => void;
  onResolutionChange: (resolution: Resolution) => void;
  onDownloadAll: (mode: DownloadMode) => void;
}

const resolutions = [128, 256, 512, 1024, 2048] as const;

export function ExportSettings({
  format,
  resolution,
  tokenCount,
  busy,
  onFormatChange,
  onResolutionChange,
  onDownloadAll,
}: ExportSettingsProps) {
  return (
    <div class="export-settings">
      <h2>Export</h2>
      <div class="export-fields">
        <div>
          <label class="field-title" for="format">
            Format
          </label>
          <select
            id="format"
            value={format}
            onChange={(event) =>
              onFormatChange(event.currentTarget.value as ExportFormat)
            }
          >
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="jpg">JPEG · white background</option>
          </select>
        </div>
        <div>
          <label class="field-title" for="resolution">
            Size (px)
          </label>
          <select
            id="resolution"
            value={resolution}
            onChange={(event) =>
              onResolutionChange(
                Number(event.currentTarget.value) as Resolution,
              )
            }
          >
            {resolutions.map((outputResolution) => (
              <option key={outputResolution} value={outputResolution}>
                {outputResolution}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <p class="field-title" aria-live="polite">
          {busy ? "Preparing…" : `Download all (${tokenCount})`}
        </p>
        <div
          class="grid grid-cols-2 gap-1"
          role="group"
          aria-label="Download all tokens"
        >
          <button
            class="button primary min-w-0 gap-1 px-1 text-[11px]"
            disabled={!tokenCount || busy}
            onClick={() => onDownloadAll("zip")}
            aria-label="Download ZIP"
            title="Download all tokens in one ZIP archive"
          >
            <Icon name="download" class="size-3.5" /> ZIP
          </button>
          <button
            class="button primary min-w-0 gap-1 px-1 text-[11px]"
            disabled={!tokenCount || busy}
            onClick={() => onDownloadAll("files")}
            aria-label="Download separate files"
            title="Download each token separately. Your browser may ask to allow multiple downloads."
          >
            <Icon name="download" class="size-3.5" /> Files
          </button>
        </div>
      </div>
    </div>
  );
}
