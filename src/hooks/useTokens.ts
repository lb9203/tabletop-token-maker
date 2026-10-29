import { useRef, useState } from "preact/hooks";
import { clamp, resizeToken } from "../tokenGeometry";
import type { BorderId } from "../types";
import type {
  ImageDimensions,
  ImagePoint,
  ImageSource,
  Shape,
  Token,
  TokenChanges,
} from "../types";

type BorderPreferences = Record<Shape, BorderId>;

interface TokenState {
  tokens: Token[];
  selectedId: number | null;
  shape: Shape;
  preferredBorders: BorderPreferences;
}

interface TokenControls extends Omit<TokenState, "preferredBorders"> {
  currentToken: Token | undefined;
  reset: (source: ImageDimensions) => void;
  select: (token: Token) => void;
  setShape: (shape: Shape) => void;
  add: (center?: ImagePoint) => void;
  update: (id: number, changes: TokenChanges) => void;
  remove: (id: number) => void;
  resize: (size: number) => void;
}

const borderPreferenceKey = "tabletop-token-maker.border-preferences";

function savedBorderPreferences(): BorderPreferences {
  const preferences: BorderPreferences = { circle: "none", square: "none" };
  try {
    const stored = JSON.parse(
      localStorage.getItem(borderPreferenceKey) ?? "{}",
    ) as Record<string, unknown>;
    for (const shape of ["circle", "square"] as const) {
      const border = stored[shape];
      if (
        border === "none" ||
        border === "classic-5e-medium" ||
        border === "classic-5e-medium-grayscale" ||
        (typeof border === "string" && border.startsWith("custom:"))
      ) {
        preferences[shape] = border as BorderId;
      }
    }
  } catch {
    // Keep defaults if browser storage is unavailable or malformed.
  }
  return preferences;
}

function storeBorderPreferences(preferences: BorderPreferences): void {
  try {
    localStorage.setItem(borderPreferenceKey, JSON.stringify(preferences));
  } catch {
    // Border selection still works for the current session.
  }
}

function centeredToken(
  source: ImageDimensions,
  id: number,
  shape: Shape,
  ratio: number,
  center: ImagePoint | undefined,
  border: BorderId,
): Token {
  const size = Math.min(source.width, source.height) * ratio;
  return {
    id,
    shape,
    border,
    size,
    x: clamp(
      (center?.x ?? source.width / 2) - size / 2,
      0,
      source.width - size,
    ),
    y: clamp(
      (center?.y ?? source.height / 2) - size / 2,
      0,
      source.height - size,
    ),
  };
}

export function useTokens(source: ImageSource | null): TokenControls {
  const [state, setState] = useState<TokenState>(() => ({
    tokens: [],
    selectedId: null,
    shape: "circle",
    preferredBorders: savedBorderPreferences(),
  }));
  // IDs remain unique for the hook's lifetime, including across image resets.
  const nextId = useRef<number>(1);
  const { tokens, selectedId, shape } = state;
  const currentToken = tokens.find((token) => token.id === selectedId);

  function reset(nextSource: ImageDimensions): void {
    const id = nextId.current++;
    setState((previous) => ({
      ...previous,
      tokens: [
        centeredToken(
          nextSource,
          id,
          previous.shape,
          0.5,
          undefined,
          previous.preferredBorders[previous.shape],
        ),
      ],
      selectedId: id,
    }));
  }

  function select(token: Token): void {
    setState((previous) => ({
      ...previous,
      selectedId: token.id,
      shape: token.shape,
    }));
  }

  function setShape(nextShape: Shape): void {
    setState((previous) => ({
      ...previous,
      shape: nextShape,
      tokens: previous.tokens.map((token) =>
        token.id === previous.selectedId
          ? {
              ...token,
              shape: nextShape,
              border: nextShape === token.shape ? token.border : "none",
            }
          : token,
      ),
    }));
  }

  function add(center?: ImagePoint): void {
    if (!source) return;
    const id = nextId.current++;
    setState((previous) => ({
      ...previous,
      tokens: [
        ...previous.tokens,
        centeredToken(
          source,
          id,
          previous.shape,
          0.4,
          center,
          previous.preferredBorders[previous.shape],
        ),
      ],
      selectedId: id,
    }));
  }

  function update(id: number, changes: TokenChanges): void {
    const changedToken = tokens.find((token) => token.id === id);
    if (changes.border !== undefined && changedToken) {
      const preferredBorders = {
        ...state.preferredBorders,
        [changedToken.shape]: changes.border,
      };
      storeBorderPreferences(preferredBorders);
      setState((previous) => ({
        ...previous,
        preferredBorders,
        tokens: previous.tokens.map((token) =>
          token.id === id ? { ...token, ...changes } : token,
        ),
      }));
      return;
    }
    setState((previous) => ({
      ...previous,
      tokens: previous.tokens.map((token) =>
        token.id === id ? { ...token, ...changes } : token,
      ),
    }));
  }

  function remove(id: number): void {
    setState((previous) => {
      const remaining = previous.tokens.filter((token) => token.id !== id);
      if (previous.selectedId !== id) return { ...previous, tokens: remaining };
      const next = remaining.at(-1);
      return {
        ...previous,
        tokens: remaining,
        selectedId: next?.id ?? null,
        shape: next?.shape ?? previous.shape,
      };
    });
  }

  function resize(size: number): void {
    if (!source) return;
    setState((previous) => {
      const current = previous.tokens.find(
        (token) => token.id === previous.selectedId,
      );
      if (!current) return previous;
      const resized: Token = {
        ...current,
        ...resizeToken(current, size, source),
      };
      return {
        ...previous,
        tokens: previous.tokens.map((token) =>
          token.id === current.id ? resized : token,
        ),
      };
    });
  }

  return {
    tokens,
    selectedId,
    currentToken,
    shape,
    reset,
    select,
    setShape,
    add,
    update,
    remove,
    resize,
  };
}
