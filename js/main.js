// ── MAIN.JS ───────────────────────────────────────────────────────────────────
import { el } from './utils.js';
import { CATS } from './config.js';
import { loadProducts, db } from './db.js';
import { renderAllCatalogs } from './catalog.js';
import { openModal, closeModal, changeGal, setGalleryOpener } from './modal.js';
import { openGalleryModal, closeGalleryModal, isClosingFromUI } from './gallery.js';
import { injectSearchPanelDOM, initSearchPanel, closeSearchPanel, isSearchOpen } from './search.js';

let products = [];

document.addEventListener('DOMContentLoaded', async () => {
  injectSearchPanelDOM();
  products = await loadProducts();
  renderAllCatalogs(products, openModal);
  setGalleryOpener(openGalleryModal);
  bindAll();
  initSearchPanel(products, openModal);
  initBackGesture();

  // ── REALTIME ──
  db.channel('products-realtime')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      async () => {
        products = await loadProducts();
        renderAllCatalogs(products, openModal);
        initSearchPanel(products, openModal);
      }
    )
    .subscribe();
});

function initBackGesture() {
  window.addEventListener('popstate', () => {
    if (isClosingFromUI) return;
    if (!el('gallery-modal').classList.contains('hidden')) { closeGalleryModal(false); return; }
    if (!el('modal-product').classList.contains('hidden')) { closeModal(false); return; }
  });
}

function bindAll() {
  el('hamburger').addEventListener('click', () => {
    el('mobile-nav').classList.toggle('hidden');
    el('hamburger').classList.toggle('open');
  });
  document.querySelectorAll('.mobile-nav .cat-btn').forEach(a => {
    a.addEventListener('click', () => {
      el('mobile-nav').classList.add('hidden');
      el('hamburger').classList.remove('open');
    });
  });

  el('btn-close-modal').addEventListener('click', () => closeModal());
  el('modal-backdrop').addEventListener('click', () => closeModal());

  const sections = Object.keys(CATS).map(cat => el(`sec-${cat}`)).filter(Boolean);
  const navLinks = document.querySelectorAll('.cat-nav-link');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link =>
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)
        );
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(s => observer.observe(s));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (isSearchOpen())                                       { closeSearchPanel(); return; }
      if (!el('gallery-modal').classList.contains('hidden'))   { closeGalleryModal(); return; }
      if (!el('modal-product').classList.contains('hidden'))   { closeModal(); return; }
    }
    if (!el('modal-product').classList.contains('hidden')) {
      if (e.key === 'ArrowLeft')  changeGal(-1);
      if (e.key === 'ArrowRight') changeGal(1);
    }
  });
}