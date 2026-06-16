/* ─── Hero parallax ───
   Scroll-driven: background scales + shifts upward while overlay text fades.
   Desktop: full effect. Mobile (≤768px): gentle fade only.
   Reduced motion: parallax disabled, text fade only. */
(function () {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const bg = hero.querySelector('.hero-bg');
  const inner = hero.querySelector('.hero-inner');
  if (!bg || !inner) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 768px)');

  let heroH = hero.offsetHeight || 1;
  let latestY = window.scrollY;
  let ticking = false;

  function recalc() { heroH = hero.offsetHeight || 1; }

  function render() {
    ticking = false;
    const y = latestY;
    const progress = Math.min(Math.max(y / heroH, 0), 1);

    if (reduceMotion.matches) {
      bg.style.transform = '';
      inner.style.opacity = (1 - progress * 0.6).toFixed(3);
      return;
    }

    if (mobile.matches) {
      // Mobile: no transform, gentle fade-out as the hero leaves
      bg.style.transform = '';
      inner.style.opacity = (1 - progress * 0.9).toFixed(3);
      return;
    }

    // Desktop: scale 1 → 1.08, shift upward, fade text slightly
    const scale = 1 + progress * 0.08;
    const shift = -(y * 0.12);
    bg.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
    inner.style.opacity = (1 - progress * 0.85).toFixed(3);
  }

  function onScroll() {
    latestY = window.scrollY;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { recalc(); render(); });
  window.addEventListener('load', () => { recalc(); render(); });

  recalc();
  render();
})();
