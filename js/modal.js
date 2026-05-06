// ── MODAL.JS ──────────────────────────────────────────────────────────────────
// Modal de detalle de producto: abrir, cerrar, galería interna, specs.
// ─────────────────────────────────────────────────────────────────────────────

import { CATS, STATUS, colorCss } from './config.js';
import { el, fmtPrice } from './utils.js';

// ── ESTADO INTERNO ────────────────────────────────────────────────────────────

let galleryImgs = [];
let galleryIdx = 0;
let _openGalleryModalFn = null; // se inyecta desde main.js

/** Permite inyectar la función del gallery modal para evitar circular deps */
export function setGalleryOpener(fn) {
  _openGalleryModalFn = fn;
}

// ── ABRIR MODAL ───────────────────────────────────────────────────────────────

export function openModal(p) {
  galleryImgs = p.images?.length ? p.images : [];
  galleryIdx = 0;

  const cat = CATS[p.category];
  const st = STATUS[p.estado] || STATUS.disponible;

  history.pushState({ modal: 'product' }, '');

  const waEnabled = p.estado === 'disponible' || p.estado === 'pocas';
  const waMsg = encodeURIComponent(`Hola, me interesa el ${p.name} (Q${p.price}), ¿está disponible?`);

  const waBtn = waEnabled
    ? `<button class="btn-whatsapp-modal"
         onclick="window.open('https://wa.me/50254834689?text=${waMsg}','_blank')">
         <i class="fa fa-whatsapp" style="font-size:20px;"></i> Consultar por WhatsApp
       </button>`
    : `<button class="btn-whatsapp-modal disabled" disabled>
         <i class="fa fa-whatsapp" style="font-size:20px;"></i> No disponible por WhatsApp aún
       </button>`;

  const agotadoNotice = p.estado === 'agotado'
    ? `<div class="agotado-notice">
         <div class="agotado-notice-icon">🚫</div>
         <div class="agotado-notice-text">
           <strong>Producto agotado</strong>
           <p>Este producto no está disponible actualmente. Escríbenos al WhatsApp para saber cuándo llega o para reservar.</p>
         </div>
       </div>` : '';

  const preventaNotice = p.estado === 'preventa'
    ? `<div class="preventa-notice">🔔 Próximamente disponible en local · Tercer Cantón, San Pedro Yepocapa</div>` : '';

  const statusBadge = `<div class="modal-status-badge ${st.cls}">
    <span class="status-dot"></span>${st.label}
  </div>`;

  const galleryHint = galleryImgs.length
    ? `<div class="modal-gallery-hint">🔍 Clic para ampliar</div>` : '';

  const galleryNav = galleryImgs.length > 1
    ? `<div class="modal-gallery-nav">
         <button class="gallery-arrow" id="gal-prev">&#8249;</button>
         <button class="gallery-arrow" id="gal-next">&#8250;</button>
       </div>` : '';

  const content = el('modal-content');
  content.innerHTML = `
    <div class="modal-img-side">
      <div class="modal-main-img-wrap" id="modal-main-img-wrap">
        ${galleryImgs.length
      ? `<img class="modal-main-img" id="modal-main-img" src="${galleryImgs[0]}" alt="${p.name}" draggable="false"/>`
      : `<div class="modal-no-img">${cat.icon}</div>`}
        ${galleryHint}
        ${galleryNav}
      </div>
      ${galleryImgs.length > 1 ? `
        <div class="modal-thumbs" id="modal-thumbs">
          ${galleryImgs.map((src, i) =>
        `<img class="modal-thumb${i === 0 ? ' active' : ''}"
                  src="${src}" data-idx="${i}" alt="img ${i + 1}"
                  onerror="this.style.display='none'"/>`
      ).join('')}
        </div>` : ''}
    </div>
    <div class="modal-info-side">
      <p class="modal-cat-tag">${cat.icon} ${cat.label}</p>
      <p class="modal-prod-brand">${p.brand}</p>
      <h2 class="modal-prod-name">${p.name}</h2>
      <div class="modal-prod-price"><sup>Q</sup>${fmtPrice(p.price)}</div>
      ${statusBadge}
      ${p.desc ? `<p class="modal-prod-desc">${p.desc}</p>` : ''}
      ${agotadoNotice}
      ${waBtn}
      ${preventaNotice}
      ${p.colors?.length ? `
        <div class="color-section">
          <div class="color-section-label">🎨 Colores disponibles</div>
          <div class="color-opts" id="modal-color-opts">
            ${p.colors.map((c, i) => `
              <div class="color-opt${i === 0 ? ' selected' : ''}" data-ci="${i}">
                <div class="color-opt-dot" style="background:${colorCss(c)};"></div>
                ${c}
              </div>`).join('')}
          </div>
        </div>` : ''}
      ${!preventaNotice ? `
        <div class="modal-store-note">
          📍 Disponible en tienda física · Tercer Cantón, San Pedro Yepocapa
        </div>` : ''}
      <div class="specs-section-modal">
        <div class="specs-section-label">Especificaciones</div>
        <div class="specs-table">${buildModalSpecs(p)}</div>
      </div>
    </div>`;

  // Flechas de galería interna
  if (galleryImgs.length > 1) {
    el('gal-prev')?.addEventListener('click', e => { e.stopPropagation(); changeGal(-1); });
    el('gal-next')?.addEventListener('click', e => { e.stopPropagation(); changeGal(1); });
    document.querySelectorAll('.modal-thumb').forEach(t => {
      t.addEventListener('click', e => { e.stopPropagation(); goGal(parseInt(t.dataset.idx)); });
    });
  }

  // Abrir galería full-screen al hacer clic en imagen
  const mainWrap = el('modal-main-img-wrap');
  if (mainWrap && galleryImgs.length) {
    mainWrap.style.cursor = 'pointer';
    mainWrap.addEventListener('click', e => {
      if (e.target.closest('.gallery-arrow')) return;
      e.stopPropagation();
      _openGalleryModalFn?.(galleryImgs, galleryIdx);
    });
  }

  // Selección de color
  document.querySelectorAll('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  el('modal-product').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// ── GALERÍA INTERNA ───────────────────────────────────────────────────────────

export function changeGal(dir) {
  goGal((galleryIdx + dir + galleryImgs.length) % galleryImgs.length);
}

function goGal(idx) {
  galleryIdx = idx;
  const img = el('modal-main-img');
  if (img) img.src = galleryImgs[idx];
  document.querySelectorAll('.modal-thumb').forEach((t, i) =>
    t.classList.toggle('active', i === idx)
  );
}

export function getCurrentGalleryIdx() { return galleryIdx; }
export function getCurrentGalleryImgs() { return galleryImgs; }

// ── CERRAR MODAL ──────────────────────────────────────────────────────────────

export function closeModal(pushState = true) {
  el('modal-product').classList.add('hidden');
  document.body.style.overflow = '';
  if (pushState && history.state?.modal === 'product') history.back();
}

// ── SPECS ─────────────────────────────────────────────────────────────────────

function buildModalSpecs(p) {
  const sc = (label, val) => val
    ? `<div class="spec-cell">
         <div class="spec-cell-label">${label}</div>
         <div class="spec-cell-val">${val}</div>
       </div>` : '';

  if (p.category === 'celulares')
    return sc('💾 Almacenamiento', p.storage) + sc('⚡ RAM', p.ram) + sc('🔧 Procesador', p.cpu)
      + sc('📺 Pantalla', p.screen) + sc('🔋 Batería', p.battery)
      + sc('📷 Cámara', p.camara) + sc('📱 Sistema', p.os);
  if (p.category === 'auriculares')
    return sc('🎧 Tipo', p.tipoAuri) + sc('📶 Conectividad', p.conect)
      + sc('🔋 Autonomía', p.autonomia) + sc('🔇 Cancelac. ruido', p.anc);
  if (p.category === 'relojes')
    return sc('⌚ Tipo', p.tipoReloj) + sc('📱 Compatibilidad', p.compat)
      + sc('🔋 Autonomía', p.batReloj) + sc('💧 Resistencia', p.resist);
  if (p.category === 'bocinas')
    return sc('🔊 Potencia', p.potencia) + sc('📶 Conectividad', p.conectBoc)
      + sc('🔋 Autonomía', p.autoBoc) + sc('💧 Resist. agua', p.agua);
  if (p.category === 'cargadores')
    return sc('🔌 Tipo carga', p.tipoCarga) + sc('⚡ Potencia', p.watts)
      + sc('📱 Compatibilidad', p.compatCarg) + sc('🔷 Puertos', p.puertos);
  if (p.category === 'accesorios')
    return sc('🎒 Tipo', p.tipoAcc) + sc('📱 Compatible con', p.compatAcc)
      + sc('✨ Material', p.material);
  return '';
}
