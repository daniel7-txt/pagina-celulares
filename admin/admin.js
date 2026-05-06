// ══════════════════════════════════════════
//  admin.js — Tecnología Yepocapa
// ══════════════════════════════════════════

import { loadProducts, saveProduct, removeProduct, uploadImage } from '../js/db.js';
import { uid, fmtPrice } from '../js/utils.js';
import { CATS, STATUS, colorCss } from '../js/config.js';

// ── SUPABASE AUTH ──
const SUPABASE_URL = 'https://ofinrpmjgdjbnhnqhrik.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f7qd8HeXaC9hxAoKKCejgA_ZTb1SCb0';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── ESTADO GLOBAL ──
let products = [];
let filterCat = 'todos';
let addCat = 'celulares';
let addImages = [], addColors = [];
let editImages = [], editColors = [];
let addPendingSrc = '', editPendingSrc = '';

// Shortcut para getElementById
const el = id => document.getElementById(id);

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
if (session) {
  showAdmin();
  products = await loadProducts();
  renderStats();
  renderRecentList();
  renderProductList();
} else {
  el('login-page').classList.remove('hidden');
  el('admin-page').classList.add('hidden');
}
bindEvents();
});

function showAdmin() {
  el('login-page').classList.add('hidden');
  el('admin-page').classList.remove('hidden');
}

// ══════════════════════════════════════════
//  AUTH — LOGIN / LOGOUT
// ══════════════════════════════════════════
async function login() {
  const email = el('login-user').value.trim();
  const pass = el('login-pass').value;
  if (!email || !pass) { showAlert('login-msg', 'error', 'Completá todos los campos.'); return; }
  showAlert('login-msg', 'info', 'Iniciando sesión...');
  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) {
    showAlert('login-msg', 'error', 'Credenciales incorrectas.');
    el('login-pass').value = '';
    return;
  }
  showAlert('login-msg', 'success', '¡Bienvenido! Cargando panel...');
  setTimeout(async () => {
    showAdmin();
    products = await loadProducts();
    renderStats();
    renderRecentList();
    renderProductList();
  }, 600);
}

async function logout() {
  await db.auth.signOut();
  el('admin-page').classList.add('hidden');
  el('login-page').classList.remove('hidden');
  el('login-user').value = '';
  el('login-pass').value = '';
  hideAlert('login-msg');
}

// ══════════════════════════════════════════
//  NAVEGACIÓN ENTRE VISTAS
// ══════════════════════════════════════════
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el(`view-${name}`).classList.add('active');
  document.querySelector(`[data-view="${name}"]`)?.classList.add('active');
  const titles = { dashboard: 'Dashboard', agregar: 'Agregar producto', gestionar: 'Gestionar productos' };
  el('topbar-title').textContent = titles[name] || name;
  el('topbar-badge').textContent = name === 'gestionar' ? `${products.length} productos` : '';
  if (name === 'gestionar') renderProductList();
  if (name === 'dashboard') { renderStats(); renderRecentList(); }
}

// Exponer globalmente para el onclick del HTML
window.switchView = switchView;

// ══════════════════════════════════════════
//  DASHBOARD — STATS
// ══════════════════════════════════════════
function renderStats() {
  Object.keys(CATS).forEach(cat => {
    const count = products.filter(p => p.category === cat).length;
    const statEl = el(`stat-${cat}`);
    if (statEl) statEl.textContent = count;
  });
}

// ══════════════════════════════════════════
//  RENDERIZADO DE LISTAS
// ══════════════════════════════════════════
function renderRecentList() {
  renderRows(el('recent-list'), products.slice(0, 8));
}

function renderProductList() {
  const q = el('admin-search')?.value.toLowerCase().trim() || '';
  let list = filterCat === 'todos' ? products : products.filter(p => p.category === filterCat);
  if (q) list = list.filter(p =>
    p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  );
  renderRows(el('product-list'), list);
}

