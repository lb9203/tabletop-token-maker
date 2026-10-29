import { useEffect, useRef, useState } from "preact/hooks";
import {
  addCustomBorder,
  borderOptions,
  restoreCustomBorders,
  type BorderOption,
} from "../borders";
import type { BorderId, Shape } from "../types";

interface CustomBorderLibrary {
  options: readonly BorderOption[];
  error: string;
  loading: boolean;
  add: (file: File, shape: Shape) => Promise<BorderId>;
}

function mergeOptions(
  current: readonly BorderOption[],
  additions: readonly BorderOption[],
): BorderOption[] {
  const options = new Map(current.map((option) => [option.id, option]));
  for (const option of additions) options.set(option.id, option);
  return [...options.values()];
}

export function useCustomBorders(): CustomBorderLibrary {
  const [options, setOptions] =
    useState<readonly BorderOption[]>(borderOptions);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void restoreCustomBorders()
      .then((restored) => {
        if (mounted.current) {
          setOptions((current) => mergeOptions(current, restored));
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (mounted.current) {
          const detail = cause instanceof Error ? cause.message : "";
          setError(
            `Saved borders could not be loaded. ${detail || "Allow browser storage, then reload to try again."}`,
          );
        }
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  async function add(file: File, shape: Shape): Promise<BorderId> {
    const option = await addCustomBorder(file, shape);
    if (mounted.current) {
      setOptions((current) => mergeOptions(current, [option]));
      setError("");
    }
    return option.id;
  }

  return { options, error, loading, add };
}
