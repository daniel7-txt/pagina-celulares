/* =====================================================
   TechStore GT — script.js
   Supabase integration | Secure Admin Auth
===================================================== */

// ── SUPABASE CONFIG ──
const SUPABASE_URL = 'https://ofinrpmjgdjbnhnqhrik.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f7qd8HeXaC9hxAoKKCejgA_ZTb1SCb0';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CONFIG ──
const CATS = {
  celulares:   { label:'Celulares',   icon:'📱', sub:'Los mejores smartphones del mercado' },
  auriculares: { label:'Auriculares', icon:'🎧', sub:'Audio de alta calidad para cada momento' },
  relojes:     { label:'Relojes',     icon:'⌚', sub:'Smartwatches y relojes de última generación' },
  bocinas:     { label:'Bocinas',     icon:'🔊', sub:'Sonido potente para cualquier ambiente' },
  cargadores:  { label:'Cargadores',  icon:'⚡', sub:'Carga rápida y segura para tus dispositivos' },
  accesorios:  { label:'Accesorios',  icon:'🎒', sub:'Fundas, cables, vidrios y más' }
};
const STATUS = {
  disponible: { label:'Disponible',    cls:'s-disponible' },
  pocas:      { label:'Pocas unidades', cls:'s-pocas' },
  agotado:    { label:'Agotado',       cls:'s-agotado' },
  preventa:   { label:'Preventa',      cls:'s-preventa' }
};
const COLOR_MAP = {
  negro:'#1a1a1a',blanco:'#f5f5f5',rojo:'#ef4444',azul:'#3b82f6',verde:'#22c55e',
  amarillo:'#eab308',naranja:'#f97316',morado:'#a855f7',rosa:'#ec4899',
  gris:'#6b7280',plateado:'#94a3b8',dorado:'#d97706',cafe:'#92400e',
  beige:'#d2b48c',celeste:'#38bdf8',turquesa:'#14b8a6',coral:'#fb923c',
  lila:'#c084fc',navy:'#1e3a5f',titanio:'#b0b8c1',titanium:'#b0b8c1',
  natural:'#d4c5b0',graphite:'#4b5563',midnight:'#1c1c2e',starlight:'#f0ece4',
  black:'#1a1a1a',white:'#f5f5f5',gray:'#6b7280',red:'#dc2626',
  blue:'#2563eb',green:'#16a34a',pink:'#db2777',silver:'#9ca3af',gold:'#b45309',
  purple:'#9333ea',orange:'#ea580c',teal:'#0d9488',cyan:'#0891b2',
  transparente:'rgba(200,220,240,0.5)'
};

// ── STATE ──
let products = [];
let activeCat = 'celulares';
let adminFilterCat = 'todos';
let addCat = 'celulares';
let addImages = [], addColors = [];
let editImages = [], editColors = [];
let addPendingSrc = '', editPendingSrc = '';
let galleryImgs = [], galleryIdx = 0;

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  renderCatalog();
  await checkSession();
  bindAll();
});

// ── DATA — Supabase ──
async function loadProducts() {
  const { data, error } = await db.from('products').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error cargando productos:', error); products = []; return; }
  products = (data || []).map(mapFromDb);
  if (!products.length) {
    await seedSamples();
    const { data: d2 } = await db.from('products').select('*').order('created_at', { ascending: false });
    products = (d2 || []).map(mapFromDb);
  }
}

function mapFromDb(r) {
  return {
    id: r.id, category: r.category, name: r.name, brand: r.brand,
    price: r.price, estado: r.estado, desc: r.description,
    images: r.images || [], colors: r.colors || [],
    storage: r.storage, ram: r.ram, cpu: r.cpu, screen: r.screen,
    battery: r.battery, camara: r.camara, os: r.os,
    tipoAuri: r.tipo_auri, conect: r.conect, autonomia: r.autonomia, anc: r.anc,
    tipoReloj: r.tipo_reloj, compat: r.compat, batReloj: r.bat_reloj, resist: r.resist,
    potencia: r.potencia, conectBoc: r.conect_boc, autoBoc: r.auto_boc, agua: r.agua,
    tipoCarga: r.tipo_carga, watts: r.watts, compatCarg: r.compat_carg, puertos: r.puertos,
    tipoAcc: r.tipo_acc, compatAcc: r.compat_acc, material: r.material
  };
}

function mapToDb(p) {
  return {
    id: p.id, category: p.category, name: p.name, brand: p.brand,
    price: p.price, estado: p.estado, description: p.desc,
    images: p.images || [], colors: p.colors || [],
    storage: p.storage||null, ram: p.ram||null, cpu: p.cpu||null,
    screen: p.screen||null, battery: p.battery||null, camara: p.camara||null, os: p.os||null,
    tipo_auri: p.tipoAuri||null, conect: p.conect||null, autonomia: p.autonomia||null, anc: p.anc||null,
    tipo_reloj: p.tipoReloj||null, compat: p.compat||null, bat_reloj: p.batReloj||null, resist: p.resist||null,
    potencia: p.potencia||null, conect_boc: p.conectBoc||null, auto_boc: p.autoBoc||null, agua: p.agua||null,
    tipo_carga: p.tipoCarga||null, watts: p.watts||null, compat_carg: p.compatCarg||null, puertos: p.puertos||null,
    tipo_acc: p.tipoAcc||null, compat_acc: p.compatAcc||null, material: p.material||null
  };
}

async function saveProduct(p) {
  const { error } = await db.from('products').upsert(mapToDb(p));
  if (error) throw error;
}

async function removeProduct(id) {
  const { error } = await db.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ── SESSION ──
async function checkSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session) enableAdminMode();
}

function enableAdminMode() {
  document.body.classList.add('admin-mode');
  el('admin-bar').classList.remove('hidden');
}

