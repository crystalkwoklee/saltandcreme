(function () {
  'use strict';

  var form     = document.getElementById('contact-form');
  var feedback = document.getElementById('clipboard-feedback');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name    = ((document.getElementById('contact-name')    || {}).value || '').trim();
    var cake    = ((document.getElementById('contact-cake')    || {}).value || '').trim();
    var message = ((document.getElementById('contact-message') || {}).value || '').trim();

    var parts = ["Hi! I’d like to place an order."];
    if (name)    parts.push("My name is " + name + ".");
    if (cake)    parts.push("I’m interested in: " + cake + ".");
    if (message) parts.push(message);
    var text = parts.join(' ');

    function openIG() {
      window.open('https://ig.me/m/saltandcreme', '_blank', 'noopener,noreferrer');
    }

    // Submit to Netlify Forms in the background so you receive the inquiry by email
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'form-name': 'contact', name: name, cake: cake, message: message }).toString()
    }).catch(function () {});

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () {
          if (feedback) feedback.style.display = 'block';
          openIG();
        })
        .catch(openIG);
    } else {
      openIG();
    }
  });
})();
