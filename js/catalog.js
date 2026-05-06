// ── CATALOG.JS ────────────────────────────────────────────────────────────────
// Renderizado del catálogo: grids por categoría y tarjetas de producto.
// ─────────────────────────────────────────────────────────────────────────────

import { CATS, CAT_ORDER, STATUS, colorCss } from './config.js';
import { el, fmtPrice } from './utils.js';

// ── REORDENAR SECCIONES ───────────────────────────────────────────────────────

export function reorderSections(products) {
  const catalogo = el('catalogo');
  if (!catalogo) return;

  const sorted = [...CAT_ORDER].sort((a, b) => {
    const aHas = products.some(p => p.category === a) ? 0 : 1;
    const bHas = products.some(p => p.category === b) ? 0 : 1;
    if (aHas !== bHas) return aHas - bHas;
    return CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b);
  });

  sorted.forEach((cat, i) => {
    const sec = el(`sec-${cat}`);
    if (!sec) return;
    catalogo.appendChild(sec);
    sec.classList.toggle('catalog-section-alt', i % 2 === 1);
    const countEl = el(`count-${cat}`);
    if (countEl) countEl.style.background = i % 2 === 1 ? 'var(--bg)' : 'var(--bg-white)';
  });
}

// ── RENDER CATÁLOGOS ──────────────────────────────────────────────────────────

export function renderAllCatalogs(products, openModalFn) {
  Object.keys(CATS).forEach(cat => {
    const grid    = el(`grid-${cat}`);
    const emptyDiv = el(`empty-${cat}`);
    const countEl  = el(`count-${cat}`);
    const list     = products.filter(p => p.category === cat);

    if (countEl) countEl.textContent = `${list.length} producto${list.length !== 1 ? 's' : ''}`;
    if (!grid) return;

    grid.innerHTML = '';

    if (!list.length) {
      emptyDiv?.classList.remove('hidden');
      return;
    }
    emptyDiv?.classList.add('hidden');

    list.forEach(p => {
      const card = buildProductCard(p, openModalFn);
      grid.appendChild(card);
    });
  });

  reorderSections(products);
}

// ── CONSTRUIR TARJETA ─────────────────────────────────────────────────────────

export function buildProductCard(p, openModalFn) {
  const cat  = CATS[p.category];
  const st   = STATUS[p.estado] || STATUS.disponible;
  const img0 = p.images?.[0] || '';

  const card = document.createElement('div');
  card.className = `product-card pc-${p.category}`;

  card.innerHTML = `
    <div class="card-img-wrap">
      ${img0
        ? `<img src="${img0}" alt="${p.name}" loading="lazy"
               onerror="this.parentElement.innerHTML='<div class=\\'card-no-img\\'>${cat.icon}</div>'">`
        : `<div class="card-no-img">${cat.icon}</div>`}
      <div class="card-brand-badge">${p.brand}</div>
      <div class="card-status-badge ${st.cls}">${st.label}</div>
      ${(p.images?.length || 0) > 1
        ? `<div class="card-img-count">🖼 ${p.images.length}</div>` : ''}
    </div>
    <div class="card-body">
      <div class="card-cat-label">${cat.icon} ${cat.label}</div>
      <div class="card-name">${p.name}</div>
      <div class="card-chips">${buildChips(p)}</div>
      ${buildColorDots(p.colors || [])}
      <div class="card-footer">
        <div class="card-price"><sup>Q</sup>${fmtPrice(p.price)}</div>
        <button class="card-cta">Ver detalle</button>
      </div>
    </div>`;

  card.addEventListener('click', () => openModalFn(p));

  return card;
}

// ── CHIPS ─────────────────────────────────────────────────────────────────────

function buildChips(p) {
  const c = t => `<span class="chip">${t}</span>`;
  if (p.category === 'celulares')
    return [p.storage && c(`💾 ${p.storage}`), p.ram && c(`⚡ ${p.ram} RAM`), p.os && c(p.os)].filter(Boolean).join('');
  if (p.category === 'auriculares')
    return [p.tipoAuri && c(p.tipoAuri), p.conect && c(p.conect), p.autonomia && c(`🔋 ${p.autonomia}`)].filter(Boolean).join('');
  if (p.category === 'relojes')
    return [p.tipoReloj && c(p.tipoReloj), p.compat && c(p.compat), p.batReloj && c(`🔋 ${p.batReloj}`)].filter(Boolean).join('');
  if (p.category === 'bocinas')
    return [p.potencia && c(`🔊 ${p.potencia}`), p.autoBoc && c(`🔋 ${p.autoBoc}`), p.agua && c(p.agua)].filter(Boolean).join('');
  if (p.category === 'cargadores')
    return [p.watts && c(`⚡ ${p.watts}`), p.tipoCarga && c(p.tipoCarga), p.puertos && c(p.puertos)].filter(Boolean).join('');
  if (p.category === 'accesorios')
    return [p.tipoAcc && c(p.tipoAcc), p.compatAcc && c(p.compatAcc), p.material && c(p.material)].filter(Boolean).join('');
  return '';
}

// ── COLOR DOTS ────────────────────────────────────────────────────────────────

function buildColorDots(colors) {
  if (!colors.length) return '';
  const show = colors.slice(0, 6);
  const more = colors.length - 6;
  const dots = show.map(c =>
    `<div class="color-dot" style="background:${colorCss(c)};" title="${c}"></div>`
  ).join('');
  return `<div class="card-color-row">${dots}${more > 0 ? `<span class="more-colors">+${more}</span>` : ''}</div>`;
}