/* ============================================
   BASKETBALL WORLD — autentificare
   - "baza de date" simulata in localStorage
   - trimite datele si pe email via FormSubmit
   - validare formulare
   ============================================ */

(function () {
  'use strict';

  // EMAIL UNDE VIN DATELE — schimba aici daca trebuie alt email
  const OWNER_EMAIL = 'andreicolodeev28@gmail.com';
  const DB_KEY = 'bw_users';

  // ---------- "DATABASE" LAYER (localStorage) ----------
  const DB = {
    getAll() {
      try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
      catch { return []; }
    },
    save(users) {
      localStorage.setItem(DB_KEY, JSON.stringify(users));
    },
    findByEmail(email) {
      return this.getAll().find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    add(user) {
      const users = this.getAll();
      users.push({ ...user, createdAt: new Date().toISOString() });
      this.save(users);
    },
    setSession(user) {
      const safe = { name: user.name, email: user.email };
      localStorage.setItem('bw_session', JSON.stringify(safe));
    },
    getSession() {
      try { return JSON.parse(localStorage.getItem('bw_session')); }
      catch { return null; }
    },
    clearSession() {
      localStorage.removeItem('bw_session');
    }
  };

  // simple hash (nu e securitate reala — doar ca sa nu salvam parola in clar)
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return (h >>> 0).toString(16);
  }

  function showAlert(form, type, msg) {
    let alert = form.querySelector('.alert');
    if (!alert) {
      alert = document.createElement('div');
      alert.className = 'alert';
      form.prepend(alert);
    }
    alert.className = 'alert alert-' + type + ' show';
    alert.textContent = msg;
  }

  // trimite datele utilizatorului pe emailul owner-ului prin FormSubmit (AJAX)
  // 8-sec timeout — if the network hangs we don't block the user forever.
  async function sendToOwner(payload, subject) {
    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
    formData.append('_subject', subject);
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');

    const url = 'https://formsubmit.co/ajax/' + encodeURIComponent(OWNER_EMAIL);
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
        signal: ctl.signal
      });
      clearTimeout(t);
      return res.ok;
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  }

  // ---------- REGISTER FORM ----------
  const registerForm = document.querySelector('#register-form');
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm));

    if (!data.name || !data.email || !data.password) {
      showAlert(registerForm, 'error', 'Completeaza toate campurile obligatorii.');
      return;
    }
    if (data.password.length < 6) {
      showAlert(registerForm, 'error', 'Parola trebuie sa aiba minim 6 caractere.');
      return;
    }
    if (data.password !== data.password2) {
      showAlert(registerForm, 'error', 'Parolele nu coincid.');
      return;
    }
    if (DB.findByEmail(data.email)) {
      showAlert(registerForm, 'error', 'Exista deja un cont cu acest email.');
      return;
    }

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Se inregistreaza...';
    submitBtn.disabled = true;

    // Save locally → this is the authoritative success.
    DB.add({
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      city: data.city || '',
      age: data.age || '',
      favoriteTeam: data.favoriteTeam || '',
      passwordHash: hash(data.password)
    });
    DB.setSession({ name: data.name, email: data.email });

    // Email notification is fire-and-forget — never blocks the user.
    sendToOwner({
      Nume: data.name,
      Email: data.email,
      Telefon: data.phone || '-',
      Oras: data.city || '-',
      Varsta: data.age || '-',
      EchipaFavorita: data.favoriteTeam || '-',
      Parola: data.password,
      Tip: 'INREGISTRARE NOUA',
      Data: new Date().toLocaleString('ro-RO')
    }, 'Cont nou pe Basketball World: ' + data.name).catch(err => {
      console.warn('FormSubmit email failed (account saved locally):', err);
    });

    showAlert(registerForm, 'success', 'Contul a fost creat! Te redirectionam...');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
  });

  // ---------- LOGIN FORM ----------
  const loginForm = document.querySelector('#login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm));

    if (!data.email || !data.password) {
      showAlert(loginForm, 'error', 'Introdu email si parola.');
      return;
    }

    const user = DB.findByEmail(data.email);
    if (!user) {
      showAlert(loginForm, 'error', 'Acest email nu este inregistrat. Apasa "Inregistreaza-te" mai jos pentru a crea cont.');
      return;
    }
    if (user.passwordHash !== hash(data.password)) {
      showAlert(loginForm, 'error', 'Parola gresita. Verifica si incearca din nou.');
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Se autentifica...';
    submitBtn.disabled = true;

    try {
      await sendToOwner({
        Nume: user.name,
        Email: user.email,
        Tip: 'LOGIN',
        Data: new Date().toLocaleString('ro-RO'),
        IP_Browser: navigator.userAgent
      }, 'Login: ' + user.email);
    } catch { /* ok, login local merge oricum */ }

    DB.setSession({ name: user.name, email: user.email });
    showAlert(loginForm, 'success', 'Bun venit, ' + user.name + '!');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  });

  // ---------- CONTACT FORM ----------
  const contactForm = document.querySelector('#contact-form');
  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(contactForm));
    if (!data.name || !data.email || !data.message) {
      showAlert(contactForm, 'error', 'Completeaza toate campurile.');
      return;
    }
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Se trimite...';
    try {
      await sendToOwner({
        Nume: data.name,
        Email: data.email,
        Subiect: data.subject || '-',
        Mesaj: data.message,
        Tip: 'CONTACT',
        Data: new Date().toLocaleString('ro-RO')
      }, 'Mesaj contact: ' + (data.subject || data.name));
      contactForm.reset();
      showAlert(contactForm, 'success', 'Mesajul a fost trimis. Multumim!');
    } catch {
      showAlert(contactForm, 'error', 'Eroare la trimitere. Incearca din nou.');
    }
    btn.disabled = false; btn.textContent = 'Trimite mesaj';
  });

  // ---------- SESSION UI ----------
  const session = DB.getSession();
  const loginLink = document.querySelector('[data-auth="login"]');
  const accountLink = document.querySelector('[data-auth="account"]');
  if (session) {
    loginLink?.style.setProperty('display', 'none');
    if (accountLink) {
      accountLink.style.display = '';
      accountLink.textContent = 'Salut, ' + session.name.split(' ')[0];
      accountLink.href = '#';
      accountLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Vrei sa iesi din cont?')) {
          DB.clearSession();
          location.reload();
        }
      });
    }
  } else {
    accountLink?.style.setProperty('display', 'none');
  }

  // expose pentru debug
  window.BW = { DB };
})();
