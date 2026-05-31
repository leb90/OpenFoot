/// <reference types="vite/client" />

declare module "@tauri-apps/api/core" {
  export function invoke<T = unknown>(
    command: string,
    args?: Record<string, unknown>,
  ): Promise<T>;
}

declare module "@tauri-apps/api/window" {
  type Unlisten = () => void;
  interface CloseRequestedEvent {
    preventDefault: () => void;
  }
  interface WebWindowHandle {
    destroy: () => Promise<void>;
    onCloseRequested: (
      callback: (event: CloseRequestedEvent) => void | Promise<void>,
    ) => Promise<Unlisten>;
  }
  export function getCurrentWindow(): WebWindowHandle;
}
