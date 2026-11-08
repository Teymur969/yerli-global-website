// Yerli Global. Plain JS plus GSAP + ScrollTrigger (self-hosted in /vendor).
// Every scroll scene sits behind a reduced-motion check; without it the page is static and complete.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Hero load sequence ---------- */
  const fontsReady = document.fonts && document.fonts.ready
    ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))])
    : Promise.resolve();
  fontsReady.then(() => requestAnimationFrame(() => root.classList.add('ready')));

  /* ---------- Nav theme follows the section under it ---------- */
  const nav = $('.nav');
  const themed = $$('main section, .foot');
  const syncNav = () => {
    const y = nav.offsetHeight + 1; // the section just under the bar
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { if (nav.dataset.theme !== s.dataset.theme) nav.dataset.theme = s.dataset.theme; break; }
    }
  };
  let navTick = false;
  addEventListener('scroll', () => { if (!navTick) { navTick = true; requestAnimationFrame(() => { navTick = false; syncNav(); }); } }, { passive: true });
  addEventListener('resize', syncNav);
  syncNav();

  /* ---------- Phone menu ---------- */
  const toggle = $('.nav__toggle');
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav__links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---------- Clocks ---------- */
  const clocks = $$('[data-tz]').map(el => ({ el, f: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: el.dataset.tz }) }));
  const tick = () => { const n = new Date(); clocks.forEach(c => { const t = c.f.format(n); if (c.el.textContent !== t) { c.el.textContent = t; c.el.dateTime = t; } }); };
  tick(); setInterval(tick, 10000);
  const yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Manifesto: wrap words (harmless without motion) ---------- */
  $$('[data-words]').forEach(p => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  });

  /* ---------- Projects: number only the cards that are live (placeholders are hidden by CSS) ---------- */
  const liveCards = $$('.proj__item').filter(it => getComputedStyle(it).display !== 'none');
  const pad = n => String(n).padStart(2, '0');
  liveCards.forEach((it, i) => { const n = $('.proj__num', it); if (n) n.textContent = `${pad(i + 1)} / ${pad(liveCards.length)}`; });

  /* ---------- Contact headline: letters get heavier/lighter near the cursor ---------- */
  const weightEl = $('[data-weight]');
  if (weightEl) {
    const label = weightEl.textContent;
    weightEl.setAttribute('aria-label', label);
    weightEl.innerHTML = [...label].map(ch => ch === ' ' ? ' ' : `<span class="l" aria-hidden="true">${ch}</span>`).join('');
    if (finePointer && !reduced) {
      const letters = $$('.l', weightEl);
      let mx = -1e4, my = -1e4, raf = 0;
      const paint = () => {
        raf = 0;
        const reach = weightEl.offsetHeight * 2.2;
        letters.forEach(l => {
          const r = l.getBoundingClientRect();
          const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
          const k = Math.max(0, 1 - d / reach);            // 1 at the cursor, 0 at reach
          const w = Math.round(900 - 700 * k * k);         // 900 at rest, down to 200
          l.style.fontVariationSettings = `"wght" ${w}`;
        });
      };
      const sec = weightEl.closest('section');
      sec.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(paint); });
      sec.addEventListener('pointerleave', () => { mx = my = -1e4; if (!raf) raf = requestAnimationFrame(paint); });
    }
  }

  /* ---------- Yerli Family: filters + profile card ---------- */
  const lineup = $('.lineup');
  const people = $$('.lineup .p');
  const rolesOf = p => (p.dataset.roles || '').split(/\s+/).filter(Boolean);
  if (people.some(p => p.dataset.signed === 'true')) $('.lineup__key').hidden = false;

  $$('.filter').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    $$('.filter').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    lineup.classList.toggle('is-filtered', f !== 'all');
    people.forEach(p => p.classList.toggle('is-match', rolesOf(p).includes(f)));
  }));

  // Monochrome icons, drawn in currentColor
  const ICON = {
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    sp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M7 9.4c3.4-1 7.4-.7 10.4 1"/><path d="M7.6 12.6c2.9-.8 6-.5 8.5.9"/><path d="M8.2 15.6c2.2-.6 4.5-.4 6.4.7"/></svg>',
    am: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5" fill="currentColor"/><circle cx="16.5" cy="15.5" r="2.5" fill="currentColor"/></svg>'
  };
  const LINKS = [['ig', 'Instagram'], ['sp', 'Spotify'], ['am', 'Apple Music']];

  const card = $('.card');
  const cardLinks = $('.card__links', card);
  let current = null;
  const fill = p => {
    const name = p.textContent.trim();
    const signed = p.dataset.signed === 'true';
    $('.card__role', card).textContent = (signed ? 'signed · ' : '') + rolesOf(p).join(' · ');
    $('.card__name', card).textContent = name;
    $('.card__meta', card).textContent = (p.dataset.genre || '').toLowerCase();
    cardLinks.replaceChildren(...LINKS.filter(([k]) => p.dataset[k]).map(([k, label]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = p.dataset[k]; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', `${name} on ${label}`);
      a.innerHTML = ICON[k];
      li.append(a);
      return li;
    }));
    const img = $('.card__img', card);
    if (p.dataset.photo) { img.src = p.dataset.photo; img.hidden = false; } else { img.hidden = true; img.removeAttribute('src'); }
  };

  // Fine pointers: the card opens beside the name and glides between names; it stays open while the pointer is on it
  let cx = 0, cy = 0, tx = 0, ty = 0, cardRaf = 0, closeT = 0;
  const moveCard = () => {
    cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
    card.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(${card.classList.contains('is-on') ? 1 : .92})`;
    cardRaf = Math.abs(tx - cx) > .5 || Math.abs(ty - cy) > .5 ? requestAnimationFrame(moveCard) : 0;
  };
  const place = btn => {
    const r = btn.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight, m = 12;
    // under the name (above it near the bottom of the screen), so the other names in the tier stay free to hover
    tx = Math.max(m, Math.min(r.left, innerWidth - w - m));
    ty = r.bottom + 4 + h + m <= innerHeight ? r.bottom + 4 : Math.max(m, r.top - h - 4);
  };
  const open = p => {
    clearTimeout(closeT);
    const btn = $('button', p);
    const wasOn = card.classList.contains('is-on');
    if (current && current !== p) $('button', current).setAttribute('aria-expanded', 'false');
    current = p; fill(p);
    btn.setAttribute('aria-expanded', 'true');
    card.classList.add('is-on'); card.inert = false;
    if (finePointer) {
      place(btn);
      if (!wasOn) { cx = tx; cy = ty; }
      if (!cardRaf) cardRaf = requestAnimationFrame(moveCard);
    }
  };
  const close = () => {
    clearTimeout(closeT);
    if (current) $('button', current).setAttribute('aria-expanded', 'false');
    current = null;
    card.classList.remove('is-on'); card.inert = true;
    if (finePointer && !cardRaf) moveCard();
  };
  const closeSoon = () => { clearTimeout(closeT); closeT = setTimeout(close, 220); };

  people.forEach(p => {
    const btn = $('button', p);
    btn.setAttribute('aria-controls', 'family-card');
    btn.setAttribute('aria-expanded', 'false');
    if (finePointer) {
      btn.addEventListener('pointerenter', () => open(p));
      btn.addEventListener('pointerleave', closeSoon);
      btn.addEventListener('focus', () => open(p));
    }
    // Touch (and click/Enter): first tap opens the card, tapping the same name again closes it
    btn.addEventListener('click', () => { if (current === p && !finePointer) close(); else open(p); });
    btn.addEventListener('keydown', e => {
      const first = $('a', cardLinks);
      if (e.key === 'Tab' && !e.shiftKey && current === p && first) { e.preventDefault(); first.focus(); }
      if (e.key === 'Escape' && current) close();
    });
    btn.addEventListener('blur', e => { if (!card.contains(e.relatedTarget)) closeSoon(); });
  });

  card.addEventListener('pointerenter', () => clearTimeout(closeT));
  card.addEventListener('pointerleave', () => { if (finePointer) closeSoon(); });
  card.addEventListener('focusin', () => clearTimeout(closeT));
  card.addEventListener('focusout', e => {
    if (!card.contains(e.relatedTarget) && !(current && current.contains(e.relatedTarget))) closeSoon();
  });
  card.addEventListener('keydown', e => {
    if (!current) return;
    const links = $$('a', cardLinks), btn = $('button', current);
    if (e.key === 'Escape') { btn.focus(); close(); }
    else if (e.key === 'Tab' && e.shiftKey && document.activeElement === links[0]) { e.preventDefault(); btn.focus(); }
    else if (e.key === 'Tab' && !e.shiftKey && document.activeElement === links[links.length - 1]) {
      // continue to the next name in the lineup, as if the card sat right after this one
      const next = people[people.indexOf(current) + 1];
      if (next) { e.preventDefault(); $('button', next).focus(); }
    }
  });
  document.addEventListener('click', e => { if (current && !e.target.closest('.lineup .p, .card')) close(); });

  /* ---------- Star cursor ---------- */
  const cursor = $('.cursor');
  if (finePointer && !reduced) {
    root.classList.add('has-cursor');
    let px = -100, py = -100, qx = -100, qy = -100;
    addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY;
      const sec = e.target.closest && e.target.closest('[data-theme]');
      if (sec) cursor.style.setProperty('--cur', getComputedStyle(sec).getPropertyValue('--cur'));
      cursor.classList.toggle('is-hover', !!(e.target.closest && e.target.closest('a, button, [tabindex="0"]')));
    }, { passive: true });
    const loop = () => { qx += (px - qx) * 0.35; qy += (py - qy) * 0.35; cursor.style.transform = `translate3d(${qx}px, ${qy}px, 0)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('pointerleave', () => cursor.style.opacity = 0);
    document.addEventListener('pointerenter', () => cursor.style.opacity = '');
  }

  /* ---------- Scroll scenes ---------- */
  if (reduced || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('motion');

  /* 1. Gate: split the duplicated poster between "We see you." and "The world will too.", then part the halves.
     Desktop splits left/right between the two columns, phones split top/bottom between the stacked halves. */
  const hero = $('.hero');
  const gateA = $('.gate--a'), gateB = $('.gate--b');
  const textBox = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  const measureSplit = () => {
    const vertical = matchMedia('(max-width: 600px)').matches;
    const h = hero.getBoundingClientRect();
    const l = textBox($('.hero-left .hero-in', gateA)), r = textBox($('.hero-right .hero-in', gateA));
    const split = vertical ? (l.bottom + r.top) / 2 - h.top : (l.right + r.left) / 2 - h.left;
    hero.classList.toggle('is-vertical', vertical);
    hero.style.setProperty('--split', split + 'px');
    return { vertical, split, w: h.width, h: h.height };
  };
  hero.classList.add('is-gated');
  let g = measureSplit();
  ScrollTrigger.addEventListener('refreshInit', () => { gsap.set([gateA, gateB], { x: 0, y: 0 }); g = measureSplit(); });

  gsap.timeline({
    scrollTrigger: {
      trigger: hero, start: 'top top', end: '+=110%', pin: true, scrub: 0.6, invalidateOnRefresh: true,
      // once the halves have parted, the hero counts as black (nav and cursor follow)
      onUpdate: self => { const t = self.progress > 0.55 ? 'black' : 'red'; if (hero.dataset.theme !== t) { hero.dataset.theme = t; syncNav(); } }
    }
  })
    .to(gateA, { x: () => g.vertical ? 0 : -(g.split + 24), y: () => g.vertical ? -(g.split + 24) : 0, ease: 'power2.in' }, 0)
    .to(gateB, { x: () => g.vertical ? 0 : g.w - g.split + 24, y: () => g.vertical ? g.h - g.split + 24 : 0, ease: 'power2.in' }, 0)
    .fromTo('.hero__behind svg', { scale: 0.15, rotate: -144 }, { scale: 1, rotate: 0, ease: 'power2.out' }, 0.05);

  /* 2. Manifesto: words light up in reading order */
  const words = $$('.manifesto__text .w');
  gsap.timeline({ scrollTrigger: { trigger: '.manifesto', start: 'top top', end: '+=90%', pin: true, scrub: 0.4 } })
    .to(words, { opacity: 1, stagger: 0.08, ease: 'none', duration: 0.3 });

  /* 3. Services: one word per step; the star turns one point per word */
  const items = $$('.svc__item');
  const arms = { label: $('.svc__arm--l'), production: $('.svc__arm--r') };
  const now = $('.svc__now');
  const svcStar = $('.svc__star svg');
  let activeStep = 0;
  const setActive = i => {
    const it = items[i];
    arms.label.classList.toggle('is-on', it.dataset.arm === 'label');
    arms.production.classList.toggle('is-on', it.dataset.arm === 'production');
    now.textContent = String(i + 1).padStart(2, '0');
    // the star turns one point (72deg) per word, as its own short tween, so it is never left sitting at an angle
    if (i !== activeStep) { activeStep = i; gsap.to(svcStar, { rotation: 72 * i, duration: 0.7, ease: 'power3.out', overwrite: true }); }
  };
  setActive(0);
  const steps = items.length - 1;
  gsap.set(items.slice(1).map(it => $('.svc__word', it)), { yPercent: 110 });
  gsap.set(items.slice(1).map(it => $('.svc__desc', it)), { opacity: 0 });
  const svcTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.services', start: 'top top', end: () => '+=' + steps * 55 + '%', pin: true, scrub: 0.5,
      snap: { snapTo: v => Math.round(v * steps) / steps, inertia: false, delay: 0.08, duration: { min: 0.2, max: 0.5 }, ease: 'power2.inOut' },
      onUpdate: self => setActive(Math.min(steps, Math.round(self.progress * steps)))
    }
  });
  items.forEach((it, i) => {
    if (i === 0) return;
    const prev = items[i - 1];
    svcTl
      .to($('.svc__word', prev), { yPercent: -110, duration: 0.5, ease: 'power3.in' }, i - 1)
      .to($('.svc__desc', prev), { opacity: 0, duration: 0.3 }, i - 1)
      .fromTo($('.svc__word', it), { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: 'power3.out' }, i - 0.5)
      .fromTo($('.svc__desc', it), { opacity: 0 }, { opacity: 1, duration: 0.3 }, i - 0.3);
  });

  /* 3a. Worked With: the logos rise in once, left to right */
  if ($('.logos .logo')) {
    gsap.from('.logos .logo', { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06,
      scrollTrigger: { trigger: '.logos', start: 'top 85%', once: true } });
  }

  /* 4. Projects: as the next card slides over, the one underneath shrinks back and dims */
  const cards = liveCards;
  cards.forEach((it, i) => {
    const next = cards[i + 1];
    if (!next) return;
    // starts when the next card reaches this card's bottom edge, ends when it has fully landed
    const stickTop = el => parseFloat(getComputedStyle(el).top);
    gsap.to(it, {
      scale: 0.92, filter: 'brightness(.5)', ease: 'none',
      scrollTrigger: { trigger: next, start: () => 'top ' + (stickTop(it) + it.offsetHeight), end: () => 'top ' + stickTop(next), scrub: true, invalidateOnRefresh: true }
    });
  });

  /* 7. Founders slide in from the edges until they flank the mark */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    gsap.from('.founder--l', { xPercent: -60, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.pillars', start: 'top bottom', end: 'center 60%', scrub: 0.6 } });
    gsap.from('.founder--r', { xPercent: 60, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.pillars', start: 'top bottom', end: 'center 60%', scrub: 0.6 } });
    gsap.from('.pillars__mark', { scale: 0.6, ease: 'none', scrollTrigger: { trigger: '.pillars', start: 'top bottom', end: 'center 60%', scrub: 0.6 } });
  });

  fontsReady.then(() => ScrollTrigger.refresh());
  ScrollTrigger.addEventListener('refresh', syncNav);
})();
