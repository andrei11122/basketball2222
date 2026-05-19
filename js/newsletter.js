/* ============================================
   BASKETBALL WORLD — newsletter signup
   - injected into every footer
   - sends to OWNER_EMAIL via FormSubmit AJAX
   ============================================ */
(function () {
  'use strict';

  const OWNER_EMAIL = 'andreicolodeev28@gmail.com';
  const STORE_KEY   = 'bw_newsletter_seen';

  // 1. Inject newsletter form into every footer (4th column or new row)
  function injectIntoFooter() {
    const footer = document.querySelector('.site-footer .footer-grid');
    if (!footer) return;
    if (footer.querySelector('.newsletter')) return;

    // Add a 5th item-row that spans full width above footer-bottom
    const wrap = document.createElement('div');
    wrap.className = 'footer-col newsletter-col';
    wrap.innerHTML = `
      <h4 data-i18n="ft.newsletter">Newsletter</h4>
      <p data-i18n="ft.newsletter.sub">Aboneaza-te si primesti noutati NBA direct pe email.</p>
      <form class="newsletter" id="newsletter-form" novalidate>
        <input type="email" name="email" placeholder="Email-ul tau..." required autocomplete="email" data-i18n-attr="placeholder:ft.newsletter.placeholder">
        <button type="submit" data-i18n="ft.newsletter.submit">Aboneaza-te</button>
      </form>
    `;
    footer.appendChild(wrap);
    bind();
  }

  function bind() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        window.BWtoast?.('Introdu un email valid.', 'error');
        return;
      }
      const btn = form.querySelector('button');
      btn.disabled = true;
      const orig = btn.textContent;
      btn.textContent = '...';
      try {
        const fd = new FormData();
        fd.append('Email', email);
        fd.append('Tip', 'NEWSLETTER');
        fd.append('Sursa', window.location.pathname);
        fd.append('Data', new Date().toLocaleString('ro-RO'));
        fd.append('_subject', 'Newsletter signup: ' + email);
        fd.append('_template', 'table');
        fd.append('_captcha', 'false');
        const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(OWNER_EMAIL), {
          method: 'POST',
          body: fd,
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        localStorage.setItem(STORE_KEY, '1');
        window.BWtoast?.('Multumim! Te-ai abonat cu succes 🎉', 'success');
      } catch (err) {
        window.BWtoast?.('Eroare la trimitere. Incearca din nou.', 'error');
      }
      btn.disabled = false;
      btn.textContent = orig;
    });
  }

  if (document.readyState !== 'loading') injectIntoFooter();
  else document.addEventListener('DOMContentLoaded', injectIntoFooter);
})();
