(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Design tokens, rounded surfaces and theme behavior follow the Alex-fgCV portfolio design system.
  const themeToggle = document.querySelector('#themeToggle');
  let theme = 'dark';
  try { theme = localStorage.getItem('fg-track-theme') === 'light' ? 'light' : 'dark'; } catch (_) {}
  function applyTheme(next) {
    theme = next === 'light' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
    themeToggle.setAttribute('aria-label', theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', theme === 'light' ? '#eef2e9' : '#090c0a');
    try { localStorage.setItem('fg-track-theme', theme); } catch (_) {}
  }
  themeToggle.addEventListener('click', () => applyTheme(theme === 'light' ? 'dark' : 'light'));
  applyTheme(theme);

  const header = $('#siteHeader');
  let scrollTicking = false;
  function syncScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 30);
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(syncScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', syncScroll);
  syncScroll();

  const menuToggle = $('#menuToggle');
  const siteNav = $('#mobileMenu');
  const compactHeader = window.matchMedia('(max-width: 1140px)');
  function setMenu(open) {
    open = open && compactHeader.matches;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    siteNav.classList.toggle('is-open', open);
    siteNav.setAttribute('aria-hidden', String(!open));
    siteNav.inert = !open;
    document.body.classList.toggle('menu-open', open);
  }
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', siteNav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });
  document.addEventListener('click', e => {
    if (!siteNav.contains(e.target) && !menuToggle.contains(e.target)) setMenu(false);
  });
  compactHeader.addEventListener('change', () => setMenu(false));

  const searchDialog = $('#headerSearchDialog');
  const searchInput = $('#headerSearchInput');
  const searchResults = $('#headerSearchResults');
  const searchSections = [...document.querySelectorAll('#siteNav a')].map(link => ({
    label: link.textContent,
    href: link.getAttribute('href'),
    content: document.querySelector(link.getAttribute('href'))?.textContent || ''
  }));
  let searchReturnFocus = null;
  function renderSearch() {
    const query = searchInput.value.trim().toLocaleLowerCase('ru');
    const matches = searchSections.filter(section => `${section.label} ${section.content}`.toLocaleLowerCase('ru').includes(query));
    searchResults.replaceChildren();
    matches.forEach(section => {
      const link = document.createElement('a');
      link.href = section.href;
      link.textContent = section.label;
      link.addEventListener('click', () => {
        searchReturnFocus = null;
        searchDialog.close();
      });
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
    if (e.key === 'Escape' && searchDialog.open) {
      e.preventDefault();
      searchDialog.close();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    $$('.reveal').forEach(element => element.classList.add('in-view'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -35px 0px', threshold: .08 });
    $$('.reveal').forEach((element, i) => {
      element.style.transitionDelay = `${Math.min(i % 4, 3) * 75}ms`;
      observer.observe(element);
    });
  }

  // FrogeeSoft wordmark is bundled locally from the project presentation.
  // A text fallback is shown if the local image cannot load.
  const frogeeBrand = document.querySelector('.frogee-brand');
  if (frogeeBrand) {
    const sources = Array.from(frogeeBrand.querySelectorAll(':scope > img'));
    sources.forEach(img => {
      const handleMissing = () => { frogeeBrand.classList.add('offline-brand'); };
      img.addEventListener('error', handleMissing, { once: true });
      if (img.complete && img.naturalWidth === 0) handleMissing();
    });
  }

  // Keep FAQ exclusive even in browsers without native <details name="…"> support.
  const faqItems = $$('.faq-item');
  faqItems.forEach(item => {
    const summary = $('summary', item);
    if (!summary) return;
    summary.addEventListener('click', () => {
      if (!item.open) faqItems.forEach(other => { if (other !== item) other.open = false; });
    });
  });

  if (!reduceMotion && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const photo = $('#heroPhoto');
    const hero = $('.hero');
    if (photo && hero) {
      hero.addEventListener('pointermove', event => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        photo.style.transform = `translate3d(${(-x * 11).toFixed(1)}px, ${(-y * 8).toFixed(1)}px, 0)`;
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { photo.style.transform = ''; });
    }
  }

  // Progressive enhancement: keep the exploded view and every description without motion.
  const assembly = document.querySelector('#deviceAssembly');
  if (assembly) {
    const coverPart = assembly.querySelector('.assembly-cover');
    const sticky = assembly.querySelector('.assembly-sticky');
    const items = [...assembly.querySelectorAll('.assembly-step')];
    const buttons = [...assembly.querySelectorAll('[data-assembly-step]')];
    const segments = [...assembly.querySelectorAll('.assembly-progress > span')];
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const shortScreen = matchMedia('(max-height: 600px)');
    const narrowScreen = matchMedia('(max-width: 740px)');
    const clamp = value => Math.max(0, Math.min(1, value));
    const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
    let enabled = false;
    let frame = 0;
    let current = -1;

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
      frame = 0;
      if (!enabled) return;
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const distance = Math.max(1, assembly.offsetHeight - sticky.offsetHeight);
      const progress = clamp((top - assembly.getBoundingClientRect().top) / distance);
      const size = coverPart.offsetWidth;
      const spread = size / 440;
      const battery = ease(progress / .32);
      const board = ease((progress - .32) / .32);
      const cover = ease((progress - .64) / .32);
      const gather = ease(progress / .96);
      // All four layers share one projection. The base rises as the internals settle.
      const baseY = (145 * (1 - gather) + 20 * gather) * spread;
      assembly.style.setProperty('--base-y', `${baseY}px`);
      assembly.style.setProperty('--battery-y', `${((65 * (1 - battery)) + (baseY / spread - 15) * battery) * spread}px`);
      assembly.style.setProperty('--board-y', `${((-35 * (1 - board)) + (baseY / spread - 26) * board) * spread}px`);
      assembly.style.setProperty('--cover-y', `${(-145 * (1 - cover) - 14 * cover) * spread}px`);
      assembly.style.setProperty('--interior-opacity', String(1 - ease((progress - .87) / .08)));
      assembly.style.setProperty('--base-opacity', String(1 - ease((progress - .91) / .07)));
      assembly.style.setProperty('--shadow-scale', String(1 - progress * .22));
      segments.forEach((segment, i) => segment.style.setProperty('--fill', String(clamp(progress * 3 - i))));
      const step = Math.min(2, Math.floor(progress * 3));
      setStep(step);
    }

    function scheduleAssembly() {
      if (enabled && !frame) frame = requestAnimationFrame(renderAssembly);
    }

    function configureAssembly() {
      enabled = !motion.matches && !shortScreen.matches;
      assembly.classList.toggle('assembly-ready', enabled);
      if (enabled) scheduleAssembly();
      else {
        assembly.removeAttribute('style');
        segments.forEach(segment => segment.style.removeProperty('--fill'));
        setStep(0);
      }
    }

    buttons.forEach((button, index) => button.addEventListener('click', () => {
      if (!enabled) { setStep(index); return; }
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const distance = Math.max(1, assembly.offsetHeight - sticky.offsetHeight);
      const target = window.scrollY + assembly.getBoundingClientRect().top - top + distance * [0, .48, .99][index];
      window.scrollTo({ top: target, behavior: 'smooth' });
    }));
    window.addEventListener('scroll', scheduleAssembly, { passive: true });
    window.addEventListener('resize', configureAssembly, { passive: true });
    motion.addEventListener('change', configureAssembly);
    shortScreen.addEventListener('change', configureAssembly);
    narrowScreen.addEventListener('change', configureAssembly);
    if ('ResizeObserver' in window) new ResizeObserver(scheduleAssembly).observe(sticky);
    configureAssembly();
  }

})();
