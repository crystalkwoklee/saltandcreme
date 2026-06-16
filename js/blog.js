(function () {
  'use strict';

  var container = document.getElementById('posts-list');
  if (!container) return;

  fetchJSON('content/posts.json').then(function (posts) {
    if (!posts) {
      renderError(container, "Couldn’t load posts. Please refresh.");
      return;
    }
    if (!posts.length) {
      container.innerHTML = '<p style="color:var(--text-secondary);">No posts yet. Check back soon.</p>';
      return;
    }

    posts.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

    var hasEmbed = false;
    container.innerHTML = posts.map(function (post) {
      var dateStr = post.date;
      try {
        dateStr = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch (e) { /* keep raw date */ }

      var imgHtml = post.image
        ? '<img src="' + post.image + '" alt="" loading="lazy" style="width:100%;border-radius:4px;margin-top:1.5rem;">'
        : '';
      var embedHtml = '';
      if (post.instagram_embed) {
        embedHtml = '<div style="margin-top:1.5rem;">' + post.instagram_embed + '</div>';
        hasEmbed = true;
      }

      return '<article style="padding-bottom:3rem;border-bottom:1px solid var(--border-light);">' +
        '<p class="text-eyebrow" style="color:var(--text-secondary);">' + dateStr + '</p>' +
        '<h2 style="font-family:\'Playfair Display\',serif;font-weight:400;font-size:1.5rem;margin-top:0.5rem;line-height:1.2;">' + post.title + '</h2>' +
        '<p style="margin-top:1rem;color:var(--text-secondary);line-height:1.7;">' + post.body + '</p>' +
        imgHtml + embedHtml +
        '</article>';
    }).join('');

    if (hasEmbed) {
      var s = document.createElement('script');
      s.src = '//www.instagram.com/embed.js';
      s.async = true;
      s.defer = true;
      s.onload = function () { if (window.instgrm) window.instgrm.Embeds.process(); };
      document.body.appendChild(s);
    }
  });
})();
