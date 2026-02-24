function pulseCardsOnLoad() {
  // Select all cards to apply a subtle intro animation for visual feedback.
  // Use a small stagger to make the page feel lively without heavy effects.
  // Keep animation lightweight so performance stays good on modern browsers.
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, index) => {
    card.animate(
      [
        { transform: "translateY(6px)", opacity: 0.75 },
        { transform: "translateY(0)", opacity: 1 }
      ],
      { duration: 350 + index * 70, fill: "forwards", easing: "ease-out" }
    );
  });
}

function initLeafTrail() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasAnyFinePointer = window.matchMedia("(any-pointer: fine)").matches;

  if (prefersReducedMotion || !hasAnyFinePointer) {
    return;
  }

  const leafCount = 14;
  const leaves = [];
  const target = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5
  };

  for (let index = 0; index < leafCount; index += 1) {
    const leaf = document.createElement("span");
    leaf.className = "leaf-particle";
    leaf.style.opacity = `${0.95 - index * 0.05}`;
    leaf.style.transform = "translate3d(-200px, -200px, 0)";
    document.body.appendChild(leaf);

    leaves.push({
      element: leaf,
      x: target.x,
      y: target.y,
      vx: 0,
      vy: 0,
      angle: 0
    });
  }

  function onPointerMove(event) {
    target.x = event.clientX;
    target.y = event.clientY;
  }

  function animateLeaves() {
    let followX = target.x;
    let followY = target.y;

    leaves.forEach((leafData, index) => {
      const stiffness = 0.22 - index * 0.008;
      const damping = 0.72;

      leafData.vx += (followX - leafData.x) * stiffness;
      leafData.vy += (followY - leafData.y) * stiffness;
      leafData.vx *= damping;
      leafData.vy *= damping;
      leafData.x += leafData.vx;
      leafData.y += leafData.vy;

      leafData.angle += leafData.vx * 0.14;

      const scale = 1 - index * 0.035;
      leafData.element.style.transform = `translate3d(${leafData.x - 6}px, ${leafData.y - 8}px, 0) rotate(${leafData.angle}deg) scale(${Math.max(scale, 0.45)})`;

      followX = leafData.x;
      followY = leafData.y;
    });

    window.requestAnimationFrame(animateLeaves);
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("mousemove", onPointerMove, { passive: true });
  window.requestAnimationFrame(animateLeaves);
}

function initSiteEffects() {
  // Wrap effects in try/catch to avoid hard crashes from animation APIs.
  // Run only page-level effects that are safe on all pages.
  // Keep this module independent from nav and gallery/game logic.
  try {
    pulseCardsOnLoad();
    initLeafTrail();
  } catch (error) {
    console.error("Site effects init failed:", error);
  }
}

initSiteEffects();
