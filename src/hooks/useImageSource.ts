import { useEffect, useRef, useState } from "preact/hooks";
import type { ImageSource } from "../types";

interface ImageSourceState {
  source: ImageSource | null;
  error: string;
  clearError: () => void;
  load: (file: File | undefined) => Promise<ImageSource | null>;
}

export function useImageSource(): ImageSourceState {
  const [source, setSource] = useState<ImageSource | null>(null);
  const [error, setError] = useState<string>("");
  const mounted = useRef<boolean>(true);
  const requestId = useRef<number>(0);
  const currentUrl = useRef<string | null>(null);
  const ownedUrls = useRef<Set<string>>(new Set());

  function release(url: string | null | undefined): void {
    if (url != null && ownedUrls.current.delete(url)) URL.revokeObjectURL(url);
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current++;
      for (const url of ownedUrls.current) URL.revokeObjectURL(url);
      ownedUrls.current.clear();
      currentUrl.current = null;
    };
  }, []);

  function clearError(): void {
    if (mounted.current) setError("");
  }

  async function load(file: File | undefined): Promise<ImageSource | null> {
    if (!file || !mounted.current) return null;
    const request = ++requestId.current;
    setError("");
    let url: string | undefined;
    try {
      url = URL.createObjectURL(file);
      ownedUrls.current.add(url);
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!mounted.current || request !== requestId.current) {
        release(url);
        return null;
      }
      const nextSource: ImageSource = {
        image,
        url,
        name: file.name.replace(/\.[^.]+$/, ""),
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      const previousUrl = currentUrl.current;
      currentUrl.current = url;
      setSource(nextSource);
      release(previousUrl);
      return nextSource;
    } catch {
      release(url);
      if (mounted.current && request === requestId.current) {
        setError(
          "This image could not be opened. Try a PNG, JPEG, WebP, or another browser-supported image.",
        );
      }
      return null;
    }
  }

  // Failed or superseded loads never replace the last successfully decoded image.
  return { source, error, clearError, load };
}
