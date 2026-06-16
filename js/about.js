(function () {
  'use strict';

  var container = document.getElementById('about-content');
  if (!container) return;

  fetchJSON('content/about.json').then(function (data) {
    if (!data) {
      renderError(container, "Couldn’t load about content. Please refresh.");
      return;
    }
    var paragraphs = (data.paragraphs || [])
      .map(function (p) { return '<p style="margin-bottom:1.5rem;">' + p + '</p>'; })
      .join('');
    var signoff = data.signoff
      ? '<p class="text-eyebrow" style="margin-top:2.5rem;color:var(--text-secondary);">' + data.signoff + '</p>'
      : '';
    container.innerHTML = paragraphs + signoff;
  });
})();
