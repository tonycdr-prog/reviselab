import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Carbon form fields rely on ResizeObserver in jsdom-less environments.
globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
globalThis.matchMedia =
  globalThis.matchMedia ||
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  }));
