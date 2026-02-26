import { gardenPhotos } from "../data/gallery-data.js";

const galleryGrid = document.getElementById("galleryGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxDate = document.getElementById("lightboxDate");
const lightboxClose = document.getElementById("lightboxClose");

function createGalleryItem(photo) {
  // Build each gallery card with semantic figure content.
  // Keep image alt text from data so descriptions stay explicit.
  // Return a ready element that can be inserted into the grid.
  const article = document.createElement("article");
  article.className = "gallery-item";

  const button = document.createElement("button");
  button.className = "gallery-button";
  button.type = "button";
  button.setAttribute("aria-label", `Open image: ${photo.caption}`);

  const image = document.createElement("img");
  image.src = photo.src;
  image.alt = photo.alt;
  image.loading = "lazy";

  const meta = document.createElement("div");
  meta.className = "gallery-meta";

  const caption = document.createElement("p");
  caption.textContent = photo.caption;

  const date = document.createElement("p");
  date.className = "gallery-date";
  date.textContent = new Date(photo.date).toLocaleDateString();

  button.addEventListener("click", () => openLightbox(photo));

  meta.append(caption, date);
  button.append(image, meta);
  article.append(button);
  return article;
}

function openLightbox(photo) {
  // Copy selected image data into the lightbox viewer elements.
  // Open dialog in modal mode so focus stays inside the viewer.
  // Keep date and caption visible to match gallery metadata rules.
  lightboxImage.src = photo.src;
  lightboxImage.alt = photo.alt;
  lightboxCaption.textContent = photo.caption;
  lightboxDate.textContent = new Date(photo.date).toLocaleDateString();
  lightbox.showModal();
}

function wireLightboxClose() {
  // Provide explicit close action with the X button.
  // Close when user taps outside content for easier mobile use.
  // Handle ESC behavior automatically through native dialog support.
  lightboxClose.addEventListener("click", () => lightbox.close());

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      lightbox.close();
    }
  });
}

function initGallery() {
  // Guard for pages that do not render the gallery section.
  // Use try/catch so bad data does not crash the whole page.
  // Render all photos from a dedicated data module for maintainability.
  if (!galleryGrid || !lightbox || !lightboxImage || !lightboxCaption || !lightboxDate || !lightboxClose) {
    return;
  }

  try {
    const cards = gardenPhotos.map((photo) => createGalleryItem(photo));
    galleryGrid.append(...cards);
    wireLightboxClose();
  } catch (error) {
    console.error("Gallery initialization failed:", error);
    galleryGrid.innerHTML = "<p>Gallery failed to load. Please refresh the page.</p>";
  }
}

initGallery();