function renderRows(container, list) {
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = `<div class="empty-list"><div class="empty-list-icon">📦</div><p>No hay productos aquí</p></div>`;
    return;
  }
  list.forEach(p => {
    const cat = CATS[p.category];
    const st = STATUS[p.estado] || STATUS.disponible;
    const img0 = p.images?.[0] || '';
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `
      ${img0
        ? `<img class="table-img" src="${img0}" alt="" onerror="this.outerHTML='<div class=\\'table-no-img\\'>${cat.icon}</div>'">`
        : `<div class="table-no-img">${cat.icon}</div>`}
      <div>
        <div class="table-name">${p.name}</div>
        <div class="table-brand">${p.brand}</div>
      </div>
      <div><span class="table-cat">${cat.icon} ${cat.label}</span></div>
      <div class="table-price">Q${fmtPrice(p.price)}</div>
      <div><span class="status-badge ${st.cls}">${st.label}</span></div>
      <div class="table-actions">
        <button class="action-btn" title="Editar" data-edit="${p.id}">✏️</button>
        <button class="action-btn del" title="Eliminar" data-del="${p.id}">🗑️</button>
      </div>`;
    row.querySelector('[data-edit]').addEventListener('click', () => openEditModal(p.id));
    row.querySelector('[data-del]').addEventListener('click', () => deleteProduct(p.id));
    container.appendChild(row);
  });
}

// ══════════════════════════════════════════
//  AGREGAR PRODUCTO
// ══════════════════════════════════════════
async function addProduct() {
  const name = el('prod-name').value.trim();
  const brand = el('prod-brand').value.trim();
  const price = parseFloat(el('prod-price').value);
  const desc = el('prod-desc').value.trim();
  const estado = el('prod-estado').value;

  if (!name) { showAlert('form-msg', 'error', 'El campo Nombre es obligatorio.'); return; }
  if (!brand) { showAlert('form-msg', 'error', 'El campo Marca es obligatorio.'); return; }
  if (!price || isNaN(price) || price <= 0) { showAlert('form-msg', 'error', 'Ingresa un precio válido.'); return; }
  if (!addColors.length) { showAlert('form-msg', 'error', 'Agrega al menos un color.'); return; }

  const extra = getSpecs('add');
  if (extra === null) return;

  showAlert('form-msg', 'info', 'Guardando...');
  const prod = {
    id: uid(), category: addCat, name, brand, price, estado, desc,
    images: addImages.map(i => i.src),
    colors: addColors.map(c => c.name),
    ...extra
  };
  try {
    await saveProduct(prod);
    products.unshift(prod);
    renderStats(); renderRecentList(); renderProductList();
    resetAddForm();
    showAlert('form-msg', 'success', `${CATS[addCat].icon} Producto agregado correctamente.`);
    setTimeout(() => hideAlert('form-msg'), 3000);
  } catch {
    showAlert('form-msg', 'error', 'Error al guardar.');
  }
}

// ══════════════════════════════════════════
//  ELIMINAR PRODUCTO
// ══════════════════════════════════════════
async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await removeProduct(id);
    products = products.filter(p => p.id !== id);
    renderStats(); renderRecentList(); renderProductList();
  } catch {
    alert('Error al eliminar.');
  }
}

// ══════════════════════════════════════════
//  EDITAR PRODUCTO — MODAL
// ══════════════════════════════════════════
function openEditModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const cat = CATS[p.category];

  el('edit-id').value = p.id;
  el('edit-name').value = p.name;
  el('edit-brand').value = p.brand;
  el('edit-price').value = p.price;
  el('edit-desc').value = p.desc || '';
  el('edit-estado').value = p.estado || 'disponible';
  el('edit-cat-label').textContent = `${cat.icon} ${cat.label}`;

  editImages = (p.images || []).map(src => ({ src }));
  renderEditGallery();
  el('edit-img-add-controls').classList.add('hidden');
  editPendingSrc = '';

  editColors = (p.colors || []).map(n => ({ name: n, css: colorCss(n) }));
  renderColorTags('edit-color-chips', editColors);

  Object.keys(CATS).forEach(c =>
    el(`edit-specs-${c}`)?.classList.toggle('hidden', c !== p.category)
  );
  fillEditSpecs(p);
  hideAlert('edit-msg');
  el('modal-edit').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  el('modal-edit').classList.add('hidden');
  document.body.style.overflow = '';
}

