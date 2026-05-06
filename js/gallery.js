// ── GALLERY.JS ────────────────────────────────────────────────────────────────
// Modal de galería full-screen: navegación, dots, thumbnails, swipe.
// ─────────────────────────────────────────────────────────────────────────────

import { el } from './utils.js';

// ── ESTADO INTERNO ────────────────────────────────────────────────────────────

let galModalImgs = [];
let galModalIdx  = 0;

// ── ABRIR GALERÍA ─────────────────────────────────────────────────────────────

export function openGalleryModal(imgs, startIdx) {
  galModalImgs = imgs;
  galModalIdx  = startIdx || 0;

  history.pushState({ modal: 'gallery' }, '');

  const galModal = el('gallery-modal');
  galModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  renderGalleryModal();

  // Botones de navegación
  el('gal-modal-prev').onclick = e => { e.stopPropagation(); changeGalModal(-1); };
  el('gal-modal-next').onclick = e => { e.stopPropagation(); changeGalModal(1); };
  el('btn-close-gallery').onclick = e => { e.stopPropagation(); closeGalleryModal(); };
  el('gallery-modal-backdrop').onclick = () => closeGalleryModal();

  // Soporte de swipe en móvil
  let swipeStartX = 0;
  const imgWrap = galModal.querySelector('.gallery-modal-img-wrap');
  imgWrap.addEventListener('touchstart', e => {
    swipeStartX = e.touches[0].clientX;
  }, { passive: true });
  imgWrap.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - swipeStartX;
    if (Math.abs(dx) > 50) changeGalModal(dx < 0 ? 1 : -1);
  }, { passive: true });
}

// ── RENDER ────────────────────────────────────────────────────────────────────

function renderGalleryModal() {
  // Imagen principal
  const img = el('gallery-modal-img');
  if (img) img.src = galModalImgs[galModalIdx];

  // Dots de navegación
  const dotsEl = el('gallery-modal-dots');
  if (dotsEl && galModalImgs.length > 1) {
    dotsEl.innerHTML = galModalImgs.map((_, i) =>
      `<button class="gallery-dot${i === galModalIdx ? ' active' : ''}" data-gidx="${i}"></button>`
    ).join('');
    dotsEl.querySelectorAll('.gallery-dot').forEach(dot => {
      dot.addEventListener('click', e => {
        e.stopPropagation();
        goGalModal(parseInt(dot.dataset.gidx));
      });
    });
  } else if (dotsEl) {
    dotsEl.innerHTML = '';
  }

  // Miniaturas
  const thumbsEl = el('gallery-modal-thumbs');
  if (thumbsEl && galModalImgs.length > 1) {
    thumbsEl.innerHTML = galModalImgs.map((src, i) =>
      `<img class="gallery-modal-thumb${i === galModalIdx ? ' active' : ''}"
            src="${src}" data-gidx="${i}" alt=""/>`
    ).join('');
    thumbsEl.querySelectorAll('.gallery-modal-thumb').forEach(t => {
      t.addEventListener('click', e => {
        e.stopPropagation();
        goGalModal(parseInt(t.dataset.gidx));
      });
    });
  } else if (thumbsEl) {
    thumbsEl.innerHTML = '';
  }

  // Visibilidad de flechas
  const prevBtn = el('gal-modal-prev');
  const nextBtn = el('gal-modal-next');
  if (prevBtn) prevBtn.style.visibility = galModalImgs.length > 1 ? 'visible' : 'hidden';
  if (nextBtn) nextBtn.style.visibility = galModalImgs.length > 1 ? 'visible' : 'hidden';
}

// ── NAVEGACIÓN ────────────────────────────────────────────────────────────────

function changeGalModal(dir) {
  goGalModal((galModalIdx + dir + galModalImgs.length) % galModalImgs.length);
}

function goGalModal(idx) {
  galModalIdx = idx;
  renderGalleryModal();
}

// ── CERRAR GALERÍA ────────────────────────────────────────────────────────────

export let isClosingFromUI = false;

export function closeGalleryModal(pushState = true) {
  el('gallery-modal').classList.add('hidden');
  document.body.style.overflow = 'hidden'; // el product modal sigue abierto
  if (pushState && history.state?.modal === 'gallery') {
    isClosingFromUI = true;
    history.back();
  }
}
