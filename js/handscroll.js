/* ─── Featured bakes wheel gallery ───
   Vertical scroll rotates a 3D ring of cake cards via GSAP ScrollTrigger.
   Each card sits on a spoke at its angle on the ring; JS drives ring rotation
   and per-spoke opacity to emphasise the front card.
   Mobile (≤768px) & reduced-motion: flat horizontal swipe (CSS). */
(function () {
  const section = document.getElementById('featured');
  if (!section) return;

  const ring = document.getElementById('wheel-ring');
  if (!ring) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile       = window.matchMedia('(max-width: 768px)');

  const RADIUS      = 420;   // px — ring radius (translateZ on each card)
  const SCROLL_PX   = 2400;  // extra px to scroll through one full rotation

  let st     = null;
  let spokes = [];

  /* Opacity: front card = 1.0, back card = 0.28. Smooth cosine curve. */
  function updateOpacities(ringDeg) {
    const N = spokes.length;
    const step = 360 / N;
    spokes.forEach((spoke, i) => {
      const worldAngle   = ((i * step + ringDeg) % 360 + 360) % 360;
      const distFromFront = Math.min(worldAngle, 360 - worldAngle); // 0–180
      const t = (1 + Math.cos(distFromFront * Math.PI / 180)) / 2;  // 1→0
      spoke.style.opacity = (0.28 + 0.72 * t).toFixed(3);
    });
  }

  function initWheel() {
    if (st) { st.kill(); st = null; }
    section.style.height = '';
    ring.style.transform  = '';
    spokes.forEach(s => { s.style.opacity = ''; });

    if (reduceMotion.matches || mobile.matches) return;

    section.style.height = (window.innerHeight + SCROLL_PX) + 'px';
    updateOpacities(0);

    st = ScrollTrigger.create({
      trigger: section,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   0.9,
      onUpdate(self) {
        const deg = -(self.progress * 360);
        ring.style.transform = `rotateY(${deg}deg)`;
        updateOpacities(deg);
      }
    });
  }

  async function buildWheel() {
    const data = await fetchJSON('content/gallery.json');
    if (!data) {
      renderError(ring, "Couldn't load featured bakes. Please refresh.");
      return;
    }

    const N    = data.length;
    const step = 360 / N;

    ring.innerHTML = data.map((c, i) => `
      <div class="wheel-spoke" style="transform:rotateY(${i * step}deg);">
        <article class="wheel-card" style="--flavor:${c.flavor_color};">
          <div class="wheel-card-img">
            <img src="${c.image}" alt="${c.name}" loading="lazy" width="400" height="400">
          </div>
          <div class="wheel-card-body">
            <h3 class="wheel-card-name">${c.name}</h3>
            <p class="wheel-card-desc">${c.description}</p>
            <p class="wheel-card-price">${c.price_note}</p>
          </div>
        </article>
      </div>`).join('');

    spokes = Array.from(ring.querySelectorAll('.wheel-spoke'));

    requestAnimationFrame(initWheel);
  }

  window.addEventListener('resize', initWheel);
  if (mobile.addEventListener)      mobile.addEventListener('change', initWheel);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', initWheel);

  buildWheel();
})();
