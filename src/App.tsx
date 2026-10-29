import { useState } from "preact/hooks";
import { useImageSource } from "./hooks/useImageSource";
import { useTokens } from "./hooks/useTokens";
import { useTokenExport } from "./hooks/useTokenExport";
import { useDeleteShortcut } from "./hooks/useDeleteShortcut";
import { PageLayout } from "./components/PageLayout";
import { ErrorNotice } from "./components/ErrorNotice";
import { ImageEditor } from "./components/ImageEditor";
import { TokenSettings } from "./components/TokenSettings";
import { ExportSettings } from "./components/ExportSettings";
import { TokenGallery } from "./components/TokenGallery";
import type {
  BorderId,
  DownloadMode,
  ExportFormat,
  Resolution,
  Token,
} from "./types";

/** Connects independent UI components to the state each workflow owns. */
export function App() {
  const artwork = useImageSource();
  const cutouts = useTokens(artwork.source);
  useDeleteShortcut(cutouts.selectedId, cutouts.remove);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [resolution, setResolution] = useState<Resolution>(512);
  const exporter = useTokenExport({
    source: artwork.source,
    tokens: cutouts.tokens,
    format,
    resolution,
  });

  function clearErrors() {
    artwork.clearError();
    exporter.clearError();
  }

  async function upload(file: File | undefined): Promise<void> {
    if (!file) return;
    clearErrors();
    const source = await artwork.load(file);
    if (source) cutouts.reset(source);
  }

  function downloadToken(token: Token): Promise<void> {
    clearErrors();
    return exporter.downloadToken(token);
  }

  function downloadAll(mode: DownloadMode): Promise<void> {
    clearErrors();
    return exporter.downloadAll(mode);
  }

  function changeBorder(border: BorderId): void {
    const token = cutouts.currentToken;
    if (token) {
      cutouts.update(token.id, { border });
    }
  }

  return (
    <PageLayout>
      <ErrorNotice
        message={artwork.error || exporter.error}
        onDismiss={clearErrors}
      />
      <div class="workspace">
        <ImageEditor
          source={artwork.source}
          tokens={cutouts.tokens}
          selectedId={cutouts.selectedId}
          onUpload={upload}
          onSelect={cutouts.select}
          onUpdate={cutouts.update}
          onAddAt={cutouts.add}
        />
        <TokenSettings
          source={artwork.source}
          currentToken={cutouts.currentToken}
          shape={cutouts.shape}
          onShapeChange={cutouts.setShape}
          onAdd={cutouts.add}
          onResize={cutouts.resize}
          onBorderChange={changeBorder}
        >
          <ExportSettings
            format={format}
            resolution={resolution}
            tokenCount={cutouts.tokens.length}
            busy={exporter.busy}
            onFormatChange={setFormat}
            onResolutionChange={setResolution}
            onDownloadAll={downloadAll}
          />
        </TokenSettings>
      </div>
      <TokenGallery
        source={artwork.source}
        tokens={cutouts.tokens}
        selectedId={cutouts.selectedId}
        resolution={resolution}
        busy={exporter.busy}
        onSelect={cutouts.select}
        onRemove={cutouts.remove}
        onDownload={downloadToken}
      />
    </PageLayout>
  );
}