async function saveEdit() {
  const id = el('edit-id').value;
  const idx = products.findIndex(x => x.id === id);
  if (idx === -1) return;
  const p = products[idx];
  const name = el('edit-name').value.trim();
  const brand = el('edit-brand').value.trim();
  const price = parseFloat(el('edit-price').value);
  const desc = el('edit-desc').value.trim();
  const estado = el('edit-estado').value;

  if (!name) { showAlert('edit-msg', 'error', 'Nombre obligatorio.'); return; }
  if (!brand) { showAlert('edit-msg', 'error', 'Marca obligatoria.'); return; }
  if (!price || isNaN(price) || price <= 0) { showAlert('edit-msg', 'error', 'Precio inválido.'); return; }
  if (!editColors.length) { showAlert('edit-msg', 'error', 'Agrega al menos un color.'); return; }

  const extra = getSpecs('edit', p.category);
  if (extra === null) return;

  const updated = {
    ...p, name, brand, price, estado, desc,
    images: editImages.map(i => i.src),
    colors: editColors.map(c => c.name),
    ...extra
  };
  showAlert('edit-msg', 'info', 'Guardando...');
  try {
    await saveProduct(updated);
    products[idx] = updated;
    renderStats(); renderRecentList(); renderProductList();
    showAlert('edit-msg', 'success', 'Cambios guardados ✓');
    setTimeout(closeEditModal, 800);
  } catch {
    showAlert('edit-msg', 'error', 'Error al guardar.');
  }
}

// ══════════════════════════════════════════
//  SPECS POR CATEGORÍA
// ══════════════════════════════════════════
function getSpecs(prefix, forceCat) {
  const cat = forceCat || addCat;
  const g = id => document.getElementById(prefix === 'add' ? id : id.replace('prod-', 'edit-'))?.value.trim() || '';
  const err = msg => { showAlert(prefix === 'add' ? 'form-msg' : 'edit-msg', 'error', msg); return null; };

  if (cat === 'celulares') {
    const s = g('prod-storage'), r = g('prod-ram'), c = g('prod-cpu');
    if (!s || !r || !c) return err('Almacenamiento, RAM y Procesador son obligatorios.');
    return { storage: s, ram: r, cpu: c, screen: g('prod-screen'), battery: g('prod-battery'), camara: g('prod-camara'), os: g('prod-os') };
  }
  if (cat === 'auriculares') {
    const t = g('prod-tipo-auri'), c = g('prod-conect');
    if (!t || !c) return err('Tipo y Conectividad son obligatorios.');
    return { tipoAuri: t, conect: c, autonomia: g('prod-autonomia'), anc: g('prod-anc') };
  }
  if (cat === 'relojes') {
    const t = g('prod-tipo-reloj'), c = g('prod-compat');
    if (!t || !c) return err('Tipo y Compatibilidad son obligatorios.');
    return { tipoReloj: t, compat: c, batReloj: g('prod-bat-reloj'), resist: g('prod-resist') };
  }
  if (cat === 'bocinas') {
    const p2 = g('prod-potencia'), c = g('prod-conect-boc');
    if (!p2 || !c) return err('Potencia y Conectividad son obligatorios.');
    return { potencia: p2, conectBoc: c, autoBoc: g('prod-auto-boc'), agua: g('prod-agua') };
  }
  if (cat === 'cargadores') {
    const t = g('prod-tipo-carga'), w = g('prod-watts');
    if (!t || !w) return err('Tipo de carga y Potencia son obligatorios.');
    return { tipoCarga: t, watts: w, compatCarg: g('prod-compat-carg'), puertos: g('prod-puertos') };
  }
  if (cat === 'accesorios') {
    const t = g('prod-tipo-acc'), c = g('prod-compat-acc');
    if (!t || !c) return err('Tipo y Compatibilidad son obligatorios.');
    return { tipoAcc: t, compatAcc: c, material: g('prod-material') };
  }
  return {};
}

