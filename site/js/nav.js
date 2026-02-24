const menuButton = document.getElementById("menuButton");
const siteNav = document.getElementById("siteNav");

function toggleMenu() {
  // Toggle the menu visibility class for small-screen navigation.
  // Update aria-expanded so assistive tech can understand open state.
  // Keep logic centralized to avoid duplicate UI state handling.
  const isOpen = siteNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
}

function closeMenuAfterChoice() {
  // Close the dropdown after a link click on mobile for better UX.
  // Avoid forcing close on desktop where menu is always visible.
  // Keep navigation state deterministic after user navigation.
  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        siteNav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function initNavigation() {
  // Guard against missing nav in case a page template changes.
  // Wire up the menu button only once to prevent duplicate handlers.
  // Keep initialization in one place to reduce global side effects.
  if (!menuButton || !siteNav) {
    return;
  }

  menuButton.addEventListener("click", toggleMenu);
  closeMenuAfterChoice();
}

initNavigation();
