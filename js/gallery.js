(function () {
  'use strict';

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cakeData = [];

  // ── Plate gallery refs ────────────────────────────────────────────────────
  const plateSection  = document.getElementById('plate-gallery-section');
  const plateSpacer   = document.getElementById('plate-gallery-spacer');
  const plateCakeEl   = document.getElementById('plate-cake');
  const plateCakeImg  = document.getElementById('plate-cake-img');
  const plateInfo     = document.getElementById('plate-info');
  const plateCounter  = document.getElementById('plate-counter');
  const plateNote     = document.getElementById('plate-info-note');
  const plateName     = document.getElementById('plate-info-name');
  const plateDesc     = document.getElementById('plate-info-desc');
  const platePrice    = document.getElementById('plate-info-price');
  const plateDotsWrap = document.getElementById('plate-dots');
  const plateHint     = document.getElementById('plate-scroll-hint');

  // ── Grid + overlay refs ───────────────────────────────────────────────────
  const grid    = document.getElementById('gallery-grid');
  const overlay = document.getElementById('gallery-overlay');
  const oClose  = document.getElementById('overlay-close');
  const oImg    = document.getElementById('overlay-img');
  const oName   = document.getElementById('overlay-name');
  const oNote   = document.getElementById('overlay-note');
  const oDesc   = document.getElementById('overlay-desc');
  const oPrice  = document.getElementById('overlay-price');
  const oSave   = document.getElementById('overlay-save');

  // ── Load data once ────────────────────────────────────────────────────────
  fetchJSON('content/gallery.json').then(cakes => {
    if (!cakes) {
      if (grid) renderError(grid, "Couldn't load the gallery. Please refresh.");
      return;
    }
    cakeData = cakes;
    initPlateGallery(cakes);
    initGrid(cakes);
  });

  // ── Plate gallery ─────────────────────────────────────────────────────────
  let plateDots  = [];
  let currentIdx = -1;
  let hintDone   = false;

  function initPlateGallery(cakes) {
    if (!plateSection) return;

    // Set spacer height: each cake gets 75vh of scroll range
    if (plateSpacer) plateSpacer.style.height = `calc(${cakes.length} * 75vh)`;

    // Build progress dots
    if (plateDotsWrap) {
      cakes.forEach((cake, i) => {
        const btn = document.createElement('button');
        btn.className = 'plate-dot';
        btn.setAttribute('aria-label', `View ${cake.name}`);
        btn.addEventListener('click', () => {
          const sectionTop = plateSection.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: sectionTop + i * 0.75 * window.innerHeight, behavior: 'smooth' });
        });
        plateDotsWrap.appendChild(btn);
        plateDots.push(btn);
      });
    }

    window.addEventListener('scroll', onPlateScroll, { passive: true });
    // Plate starts empty — first cake hops in when user scrolls to this section
  }

  function onPlateScroll() {
    if (!plateSection || !cakeData.length) return;

    const rect = plateSection.getBoundingClientRect();

    // Dismiss scroll hint when section nears the viewport
    if (!hintDone && plateHint && rect.top < window.innerHeight * 0.85) {
      hintDone = true;
      plateHint.classList.add('is-hidden');
    }

    // Only trigger cakes once the section is in sticky mode (top at/above viewport)
    if (rect.top > 5) return;

    const scrollRng = plateSection.offsetHeight - window.innerHeight;
    if (scrollRng <= 0) return;

    const progress = Math.max(0, Math.min(1, -rect.top / scrollRng));
    const idx      = Math.min(Math.floor(progress * cakeData.length), cakeData.length - 1);
    showPlate(Math.max(0, idx));
  }

  function showPlate(idx) {
    if (idx === currentIdx) return;
    currentIdx = idx;
    const cake = cakeData[idx];

    // Counter + dots
    if (plateCounter) plateCounter.textContent = `${idx + 1} / ${cakeData.length}`;
    plateDots.forEach((d, i) => d.classList.toggle('is-active', i === idx));

    // Cake jump animation
    if (plateCakeEl && plateCakeImg) {
      plateCakeEl.classList.remove('is-jumping');
      plateCakeEl.style.opacity = ''; // clear any inline override before reflow
      void plateCakeEl.offsetWidth;  // force reflow so animation restarts
      plateCakeImg.src = cake.image;
      plateCakeImg.alt = cake.name;
      if (!reduced()) {
        plateCakeEl.classList.add('is-jumping');
      } else {
        plateCakeEl.style.opacity = '1'; // show immediately without animation
      }
    }

    // Info fade
    if (plateInfo) {
      plateInfo.classList.add('is-fading');
      setTimeout(() => {
        if (plateNote)  plateNote.textContent  = cake.note;
        if (plateName)  plateName.textContent  = cake.name;
        if (plateDesc)  plateDesc.textContent  = cake.description;
        if (platePrice) platePrice.textContent = cake.price_note;
        plateInfo.classList.remove('is-fading');
      }, reduced() ? 0 : 175);
    }
  }

  // ── Grid ──────────────────────────────────────────────────────────────────
  function initGrid(cakes) {
    if (!grid) return;
    grid.innerHTML = cakes.map((cake, i) => `
      <article class="gallery-card"
               data-index="${i}"
               tabindex="0"
               role="button"
               aria-haspopup="dialog"
               aria-label="View details for ${cake.name}">
        <div class="gallery-card-img">
          <img src="${cake.image}" alt="${cake.name}" loading="lazy" width="400" height="400">
        </div>
        <div class="gallery-card-label">
          <p class="text-eyebrow">${cake.note}</p>
          <h3>${cake.name}</h3>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.gallery-card').forEach(card => {
      const activate = () => openOverlay(cakeData[parseInt(card.dataset.index, 10)], card);
      card.addEventListener('click', activate);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });
  }

  // ── Overlay ───────────────────────────────────────────────────────────────
  let activeCakeId = null;
  let savedScrollY = 0;
  let triggerEl    = null;

  const isOpen = () => overlay && overlay.classList.contains('is-open');

  function openOverlay(cake, trigger) {
    if (!overlay) return;
    triggerEl    = trigger;
    activeCakeId = cake.id;
    savedScrollY = window.scrollY;

    oImg.src           = cake.image;
    oImg.alt           = cake.name;
    oName.textContent  = cake.name;
    oNote.textContent  = cake.note;
    oDesc.textContent  = cake.description;
    oPrice.textContent = cake.price_note;
    updateSaveButton();

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.position    = 'fixed';
    document.body.style.top         = `-${savedScrollY}px`;
    document.body.style.width       = '100%';
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('is-visible');
    overlay.offsetHeight; // force reflow
    overlay.classList.add('is-open');
    oClose.focus();
  }

  function closeOverlay() {
    if (!isOpen()) return;
    overlay.classList.remove('is-open');
    setTimeout(() => {
      overlay.classList.remove('is-visible');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.position     = '';
      document.body.style.top          = '';
      document.body.style.width        = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, savedScrollY);
      requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = ''; });
      if (triggerEl) triggerEl.focus({ preventScroll: true });
      activeCakeId = null;
    }, reduced() ? 0 : 450);
  }

  if (oClose)   oClose.addEventListener('click', closeOverlay);
  if (overlay)  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) closeOverlay(); });

  // Focus trap
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !isOpen() || !overlay) return;
    const focusable = Array.from(
      overlay.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (!overlay.contains(active))           { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  });

  // ── Save / localStorage ───────────────────────────────────────────────────
  const STORAGE_KEY = 'sc_saved_cakes';
  const getSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
  const setSaved = l  => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(l)); } catch {} };

  function updateSaveButton() {
    if (!oSave) return;
    const saved = getSaved().includes(activeCakeId);
    oSave.textContent = saved ? 'Saved ✓' : 'Save this cake';
    oSave.classList.toggle('is-saved', saved);
    oSave.setAttribute('aria-pressed', String(saved));
  }

  if (oSave) {
    oSave.addEventListener('click', () => {
      if (!activeCakeId) return;
      const saved = getSaved();
      const idx = saved.indexOf(activeCakeId);
      if (idx === -1) saved.push(activeCakeId); else saved.splice(idx, 1);
      setSaved(saved);
      updateSaveButton();
    });
  }

})();
