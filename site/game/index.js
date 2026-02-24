import Module from "./rl/raylib.js";

const overlay = document.getElementById("loading-overlay");
const overlayText = document.querySelector(".loading-text");
const canvas = document.getElementById("canvas");

function hideOverlay() {
  if (overlay) {
    overlay.style.display = "none";
  }
}

function showOverlay() {
  if (overlay) {
    overlay.style.display = "flex";
  }
}

function setOverlayMessage(message) {
  if (overlayText) {
    overlayText.textContent = message;
  }
}

async function fetchArrayBuffer(paths) {
  let lastError = null;

  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        lastError = new Error(`Request failed for ${path}: ${response.status}`);
        continue;
      }

      return await response.arrayBuffer();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Failed to fetch required file.");
}

async function instantiateGameWasm(go, paths) {
  let lastError = null;

  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        lastError = new Error(`Request failed for ${path}: ${response.status}`);
        continue;
      }

      try {
        return await WebAssembly.instantiateStreaming(fetch(path), go.importObject);
      } catch {
        const bytes = await response.arrayBuffer();
        return await WebAssembly.instantiate(bytes, go.importObject);
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Could not instantiate game WASM.");
}

async function bootstrap() {
  try {
    showOverlay();
    setOverlayMessage("Loading Raylib runtime…");

    if (!canvas) {
      throw new Error("Canvas element not found.");
    }

    canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    const raylibWasm = await fetchArrayBuffer(["./rl/raylib.wasm", "rl/raylib.wasm"]);

    const raylibModule = await Module({
      canvas,
      wasmBinary: new Uint8Array(raylibWasm)
    });

    globalThis.mod = raylibModule;
    globalThis.Module = raylibModule;

    if (typeof Go !== "function") {
      throw new Error("Go runtime missing. Confirm site/game/wasm_exec.js is present.");
    }

    setOverlayMessage("Starting Happy Garden…");
    const go = new Go();

    const result = await instantiateGameWasm(go, ["./HappyGarden.wasm", "HappyGarden.wasm", "./main.wasm", "main.wasm"]);

    hideOverlay();
    go.run(result.instance);
  } catch (error) {
    console.error("Happy Garden bootstrap failed:", error);
    showOverlay();
    setOverlayMessage(`Game failed to start: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

void bootstrap();
