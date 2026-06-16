(function () {
  'use strict';

  const group = document.getElementById('pricing-toggle');
  const grid  = document.getElementById('pricing-cards');
  const note  = document.getElementById('pricing-note');
  if (!group || !grid) return;

  const buttons = Array.from(group.querySelectorAll('.pricing-toggle'));
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let data    = null;
  let current = null;

  // ── Render ────────────────────────────────────────────────────────────────
  function cardHTML(card, cta) {
    return `
      <article class="pricing-card">
        <p class="text-eyebrow">${card.shape}</p>
        <p class="pricing-card-price">${card.price}</p>
        <p class="pricing-card-serves">${card.serves}</p>
        <p class="pricing-card-desc">${card.description}</p>
        <p class="pricing-card-timeline text-eyebrow">${card.timeline}</p>
        <a class="btn" href="${cta.href}">${cta.label}</a>
      </article>`;
  }

  function render(mode) {
    const m = data.modes.find(x => x.id === mode);
    if (!m) return;
    grid.innerHTML = m.cards.map(c => cardHTML(c, data.cta)).join('');
  }

  function setActive(mode) {
    buttons.forEach(b => {
      const on = b.dataset.mode === mode;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  // ── Toggle with fade + slide ───────────────────────────────────────────────
  function switchTo(mode) {
    if (mode === current || !data) return;
    current = mode;
    setActive(mode);

    if (reduced()) { render(mode); return; }

    grid.classList.add('is-switching');        // fade + slide out (0.4s)
    setTimeout(() => {
      render(mode);
      grid.offsetHeight;                        // force reflow before fading in
      grid.classList.remove('is-switching');    // fade + slide back in
    }, 400);
  }

  buttons.forEach(b => b.addEventListener('click', () => switchTo(b.dataset.mode)));

  // ── Load data ───────────────────────────────────────────────────────────────
  fetchJSON('content/pricing.json').then(d => {
    if (!d || !Array.isArray(d.modes) || !d.modes.length) {
      renderError(grid, "Couldn't load pricing. Please refresh.");
      return;
    }
    data = d;
    if (note && d.note) note.textContent = d.note;
    current = d.modes[0].id;
    setActive(current);
    render(current);
  });

})();
