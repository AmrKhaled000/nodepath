import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup, configure } from "@testing-library/react";
import { progressStore } from "@/services/progressStore";

// Cold workers parse the multi-megabyte curriculum chunk; give async queries room.
configure({ asyncUtilTimeout: 10000 });

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): ResizeObserverEntry[] {
    return [];
  }
}

if (!("ResizeObserver" in globalThis)) {
  (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
}

if (typeof window !== "undefined") {
  // React Router v7 constructs `new Request(url, { signal })` from its own
  // AbortController. In the jsdom environment that controller is jsdom's, but
  // `Request` is undici's — and undici rejects any signal that is not a Node
  // AbortSignal. Strip the signal in tests; nothing depends on cancellation here.
  const RealRequest = window.Request;
  class TestRequest extends RealRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (init?.signal) {
        const { signal: _signal, ...rest } = init;
        super(input, rest as RequestInit);
      } else {
        super(input, init);
      }
    }
  }
  window.Request = TestRequest as unknown as typeof Request;

  // Pretend to be a narrow viewport so the roadmap renders its accessible list
  // view instead of React Flow (which needs a real layout engine).
  Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

  if (!window.matchMedia) {
    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  window.scrollTo = (() => {}) as typeof window.scrollTo;
}

if (!("IntersectionObserver" in globalThis)) {
  (globalThis as Record<string, unknown>).IntersectionObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
  };
}

beforeEach(() => {
  window.localStorage.clear();
  progressStore.reset();
  window.history.pushState({}, "", "/");
});

afterEach(() => {
  cleanup();
});
