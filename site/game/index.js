// Imports the raylib WebAssembly JS glue module.
// This creates the Emscripten runtime instance that exposes raylib to the browser.
import Module from "./rl/raylib.js";

// Cache key DOM elements once at startup.
const canvas        = document.getElementById("canvas");
const overlay       = document.getElementById("loading-overlay");
const startButton   = document.getElementById("start-button");
const statusText    = document.getElementById("status-text");
const loadingText   = document.getElementById("loading-text");
const spinner       = document.getElementById("overlay-spinner");
const progressWrap  = document.getElementById("progress-wrap");
const progressBar   = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");

// ── UI helpers ────────────────────────────────────────────────────────────────

function setStatus(message) {
  if (statusText) statusText.textContent = message;
}

function setLoadingText(message) {
  if (loadingText) loadingText.textContent = message;
}

function hideOverlay() {
  if (overlay) overlay.style.display = "none";
}

function showSpinner(visible) {
  if (spinner) spinner.classList.toggle("hidden", !visible);
}

function showProgress(visible) {
  if (progressWrap)  progressWrap.classList.toggle("visible", visible);
  if (progressLabel) progressLabel.classList.toggle("visible", visible);
}

// Update the visual progress bar and label.
// pct is 0–100. label is optional e.g. "2.4 MB / 6.1 MB".
function setProgress(pct, label = "") {
  if (progressBar)   progressBar.style.width = `${Math.min(100, pct)}%`;
  if (progressLabel) progressLabel.textContent = label;
}

// ── Fetching with real progress ───────────────────────────────────────────────

// Fetch a binary file and stream progress back via onProgress(received, total, pct).
// Returns an ArrayBuffer when complete.
async function fetchWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : null;

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (onProgress) {
      const pct = total ? (received / total) * 100 : null;
      onProgress(received, total, pct);
    }
  }

  // Stitch all chunks into a single ArrayBuffer.
  const combined = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return combined.buffer;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Main startup sequence ─────────────────────────────────────────────────────

// Prevent right-click context menu over the canvas.
canvas.addEventListener("contextmenu", e => e.preventDefault());
// Prevent arrow keys and spacebar from scrolling the page while canvas is focused.
canvas.addEventListener("keydown", e => {
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
  if (keys.includes(e.key)) {
    e.preventDefault();
  }
});
async function startGame() {
  // Check that the browser actually supports WebAssembly before attempting load.
  // Show a clear compatibility message and bail out early if unsupported.
  // This satisfies REQ-25 for explicit feature detection.
  if (typeof WebAssembly === "undefined") {
    setLoadingText("Your browser does not support WebAssembly.");
    setStatus("Please use a modern browser to play this game.");
    return;
  }

  try {
    startButton.disabled = true;
    showSpinner(true);
    showProgress(true);

    // Step 1 — download and init raylib engine (maps to 0–50% of bar)
    setLoadingText("Loading game engine...");
    setStatus("Fetching raylib.wasm…");
    setProgress(0);

    const raylibBytes = await fetchWithProgress("./rl/raylib.wasm", (received, total, pct) => {
      if (pct !== null) {
        setProgress(pct * 0.5, `${formatBytes(received)} / ${formatBytes(total)}`);
      } else {
        setProgress(0, `${formatBytes(received)} downloaded…`);
      }
    });

    setStatus("Initializing raylib…");
    const mod = await Module({
      canvas,
      wasmBinary: new Uint8Array(raylibBytes),
    });
    window.mod = mod;

    // Step 2 — download and instantiate game WASM (maps to 50–100% of bar)
    setLoadingText("Starting Happy Garden…");
    setStatus("Fetching game…");

    const go = new Go();

    // Try preferred filename first, fall back to main.wasm.
    const wasmPaths = ["./HappyGarden.wasm", "./main.wasm"];
    let result = null;

    for (const path of wasmPaths) {
      try {
        const gameBytes = await fetchWithProgress(path, (received, total, pct) => {
          if (pct !== null) {
            setProgress(50 + pct * 0.5, `${formatBytes(received)} / ${formatBytes(total)}`);
          } else {
            setProgress(50, `${formatBytes(received)} downloaded…`);
          }
        });

        result = await WebAssembly.instantiate(gameBytes, go.importObject);
        break;
      } catch {
        // try next path
      }
    }

    if (!result) {
      throw new Error("Could not find HappyGarden.wasm or main.wasm.");
    }

    setProgress(100, "Done!");

    // Brief pause so the user sees 100% before the overlay disappears.
    await new Promise(resolve => setTimeout(resolve, 300));

    hideOverlay();

    // Focus the canvas immediately so arrow keys work without an extra click.
    canvas.focus();

    go.run(result.instance);

  } catch (error) {
    console.error("Happy Garden failed to start:", error);
    showSpinner(false);
    showProgress(false);
    setLoadingText("Could not start game.");
    setStatus(error instanceof Error ? error.message : "Unknown error. Check console.");
    startButton.disabled = false;
    startButton.textContent = "Retry";
  }
}

startButton.addEventListener("click", startGame);
setStatus(" ");