function disableAdminMode() {
  document.body.classList.remove('admin-mode');
  el('admin-bar').classList.add('hidden');
}

function closeAdminOverlay() {
  el('admin-overlay').classList.add('hidden');
}

async function login() {
  const email = v('login-user');
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showAlert('login-msg','error','Completa todos los campos.'); return; }
  showAlert('login-msg','info','Iniciando sesión...');
  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) {
    showAlert('login-msg','error','Credenciales incorrectas.');
    document.getElementById('login-pass').value = '';
  } else {
    showAlert('login-msg','success','Sesión iniciada ✓');
    setTimeout(() => {
      el('login-panel').classList.add('hidden');
      el('admin-overlay').classList.add('hidden');
      enableAdminMode();
    }, 600);
  }
}

async function logout() {
  await db.auth.signOut();
  disableAdminMode();
  el('admin-overlay').classList.add('hidden');
  el('admin-panel').classList.add('hidden');
  el('login-panel').classList.remove('hidden');
  el('login-user').value = ''; el('login-pass').value = '';
  hideAlert('login-msg');
}

function showAdminPanel() {
  el('admin-overlay').classList.remove('hidden');
  el('login-panel').classList.add('hidden');
  el('admin-panel').classList.remove('hidden');
  renderAdminList();
}

// ── CATALOG RENDER ──
function renderCatalog() {
  const query = (el('search-input')?.value || el('search-mobile')?.value || '').toLowerCase().trim();
  const grid = el('product-grid'), emptyDiv = el('empty-state');
  const cat = CATS[activeCat];

  el('catalog-title').textContent = `${cat.icon} ${cat.label}`;
  el('catalog-sub').textContent = cat.sub;

  let list = products.filter(p => p.category === activeCat);
  if (query) list = list.filter(p =>
    p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) || (p.desc||'').toLowerCase().includes(query)
  );

  el('catalog-count').textContent = `${list.length} producto${list.length !== 1 ? 's' : ''}`;
  grid.innerHTML = '';

  if (!list.length) {
    emptyDiv.classList.remove('hidden');
    el('empty-icon').textContent = cat.icon;
    el('empty-title').textContent = query ? 'Sin resultados' : `Sin ${cat.label} aún`;
    return;
  }
  emptyDiv.classList.add('hidden');

  list.forEach(p => {
    const card = document.createElement('div');
    card.className = `product-card pc-${p.category}`;
    const img0 = p.images?.[0] || '';
    const st = STATUS[p.estado] || STATUS.disponible;
    card.innerHTML = `
      <div class="card-img-wrap">
        ${img0
          ? `<img src="${img0}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card-no-img\\'>${cat.icon}</div>'">`
          : `<div class="card-no-img">${cat.icon}</div>`}
        <div class="card-brand-badge">${p.brand}</div>
        <div class="card-status-badge ${st.cls}">${st.label}</div>
        ${(p.images?.length||0)>1 ? `<div class="card-img-count">🖼 ${p.images.length}</div>` : ''}
      </div>
      <div class="card-body">
        <div class="card-cat-label">${cat.icon} ${cat.label}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-chips">${buildChips(p)}</div>
        ${buildColorDots(p.colors||[])}
        <div class="card-footer">
          <div class="card-price"><sup>Q</sup>${fmtPrice(p.price)}</div>
          <button class="card-cta">Ver detalle</button>
        </div>
      </div>`;
    card.addEventListener('click', () => openModal(p));

    db.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const editBtn = document.createElement('button');
        editBtn.className = 'card-admin-edit';
        editBtn.textContent = '✏️ Editar';
        editBtn.style.cssText = 'margin-top:6px;width:100%;';
        editBtn.addEventListener('click', e => { e.stopPropagation(); openEditModal(p.id); });
        card.querySelector('.card-body').appendChild(editBtn);
      }
    });

    grid.appendChild(card);
  });
}

function buildChips(p) {
  const c = t => `<span class="chip">${t}</span>`;
  if (p.category==='celulares')   return [p.storage&&c(`💾 ${p.storage}`),p.ram&&c(`⚡ ${p.ram} RAM`),p.os&&c(p.os)].filter(Boolean).join('');
  if (p.category==='auriculares') return [p.tipoAuri&&c(p.tipoAuri),p.conect&&c(p.conect),p.autonomia&&c(`🔋 ${p.autonomia}`)].filter(Boolean).join('');
  if (p.category==='relojes')     return [p.tipoReloj&&c(p.tipoReloj),p.compat&&c(p.compat),p.batReloj&&c(`🔋 ${p.batReloj}`)].filter(Boolean).join('');
  if (p.category==='bocinas')     return [p.potencia&&c(`🔊 ${p.potencia}`),p.autoBoc&&c(`🔋 ${p.autoBoc}`),p.agua&&c(p.agua)].filter(Boolean).join('');
  if (p.category==='cargadores')  return [p.watts&&c(`⚡ ${p.watts}`),p.tipoCarga&&c(p.tipoCarga),p.puertos&&c(p.puertos)].filter(Boolean).join('');
  if (p.category==='accesorios')  return [p.tipoAcc&&c(p.tipoAcc),p.compatAcc&&c(p.compatAcc),p.material&&c(p.material)].filter(Boolean).join('');
  return '';
}

function buildColorDots(colors) {
  if (!colors.length) return '';
  const show = colors.slice(0, 6), more = colors.length - 6;
  const dots = show.map(c => `<div class="color-dot" style="background:${colorCss(c)};" title="${c}"></div>`).join('');
  return `<div class="card-color-row">${dots}${more > 0 ? `<span class="more-colors">+${more}</span>` : ''}</div>`;
}

