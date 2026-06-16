/* ─── Featured bakes handscroll ───
   Vertical scroll drives horizontal glide of the card track.
   The outer section is made tall; an inner viewport is pinned (sticky) and the
   track is translated in X according to scroll progress through the section.
   Mobile (≤768px) & reduced-motion: native horizontal swipe instead (CSS). */
(function () {
  const section = document.getElementById('featured');
  if (!section) return;

  const track = document.getElementById('handscroll-track');
  const viewport = section.querySelector('.handscroll-viewport');
  if (!track || !viewport) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 768px)');

  let maxX = 0;
  let ticking = false;

  function isDisabled() { return reduceMotion.matches || mobile.matches; }

  function measure() {
    if (isDisabled()) {
      section.style.height = '';
      track.style.transform = '';
      maxX = 0;
      return;
    }
    const vw = viewport.clientWidth;
    maxX = Math.max(track.scrollWidth - vw, 0);
    // 1px of vertical scroll ≈ 1px of horizontal glide
    section.style.height = (window.innerHeight + maxX) + 'px';
  }

  function tick() {
    ticking = false;
    if (isDisabled()) return;
    const rect = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
    track.style.transform = `translate3d(${(-(maxX * progress)).toFixed(1)}px, 0, 0)`;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
  }

  async function buildCards() {
    const data = await fetchJSON('content/gallery.json');
    if (!data) {
      renderError(track, "Couldn't load featured bakes. Please refresh.");
      return;
    }
    track.innerHTML = data.map(c => `
      <article class="handscroll-card">
        <div class="handscroll-card-img">
          <img src="${c.image}" alt="${c.name}" loading="lazy" width="400" height="400">
        </div>
        <div class="handscroll-card-body">
          <p class="text-eyebrow" style="color: var(--text-secondary);">${c.note}</p>
          <h3>${c.name}</h3>
        </div>
      </article>`).join('');
    requestAnimationFrame(() => { measure(); tick(); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); tick(); });
  window.addEventListener('load', () => { measure(); tick(); });
  if (mobile.addEventListener) mobile.addEventListener('change', () => { measure(); tick(); });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', () => { measure(); tick(); });

  buildCards();
})();
