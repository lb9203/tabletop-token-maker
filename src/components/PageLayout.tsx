import type { ComponentChildren } from "preact";

export function PageLayout({ children }: { children: ComponentChildren }) {
  return (
    <div class="flex h-dvh min-h-0 flex-col overflow-hidden">
      <main class="flex min-h-0 flex-1 flex-col gap-2 p-2">{children}</main>
    </div>
  );
}
