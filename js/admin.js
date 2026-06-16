(function () {
  'use strict';

  var ADMIN_EMAIL = 'crystal.k.lee2@gmail.com';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var loginForm    = document.getElementById('admin-login-form');
  var authSection  = document.getElementById('admin-auth-section');
  var dashboard    = document.getElementById('admin-dashboard');
  var adminError   = document.getElementById('admin-error');
  var customerList = document.getElementById('customer-list');
  var adminPosts   = document.getElementById('admin-posts');
  var clearBtn     = document.getElementById('clear-all-stamps');
  var newPostBtn   = document.getElementById('new-post-btn');

  // ── Auth: check for existing session on load ──────────────────────────────
  supabase.auth.getSession().then(function (result) {
    var session = result.data && result.data.session;
    if (session && session.user && session.user.email === ADMIN_EMAIL) {
      showDashboard();
    }
  });

  // ── Login form ────────────────────────────────────────────────────────────
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (document.getElementById('admin-email') || {}).value || '';
      var pwd   = (document.getElementById('admin-password') || {}).value || '';

      supabase.auth.signInWithPassword({ email: email, password: pwd })
        .then(function (result) {
          if (result.error || !result.data.user) {
            if (adminError) adminError.style.display = 'block';
            return;
          }
          if (result.data.user.email !== ADMIN_EMAIL) {
            if (adminError) adminError.style.display = 'block';
            supabase.auth.signOut();
            return;
          }
          if (adminError) adminError.style.display = 'none';
          showDashboard();
        });
    });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  function showDashboard() {
    if (authSection) authSection.hidden = true;
    if (dashboard)   dashboard.hidden   = false;
    loadCustomers();
    loadPosts();
  }

  // ── Customer list ─────────────────────────────────────────────────────────
  function loadCustomers() {
    if (!customerList) return;
    customerList.innerHTML = '<p style="color:var(--text-secondary);">Loading customers…</p>';

    supabase
      .from('profiles')
      .select('id, display_name, email, stamps')
      .order('updated_at', { ascending: false })
      .then(function (result) {
        if (result.error || !result.data || !result.data.length) {
          customerList.innerHTML = '<p style="color:var(--text-secondary);">No customers yet.</p>';
          return;
        }
        renderCustomers(result.data);
      });
  }

  function renderCustomers(customers) {
    if (!customerList) return;
    customerList.innerHTML = customers.map(function (c) {
      var stamps = Array.isArray(c.stamps) ? c.stamps : [];
      var count  = stamps.filter(Boolean).length;
      return '<div style="display:flex;align-items:center;gap:1rem;padding:1rem;border:1px solid var(--border-light);border-radius:4px;flex-wrap:wrap;" data-id="' + esc(c.id) + '">' +
        '<div style="flex:1;min-width:12ch;">' +
          '<p style="font-size:0.95rem;">' + esc(c.display_name || '—') + '</p>' +
          '<p style="font-size:0.75rem;color:var(--text-secondary);">' + esc(c.email || '') + '</p>' +
        '</div>' +
        '<span style="color:var(--text-secondary);white-space:nowrap;">' + count + ' of 8 stamps</span>' +
        '<button type="button" class="btn btn-ghost" style="font-size:0.82rem;" data-action="add" data-id="' + esc(c.id) + '">+1 cake</button>' +
        '<button type="button" class="btn btn-ghost" style="font-size:0.82rem;" data-action="redeem" data-id="' + esc(c.id) + '" data-name="' + esc(c.display_name || c.email) + '">Mark redeemed</button>' +
      '</div>';
    }).join('');

    customerList.querySelectorAll('[data-action="add"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addStamp(btn.getAttribute('data-id'));
      });
    });

    customerList.querySelectorAll('[data-action="redeem"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.getAttribute('data-name');
        if (confirm('Clear all stamps for ' + name + '?')) {
          resetStamps(btn.getAttribute('data-id'));
        }
      });
    });
  }

  function addStamp(userId) {
    supabase
      .from('profiles')
      .select('stamps')
      .eq('id', userId)
      .single()
      .then(function (result) {
        if (result.error || !result.data) return;
        var stamps = Array.isArray(result.data.stamps) ? result.data.stamps.slice() : [];
        while (stamps.length < 8) stamps.push(false);
        var next = stamps.indexOf(false);
        if (next !== -1) stamps[next] = true;
        supabase
          .from('profiles')
          .update({ stamps: stamps, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .then(function () { loadCustomers(); });
      });
  }

  function resetStamps(userId) {
    supabase
      .from('profiles')
      .update({ stamps: [], updated_at: new Date().toISOString() })
      .eq('id', userId)
      .then(function () { loadCustomers(); });
  }

  // ── Clear all stamps button ───────────────────────────────────────────────
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (!confirm('Clear ALL loyalty stamps for every customer? This cannot be undone.')) return;
      supabase
        .from('profiles')
        .update({ stamps: [], updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000') // update all rows
        .then(function () { loadCustomers(); });
    });
  }

  // ── Journal posts (session-only, same as before) ──────────────────────────
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

})();
