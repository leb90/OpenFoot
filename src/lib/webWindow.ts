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

export function getCurrentWindow(): WebWindowHandle {
  return {
    async destroy() {
      window.close();

      if (!window.closed) {
        window.location.assign("/");
      }
    },
    async onCloseRequested() {
      return () => {};
    },
  };
}
