# Basketball World — Proiect Informatica

Site complet despre baschet, construit cu **HTML**, **CSS** si **JavaScript**.

---

## Structura proiectului

```
example/
|-- index.html               # pagina principala
|-- README.md                # acest fisier
|-- css/
|   `-- style.css            # stilul intregului site
|-- js/
|   |-- main.js              # meniu, animatii, galerie
|   `-- auth.js              # login, inregistrare, baza de date
|-- images/                  # toate pozele salvate local
|   |-- hero.jpg
|   |-- court.jpg
|   |-- ball.jpg
|   |-- dunk.jpg
|   |-- history.jpg
|   |-- player1..4.jpg
|   |-- team1..2.jpg
|   |-- gallery1..4.jpg
|   |-- logo.svg
|   `-- favicon.svg
|-- videos/
|   `-- sample.mp4           # video local pentru pagina multimedia
|-- audio/
|   |-- anthem.mp3           # sunet 1 (audio HTML5)
|   `-- whistle.mp3          # sunet 2
|-- data/
|   `-- users.json           # exemplu de "baza de date" cu utilizatori
`-- pages/
    |-- echipe.html          # tabel cu echipe NBA + clasament
    |-- jucatori.html        # carduri jucatori + statistici
    |-- istorie.html         # linia timpului (timeline)
    |-- galerie.html         # galerie foto cu lightbox
    |-- multimedia.html      # video local + YouTube + audio
    |-- contact.html         # formular contact + Google Maps
    |-- login.html           # autentificare
    `-- register.html        # inregistrare
```

---

## Cerinte indeplinite

| # | Cerinta | Cum e rezolvata |
|---|---------|-----------------|
| 1 | Poze salvate local pe calculator | Toate imaginile sunt in `images/` (descarcate, nu link-uri externe) |
| 2 | Meniu, pagina principala + alte pagini | `index.html` + 8 pagini in `pages/` |
| 3 | Structurat cu mape (foldere) si fisiere | `css/`, `js/`, `images/`, `videos/`, `audio/`, `data/`, `pages/` |
| 4 | Responsive (telefon + alte dispozitive) | Media queries in CSS, mobile-first, breakpoint la 880px si 540px |
| 5 | Animatii si tranzitii | Hero ken-burns, bounce pe titlu, reveal-on-scroll, hover pe carduri, animatie loader (minge), tranzitii pe butoane, etc. |
| 6 | Buton hamburger | Buton cu 3 linii care se transforma in X la apasare — vezi `.hamburger` in CSS si `js/main.js` |
| 7 | Google Maps + video + audio | `pages/contact.html` (iframe Maps), `pages/multimedia.html` (video HTML5 + iframe YT + 2x audio) |
| 8 | Footer | Footer cu 4 coloane prezent pe toate paginile |
| 9 | Login / inregistrare cu date care vin doar la tine | Folosesc **FormSubmit.co** care trimite toate datele formularelor pe `andreicolodeev28@gmail.com` |
| 10 | Baza de date | "Baza de date" simulata in `localStorage` (vezi `js/auth.js`) + exemplu de schema in `data/users.json` |

---

## Cum se deschide

1. Da dublu-click pe `index.html` SAU
2. Deschide cu un browser modern (Chrome, Edge, Firefox).

Pentru o experienta cu **toate** functiile (audio, video, fonturi) e bine sa fii conectat la internet (fonturile Google si Google Maps necesita net). Imaginile sunt locale si merg si offline.

---

## Cum primesc datele de login pe email (IMPORTANT)

Folosim serviciul gratuit **FormSubmit.co** (nu trebuie cont, nu costa nimic).

**Prima data cand cineva trimite un formular** (contact, login sau inregistrare):
1. FormSubmit iti va trimite un email pe `andreicolodeev28@gmail.com` cu titlul "Confirm your email".
2. Apesi butonul `Confirm Email` din acel email.
3. Gata — de acum, **TOATE** formularele de pe site iti vor veni automat pe email cu toate detaliile.

Ce informatii primesti la inregistrare:
- Nume, Email, Telefon, Oras, Varsta, Echipa favorita, **Parola** (in clar — ca sa o ai)
- Data exacta a inregistrarii

Ce informatii primesti la login:
- Cine s-a logat, cand, de pe ce browser

Daca vrei sa schimbi emailul, editeaza in `js/auth.js` linia:
```js
const OWNER_EMAIL = 'andreicolodeev28@gmail.com';
```

---

## Baza de date

Pe langa emailul de notificare, fiecare utilizator inregistrat este salvat si in **localStorage**-ul browserului (la cheia `bw_users`). Asta inseamna ca poti face login chiar si offline cu un cont creat anterior.

Poti vedea utilizatorii salvati astfel:
1. Apasa **F12** in browser
2. Du-te la tab-ul **Console**
3. Scrie: `BW.DB.getAll()` si apasa Enter

Schema unui utilizator (exemplu in `data/users.json`):
```json
{
  "name": "Andrei Popescu",
  "email": "...",
  "phone": "...",
  "city": "...",
  "age": 17,
  "favoriteTeam": "Lakers",
  "passwordHash": "...",
  "createdAt": "2026-04-12T10:32:00.000Z"
}
```

---

## Tehnologii folosite

- **HTML5** — structura semantica
- **CSS3** — grid, flexbox, custom properties, animatii, media queries
- **JavaScript (vanilla)** — IntersectionObserver, fetch API, localStorage, DOM events
- **Google Fonts** — Bebas Neue + Inter
- **Google Maps Embed** — pentru harta
- **FormSubmit.co** — pentru emailuri din formulare
- **YouTube iframe API** — pentru video embed

Niciun framework si nicio biblioteca externa (totul scris de la zero).

---

## Functii cheie (pentru explicat profesorului)

- **IntersectionObserver** in `js/main.js` — face animatiile reveal cand un element intra in vizor.
- **localStorage** in `js/auth.js` — simuleaza o baza de date persistenta.
- **fetch + FormData** in `js/auth.js` — trimite datele catre FormSubmit asincron.
- **CSS variables** in `:root` — toate culorile si dimensiunile centralizate.
- **Media queries** — site-ul se adapteaza automat pe mobil (hamburger menu).
- **Animatii @keyframes** — ken-burns pe hero, bounce pe titlu, dribble pe loader.
