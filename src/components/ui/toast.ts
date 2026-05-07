/**
 * Imperative toast helper backed by an in-memory `EventTarget`.
 *
 * Public API:
 *   toast("Hello")
 *   toast("Saved", { variant: "info", durationMs: 3000 })
 *
 * The matching `<Toaster />` client component subscribes to the event bus
 * and renders queued messages with auto-dismiss. If no Toaster is mounted,
 * `toast()` is a no-op (no errors, no warnings) — this keeps unit-test
 * setups simple.
 */

export type ToastVariant = "info" | "error";

export type ToastOptions = {
  variant?: ToastVariant;
  durationMs?: number;
};

export type ToastMessage = {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
};

const TOAST_EVENT = "saa:toast";
const DEFAULT_DURATION_MS = 4_000;

let nextId = 1;

const isClient = typeof window !== "undefined";

const bus: EventTarget | null = isClient ? new EventTarget() : null;

export function toast(message: string, options?: ToastOptions): void {
  if (!bus) return;
  const detail: ToastMessage = {
    id: nextId++,
    message,
    variant: options?.variant ?? "info",
    durationMs: options?.durationMs ?? DEFAULT_DURATION_MS,
  };
  bus.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
}

export function subscribeToast(
  handler: (message: ToastMessage) => void,
): () => void {
  if (!bus) return () => {};
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<ToastMessage>).detail;
    handler(detail);
  };
  bus.addEventListener(TOAST_EVENT, listener);
  return () => bus.removeEventListener(TOAST_EVENT, listener);
}