function fillEditSpecs(p) {
  const sv = (id, val) => { const e = document.getElementById(id); if (e) e.value = val || ''; };
  if (p.category === 'celulares') { sv('edit-storage', p.storage); sv('edit-ram', p.ram); sv('edit-cpu', p.cpu); sv('edit-screen', p.screen); sv('edit-battery', p.battery); sv('edit-camara', p.camara); sv('edit-os', p.os); }
  else if (p.category === 'auriculares') { sv('edit-tipo-auri', p.tipoAuri); sv('edit-conect', p.conect); sv('edit-autonomia', p.autonomia); sv('edit-anc', p.anc); }
  else if (p.category === 'relojes') { sv('edit-tipo-reloj', p.tipoReloj); sv('edit-compat', p.compat); sv('edit-bat-reloj', p.batReloj); sv('edit-resist', p.resist); }
  else if (p.category === 'bocinas') { sv('edit-potencia', p.potencia); sv('edit-conect-boc', p.conectBoc); sv('edit-auto-boc', p.autoBoc); sv('edit-agua', p.agua); }
  else if (p.category === 'cargadores') { sv('edit-tipo-carga', p.tipoCarga); sv('edit-watts', p.watts); sv('edit-compat-carg', p.compatCarg); sv('edit-puertos', p.puertos); }
  else if (p.category === 'accesorios') { sv('edit-tipo-acc', p.tipoAcc); sv('edit-compat-acc', p.compatAcc); sv('edit-material', p.material); }
}

// ══════════════════════════════════════════
//  GALERÍAS DE IMÁGENES
// ══════════════════════════════════════════
function renderAddGallery() {
  const g = el('multi-img-gallery');
  const slot = el('add-img-slot');
  g.querySelectorAll('.img-slot-thumb').forEach(s => s.remove());
  addImages.forEach((img, i) => {
    const t = document.createElement('div');
    t.className = 'img-slot-thumb';
    t.innerHTML = `<img src="${img.src}" alt=""/><button class="img-slot-del">✕</button>`;
    t.querySelector('.img-slot-del').onclick = () => { addImages.splice(i, 1); renderAddGallery(); };
    g.insertBefore(t, slot);
  });
  slot.style.display = addImages.length >= 6 ? 'none' : 'flex';
}

function renderEditGallery() {
  const g = el('edit-multi-img-gallery');
  const slot = el('edit-add-img-slot');
  g.querySelectorAll('.img-slot-thumb').forEach(s => s.remove());
  editImages.forEach((img, i) => {
    const t = document.createElement('div');
    t.className = 'img-slot-thumb';
    t.innerHTML = `<img src="${img.src}" alt=""/><button class="img-slot-del">✕</button>`;
    t.querySelector('.img-slot-del').onclick = () => { editImages.splice(i, 1); renderEditGallery(); };
    g.insertBefore(t, slot);
  });
  slot.style.display = editImages.length >= 6 ? 'none' : 'flex';
}

function updatePreview(src, imgId, phId) {
  const img = el(imgId), ph = el(phId);
  if (src) { img.src = src; img.classList.remove('hidden'); ph.classList.add('hidden'); }
  else { img.classList.add('hidden'); ph.classList.remove('hidden'); }
}

// ══════════════════════════════════════════
//  COLORES
// ══════════════════════════════════════════
function pushColor(name, arr, chipsId) {
  name.split(',').forEach(n => {
    n = n.trim();
    if (!n || arr.find(c => c.name.toLowerCase() === n.toLowerCase())) return;
    arr.push({ name: n, css: colorCss(n) });
  });
  renderColorTags(chipsId, arr);
}

