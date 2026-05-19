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
|   |-- main.js              # meniu, animatii, galerie, lang switcher
|   |-- translations.js      # dictionar RO / EN
|   |-- auth.js              # login, inregistrare, baza de date locala
|   |-- effects.js           # particles, tilt 3D, toast, tema, shortcuts
|   |-- search.js            # paleta de cautare (Ctrl+K)
|   |-- newsletter.js        # formular newsletter in footer
|   |-- quiz.js              # quiz NBA (10 intrebari)
|   |-- shooter.js           # mini-joc canvas "arunca la cos"
|   |-- players-extra.js     # favorite + comparare jucatori
|   |-- potd.js              # Player of the Day (rotativ)
|   `-- audio-viz.js         # vizualizator audio (Web Audio API)
|-- images/                  # toate pozele salvate local
|   |-- hero.jpg
|   |-- court.jpg, ball.jpg, dunk.jpg, history.jpg
|   |-- p-*.png              # jucatori (Jordan, Kobe, LeBron, etc.)
|   |-- team-*.svg           # loguri echipe
|   |-- gallery*.jpg, player*.jpg, team*.jpg
|   |-- logo.svg
|   `-- favicon.svg
|-- videos/
|   `-- fouls.mp4            # video local pentru pagina multimedia
|-- audio/
|   |-- horn.mp3             # sirena oficiala NBA
|   `-- whistle.mp3          # fluier oficial NBA
|-- data/
|   |-- users.json           # exemplu de "baza de date" cu utilizatori
|   |-- games.js             # baza de date cu finale NBA legendare
|   `-- games.json           # acelasi continut ca JSON pur
`-- pages/
    |-- echipe.html          # tabel cu echipe NBA + clasament
    |-- jucatori.html        # carduri jucatori + comparare + favorite
    |-- istorie.html         # linia timpului (timeline)
    |-- galerie.html         # galerie foto cu lightbox
    |-- multimedia.html      # video local + YouTube + audio + baza de date
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
| 5 | Animatii si tranzitii | Hero particles, ken-burns, bounce, reveal-on-scroll, hover pe carduri, loader, tranzitii pe butoane, etc. |
| 6 | Buton hamburger | Buton cu 3 linii care se transforma in X la apasare — vezi `.hamburger` in CSS si `js/main.js` |
| 7 | Google Maps + video + audio | `pages/contact.html` (iframe Maps), `pages/multimedia.html` (video HTML5 local + iframe YT + 2x audio) |
| 8 | Footer | Footer cu 4 coloane prezent pe toate paginile |
| 9 | Login / inregistrare cu date care vin doar la tine | Folosesc **FormSubmit.co** care trimite toate datele formularelor pe `andreicolodeev28@gmail.com` |
| 10 | Baza de date | "Baza de date" simulata in `localStorage` (vezi `js/auth.js`) + exemplu de schema in `data/users.json` |
