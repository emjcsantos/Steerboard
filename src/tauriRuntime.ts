export function hasTauriRuntime(): boolean {
  if (typeof globalThis === "undefined") {
    return false;
  }

  const runtime = globalThis as typeof globalThis & {
    isTauri?: boolean;
    __TAURI_INTERNALS__?: unknown;
  };

  return runtime.isTauri === true || "__TAURI_INTERNALS__" in runtime;
}