function renderColorTags(id, arr) {
  const container = el(id);
  container.innerHTML = '';
  arr.forEach((c, i) => {
    const tag = document.createElement('div');
    tag.className = 'color-tag';
    tag.innerHTML = `<div class="color-tag-dot" style="background:${c.css};"></div><span>${c.name}</span><button class="color-tag-del">✕</button>`;
    tag.querySelector('.color-tag-del').onclick = () => { arr.splice(i, 1); renderColorTags(id, arr); };
    container.appendChild(tag);
  });
}

// ══════════════════════════════════════════
//  RESET FORMULARIO AGREGAR
// ══════════════════════════════════════════
function resetAddForm() {
  addImages = []; addColors = [];
  renderAddGallery();
  renderColorTags('color-chips', addColors);
  el('img-add-controls').classList.add('hidden');
  addPendingSrc = '';
  [
    'prod-name', 'prod-brand', 'prod-price', 'prod-storage', 'prod-ram', 'prod-cpu',
    'prod-screen', 'prod-battery', 'prod-camara', 'prod-os', 'prod-tipo-auri', 'prod-conect',
    'prod-autonomia', 'prod-anc', 'prod-tipo-reloj', 'prod-compat', 'prod-bat-reloj',
    'prod-resist', 'prod-potencia', 'prod-conect-boc', 'prod-auto-boc', 'prod-agua',
    'prod-tipo-carga', 'prod-watts', 'prod-compat-carg', 'prod-puertos', 'prod-tipo-acc',
    'prod-compat-acc', 'prod-material', 'prod-desc', 'img-url-input', 'color-input-text'
  ].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  el('img-file-input').value = '';
  el('prod-estado').value = 'disponible';
  updatePreview('', 'img-add-preview-img', 'img-add-ph');
}

// ══════════════════════════════════════════
//  ALERTAS
// ══════════════════════════════════════════
function showAlert(id, type, text) {
  const e = el(id);
  if (!e) return;
  e.className = `alert ${type}`;
  e.textContent = text;
  e.classList.remove('hidden');
}
function hideAlert(id) { el(id)?.classList.add('hidden'); }