function colorCss(name) {
  const k = name.toLowerCase().split(' ')[0];
  return COLOR_MAP[k] || COLOR_MAP[name.toLowerCase()] || '#a0a0a0';
}

// ── PRODUCT MODAL ──
function openModal(p) {
  galleryImgs = p.images?.length ? p.images : [];
  galleryIdx = 0;
  const cat = CATS[p.category];
  const st  = STATUS[p.estado] || STATUS.disponible;

  const content = el('modal-content');
  content.innerHTML = `
    <div class="modal-img-side">
      <div class="modal-main-img-wrap" id="zoom-source-wrap">
        ${galleryImgs.length
          ? `<img class="modal-main-img" id="modal-main-img" src="${galleryImgs[0]}" alt="${p.name}" draggable="false"/>`
          : `<div class="modal-no-img">${cat.icon}</div>`}
        ${galleryImgs.length ? `<div class="zoom-hint-label">🔍 Pasa el cursor para hacer zoom</div>` : ''}
        ${galleryImgs.length > 1 ? `
          <div class="modal-gallery-nav">
            <button class="gallery-arrow" id="gal-prev">‹</button>
            <button class="gallery-arrow" id="gal-next">›</button>
          </div>` : ''}
      </div>
      ${galleryImgs.length > 1 ? `
        <div class="modal-thumbs" id="modal-thumbs">
          ${galleryImgs.map((src,i) => `<img class="modal-thumb${i===0?' active':''}" src="${src}" data-idx="${i}" alt="img ${i+1}" onerror="this.style.display='none'"/>`).join('')}
        </div>` : ''}
    </div>
    <div class="modal-info-side">
      <p class="modal-cat-tag">${cat.icon} ${cat.label}</p>
      <p class="modal-prod-brand">${p.brand}</p>
      <h2 class="modal-prod-name">${p.name}</h2>
      <div class="modal-prod-price"><sup>Q</sup>${fmtPrice(p.price)}</div>
      <div style="margin-bottom:14px;">
        <span class="card-status-badge ${st.cls}" style="position:static;font-size:12px;padding:5px 12px;">${st.label}</span>
      </div>
      ${p.desc ? `<p class="modal-prod-desc">${p.desc}</p>` : ''}
      <button class="btn-whatsapp-modal" onclick="window.open('https://wa.me/50254834689?text=Hola%2C%20me%20interesa%20el%20${encodeURIComponent(p.name)}%20%28Q${p.price}%29%2C%20%C2%BFestá%20disponible%3F','_blank')">
        <i class="fa fa-whatsapp" style="font-size:20px;"></i> Consultar por WhatsApp
      </button>
      ${(p.colors?.length) ? `
        <div class="color-section">
          <div class="color-section-label">🎨 Colores disponibles</div>
          <div class="color-opts" id="modal-color-opts">
            ${p.colors.map((c,i) => `
              <div class="color-opt${i===0?' selected':''}" data-ci="${i}">
                <div class="color-opt-dot" style="background:${colorCss(c)};"></div>
                ${c}
              </div>`).join('')}
          </div>
        </div>` : ''}
      <div class="modal-store-note">
        📍 Disponible en tienda física · Tercer Cantón, San Pedro Yepocapa
      </div>
      <div class="specs-section-modal">
        <div class="specs-section-label">Especificaciones</div>
        <div class="specs-table">${buildModalSpecs(p)}</div>
      </div>
    </div>`;

  if (galleryImgs.length > 1) {
    el('gal-prev')?.addEventListener('click', e => { e.stopPropagation(); changeGal(-1); });
    el('gal-next')?.addEventListener('click', e => { e.stopPropagation(); changeGal(1); });
    document.querySelectorAll('.modal-thumb').forEach(t => {
      t.addEventListener('click', () => goGal(parseInt(t.dataset.idx)));
    });
  }

  const mainWrap = el('zoom-source-wrap');
  const mainImg  = el('modal-main-img');
  if (mainImg) {
    mainWrap.addEventListener('click', e => { e.stopPropagation(); openZoom(mainImg.src); });
    mainImg.style.cursor = 'zoom-in';
  }

  document.querySelectorAll('.color-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  el('modal-product').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function changeGal(dir) { goGal((galleryIdx + dir + galleryImgs.length) % galleryImgs.length); }
function goGal(idx) {
  galleryIdx = idx;
  const img = el('modal-main-img');
  if (img) { img.src = galleryImgs[idx]; img.style.cursor = 'zoom-in'; }
  document.querySelectorAll('.modal-thumb').forEach((t,i) => t.classList.toggle('active', i === idx));
}

function closeModal() { el('modal-product').classList.add('hidden'); document.body.style.overflow = ''; }

function buildModalSpecs(p) {
  const sc = (label,val) => val ? `<div class="spec-cell"><div class="spec-cell-label">${label}</div><div class="spec-cell-val">${val}</div></div>` : '';
  if (p.category==='celulares')   return sc('💾 Almacenamiento',p.storage)+sc('⚡ RAM',p.ram)+sc('🔧 Procesador',p.cpu)+sc('📺 Pantalla',p.screen)+sc('🔋 Batería',p.battery)+sc('📷 Cámara',p.camara)+sc('📱 Sistema',p.os);
  if (p.category==='auriculares') return sc('🎧 Tipo',p.tipoAuri)+sc('📶 Conectividad',p.conect)+sc('🔋 Autonomía',p.autonomia)+sc('🔇 Cancelac. ruido',p.anc);
  if (p.category==='relojes')     return sc('⌚ Tipo',p.tipoReloj)+sc('📱 Compatibilidad',p.compat)+sc('🔋 Autonomía',p.batReloj)+sc('💧 Resistencia',p.resist);
  if (p.category==='bocinas')     return sc('🔊 Potencia',p.potencia)+sc('📶 Conectividad',p.conectBoc)+sc('🔋 Autonomía',p.autoBoc)+sc('💧 Resist. agua',p.agua);
  if (p.category==='cargadores')  return sc('🔌 Tipo carga',p.tipoCarga)+sc('⚡ Potencia',p.watts)+sc('📱 Compatibilidad',p.compatCarg)+sc('🔷 Puertos',p.puertos);
  if (p.category==='accesorios')  return sc('🎒 Tipo',p.tipoAcc)+sc('📱 Compatible con',p.compatAcc)+sc('✨ Material',p.material);
  return '';
}

// ── ZOOM ──
function openZoom(src) {
  const zOverlay = el('zoom-overlay'), zImg = el('zoom-img');
  const zResult = el('zoom-result'), zLens = el('zoom-lens'), zContainer = el('zoom-container');
  zImg.src = src;
  zOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  zImg.onload = () => setupZoomBg();
  if (zImg.complete) setupZoomBg();
  function setupZoomBg() { zResult.style.backgroundImage = `url(${src})`; zResult.style.display = 'block'; }
  function onMove(e) {
    const rect = zContainer.getBoundingClientRect();
    let x = Math.max(zLens.offsetWidth/2, Math.min(e.clientX - rect.left, rect.width - zLens.offsetWidth/2));
    let y = Math.max(zLens.offsetHeight/2, Math.min(e.clientY - rect.top, rect.height - zLens.offsetHeight/2));
    zLens.style.left = `${x - zLens.offsetWidth/2}px`;
    zLens.style.top  = `${y - zLens.offsetHeight/2}px`;
    zLens.style.display = 'block';
    const ratio = 4;
    zResult.style.backgroundSize = `${rect.width*ratio}px ${rect.height*ratio}px`;
    zResult.style.backgroundPosition = `${-(x*ratio - zResult.offsetWidth/2)}px ${-(y*ratio - zResult.offsetHeight/2)}px`;
    zResult.style.display = 'block';
  }
  function onTouch(e) { e.preventDefault(); const t = e.touches[0]; onMove({ clientX: t.clientX, clientY: t.clientY }); }
  zContainer.addEventListener('mousemove', onMove);
  zContainer.addEventListener('touchmove', onTouch, { passive: false });
  zContainer.addEventListener('mouseleave', () => { zLens.style.display='none'; zResult.style.display='none'; });
  el('btn-close-zoom').onclick = closeZoom;
  el('zoom-bg').onclick = closeZoom;
  zContainer._cleanup = () => { zContainer.removeEventListener('mousemove', onMove); zContainer.removeEventListener('touchmove', onTouch); };
}

function closeZoom() {
  el('zoom-overlay').classList.add('hidden');
  el('zoom-lens').style.display = 'none';
  el('zoom-result').style.display = 'none';
  const zc = el('zoom-container');
  if (zc._cleanup) { zc._cleanup(); zc._cleanup = null; }
}

// ── ADD PRODUCT ──
async function addProduct() {
  const name = v('prod-name'), brand = v('prod-brand');
  const price = parseFloat(document.getElementById('prod-price').value);
  const desc = v('prod-desc');
  const estado = document.getElementById('prod-estado').value;

  if (!name)  { showAlert('form-msg','error','El campo Nombre es obligatorio.'); return; }
  if (!brand) { showAlert('form-msg','error','El campo Marca es obligatorio.'); return; }
  if (!price||isNaN(price)||price<=0) { showAlert('form-msg','error','Ingresa un precio válido.'); return; }
  if (!addColors.length) { showAlert('form-msg','error','Agrega al menos un color.'); return; }

  let extra = {};
  if (addCat==='celulares') {
    const s=v('prod-storage'),r=v('prod-ram'),c=v('prod-cpu');
    if (!s||!r||!c) { showAlert('form-msg','error','Almacenamiento, RAM y Procesador son obligatorios.'); return; }
    extra={storage:s,ram:r,cpu:c,screen:v('prod-screen'),battery:v('prod-battery'),camara:v('prod-camara'),os:v('prod-os')};
  } else if (addCat==='auriculares') {
    const t=v('prod-tipo-auri'),c=v('prod-conect');
    if (!t||!c) { showAlert('form-msg','error','Tipo y Conectividad son obligatorios.'); return; }
    extra={tipoAuri:t,conect:c,autonomia:v('prod-autonomia'),anc:v('prod-anc')};
  } else if (addCat==='relojes') {
    const t=v('prod-tipo-reloj'),c=v('prod-compat');
    if (!t||!c) { showAlert('form-msg','error','Tipo y Compatibilidad son obligatorios.'); return; }
    extra={tipoReloj:t,compat:c,batReloj:v('prod-bat-reloj'),resist:v('prod-resist')};
  } else if (addCat==='bocinas') {
    const p2=v('prod-potencia'),c=v('prod-conect-boc');
    if (!p2||!c) { showAlert('form-msg','error','Potencia y Conectividad son obligatorios.'); return; }
    extra={potencia:p2,conectBoc:c,autoBoc:v('prod-auto-boc'),agua:v('prod-agua')};
  } else if (addCat==='cargadores') {
    const t=v('prod-tipo-carga'),w=v('prod-watts');
    if (!t||!w) { showAlert('form-msg','error','Tipo de carga y Potencia son obligatorios.'); return; }
    extra={tipoCarga:t,watts:w,compatCarg:v('prod-compat-carg'),puertos:v('prod-puertos')};
  } else if (addCat==='accesorios') {
    const t=v('prod-tipo-acc'),c=v('prod-compat-acc');
    if (!t||!c) { showAlert('form-msg','error','Tipo y Compatibilidad son obligatorios.'); return; }
    extra={tipoAcc:t,compatAcc:c,material:v('prod-material')};
  }

  showAlert('form-msg','info','Guardando...');
  const prod = { id:uid(), category:addCat, name, brand, price, estado, desc, images:addImages.map(i=>i.src), colors:addColors.map(c=>c.name), ...extra };
  try {
    await saveProduct(prod);
    products.unshift(prod);
    renderCatalog(); renderAdminList(); resetAddForm();
    showAlert('form-msg','success',`${CATS[addCat].icon} Producto agregado en ${CATS[addCat].label}.`);
    setTimeout(()=>hideAlert('form-msg'), 3000);
  } catch(e) {
    showAlert('form-msg','error','Error al guardar. ¿Estás autenticado?');
  }
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await removeProduct(id);
    products = products.filter(x => x.id !== id);
    renderCatalog(); renderAdminList();
  } catch(e) {
    alert('Error al eliminar el producto.');
  }
}

// ── ADMIN LIST ──
function renderAdminList() {
  const list = el('admin-product-list'), cnt = el('admin-count');
  const filtered = adminFilterCat==='todos' ? products : products.filter(p=>p.category===adminFilterCat);
  cnt.textContent = filtered.length;
  list.innerHTML = '';
  if (!filtered.length) { list.innerHTML = '<p style="text-align:center;color:#adb5bd;font-size:13px;padding:24px 0;">Sin productos aquí</p>'; return; }
  filtered.forEach(p => {
    const cat = CATS[p.category];
    const img0 = p.images?.[0] || '';
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      ${img0 ? `<img class="admin-item-img" src="${img0}" alt="" onerror="this.outerHTML='<div class=\\'admin-item-no-img\\'>${cat.icon}</div>'">` : `<div class="admin-item-no-img">${cat.icon}</div>`}
      <div class="admin-item-info">
        <div class="admin-item-name">${p.name}</div>
        <div class="admin-item-meta">
          <span>${p.brand}</span>
          <span class="admin-item-cat">${cat.icon} ${cat.label}</span>
          <span class="card-status-badge ${(STATUS[p.estado]||STATUS.disponible).cls}" style="position:static;font-size:9px;padding:2px 7px;">${(STATUS[p.estado]||STATUS.disponible).label}</span>
        </div>
      </div>
      <div class="admin-item-price">Q${fmtPrice(p.price)}</div>
      <button class="action-btn" data-edit="${p.id}" title="Editar">✏️</button>
      <button class="action-btn del" data-del="${p.id}" title="Eliminar">🗑️</button>`;
    item.querySelector(`[data-edit]`).addEventListener('click', e => { e.stopPropagation(); openEditModal(p.id); });
    item.querySelector(`[data-del]`).addEventListener('click', e => { e.stopPropagation(); deleteProduct(p.id); });
    list.appendChild(item);
  });
}

// ── EDIT MODAL ──
function openEditModal(id) {
  const p = products.find(x=>x.id===id);
  if (!p) return;
  const cat = CATS[p.category];
  el('edit-id').value=p.id; el('edit-name').value=p.name; el('edit-brand').value=p.brand;
  el('edit-price').value=p.price; el('edit-desc').value=p.desc||''; el('edit-estado').value=p.estado||'disponible';
  el('edit-cat-label').textContent=`${cat.icon} Categoría: ${cat.label}`;
  editImages=(p.images||[]).map(src=>({src})); renderEditGallery();
  el('edit-img-add-controls').classList.add('hidden');
  editColors=(p.colors||[]).map(n=>({name:n,css:colorCss(n)}));
  renderColorTags('edit-color-chips', editColors);
  Object.keys(CATS).forEach(c => { el(`edit-specs-${c}`)?.classList.toggle('hidden', c!==p.category); });
  if (p.category==='celulares') { sv('edit-storage',p.storage);sv('edit-ram',p.ram);sv('edit-cpu',p.cpu);sv('edit-screen',p.screen);sv('edit-battery',p.battery);sv('edit-camara',p.camara);sv('edit-os',p.os); }
  else if(p.category==='auriculares') { sv('edit-tipo-auri',p.tipoAuri);sv('edit-conect',p.conect);sv('edit-autonomia',p.autonomia);sv('edit-anc',p.anc); }
  else if(p.category==='relojes')     { sv('edit-tipo-reloj',p.tipoReloj);sv('edit-compat',p.compat);sv('edit-bat-reloj',p.batReloj);sv('edit-resist',p.resist); }
  else if(p.category==='bocinas')     { sv('edit-potencia',p.potencia);sv('edit-conect-boc',p.conectBoc);sv('edit-auto-boc',p.autoBoc);sv('edit-agua',p.agua); }
  else if(p.category==='cargadores')  { sv('edit-tipo-carga',p.tipoCarga);sv('edit-watts',p.watts);sv('edit-compat-carg',p.compatCarg);sv('edit-puertos',p.puertos); }
  else if(p.category==='accesorios')  { sv('edit-tipo-acc',p.tipoAcc);sv('edit-compat-acc',p.compatAcc);sv('edit-material',p.material); }
  hideAlert('edit-msg');
  el('modal-edit').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() { el('modal-edit').classList.add('hidden'); document.body.style.overflow = ''; }

async function saveEdit() {
  const id = el('edit-id').value;
  const idx = products.findIndex(x=>x.id===id);
  if (idx===-1) return;
  const p = products[idx];
  const name=v('edit-name'),brand=v('edit-brand');
  const price=parseFloat(document.getElementById('edit-price').value);
  const desc=v('edit-desc'),estado=document.getElementById('edit-estado').value;
  if (!name)  { showAlert('edit-msg','error','Nombre es obligatorio.'); return; }
  if (!brand) { showAlert('edit-msg','error','Marca es obligatoria.'); return; }
  if (!price||isNaN(price)||price<=0) { showAlert('edit-msg','error','Precio inválido.'); return; }
  if (!editColors.length) { showAlert('edit-msg','error','Agrega al menos un color.'); return; }
  let extra = {};
  if (p.category==='celulares')   { const s=v('edit-storage'),r=v('edit-ram'),c=v('edit-cpu'); if(!s||!r||!c){showAlert('edit-msg','error','Specs obligatorias incompletas.');return;} extra={storage:s,ram:r,cpu:c,screen:v('edit-screen'),battery:v('edit-battery'),camara:v('edit-camara'),os:v('edit-os')}; }
  else if(p.category==='auriculares') { extra={tipoAuri:v('edit-tipo-auri'),conect:v('edit-conect'),autonomia:v('edit-autonomia'),anc:v('edit-anc')}; }
  else if(p.category==='relojes')     { extra={tipoReloj:v('edit-tipo-reloj'),compat:v('edit-compat'),batReloj:v('edit-bat-reloj'),resist:v('edit-resist')}; }
  else if(p.category==='bocinas')     { extra={potencia:v('edit-potencia'),conectBoc:v('edit-conect-boc'),autoBoc:v('edit-auto-boc'),agua:v('edit-agua')}; }
  else if(p.category==='cargadores')  { extra={tipoCarga:v('edit-tipo-carga'),watts:v('edit-watts'),compatCarg:v('edit-compat-carg'),puertos:v('edit-puertos')}; }
  else if(p.category==='accesorios')  { extra={tipoAcc:v('edit-tipo-acc'),compatAcc:v('edit-compat-acc'),material:v('edit-material')}; }
  const updated = {...p,name,brand,price,estado,desc,images:editImages.map(i=>i.src),colors:editColors.map(c=>c.name),...extra};
  showAlert('edit-msg','info','Guardando...');
  try {
    await saveProduct(updated);
    products[idx] = updated;
    renderCatalog(); renderAdminList();
    showAlert('edit-msg','success','Cambios guardados ✓');
    setTimeout(closeEditModal, 800);
  } catch(e) {
    showAlert('edit-msg','error','Error al guardar cambios.');
  }
}

// ── IMAGE GALLERIES ──
function renderAddGallery() {
  const g=el('multi-img-gallery'),slot=el('add-img-slot');
  g.querySelectorAll('.img-slot-thumb').forEach(s=>s.remove());
  addImages.forEach((img,i) => {
    const t=document.createElement('div'); t.className='img-slot-thumb';
    t.innerHTML=`<img src="${img.src}" alt=""/><button class="img-slot-del">✕</button>`;
    t.querySelector('.img-slot-del').onclick=()=>{addImages.splice(i,1);renderAddGallery();};
    g.insertBefore(t,slot);
  });
  slot.style.display=addImages.length>=6?'none':'flex';
}

function renderEditGallery() {
  const g=el('edit-multi-img-gallery'),slot=el('edit-add-img-slot');
  g.querySelectorAll('.img-slot-thumb').forEach(s=>s.remove());
  editImages.forEach((img,i) => {
    const t=document.createElement('div'); t.className='img-slot-thumb';
    t.innerHTML=`<img src="${img.src}" alt=""/><button class="img-slot-del">✕</button>`;
    t.querySelector('.img-slot-del').onclick=()=>{editImages.splice(i,1);renderEditGallery();};
    g.insertBefore(t,slot);
  });
  slot.style.display=editImages.length>=6?'none':'flex';
}

// ── UPLOAD IMAGE ──
async function uploadImage(file) {
  const ext = file.name.split('.').pop();
  const path = `${uid()}.${ext}`;
  const { data, error } = await db.storage.from('productos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = db.storage.from('productos').getPublicUrl(path);
  return urlData.publicUrl;
}

function updateAddPreview(src) {
  const img=el('img-add-preview-img'),ph=el('img-add-ph');
  if(src){img.src=src;img.classList.remove('hidden');ph.classList.add('hidden');img.onerror=()=>{img.classList.add('hidden');ph.classList.remove('hidden');ph.textContent='⚠️ No se pudo cargar';};}
  else{img.classList.add('hidden');ph.classList.remove('hidden');ph.textContent='Ingresa una URL o selecciona un archivo';}
}

function updateEditPreview(src) {
  const img=el('edit-img-add-preview-img'),ph=el('edit-img-add-ph');
  if(src){img.src=src;img.classList.remove('hidden');ph.classList.add('hidden');img.onerror=()=>{img.classList.add('hidden');ph.classList.remove('hidden');};}
  else{img.classList.add('hidden');ph.classList.remove('hidden');ph.textContent='Ingresa URL o archivo';}
}

// ── COLORS ──
function pushColor(name, arr, chipsId) {
  name.split(',').forEach(n => {
    n=n.trim();
    if(!n||arr.find(c=>c.name.toLowerCase()===n.toLowerCase())) return;
    arr.push({name:n,css:colorCss(n)});
  });
  renderColorTags(chipsId, arr);
}

function renderColorTags(id, arr) {
  const container=el(id); container.innerHTML='';
  arr.forEach((c,i) => {
    const tag=document.createElement('div'); tag.className='color-tag';
    tag.innerHTML=`<div class="color-tag-dot" style="background:${c.css};"></div><span>${c.name}</span><button class="color-tag-del">✕</button>`;
    tag.querySelector('.color-tag-del').onclick=()=>{arr.splice(i,1);renderColorTags(id,arr);};
    container.appendChild(tag);
  });
}

// ── RESET FORM ──
function resetAddForm() {
  addImages=[]; addColors=[];
  renderAddGallery(); renderColorTags('color-chips',addColors);
  el('img-add-controls').classList.add('hidden'); addPendingSrc='';
  ['prod-name','prod-brand','prod-price','prod-storage','prod-ram','prod-cpu','prod-screen',
   'prod-battery','prod-camara','prod-os','prod-tipo-auri','prod-conect','prod-autonomia','prod-anc',
   'prod-tipo-reloj','prod-compat','prod-bat-reloj','prod-resist','prod-potencia','prod-conect-boc',
   'prod-auto-boc','prod-agua','prod-tipo-carga','prod-watts','prod-compat-carg','prod-puertos',
   'prod-tipo-acc','prod-compat-acc','prod-material','prod-desc','img-url-input','color-input-text'].forEach(id=>{
    const e=document.getElementById(id); if(e) e.value='';
  });
  el('img-file-input').value=''; el('prod-estado').value='disponible'; updateAddPreview('');
}

// ── SEED ──
async function seedSamples() {
  const samples = [
    {id:uid(),category:'celulares',name:'iPhone 15 Pro Max',brand:'Apple',price:13999,colors:['Natural Titanium','Negro','Blanco','Azul'],estado:'disponible',storage:'512GB',ram:'8GB',cpu:'Apple A17 Pro',screen:'6.7" OLED 120Hz',battery:'4422 mAh',camara:'48MP + 5x',os:'iOS 17',desc:'El iPhone más avanzado con chip A17 Pro y carcasa de titanio.',images:['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&q=80']},
    {id:uid(),category:'celulares',name:'Galaxy S24 Ultra',brand:'Samsung',price:9499,colors:['Titanium Gray','Titanium Black'],estado:'disponible',storage:'256GB',ram:'12GB',cpu:'Snapdragon 8 Gen 3',screen:'6.8" AMOLED 120Hz',battery:'5000 mAh',camara:'200MP',os:'Android 14',desc:'El S24 Ultra con S Pen y cámara de 200MP.',images:['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=900&q=80']},
    {id:uid(),category:'auriculares',name:'Sony WH-1000XM5',brand:'Sony',price:2799,colors:['Negro','Plateado'],estado:'disponible',tipoAuri:'Over-ear',conect:'Bluetooth 5.2',autonomia:'30 horas',anc:'ANC premium',desc:'El estándar de oro en cancelación de ruido.',images:['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80']},
    {id:uid(),category:'relojes',name:'Apple Watch Ultra 2',brand:'Apple',price:7299,colors:['Titanio Natural'],estado:'disponible',tipoReloj:'Smartwatch premium',compat:'iOS',batReloj:'36 horas',resist:'100m',desc:'El smartwatch más resistente de Apple.',images:['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=900&q=80']},
    {id:uid(),category:'bocinas',name:'JBL Charge 5',brand:'JBL',price:1399,colors:['Azul','Rojo','Negro'],estado:'disponible',potencia:'40W',conectBoc:'Bluetooth 5.1',autoBoc:'20 horas',agua:'IP67',desc:'Bocina portátil con powerbank integrado.',images:['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=80']},
    {id:uid(),category:'cargadores',name:'Cargador GaN 65W',brand:'Anker',price:549,colors:['Blanco','Negro'],estado:'disponible',tipoCarga:'USB-C PD',watts:'65W GaN',compatCarg:'Universal',puertos:'2x USB-C + 1x USB-A',desc:'65W en un cubo compacto.',images:['https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=900&q=80']},
    {id:uid(),category:'accesorios',name:'Funda iPhone 15 Pro MagSafe',brand:'Apple',price:349,colors:['Negro','Azul','Verde','Rosa'],estado:'disponible',tipoAcc:'Funda',compatAcc:'iPhone 15 Pro',material:'FineWoven',desc:'Funda oficial con MagSafe.',images:['https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=900&q=80']}
  ];
  for (const p of samples) { try { await saveProduct(p); } catch(e) { console.warn('Error seeding:', e); } }
}

// ── HELPERS ──
function el(id) { return document.getElementById(id); }
function uid() { return Math.random().toString(36).substr(2,9)+Date.now().toString(36); }
function fmtPrice(n) { return Number(n).toLocaleString('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function v(id) { return document.getElementById(id)?.value.trim()||''; }
function sv(id,val) { const e=document.getElementById(id); if(e) e.value=val||''; }
function showAlert(id,type,text) { const e=el(id); e.className=`alert ${type}`; e.textContent=text; e.classList.remove('hidden'); }
function hideAlert(id) { el(id)?.classList.add('hidden'); }

// ── BIND ALL ──
function bindAll() {
  el('hamburger').addEventListener('click', () => {
    el('mobile-nav').classList.toggle('hidden');
    el('hamburger').classList.toggle('open');
  });

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat===btn.dataset.cat));
      activeCat=btn.dataset.cat;
      el('mobile-nav').classList.add('hidden'); el('hamburger').classList.remove('open');
      el('catalogo').scrollIntoView({behavior:'smooth'}); renderCatalog();
    });
  });

  document.querySelectorAll('[data-cat-footer]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const cat=a.dataset.catFooter;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat===cat));
      activeCat=cat; el('catalogo').scrollIntoView({behavior:'smooth'}); renderCatalog();
    });
  });

  ['search-input','search-mobile'].forEach(id => { el(id)?.addEventListener('input', renderCatalog); });

  // Secret login — 5 clicks on footer
  let secretClicks = 0, secretTimer;
  el('secret-login-trigger').addEventListener('click', () => {
    secretClicks++;
    clearTimeout(secretTimer);
    secretTimer = setTimeout(() => { secretClicks = 0; }, 3000);
    if (secretClicks >= 5) {
      secretClicks = 0;
      db.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          el('admin-overlay').classList.remove('hidden');
          el('login-panel').classList.remove('hidden');
          el('admin-panel').classList.add('hidden');
        }
      });
    }
  });

  // Admin bar
  el('btn-open-panel')?.addEventListener('click', showAdminPanel);
  el('btn-manage-panel')?.addEventListener('click', showAdminPanel);
  el('btn-logout')?.addEventListener('click', logout);

  // Close admin overlay — X button just closes the window (doesn't logout)
  el('btn-close-admin-panel')?.addEventListener('click', closeAdminOverlay);
  el('btn-close-admin-x')?.addEventListener('click', closeAdminOverlay);

  // Logout from panel header
  el('btn-logout-panel')?.addEventListener('click', logout);

  // Click outside overlay to close
  el('admin-overlay').addEventListener('click', e => {
    if (e.target === el('admin-overlay')) closeAdminOverlay();
  });

  el('btn-login').addEventListener('click', login);
  el('login-pass').addEventListener('keydown', e => { if(e.key==='Enter') login(); });

  // Category pills
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); addCat=btn.dataset.sel;
      Object.keys(CATS).forEach(c => { el(`specs-${c}`)?.classList.toggle('hidden',c!==addCat); });
    });
  });

  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); adminFilterCat=btn.dataset.adminCat; renderAdminList();
    });
  });

  el('btn-add-product').addEventListener('click', addProduct);
  el('btn-close-modal').addEventListener('click', closeModal);
  el('modal-product').addEventListener('click', e => { if(e.target===el('modal-product')) closeModal(); });
  el('btn-close-edit').addEventListener('click', closeEditModal);
  el('btn-save-edit').addEventListener('click', saveEdit);
  el('modal-edit').addEventListener('click', e => { if(e.target===el('modal-edit')) closeEditModal(); });

  // Add image
  el('add-img-slot').addEventListener('click', () => { el('img-add-controls').classList.remove('hidden'); });
  el('img-url-input').addEventListener('input', e => { addPendingSrc=e.target.value.trim(); updateAddPreview(addPendingSrc); });
  el('img-file-input').addEventListener('change', async e => {
    const files = Array.from(e.target.files).slice(0, 6 - addImages.length);
    showAlert('form-msg', 'info', 'Subiendo imagen...');
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        addImages.push({ src: url });
        renderAddGallery();
      } catch(err) {
        showAlert('form-msg', 'error', 'Error al subir imagen.');
      }
    }
    hideAlert('form-msg');
    el('img-add-controls').classList.add('hidden'); addPendingSrc=''; updateAddPreview('');
    el('img-file-input').value='';
  });
  el('btn-confirm-img').addEventListener('click', () => {
    if(!addPendingSrc) return;
    addImages.push({src:addPendingSrc}); addPendingSrc='';
    el('img-add-controls').classList.add('hidden'); renderAddGallery(); updateAddPreview(''); el('img-url-input').value='';
  });
  el('btn-cancel-img').addEventListener('click', () => { el('img-add-controls').classList.add('hidden'); addPendingSrc=''; updateAddPreview(''); });

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); const t=btn.dataset.tab;
      el('tab-url').classList.toggle('hidden',t!=='url'); el('tab-file').classList.toggle('hidden',t!=='file');
    });
  });

  el('btn-add-color').addEventListener('click', () => { const inp=el('color-input-text'); pushColor(inp.value,addColors,'color-chips'); inp.value=''; });
  el('color-input-text').addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();const inp=el('color-input-text');pushColor(inp.value,addColors,'color-chips');inp.value='';} });

  // Edit image
  el('edit-add-img-slot').addEventListener('click', () => { el('edit-img-add-controls').classList.remove('hidden'); });
  el('edit-img-url-input').addEventListener('input', e => { editPendingSrc=e.target.value.trim(); updateEditPreview(editPendingSrc); });
  el('edit-img-file-input').addEventListener('change', async e => {
    const files = Array.from(e.target.files).slice(0, 6 - editImages.length);
    showAlert('edit-msg', 'info', 'Subiendo imagen...');
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        editImages.push({ src: url });
        renderEditGallery();
      } catch(err) {
        showAlert('edit-msg', 'error', 'Error al subir imagen.');
      }
    }
    hideAlert('edit-msg');
    el('edit-img-add-controls').classList.add('hidden'); editPendingSrc=''; updateEditPreview('');
    el('edit-img-file-input').value='';
  });
  el('edit-btn-confirm-img').addEventListener('click', () => {
    if(!editPendingSrc) return;
    editImages.push({src:editPendingSrc}); editPendingSrc='';
    el('edit-img-add-controls').classList.add('hidden'); renderEditGallery(); updateEditPreview(''); el('edit-img-url-input').value='';
  });
  el('edit-btn-cancel-img').addEventListener('click', () => { el('edit-img-add-controls').classList.add('hidden'); editPendingSrc=''; updateEditPreview(''); });

  document.querySelectorAll('[data-edit-img-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-edit-img-tab]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); const t=btn.dataset.editImgTab;
      el('edit-tab-url').classList.toggle('hidden',t!=='url'); el('edit-tab-file').classList.toggle('hidden',t!=='file');
    });
  });

  el('edit-btn-add-color').addEventListener('click', () => { const inp=el('edit-color-input-text');pushColor(inp.value,editColors,'edit-color-chips');inp.value=''; });
  el('edit-color-input-text').addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();const inp=el('edit-color-input-text');pushColor(inp.value,editColors,'edit-color-chips');inp.value='';} });

  el('btn-close-zoom').addEventListener('click', closeZoom);
  el('zoom-bg').addEventListener('click', closeZoom);

  document.addEventListener('keydown', e => {
    if(e.key==='Escape') { closeModal(); closeEditModal(); closeZoom(); closeAdminOverlay(); }
    if(!el('modal-product').classList.contains('hidden')) {
      if(e.key==='ArrowLeft') changeGal(-1);
      if(e.key==='ArrowRight') changeGal(1);
    }
  });
}