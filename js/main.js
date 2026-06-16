/* ─── Fetch JSON helper ─── */
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Failed to load ${url}:`, err);
    return null;
  }
}

function renderError(container, message = "Couldn't load content. Please refresh.") {
  container.innerHTML = `<p class="load-error" style="color:var(--text-secondary);padding:2rem 0;">${message}</p>`;
}

/* ─── IntersectionObserver reveal ─── */
function initReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay;
        if (delay) {
          el.style.transitionDelay = `${parseFloat(delay) * 0.12}s`;
        }
        el.classList.add('in');
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', initReveal);