// ══════════════════════════════════════════
//  BIND EVENTS
// ══════════════════════════════════════════
function bindEvents() {

  // ── Login / Logout ──
  el('btn-login').addEventListener('click', login);
  el('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  el('btn-logout').addEventListener('click', logout);

  // ── Navegación ──
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // ── Hamburger (mobile) ──
  el('ham-admin').addEventListener('click', () => {
    el('sidebar').classList.toggle('open');
    el('sidebar-overlay').classList.toggle('open');
  });
  el('sidebar-overlay').addEventListener('click', () => {
    el('sidebar').classList.remove('open');
    el('sidebar-overlay').classList.remove('open');
  });

  // ── Categoría (pills) ──
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      addCat = btn.dataset.sel;
      Object.keys(CATS).forEach(c => {
        el(`specs-${c}`)?.classList.toggle('hidden', c !== addCat);
      });
    });
  });

  // ── Filtros (gestionar) ──
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterCat = btn.dataset.cat;
      renderProductList();
    });
  });

  // ── Búsqueda ──
  el('admin-search')?.addEventListener('input', () => renderProductList());

  // ── Agregar producto ──
  el('btn-add-product').addEventListener('click', addProduct);

  // ── Imágenes (agregar) ──
  el('add-img-slot').addEventListener('click', () => el('img-add-controls').classList.remove('hidden'));
  el('img-url-input').addEventListener('input', e => {
    addPendingSrc = e.target.value.trim();
    updatePreview(addPendingSrc, 'img-add-preview-img', 'img-add-ph');
  });
  el('img-file-input').addEventListener('change', async e => {
    const files = Array.from(e.target.files).slice(0, 6 - addImages.length);
    showAlert('form-msg', 'info', 'Subiendo imagen...');
    for (const file of files) {
      try { const url = await uploadImage(file); addImages.push({ src: url }); renderAddGallery(); }
      catch { showAlert('form-msg', 'error', 'Error al subir.'); }
    }
    hideAlert('form-msg');
    el('img-add-controls').classList.add('hidden');
    addPendingSrc = '';
    updatePreview('', 'img-add-preview-img', 'img-add-ph');
    el('img-file-input').value = '';
  });
  el('btn-confirm-img').addEventListener('click', () => {
    if (!addPendingSrc) return;
    addImages.push({ src: addPendingSrc }); addPendingSrc = '';
    el('img-add-controls').classList.add('hidden');
    renderAddGallery();
    updatePreview('', 'img-add-preview-img', 'img-add-ph');
    el('img-url-input').value = '';
  });
  el('btn-cancel-img').addEventListener('click', () => {
    el('img-add-controls').classList.add('hidden');
    addPendingSrc = '';
    updatePreview('', 'img-add-preview-img', 'img-add-ph');
  });

  // ── Tabs URL / Archivo (agregar) ──
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.tab;
      el('tab-url').classList.toggle('hidden', t !== 'url');
      el('tab-file').classList.toggle('hidden', t !== 'file');
    });
  });

  // ── Colores (agregar) ──
  el('btn-add-color').addEventListener('click', () => {
    pushColor(el('color-input-text').value, addColors, 'color-chips');
    el('color-input-text').value = '';
  });
  el('color-input-text').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); pushColor(el('color-input-text').value, addColors, 'color-chips'); el('color-input-text').value = ''; }
  });

  // ── Modal editar ──
  el('btn-close-edit').addEventListener('click', closeEditModal);
  el('modal-backdrop-edit').addEventListener('click', closeEditModal);
  el('btn-save-edit').addEventListener('click', saveEdit);

  // ── Imágenes (editar) ──
  el('edit-add-img-slot').addEventListener('click', () => el('edit-img-add-controls').classList.remove('hidden'));
  el('edit-img-url-input').addEventListener('input', e => {
    editPendingSrc = e.target.value.trim();
    updatePreview(editPendingSrc, 'edit-img-add-preview-img', 'edit-img-add-ph');
  });
  el('edit-img-file-input').addEventListener('change', async e => {
    const files = Array.from(e.target.files).slice(0, 6 - editImages.length);
    showAlert('edit-msg', 'info', 'Subiendo...');
    for (const file of files) {
      try { const url = await uploadImage(file); editImages.push({ src: url }); renderEditGallery(); }
      catch { showAlert('edit-msg', 'error', 'Error al subir.'); }
    }
    hideAlert('edit-msg');
    el('edit-img-add-controls').classList.add('hidden');
    editPendingSrc = '';
    updatePreview('', 'edit-img-add-preview-img', 'edit-img-add-ph');
    el('edit-img-file-input').value = '';
  });
  el('edit-btn-confirm-img').addEventListener('click', () => {
    if (!editPendingSrc) return;
    editImages.push({ src: editPendingSrc }); editPendingSrc = '';
    el('edit-img-add-controls').classList.add('hidden');
    renderEditGallery();
    updatePreview('', 'edit-img-add-preview-img', 'edit-img-add-ph');
    el('edit-img-url-input').value = '';
  });
  el('edit-btn-cancel-img').addEventListener('click', () => {
    el('edit-img-add-controls').classList.add('hidden');
    editPendingSrc = '';
    updatePreview('', 'edit-img-add-preview-img', 'edit-img-add-ph');
  });

  // ── Tabs URL / Archivo (editar) ──
  document.querySelectorAll('[data-edit-img-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-edit-img-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.editImgTab;
      el('edit-tab-url').classList.toggle('hidden', t !== 'url');
      el('edit-tab-file').classList.toggle('hidden', t !== 'file');
    });
  });

  // ── Colores (editar) ──
  el('edit-btn-add-color').addEventListener('click', () => {
    pushColor(el('edit-color-input-text').value, editColors, 'edit-color-chips');
    el('edit-color-input-text').value = '';
  });
  el('edit-color-input-text').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); pushColor(el('edit-color-input-text').value, editColors, 'edit-color-chips'); el('edit-color-input-text').value = ''; }
  });

  // ── Escape cierra modal ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !el('modal-edit').classList.contains('hidden')) closeEditModal();
  });
}