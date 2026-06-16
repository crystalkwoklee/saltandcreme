(function () {
  const MAX_TILT = 15;
  const PERSPECTIVE = 900;

  document.querySelectorAll('.tilt-card').forEach(card => {
    const highlight = document.createElement('div');
    highlight.className = 'tilt-highlight';
    highlight.setAttribute('aria-hidden', 'true');
    card.appendChild(highlight);

    let rafId = null;

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'box-shadow 0.15s ease-out';
      highlight.style.opacity = '1';
    });

    card.addEventListener('mousemove', e => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * MAX_TILT * 2;
        const rotateX = (0.5 - y) * MAX_TILT * 2;

        card.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
        card.style.boxShadow = '0 24px 48px rgba(107, 45, 62, 0.18)';
        highlight.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.38) 0%, transparent 65%)`;
      });
    });

    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(rafId);
      card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
      card.style.transform = '';
      card.style.boxShadow = '';
      highlight.style.opacity = '0';
    });
  });
})();
