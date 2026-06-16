(function () {
  'use strict';

  // TODO: Supabase integration here for persistence.

  var USER_KEY    = 'sc_user';      // plain name string — admin.js also reads this key
  var PW_KEY      = 'sc_user_pw';   // encoded password
  var SESSION_KEY = 'sc_session';   // sessionStorage: marks active login
  var STAMPS_KEY  = 'sc_stamps';
  var SAVED_KEY   = 'sc_saved_cakes';
  var TOTAL       = 8;

  var signinSection  = document.getElementById('signin-section');
  var loyaltySection = document.getElementById('loyalty-section');
  var savedSection   = document.getElementById('saved-section');
  var signinForm     = document.getElementById('signin-form');
  var nameField      = document.getElementById('name-field');
  var confirmField   = document.getElementById('confirm-field');
  var signinNameEl   = document.getElementById('signin-name');
  var signinPwEl     = document.getElementById('signin-password');
  var signinConfirm  = document.getElementById('signin-confirm');
  var signinDesc     = document.getElementById('signin-desc');
  var authError      = document.getElementById('auth-error');
  var signinBtn      = document.getElementById('signin-btn');
  var stampGrid      = document.getElementById('stamp-grid');
  var stampProgress  = document.getElementById('stamp-progress');
  var redeemBtn      = document.getElementById('redeem-btn');
  var savedEl        = document.getElementById('saved-cakes');
  var authTitle      = document.querySelector('#account-auth h1');
  var logoutBtn      = document.getElementById('logout-btn');

  function getUser()    { return localStorage.getItem(USER_KEY) || null; }
  function getPw()      { return localStorage.getItem(PW_KEY) || null; }
  function getStamps()  { try { return JSON.parse(localStorage.getItem(STAMPS_KEY) || '[]'); } catch (e) { return []; } }
  function setStamps(s) { localStorage.setItem(STAMPS_KEY, JSON.stringify(s)); }
  function getSaved()   { try { return JSON.parse(localStorage.getItem(SAVED_KEY)  || '[]'); } catch (e) { return []; } }

  function encodePw(pw) {
    try { return btoa(encodeURIComponent(pw + '·sc')); } catch (e) { return pw; }
  }

  function showError(msg) {
    if (authError) { authError.textContent = msg; authError.hidden = false; }
  }

  function clearError() {
    if (authError) authError.hidden = true;
  }

  // ── Decide which auth state to show ───────────────────────────────────────
  var storedName = getUser();
  var storedPw   = getPw();
  var inSession  = sessionStorage.getItem(SESSION_KEY) === '1';

  if (inSession && storedName && storedPw) {
    showLoggedIn(storedName);
  } else if (storedName && storedPw) {
    configureSignIn(storedName);    // returning user: show password only
  } else if (storedName && !storedPw) {
    configureSetPassword(storedName); // legacy user: ask to add a password
  } else {
    configureCreateAccount();         // first time
  }

  function configureCreateAccount() {
    if (authTitle)    authTitle.textContent = 'Create your account.';
    if (signinDesc)   signinDesc.textContent = 'Set up a name and password to track your loyalty stamps. Saved to this device.';
    if (nameField)    nameField.hidden    = false;
    if (confirmField) confirmField.hidden = false;
    if (signinBtn)    signinBtn.textContent = 'Create account';
    if (signinNameEl) signinNameEl.setAttribute('required', '');
  }

  function configureSetPassword(name) {
    if (authTitle)    authTitle.textContent = 'One more step.';
    if (signinDesc)   signinDesc.textContent = 'Welcome back, ' + name + '. Add a password to secure your account.';
    if (nameField)    nameField.hidden    = true;
    if (confirmField) confirmField.hidden = false;
    if (signinBtn)    signinBtn.textContent = 'Save password';
    if (signinNameEl) signinNameEl.removeAttribute('required');
  }

  function configureSignIn(name) {
    if (authTitle)    authTitle.textContent = 'Welcome back.';
    if (signinDesc)   signinDesc.textContent = 'Enter your password to access your stamps, ' + name + '.';
    if (nameField)    nameField.hidden    = true;
    if (confirmField) confirmField.hidden = true;
    if (signinBtn)    signinBtn.textContent = 'Sign in';
    if (signinNameEl) signinNameEl.removeAttribute('required');
  }

  // ── Form submit ───────────────────────────────────────────────────────────
  if (signinForm) {
    signinForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError();

      var currentName = getUser();
      var currentPw   = getPw();

      if (!currentName) {
        // ─ Create account ─
        var newName = signinNameEl ? signinNameEl.value.trim() : '';
        var pw      = signinPwEl    ? signinPwEl.value : '';
        var confirm = signinConfirm ? signinConfirm.value : '';
        if (!newName)         { showError('Please enter your name.'); return; }
        if (pw.length < 4)    { showError('Password must be at least 4 characters.'); return; }
        if (pw !== confirm)   { showError('Passwords don\'t match. Try again.'); return; }
        localStorage.setItem(USER_KEY, newName);
        localStorage.setItem(PW_KEY, encodePw(pw));
        sessionStorage.setItem(SESSION_KEY, '1');
        showLoggedIn(newName);

      } else if (!currentPw) {
        // ─ Set password (legacy user) ─
        var pw      = signinPwEl    ? signinPwEl.value : '';
        var confirm = signinConfirm ? signinConfirm.value : '';
        if (pw.length < 4)  { showError('Password must be at least 4 characters.'); return; }
        if (pw !== confirm)  { showError('Passwords don\'t match. Try again.'); return; }
        localStorage.setItem(PW_KEY, encodePw(pw));
        sessionStorage.setItem(SESSION_KEY, '1');
        showLoggedIn(currentName);

      } else {
        // ─ Sign in ─
        var pw = signinPwEl ? signinPwEl.value : '';
        if (encodePw(pw) !== currentPw) {
          showError('Incorrect password. Try again.');
          if (signinPwEl) signinPwEl.value = '';
          return;
        }
        sessionStorage.setItem(SESSION_KEY, '1');
        showLoggedIn(currentName);
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
      sessionStorage.removeItem(SESSION_KEY);
      if (signinSection)  signinSection.hidden  = false;
      if (loyaltySection) loyaltySection.hidden = true;
      if (savedSection)   savedSection.hidden   = true;
      clearError();
      var n = getUser(), p = getPw();
      if (n && p) configureSignIn(n);
      else if (n) configureSetPassword(n);
      else configureCreateAccount();
    });
  }

  // ── Stamps ────────────────────────────────────────────────────────────────
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
        btn.setAttribute('aria-label',   'Stamp ' + (idx + 1) + ', ' + (earned ? 'earned' : 'not yet earned') + '. Click to toggle.');
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
          var s = getStamps();
          while (s.length <= idx) s.push(false);
          s[idx] = !s[idx];
          setStamps(s);
          renderStamps();
        });
        stampGrid.appendChild(btn);
      })(i);
    }
  }

  // ── Saved cakes ───────────────────────────────────────────────────────────
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
