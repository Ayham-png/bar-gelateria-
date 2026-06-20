/* ──────────────────────────────────────────────
   Scroll reveals — IntersectionObserver, additive motion only.
   .js class is already on <html> (set by an inline script in <head>).
   If this script fails, .reveal items stay hidden — so we ALSO add a
   timer-based failsafe that uncovers everything after 4 seconds, no
   matter what. ────────────────────────────────────────────── */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  // Always-on failsafe so a broken IO or stalled tab can never leave the
  // page blank. 4 s is well past any normal animation budget.
  const FAILSAFE_MS = 4000;
  const failsafe = setTimeout(() => {
    reveals.forEach(el => el.classList.add('is-in'));
  }, FAILSAFE_MS);

  if (reduced || !('IntersectionObserver' in window)) {
    // Reveal everything immediately if motion is off or IO is unavailable.
    clearTimeout(failsafe);
    reveals.forEach(el => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  reveals.forEach(el => io.observe(el));
})();

/* ──────────────────────────────────────────────
   Speisekarte gallery → native <dialog> lightbox
   – ESC + backdrop click close (native)
   – arrows + keyboard nav cycle through pages
   – preloads neighbours to make swiping instant
   ────────────────────────────────────────────── */
(function () {
  const dialog  = document.getElementById('menu-lightbox');
  const thumbs  = Array.from(document.querySelectorAll('.menu-page'));
  if (!dialog || !thumbs.length) return;

  const imgEl   = dialog.querySelector('.lightbox__img');
  const curEl   = dialog.querySelector('.lightbox__current');
  const totEl   = dialog.querySelector('.lightbox__total');
  const prevBtn = dialog.querySelector('.lightbox__nav--prev');
  const nextBtn = dialog.querySelector('.lightbox__nav--next');
  const closeBtn= dialog.querySelector('.lightbox__close');

  const pages = thumbs.map(t => Number(t.dataset.page));
  totEl.textContent = pages.length;

  let index = 0;

  const pad2 = n => String(n).padStart(2, '0');
  const fullUrl = page => `assets/menu/page-${pad2(page)}.jpg`;

  function show(idx) {
    index = (idx + pages.length) % pages.length;
    const page = pages[index];
    imgEl.src = fullUrl(page);
    imgEl.alt = `Speisekarte Seite ${page} von ${pages.length}`;
    curEl.textContent = page;
    // restart pop animation
    imgEl.style.animation = 'none';
    void imgEl.offsetWidth;
    imgEl.style.animation = '';

    // preload neighbours
    [-1, 1].forEach(d => {
      const n = pages[(index + d + pages.length) % pages.length];
      new Image().src = fullUrl(n);
    });
  }

  function open(idx) {
    show(idx);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  thumbs.forEach((t, i) => t.addEventListener('click', () => open(i)));
  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));
  closeBtn.addEventListener('click', () => dialog.close());

  // Click anywhere in the dark area around the image closes the lightbox.
  // We treat any click that didn't land on the image or a control as a
  // backdrop tap — much more forgiving than the old `e.target === dialog`
  // check, which only fired on a tiny invisible slice of the dialog.
  const INTERACTIVE = '.lightbox__img, .lightbox__nav, .lightbox__close, .lightbox__counter';
  dialog.addEventListener('click', (e) => {
    if (!e.target.closest(INTERACTIVE)) dialog.close();
  });

  document.addEventListener('keydown', (e) => {
    if (!dialog.open) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
})();

/* Venezia — hero flavor carousel.
   Clicking a dot or an arrow rotates the
   active flavor. The big hero cup, the
   two background cups, AND the floating
   fruit all crossfade to match the pick.

   Order in FLAVORS aligns with dot order:
   Erdbeer · Zitrone · Pistazie */

(function () {
  // year stamp
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const FLAVORS = [
    { key: 'erdbeer',  cup: 'cup-strawberry.webp', floater: 'strawberry.webp',  label: 'Erdbeer Sorbet' },
    { key: 'zitrone',  cup: 'cup-lemon.webp',      floater: 'lemon-slice.webp', label: 'Zitrone' },
    { key: 'pistazie', cup: 'cup-pistachio.webp',  floater: 'pistachio.webp',   label: 'Pistazie' },
  ];
  const BASE = 'assets/images/';

  const cups = {
    hero: document.getElementById('cup-hero'),
    mid:  document.getElementById('cup-mid'),
    bg:   document.getElementById('cup-bg'),
  };
  const floaters = [
    document.getElementById('floater-1'),
    document.getElementById('floater-2'),
  ];
  const dots = Array.from(document.querySelectorAll('.dot'));
  const [prevBtn, nextBtn] = document.querySelectorAll('.round-btn');

  if (!cups.hero || !dots.length) return;

  // Preload all images so swaps don't flash blank
  [...FLAVORS.map(f => f.cup), ...FLAVORS.map(f => f.floater)].forEach(name => {
    const img = new Image();
    img.src = BASE + name;
  });

  let active = 0;
  let busy = false;

  function setSrc(el, name) {
    if (!el) return;
    el.src = BASE + name;
  }

  function paint(idx) {
    const a = FLAVORS[idx];
    const b = FLAVORS[(idx + 1) % FLAVORS.length];
    const c = FLAVORS[(idx + 2) % FLAVORS.length];

    setSrc(cups.hero, a.cup);
    setSrc(cups.mid,  b.cup);
    setSrc(cups.bg,   c.cup);

    if (cups.hero) cups.hero.alt = `${a.label} (Hauptmotiv)`;
    if (cups.mid)  cups.mid.alt  = `${b.label} (Mitte)`;
    if (cups.bg)   cups.bg.alt   = `${c.label} (Hintergrund)`;

    floaters.forEach(el => setSrc(el, a.floater));

    dots.forEach((d, i) => {
      const on = i === idx;
      d.classList.toggle('dot--active', on);
      d.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function rotateTo(idx) {
    if (busy) return;
    const n = ((idx % FLAVORS.length) + FLAVORS.length) % FLAVORS.length;
    if (n === active) return;

    busy = true;
    const all = [cups.hero, cups.mid, cups.bg, ...floaters].filter(Boolean);
    all.forEach(el => el.classList.add('is-swapping'));

    // After fade-out completes, swap srcs then fade back in
    setTimeout(() => {
      active = n;
      paint(active);
      // Force browser to apply the new src before removing the fade class
      requestAnimationFrame(() => {
        all.forEach(el => el.classList.remove('is-swapping'));
        busy = false;
      });
    }, 240);
  }

  // ── Autoplay (3s tick, pauses on hover, respects reduced motion) ──
  const AUTOPLAY_MS = 3000;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = null;

  function startAutoplay() {
    if (reduced || timer) return;
    timer = setInterval(() => rotateTo(active + 1), AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }
  /** Restart the countdown after a manual interaction so the next tick
   *  isn't a near-instant jump on top of what the user just chose. */
  function bumpAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  const heroCard = document.querySelector('.card--hero');
  if (heroCard) {
    heroCard.addEventListener('mouseenter', stopAutoplay);
    heroCard.addEventListener('mouseleave', startAutoplay);
    heroCard.addEventListener('focusin',   stopAutoplay);
    heroCard.addEventListener('focusout',  startAutoplay);
  }
  // Don't burn CPU while the tab is hidden
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopAutoplay() : startAutoplay();
  });

  dots.forEach((d, i) => d.addEventListener('click', () => { rotateTo(i); bumpAutoplay(); }));
  prevBtn?.addEventListener('click', () => { rotateTo(active - 1); bumpAutoplay(); });
  nextBtn?.addEventListener('click', () => { rotateTo(active + 1); bumpAutoplay(); });

  // Keyboard left/right arrows rotate the carousel — UNLESS something else
  // is competing for those keys (a form field, an open dialog/lightbox).
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (document.querySelector('dialog[open]')) return;     // lightbox owns the keys when open
    if (e.key === 'ArrowLeft')  { rotateTo(active - 1); bumpAutoplay(); }
    if (e.key === 'ArrowRight') { rotateTo(active + 1); bumpAutoplay(); }
  });

  // Initial paint — supports a ?f= URL param so screenshot tests can hit specific states
  const params = new URLSearchParams(location.search);
  const init = parseInt(params.get('f'), 10);
  if (Number.isInteger(init)) active = ((init % FLAVORS.length) + FLAVORS.length) % FLAVORS.length;
  paint(active);

  // Kick off the autoplay loop
  startAutoplay();
})();
