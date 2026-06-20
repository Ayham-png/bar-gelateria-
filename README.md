# Bar Gelateria Venezia — Achern

Static landing page for **Bar Gelateria Venezia**, Kapellenstraße 1, 77855 Achern. Plain HTML / CSS / vanilla JS, no build step.

## Structure

```
.
├── index.html              # the page
├── css/style.css           # all styles
├── js/main.js              # carousel, lightbox, reveal observers
├── Logo/                   # brand mark
├── assets/
│   ├── images/             # hero cups + product photos (WebP)
│   ├── menu/               # Speisekarte PDF rendered to JPG (thumb + full)
│   └── gallery/            # polaroid-wall photos (WebP)
└── vercel.json             # cache headers
```

## Local preview

Any static server works:

```sh
# Python
python -m http.server 8765

# Or Node
npx serve .
```

Open <http://localhost:8765/>.

## Deploy

This folder is the Vercel root. Push to GitHub and import the repo in Vercel — no build command, no output directory; it's static. `vercel.json` sets long cache for assets and no cache for HTML so menu/photo updates are picked up instantly.

## Contact

Kapellenstraße 1 · 77855 Achern · 07841 67 31 596 · [@gelateria_venezia_achern](https://www.instagram.com/gelateria_venezia_achern/)
