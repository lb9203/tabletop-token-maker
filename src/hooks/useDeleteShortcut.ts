import { useLayoutEffect } from "preact/hooks";

export function useDeleteShortcut(
  selectedId: number | null,
  onDelete: (id: number) => void,
): void {
  useLayoutEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (
        selectedId === null ||
        event.key !== "Delete" ||
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        document.querySelector("dialog[open]")
      )
        return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select"))
      )
        return;

      event.preventDefault();
      onDelete(selectedId);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, onDelete]);
}
