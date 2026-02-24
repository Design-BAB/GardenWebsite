const gameStatus = document.getElementById("gameStatus");
const retryButton = document.getElementById("retryButton");
const gameFrame = document.getElementById("gameFrame");

const GAME_URL = "game/index.html";
const LOAD_TIMEOUT_MS = 10000;

function hasWasmSupport() {
  // Check whether browser exposes the WebAssembly object.
  // Confirm instantiate exists so runtime loading can actually work.
  // Return a boolean used by the page loader decision flow.
  return typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function";
}

function setStatus(message, isError = false) {
  // Update status text so users always see current loader state.
  // Toggle color to clearly indicate success/progress versus errors.
  // Keep all status rendering in one function for consistency.
  gameStatus.textContent = message;
  gameStatus.style.color = isError ? "#a73400" : "#12324a";
}

function showRetry(visible) {
  // Show retry button when load fails and hide during active attempts.
  // Keep UI transitions simple to avoid confusing state combinations.
  // Reuse one helper so error and loading paths stay consistent.
  retryButton.classList.toggle("hidden", !visible);
}

async function mountGameFrame() {
  // Clear previous frame source before trying again to force reload.
  // Wait asynchronously for iframe load or a timeout failure.
  // Report status and display retry controls on failure paths.
  showRetry(false);
  gameFrame.classList.remove("hidden");

  try {
    setStatus("Loading Happy Garden...");

    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Game load timed out."));
      }, LOAD_TIMEOUT_MS);

      gameFrame.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      gameFrame.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error("Game frame failed to load."));
      };

      gameFrame.src = "";
      gameFrame.src = GAME_URL;
    });

    setStatus("Game loaded. Have fun! 🌱");
  } catch (error) {
    console.error("Game mount failed:", error);
    setStatus("Game frame did not fully load. Check the runner area below and open console for details.", true);
    showRetry(true);
  }
}

function bindRetry() {
  // Attach one click handler to retry loading flow.
  // Keep retry logic routed through the same async loader.
  // Avoid duplicate code between initial load and retry state.
  retryButton.addEventListener("click", () => {
    void mountGameFrame();
  });
}

function initGamesPage() {
  // Guard so this module can be imported safely on any page.
  // Show compatibility message when WebAssembly is unavailable.
  // Start async load path only when environment can support WASM.
  if (!gameStatus || !retryButton || !gameFrame) {
    return;
  }

  if (!hasWasmSupport()) {
    setStatus("Your browser does not support WebAssembly. Please use a modern browser.", true);
    showRetry(false);
    return;
  }

  bindRetry();
  void mountGameFrame();
}

initGamesPage();
