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

})();
