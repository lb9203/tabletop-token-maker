import { Icon } from "../Icon";

export function ErrorNotice({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message) return null;

  return (
    <div class="error" role="alert">
      {message}
      <button aria-label="Dismiss error" onClick={onDismiss}>
        <Icon name="close" />
      </button>
    </div>
  );
}
