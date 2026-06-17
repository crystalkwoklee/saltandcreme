/* ─── Featured bakes handscroll ───
   Vertical scroll drives horizontal glide of the card track via GSAP ScrollTrigger.
   The outer section is sized tall; the inner sticky viewport is pinned via CSS and
   the track is translated in X as scrub progress.
   Mobile (≤768px) & reduced-motion: native horizontal swipe (CSS). */
(function () {
  const section  = document.getElementById('featured');
  if (!section) return;

  const track    = document.getElementById('handscroll-track');
  const viewport = section.querySelector('.handscroll-viewport');
  if (!track || !viewport) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile       = window.matchMedia('(max-width: 768px)');
  let st = null;

  function initScrollDrive() {
    if (st) { st.kill(); st = null; }
    section.style.height = '';
    track.style.transform = '';

    if (reduceMotion.matches || mobile.matches) return;

    const maxX = Math.max(track.scrollWidth - viewport.clientWidth, 0);
    if (maxX <= 0) return;

    section.style.height = (window.innerHeight + maxX) + 'px';

    st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate(self) {
        track.style.transform =
          `translate3d(${(-maxX * self.progress).toFixed(1)}px,0,0)`;
      }
    });
  }

  async function buildCards() {
    const data = await fetchJSON('content/gallery.json');
    if (!data) {
      renderError(track, "Couldn't load featured bakes. Please refresh.");
      return;
    }

    track.innerHTML = data.map(c => `
      <article class="handscroll-card" style="--flavor:${c.flavor_color};width:${c.card_width}px;">
        <div class="handscroll-card-img">
          <img src="${c.image}" alt="${c.name}" loading="lazy" width="400" height="400">
        </div>
        <div class="handscroll-card-body">
          <h3 class="handscroll-card-name">${c.name}</h3>
          <p class="handscroll-card-desc">${c.description}</p>
          <p class="handscroll-card-price">${c.price_note}</p>
        </div>
      </article>`).join('');

    requestAnimationFrame(initScrollDrive);
  }

  window.addEventListener('resize', initScrollDrive);
  if (mobile.addEventListener) mobile.addEventListener('change', initScrollDrive);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', initScrollDrive);

  buildCards();
})();
