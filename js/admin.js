(function () {
  'use strict';

  var PASSWORD    = 'saltandcreme';
  var SESSION_KEY = 'sc_admin';
  var USER_KEY    = 'sc_user';
  var STAMPS_KEY  = 'sc_stamps';

  var loginForm    = document.getElementById('admin-login-form');
  var authSection  = document.getElementById('admin-auth-section');
  var dashboard    = document.getElementById('admin-dashboard');
  var adminError   = document.getElementById('admin-error');
  var customerList = document.getElementById('customer-list');
  var adminPosts   = document.getElementById('admin-posts');
  var clearBtn     = document.getElementById('clear-all-stamps');
  var newPostBtn   = document.getElementById('new-post-btn');

  function getStamps() { try { return JSON.parse(localStorage.getItem(STAMPS_KEY) || '[]'); } catch (e) { return []; } }

  function showDashboard() {
    if (authSection) authSection.hidden = true;
    if (dashboard)   dashboard.hidden   = false;
    loadCustomers();
    loadPosts();
  }

  function loadCustomers() {
    if (!customerList) return;
    var name = localStorage.getItem(USER_KEY);
    if (!name) {
      customerList.innerHTML = '<p style="color:var(--text-secondary);">No customers yet.</p>';
      return;
    }
    var count = getStamps().filter(Boolean).length;
    customerList.innerHTML =
      '<div style="display:flex;align-items:center;gap:1rem;padding:1rem;border:1px solid var(--border-light);border-radius:4px;flex-wrap:wrap;">' +
        '<span style="flex:1;min-width:8ch;">' + name + '</span>' +
        '<span style="color:var(--text-secondary);">' + count + ' of 8 stamps</span>' +
        '<button type="button" class="btn btn-ghost" style="font-size:0.82rem;" id="add-stamp-btn">+1 cake</button>' +
        '<button type="button" class="btn btn-ghost" style="font-size:0.82rem;" id="mark-redeemed-btn">Mark redeemed</button>' +
      '</div>';

    document.getElementById('add-stamp-btn').addEventListener('click', function () {
      var s = getStamps();
      while (s.length < 8) s.push(false);
      var next = s.indexOf(false);
      if (next !== -1) s[next] = true;
      localStorage.setItem(STAMPS_KEY, JSON.stringify(s));
      loadCustomers();
    });

    document.getElementById('mark-redeemed-btn').addEventListener('click', function () {
      if (confirm('Clear all stamps for ' + name + '?')) {
        localStorage.setItem(STAMPS_KEY, JSON.stringify([]));
        loadCustomers();
      }
    });
  }

  function getSessionPosts() {
    try { return JSON.parse(sessionStorage.getItem('sc_admin_posts') || 'null'); } catch (e) { return null; }
  }

  function loadPosts() {
    if (!adminPosts) return;
    var sp = getSessionPosts();
    if (sp) { renderAdminPosts(sp); return; }
    fetchJSON('content/posts.json').then(function (posts) {
      if (!posts) { adminPosts.innerHTML = '<p style="color:var(--text-secondary);">No posts found.</p>'; return; }
      renderAdminPosts(posts);
    });
  }

  function renderAdminPosts(posts) {
    if (!adminPosts) return;
    if (!posts.length) {
      adminPosts.innerHTML = '<p style="color:var(--text-secondary);">No posts yet.</p>';
      return;
    }
    adminPosts.innerHTML = posts.map(function (p, i) {
      return '<div style="display:flex;align-items:flex-start;gap:1rem;padding:1rem;border:1px solid var(--border-light);border-radius:4px;">' +
        '<div style="flex:1;">' +
          '<p style="font-size:0.75rem;color:var(--text-secondary);">' + p.date + '</p>' +
          '<p style="font-weight:400;">' + p.title + '</p>' +
        '</div>' +
        '<button type="button" class="btn btn-ghost" style="font-size:0.8rem;" data-del="' + i + '">Delete</button>' +
      '</div>';
    }).join('');

    Array.from(adminPosts.querySelectorAll('[data-del]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-del'), 10);
        posts.splice(idx, 1);
        sessionStorage.setItem('sc_admin_posts', JSON.stringify(posts));
        renderAdminPosts(posts);
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (confirm('Clear all loyalty stamps? This cannot be undone.')) {
        localStorage.removeItem(STAMPS_KEY);
        loadCustomers();
      }
    });
  }

  if (newPostBtn) {
    newPostBtn.addEventListener('click', function () {
      var title = prompt('Post title:');
      if (!title) return;
      var body = prompt('Post body:');
      if (!body) return;
      var newPost = { date: new Date().toISOString().slice(0, 10), title: title, body: body, instagram_embed: null, image: null };
      var sp = getSessionPosts();
      if (sp) {
        sp.unshift(newPost);
        sessionStorage.setItem('sc_admin_posts', JSON.stringify(sp));
        renderAdminPosts(sp);
      } else {
        fetchJSON('content/posts.json').then(function (posts) {
          var all = (posts || []).slice();
          all.unshift(newPost);
          sessionStorage.setItem('sc_admin_posts', JSON.stringify(all));
          renderAdminPosts(all);
        });
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var pwd = (document.getElementById('admin-password') || {}).value || '';
      if (pwd === PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, '1');
        if (adminError) adminError.style.display = 'none';
        showDashboard();
      } else {
        if (adminError) adminError.style.display = 'block';
      }
    });
  }

  if (sessionStorage.getItem(SESSION_KEY)) showDashboard();
})();
