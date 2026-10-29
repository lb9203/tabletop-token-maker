import type { ImageSource, Resolution, Token } from "../types";
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { Icon } from "../Icon";
import { Preview } from "../Preview";

interface TokenCardProps {
  source: ImageSource;
  token: Token;
  selectedId: number | null;
  resolution: Resolution;
  busy: boolean;
  onSelect: (token: Token) => void;
  onRemove: (id: number) => void;
  onDownload: (token: Token) => void;
}

interface TokenGalleryProps extends Omit<TokenCardProps, "source" | "token"> {
  source: ImageSource | null;
  tokens: Token[];
}

interface NavigationState {
  selectedId: number | null;
  capacity: number;
  source: ImageSource | null;
  count: number;
}

export function TokenCard({
  source,
  token,
  selectedId,
  resolution,
  busy,
  onSelect,
  onRemove,
  onDownload,
}: TokenCardProps) {
  return (
    <article class={`token-card ${selectedId === token.id ? "active" : ""}`}>
      <button
        class="token-select"
        type="button"
        aria-pressed={selectedId === token.id}
        aria-label={`Select token ${token.id}`}
        onClick={() => onSelect(token)}
      >
        <Preview image={source.image} token={token} />
        <span class="token-meta">
          <strong>Token {String(token.id).padStart(2, "0")}</strong>
          <small>
            {token.shape} · {resolution} px
          </small>
        </span>
      </button>
      <div class="token-actions">
        <button
          type="button"
          title="Download token"
          aria-label={`Download token ${token.id}`}
          disabled={busy}
          onClick={() => onDownload(token)}
        >
          <Icon name="download" />
        </button>
        <button
          type="button"
          title="Remove token"
          aria-label={`Remove token ${token.id}`}
          onClick={() => onRemove(token.id)}
        >
          <Icon name="close" />
        </button>
      </div>
    </article>
  );
}

export function TokenGallery({
  source,
  tokens,
  selectedId,
  resolution,
  busy,
  onSelect,
  onRemove,
  onDownload,
}: TokenGalleryProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const previousNavigation = useRef<NavigationState | null>(null);
  const [capacity, setCapacity] = useState(1);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(tokens.length / capacity));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * capacity;
  const end = Math.min(start + capacity, tokens.length);

  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const updateCapacity = (width: number) => {
      const minimumCardWidth = window.matchMedia(
        "(min-width: 900px) and (min-height: 600px)",
      ).matches
        ? 280
        : 200;
      setCapacity(Math.max(1, Math.floor(width / minimumCardWidth)));
    };
    updateCapacity(strip.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      updateCapacity(entry.contentRect.width);
    });
    observer.observe(strip);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const previous = previousNavigation.current;
    const followSelection =
      !previous ||
      previous.selectedId !== selectedId ||
      previous.capacity !== capacity ||
      previous.source !== source ||
      tokens.length > previous.count;
    previousNavigation.current = {
      selectedId,
      capacity,
      source,
      count: tokens.length,
    };

    // Manual paging stays put until selection, additions, or layout changes.
    if (followSelection) {
      const index = tokens.findIndex((token) => token.id === selectedId);
      setPage(index < 0 ? 0 : Math.floor(index / capacity));
    } else {
      setPage((current) => Math.min(current, pageCount - 1));
    }
  }, [selectedId, capacity, source, tokens.length]);

  return (
    <section class="token-gallery panel">
      <div class="gallery-header">
        <h2>Tokens</h2>
        <div class="gallery-pagination">
          <span aria-live="polite">
            {tokens.length
              ? `${start + 1}–${end} of ${tokens.length}`
              : "0 tokens"}
          </span>
          <button
            type="button"
            class="button"
            aria-label="Previous tokens"
            disabled={currentPage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            class="button"
            aria-label="Next tokens"
            disabled={currentPage >= pageCount - 1}
            onClick={() =>
              setPage((current) => Math.min(pageCount - 1, current + 1))
            }
          >
            Next
          </button>
        </div>
      </div>
      <div
        ref={stripRef}
        class="token-strip"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${capacity}, minmax(0, 1fr))`,
          minWidth: 0,
        }}
      >
        {source && tokens.length ? (
          tokens
            .slice(start, end)
            .map((token) => (
              <TokenCard
                key={token.id}
                source={source}
                token={token}
                selectedId={selectedId}
                resolution={resolution}
                busy={busy}
                onSelect={onSelect}
                onRemove={onRemove}
                onDownload={onDownload}
              />
            ))
        ) : (
          <span class="empty-party">No tokens</span>
        )}
      </div>
    </section>
  );
}
