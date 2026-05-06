// ── SEARCH.JS ─────────────────────────────────────────────────────────────────
// Panel de búsqueda: inyección de DOM, apertura, cierre y renderizado.
// ─────────────────────────────────────────────────────────────────────────────

import { el } from './utils.js';
import { db } from './db.js';
import { buildProductCard } from './catalog.js';

// ── ESTADO ────────────────────────────────────────────────────────────────────

let searchPanelActive = false;

// ── INYECTAR DOM ──────────────────────────────────────────────────────────────

/** Crea el overlay y el panel de resultados en el DOM */
export function injectSearchPanelDOM() {
  const overlay = document.createElement('div');
  overlay.id = 'search-fullscreen-overlay';
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.id = 'search-results-panel';
  panel.innerHTML = `
    <div id="search-results-inner">
      <div id="search-results-header">
        <div>
          <div id="search-results-title">🔍 Buscando...</div>
          <div id="search-result-count-panel"></div>
        </div>
      </div>
      <div id="search-results-grid-panel" class="product-grid"></div>
      <div id="search-empty-panel" class="search-empty-panel hidden">
        <div class="search-empty-icon">🔍</div>
        <div class="search-empty-title"></div>
        <div class="search-empty-sub">Intenta con otro nombre, marca o categoría</div>
      </div>
    </div>`;
  document.body.appendChild(panel);
}

// ── INICIALIZAR ───────────────────────────────────────────────────────────────

/**
 * @param {Array} products - lista de productos cargados
 * @param {Function} openModalFn - función para abrir el modal de producto
 * @param {Function} openEditModalFn - función para abrir el modal de edición
 */
export function initSearchPanel(products, openModalFn, openEditModalFn) {
  const searchInput = el('search-input');
  const headerInner = document.querySelector('.header-inner');
  const clearBtn = document.querySelector('.search-clear-btn');
  const overlay = el('search-fullscreen-overlay');

  if (!searchInput) return;

  searchInput.addEventListener('focus', () => {
    headerInner.classList.add('search-expanded');
    if (searchInput.value.trim()) openSearchPanel();
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    clearBtn?.classList.toggle('visible', q.length > 0);
    if (q) { openSearchPanel(); renderSearchPanel(q, products, openModalFn, openEditModalFn); }
    else closeSearchPanel();
  });

  overlay?.addEventListener('click', () => {
    closeSearchPanel();
    searchInput.blur();
  });

  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.remove('visible');
    closeSearchPanel();
    headerInner?.classList.remove('search-expanded');
    searchInput.blur();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && searchPanelActive) {
      closeSearchPanel();
      searchInput.blur();
    }
  });

  // Búsqueda móvil
  const mobileSearch = el('search-mobile');
  if (mobileSearch) {
    mobileSearch.addEventListener('input', () => {
      const q = mobileSearch.value.trim();
      if (q) { openSearchPanel(); renderSearchPanel(q, products, openModalFn, openEditModalFn); }
      else closeSearchPanel();
    });
  }
}

// ── ABRIR / CERRAR ────────────────────────────────────────────────────────────

export function openSearchPanel() {
  searchPanelActive = true;
  el('search-fullscreen-overlay')?.classList.add('active');
  el('search-results-panel')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeSearchPanel() {
  searchPanelActive = false;
  el('search-fullscreen-overlay')?.classList.remove('active');
  el('search-results-panel')?.classList.remove('active');
  document.body.style.overflow = '';
  const headerInner = document.querySelector('.header-inner');
  if (el('search-input')?.value === '') {
    headerInner?.classList.remove('search-expanded');
  }
}

export function isSearchOpen() { return searchPanelActive; }

// ── RENDERIZAR RESULTADOS ─────────────────────────────────────────────────────

function renderSearchPanel(query, products, openModalFn, openEditModalFn) {
  const q = query.toLowerCase().trim();
  const title = el('search-results-title');
  const count = el('search-result-count-panel');
  const grid = el('search-results-grid-panel');
  const empty = el('search-empty-panel');
  if (!grid) return;

  const matches = products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    (p.desc || '').toLowerCase().includes(q)
  );

  if (title) title.textContent = `🔍 Resultados para "${query}"`;
  if (count) count.textContent = matches.length
    ? `${matches.length} producto${matches.length !== 1 ? 's' : ''} encontrado${matches.length !== 1 ? 's' : ''}`
    : '';

  grid.innerHTML = '';

  if (!matches.length) {
    empty.classList.remove('hidden');
    const t = empty.querySelector('.search-empty-title');
    if (t) t.textContent = `No encontramos "${query}"`;
    return;
  }
  empty.classList.add('hidden');

  db.auth.getSession().then(({ data: { session } }) => {
    matches.forEach(p => {
      const card = buildProductCard(p, session, (prod) => {
        closeSearchPanel();
        openModalFn(prod);
      }, openEditModalFn);
      grid.appendChild(card);
    });
  });
}
