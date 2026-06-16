(function () {
  'use strict';

  var TOTAL = 8;
  var SAVED_KEY = 'sc_saved_cakes'; // gallery saves here; displayed until migrated to DB

  // ── DOM refs ──────────────────────────────────────────────────────────────
  var signinSection  = document.getElementById('signin-section');
  var loyaltySection = document.getElementById('loyalty-section');
  var savedSection   = document.getElementById('saved-section');
  var signinForm     = document.getElementById('signin-form');
  var emailField     = document.getElementById('email-field');
  var nameField      = document.getElementById('name-field');
  var confirmField   = document.getElementById('confirm-field');
  var signinEmailEl  = document.getElementById('signin-email');
  var signinNameEl   = document.getElementById('signin-name');
  var signinPwEl     = document.getElementById('signin-password');
  var signinConfirm  = document.getElementById('signin-confirm');
  var signinDesc     = document.getElementById('signin-desc');
  var authError      = document.getElementById('auth-error');
  var signinBtn      = document.getElementById('signin-btn');
  var toggleModeBtn  = document.getElementById('toggle-mode-btn');
  var toggleModeText = document.getElementById('toggle-mode-text');
  var stampGrid      = document.getElementById('stamp-grid');
  var stampProgress  = document.getElementById('stamp-progress');
  var redeemBtn      = document.getElementById('redeem-btn');
  var savedEl        = document.getElementById('saved-cakes');
  var authTitle      = document.querySelector('#account-auth h1');
  var logoutBtn      = document.getElementById('logout-btn');

  var currentUser    = null;
  var currentProfile = null;
  var mode           = 'signin'; // 'signin' | 'signup'

  // ── Error helpers ─────────────────────────────────────────────────────────
  function showError(msg) {
    if (authError) { authError.textContent = msg; authError.hidden = false; }
  }
  function clearError() {
    if (authError) authError.hidden = true;
  }

  // ── Mode switching (sign in ↔ create account) ─────────────────────────────
  function setMode(m) {
    mode = m;
    clearError();
    if (m === 'signup') {
      if (authTitle)    authTitle.textContent   = 'Create your account.';
      if (signinDesc)   signinDesc.textContent  = 'Create an account to track your loyalty stamps from any device.';
      if (nameField)    nameField.hidden        = false;
      if (confirmField) confirmField.hidden     = false;
      if (signinBtn)    signinBtn.textContent   = 'Create account';
      if (toggleModeText) toggleModeText.textContent = 'Already have an account?';
      if (toggleModeBtn)  toggleModeBtn.textContent  = 'Sign in';
    } else {
      if (authTitle)    authTitle.textContent   = 'Welcome back.';
      if (signinDesc)   signinDesc.textContent  = 'Sign in to access your loyalty stamps.';
      if (nameField)    nameField.hidden        = true;
      if (confirmField) confirmField.hidden     = true;
      if (signinBtn)    signinBtn.textContent   = 'Sign in';
      if (toggleModeText) toggleModeText.textContent = "Don't have an account?";
      if (toggleModeBtn)  toggleModeBtn.textContent  = 'Create one';
    }
  }

  if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', function () {
      setMode(mode === 'signin' ? 'signup' : 'signin');
    });
  }

  // ── Bootstrap: check for existing session ────────────────────────────────
  supabase.auth.getSession().then(function (result) {
    if (result.data && result.data.session) {
      loadProfile(result.data.session.user);
    } else {
      setMode('signin');
    }
  });

  // React to auth events (login, logout, email confirmation redirect)
  supabase.auth.onAuthStateChange(function (event, session) {
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
      loadProfile(session.user);
    } else if (event === 'SIGNED_OUT') {
      currentUser    = null;
      currentProfile = null;
      if (signinSection)  signinSection.hidden  = false;
      if (loyaltySection) loyaltySection.hidden = true;
      if (savedSection)   savedSection.hidden   = true;
      setMode('signin');
    }
  });

  // ── Load profile from DB ──────────────────────────────────────────────────
  function loadProfile(user) {
    currentUser = user;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(function (result) {
        if (result.error || !result.data) {
          // Trigger didn't create it yet — insert manually
          supabase
            .from('profiles')
            .insert({
              id: user.id,
              display_name: (user.user_metadata && user.user_metadata.display_name) || '',
              email: user.email
            })
            .select()
            .single()
            .then(function (r) {
              currentProfile = r.data || { stamps: [] };
              showLoggedIn(currentProfile.display_name || user.email);
            });
        } else {
          currentProfile = result.data;
          showLoggedIn(currentProfile.display_name || user.email);
        }
      });
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  if (signinForm) {
    signinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError();

      var email   = signinEmailEl ? signinEmailEl.value.trim() : '';
      var name    = signinNameEl  ? signinNameEl.value.trim()  : '';
      var pw      = signinPwEl    ? signinPwEl.value           : '';
      var confirm = signinConfirm ? signinConfirm.value        : '';

      if (!email) { showError('Please enter your email address.'); return; }
      if (!pw)    { showError('Please enter your password.'); return; }

      if (mode === 'signup') {
        if (!name)          { showError('Please enter your name.'); return; }
        if (pw.length < 6)  { showError('Password must be at least 6 characters.'); return; }
        if (pw !== confirm)  { showError("Passwords don't match. Try again."); return; }

        supabase.auth.signUp({
          email: email,
          password: pw,
          options: { data: { display_name: name } }
        }).then(function (result) {
          if (result.error) { showError(result.error.message); return; }
          if (result.data.user && !result.data.session) {
            // Email confirmation required
            showError('Almost there! Check your email and click the confirmation link to finish creating your account.');
          }
        });

      } else {
        supabase.auth.signInWithPassword({ email: email, password: pw })
          .then(function (result) {
            if (result.error) { showError('Incorrect email or password. Try again.'); }
          });
      }
    });
  }

  // ── Logged-in view ────────────────────────────────────────────────────────
  function showLoggedIn(name) {
    if (authTitle)      authTitle.textContent = 'Welcome back, ' + name + '.';
    if (signinSection)  signinSection.hidden  = true;
    if (loyaltySection) loyaltySection.hidden = false;
    if (savedSection)   savedSection.hidden   = false;
    renderStamps();
    renderSaved();
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      supabase.auth.signOut();
    });
  }

  // ── Stamps ────────────────────────────────────────────────────────────────
  function getStamps() {
    return Array.isArray(currentProfile && currentProfile.stamps)
      ? currentProfile.stamps
      : [];
  }

  function saveStamps(stamps) {
    if (!currentUser || !currentProfile) return;
    currentProfile.stamps = stamps;
    supabase
      .from('profiles')
      .update({ stamps: stamps, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id);
  }

  function renderStamps() {
    if (!stampGrid) return;
    var stamps    = getStamps();
    var count     = stamps.filter(Boolean).length;
    var remaining = TOTAL - count;

    if (stampProgress) {
      stampProgress.textContent = count >= TOTAL
        ? 'Reward earned — claim it in your next order.'
        : count + ' of ' + TOTAL + ' stamps. ' + remaining + ' more cake' +
          (remaining !== 1 ? 's' : '') + ' to a free 6-inch birthday cake.';
    }

    if (redeemBtn) {
      redeemBtn.disabled      = count < TOTAL;
      redeemBtn.style.opacity = count < TOTAL ? '0.5' : '1';
      redeemBtn.style.cursor  = count < TOTAL ? 'not-allowed' : 'pointer';
    }

    stampGrid.innerHTML = '';
    for (var i = 0; i < TOTAL; i++) {
      (function (idx) {
        var earned = !!stamps[idx];
        var btn    = document.createElement('button');
        btn.type   = 'button';
        btn.setAttribute('aria-label',   'Stamp ' + (idx + 1) + ', ' + (earned ? 'earned' : 'not yet earned') + '.');
        btn.setAttribute('aria-pressed', String(earned));
        btn.style.cssText = [
          'width:100%;aspect-ratio:1;',
          'border-radius:50%;',
          'border:2px solid ' + (earned ? 'var(--dark-burgundy)' : 'var(--border-light)') + ';',
          'cursor:pointer;',
          "font-family:'Playfair Display',serif;",
          'font-size:0.85rem;',
          'display:flex;align-items:center;justify-content:center;',
          'background:' + (earned ? 'var(--dark-burgundy)' : 'transparent') + ';',
          'color:'       + (earned ? '#fff'                 : 'var(--text-secondary)') + ';',
          'transform:'   + (earned ? 'rotate(-2deg)'        : 'none') + ';',
          'transition:transform 0.2s ease,background 0.2s ease,color 0.2s ease,border-color 0.2s ease;'
        ].join('');
        btn.textContent = earned ? '✓' : String(idx + 1);
        btn.addEventListener('click', function () {
          var s = getStamps().slice();
          while (s.length <= idx) s.push(false);
          s[idx] = !s[idx];
          saveStamps(s);
          renderStamps();
        });
        stampGrid.appendChild(btn);
      })(i);
    }
  }

  // ── Saved cakes (localStorage — gallery.js writes here) ──────────────────
  function getSaved() {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch (e) { return []; }
  }

  function renderSaved() {
    if (!savedEl) return;
    var saved = getSaved();
    if (!saved.length) {
      savedEl.innerHTML = '<p style="color:var(--text-secondary);">You haven\'t saved any cakes yet. <a href="gallery.html">Browse the gallery</a> to get started.</p>';
      return;
    }
    fetchJSON('content/gallery.json').then(function (cakes) {
      if (!cakes) return;
      var items = cakes.filter(function (c) { return saved.indexOf(c.id) !== -1; });
      if (!items.length) {
        savedEl.innerHTML = '<p style="color:var(--text-secondary);">No saved cakes found. <a href="gallery.html">Browse the gallery</a>.</p>';
        return;
      }
      savedEl.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1rem;">' +
        items.map(function (c) {
          return '<a href="gallery.html" style="display:block;text-decoration:none;border:1px solid var(--border-light);border-radius:4px;overflow:hidden;">' +
            '<img src="' + c.image + '" alt="' + c.name + '" loading="lazy" width="300" height="300" style="width:100%;aspect-ratio:1;object-fit:cover;">' +
            '<div style="padding:0.5rem;">' +
            '<p style="font-size:0.75rem;color:var(--text-secondary);">' + c.note + '</p>' +
            '<p style="font-size:0.9rem;font-family:\'Playfair Display\',serif;">' + c.name + '</p>' +
            '</div></a>';
        }).join('') +
        '</div>';
    });
  }

})();
