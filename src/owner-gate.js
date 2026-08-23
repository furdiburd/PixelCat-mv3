(() => {
  const API = typeof browser !== "undefined" ? browser : chrome;
  const RUNTIME_FILES = [
    "src/quests.js",
    "src/fairplay.js",
    "src/cat-storage.js",
    "src/cat-coins.js",
    "src/cat-fish.js",
    "src/cat-balls.js",
    "src/cat-portals.js",
    "src/cat-speech.js",
    "src/content.js",
  ];
  let requested = false;
  let retryTimer = null;
  let requestGeneration = 0;

  function requestRuntime() {
    if (requested || globalThis.__PixelCatRuntime || globalThis.__PixelCatLoading) return;
    requested = true;
    globalThis.__PixelCatLoading = true;
    const generation = ++requestGeneration;
    try {
      const result = API.runtime.sendMessage({ action: "load_owner_runtime" });
      if (result && typeof result.then === "function") {
        result.then((response) => {
          if (generation !== requestGeneration) return;
          globalThis.__PixelCatLoading = false;
          if (!response || response.success !== true) {
            requested = false;
            scheduleRuntime(900);
          }
        }).catch(() => {
          globalThis.__PixelCatLoading = false;
          if (generation !== requestGeneration) return;
          requested = false;
          scheduleRuntime(900);
        });
      } else {
        window.setTimeout(() => {
          if (generation !== requestGeneration || globalThis.__PixelCatRuntime) return;
          globalThis.__PixelCatLoading = false;
          requested = false;
          scheduleRuntime(900);
        }, 3500);
      }
    } catch (_) {
      if (generation !== requestGeneration) return;
      globalThis.__PixelCatLoading = false;
      requested = false;
      scheduleRuntime(900);
    }
  }

  function scheduleRuntime(delay = 0) {
    if (document.hidden || globalThis.__PixelCatRuntime || requested) return;
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    if (delay > 0) {
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        scheduleRuntime();
      }, delay);
      return;
    }
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(requestRuntime, { timeout: 2500 });
    } else {
      window.setTimeout(requestRuntime, 1200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleRuntime, { once: true });
  } else {
    scheduleRuntime();
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) scheduleRuntime();
  });
})();
