(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // Theme: dark by default, the visitor's choice is remembered.
  const currentTheme = () => root.dataset.theme === 'light' ? 'light' : 'dark';
  const syncTheme = () => {
    const light = currentTheme() === 'light';
    $('meta[name="theme-color"]').setAttribute('content', light ? '#eef2e9' : '#090c0a');
    $('#themeToggle').setAttribute('aria-label', light ? 'Включить тёмную тему' : 'Включить светлую тему');
  };
  $('#themeToggle').addEventListener('click', () => {
    root.dataset.theme = currentTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('fg-track-theme', root.dataset.theme); } catch (_) {}
    syncTheme();
  });
  syncTheme();

  // The floating header turns to glass once the page is scrolled.
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu from the original header.
  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  const compactHeader = matchMedia('(max-width: 1100px)');
  function setMenu(open) {
    open = open && compactHeader.matches;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    mobileMenu.inert = !open;
    document.body.classList.toggle('menu-open', open);
  }
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') { setMenu(false); menuToggle.focus(); }
  });
  compactHeader.addEventListener('change', () => setMenu(false));

  // Search across the page sections (Cmd/Ctrl+K or the search button).
  const searchDialog = $('#headerSearchDialog');
  const searchInput = $('#headerSearchInput');
  const searchResults = $('#headerSearchResults');
  const searchSections = $$('#siteNav a').map(link => ({
    label: link.textContent.trim(),
    href: link.getAttribute('href'),
    content: $(link.getAttribute('href'))?.textContent || ''
  }));
  let searchReturnFocus = null;
  function renderSearch() {
    const query = searchInput.value.trim().toLocaleLowerCase('ru');
    const matches = searchSections.filter(item => `${item.label} ${item.content}`.toLocaleLowerCase('ru').includes(query));
    searchResults.replaceChildren();
    matches.forEach(item => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      link.addEventListener('click', () => { searchReturnFocus = null; searchDialog.close(); });
      searchResults.append(link);
    });
    if (!matches.length) {
      const message = document.createElement('p');
      message.textContent = 'Ничего не найдено. Попробуйте другой запрос.';
      searchResults.append(message);
    }
  }
  function openSearch() {
    if (searchDialog.open) return;
    searchReturnFocus = document.activeElement;
    setMenu(false);
    searchInput.value = '';
    renderSearch();
    searchDialog.showModal();
    searchInput.focus();
  }
  $$('[data-header-search]').forEach(button => button.addEventListener('click', openSearch));
  searchInput.addEventListener('input', renderSearch);
  $('#headerSearchClose').addEventListener('click', () => searchDialog.close());
  searchDialog.addEventListener('click', e => { if (e.target === searchDialog) searchDialog.close(); });
  searchDialog.addEventListener('close', () => { if (searchReturnFocus) searchReturnFocus.focus(); });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
  });

  // Keep FAQ exclusive where <details name> is not supported.
  const faq = $$('.faq-items details');
  faq.forEach(item => item.addEventListener('toggle', () => {
    if (item.open) faq.forEach(other => { if (other !== item) other.open = false; });
  }));

  // Section parts rise in once, staggered within each group.
  const reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-in'));
  } else {
    reveals.forEach(el => {
      const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
      el.style.transitionDelay = `${siblings.indexOf(el) * 80}ms`;
    });
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  }

  // Scroll-driven assembly. Without motion or on short screens every step stays readable.
  const assembly = $('#deviceAssembly');
  if (assembly) {
    const coverPart = $('.assembly-cover', assembly);
    const sticky = $('.assembly-sticky', assembly);
    const items = $$('.assembly-step', assembly);
    const buttons = $$('[data-assembly-step]', assembly);
    const segments = $$('.assembly-progress > span', assembly);
    const shortScreen = matchMedia('(max-height: 600px)');
    const clamp = v => Math.max(0, Math.min(1, v));
    const ease = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
    let enabled = false, raf = 0, current = -1;

    function setStep(index) {
      if (index === current) return;
      current = index;
      items.forEach((item, i) => {
        item.classList.toggle('is-active', i === index);
        if (i === index) buttons[i].setAttribute('aria-current', 'step');
        else buttons[i].removeAttribute('aria-current');
      });
    }
    function renderAssembly() {
      raf = 0;
      if (!enabled) return;
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const distance = Math.max(1, assembly.offsetHeight - sticky.offsetHeight);
      const progress = clamp((top - assembly.getBoundingClientRect().top) / distance);
      const spread = coverPart.offsetWidth / 440;
      const battery = ease(progress / .32), board = ease((progress - .32) / .32), cover = ease((progress - .64) / .32), gather = ease(progress / .96);
      const baseY = (145 * (1 - gather) + 20 * gather) * spread;
      const set = (k, v) => assembly.style.setProperty(k, v);
      set('--base-y', `${baseY}px`);
      set('--battery-y', `${((65 * (1 - battery)) + (baseY / spread - 15) * battery) * spread}px`);
      set('--board-y', `${((-35 * (1 - board)) + (baseY / spread - 26) * board) * spread}px`);
      set('--cover-y', `${(-145 * (1 - cover) - 14 * cover) * spread}px`);
      set('--interior-opacity', String(1 - ease((progress - .87) / .08)));
      set('--base-opacity', String(1 - ease((progress - .91) / .07)));
      set('--shadow-scale', String(1 - progress * .22));
      segments.forEach((seg, i) => seg.style.setProperty('--fill', String(clamp(progress * 3 - i))));
      setStep(Math.min(2, Math.floor(progress * 3)));
    }
    const schedule = () => { if (enabled && !raf) raf = requestAnimationFrame(renderAssembly); };
    function configure() {
      enabled = !reduceMotion && !shortScreen.matches;
      assembly.classList.toggle('assembly-ready', enabled);
      if (enabled) schedule();
      else { assembly.removeAttribute('style'); segments.forEach(seg => seg.style.removeProperty('--fill')); setStep(0); }
    }
    buttons.forEach((button, index) => button.addEventListener('click', () => {
      if (!enabled) { setStep(index); return; }
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const distance = Math.max(1, assembly.offsetHeight - sticky.offsetHeight);
      scrollTo({ top: scrollY + assembly.getBoundingClientRect().top - top + distance * [0, .48, .99][index], behavior: 'smooth' });
    }));
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', configure, { passive: true });
    shortScreen.addEventListener('change', configure);
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(sticky);
    configure();
  }

  // Jump replay: one FS 360 along a ballistic arc, seen from the side.
  const jump = $('#jump');
  if (!jump) return;
  const AIRTIME = 0.82;
  const G = 9.81;
  const P0 = [428, 322], C = [663, -20], P2 = [902, 404];
  const board = $('#board');
  const spin = $('#boardSpin');
  const ghosts = $('#ghosts');
  const scrub = $('#scrub');
  const out = { time: $('#rTime'), yaw: $('#rYaw'), height: $('#rHeight') };
  const ghostAt = [0, .14, .28, .42, .56, .7, .84, 1];
  const fmt = (n, d = 2) => n.toFixed(d).replace('.', ',');
  const smooth = t => t * t * (3 - 2 * t);

  function pose(u) {
    const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    const x = a * P0[0] + b * C[0] + c * P2[0];
    const y = a * P0[1] + b * C[1] + c * P2[1];
    const yaw = 360 * smooth(u);
    const cos = Math.cos(yaw * Math.PI / 180);
    // Seen from the side, a spinning board shortens to its width at 90° and 270°.
    const sx = Math.sign(cos || 1) * Math.max(Math.abs(cos), .16);
    const tilt = -18 + 40 * u;
    return { x, y, yaw, sx, tilt };
  }
  const transformFor = p => [`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.tilt.toFixed(1)})`, `scale(${p.sx.toFixed(3)} 1)`];

  const states = $$('#jumpStates li');
  const ghostEls = ghostAt.map(u => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const inner = spin.cloneNode(true);
    inner.removeAttribute('id');
    const [outer, scale] = transformFor(pose(u));
    g.setAttribute('class', 'ghost');
    g.dataset.fade = (.12 + .38 * u).toFixed(2);
    g.setAttribute('transform', outer);
    inner.setAttribute('transform', scale);
    g.append(inner);
    ghosts.append(g);
    return { u, el: g };
  });

  function render(u) {
    const p = pose(u);
    const [outer, scale] = transformFor(p);
    board.setAttribute('transform', outer);
    spin.setAttribute('transform', scale);
    // Ghosts trail behind the board like a long-exposure photo.
    ghostEls.forEach(g => { g.el.style.opacity = g.u <= u - .02 ? g.el.dataset.fade : 0; });
    const t = u * AIRTIME;
    const h = Math.max(0, G * AIRTIME / 2 * t - G * t * t / 2);
    out.time.textContent = fmt(t);
    out.yaw.textContent = Math.round(p.yaw);
    out.height.textContent = fmt(h);
    scrub.value = Math.round(u * 1000);
    scrub.setAttribute('aria-valuetext', `${fmt(t)} с, поворот ${Math.round(p.yaw)}°`);
    const state = u <= 0 ? 'ground' : u < .08 ? 'takeoff' : u < .92 ? 'airborne' : 'landing';
    states.forEach(li => li.classList.toggle('is-on', li.dataset.state === state));
  }

  let frame = 0;
  function play() {
    cancelAnimationFrame(frame);
    if (reduceMotion) { render(1); return; }
    const duration = 2400;
    let start = 0;
    const step = now => {
      if (!start) start = now;
      const u = Math.min(1, (now - start) / duration);
      render(u);
      if (u < 1) frame = requestAnimationFrame(step);
    };
    render(0);
    frame = requestAnimationFrame(step);
  }

  scrub.addEventListener('input', () => { cancelAnimationFrame(frame); render(scrub.value / 1000); });
  $('#replay').addEventListener('click', play);

  // On narrow screens frame the flight itself, so the labels stay legible.
  const scene = $('.jump-scene');
  const narrow = matchMedia('(max-width: 640px)');
  const frameScene = () => scene.setAttribute('viewBox', narrow.matches ? '300 100 760 430' : '100 100 1100 440');
  narrow.addEventListener('change', frameScene);
  frameScene();

  render(1);
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(play, 350); }
    }, { threshold: .45 });
    io.observe(jump);
  }
})();
