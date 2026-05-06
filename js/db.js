// ── DB.JS ─────────────────────────────────────────────────────────────────────
// Conexión a Supabase y todas las operaciones de base de datos.
// Exporta: db, loadProducts, saveProduct, removeProduct, seedSamples
// ─────────────────────────────────────────────────────────────────────────────

import { uid } from './utils.js';

const SUPABASE_URL = 'https://ofinrpmjgdjbnhnqhrik.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f7qd8HeXaC9hxAoKKCejgA_ZTb1SCb0';

const { createClient } = supabase; // supabase CDN global
export const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── MAPPERS ──────────────────────────────────────────────────────────────────

export function mapFromDb(r) {
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
    storage: p.storage || null, ram: p.ram || null, cpu: p.cpu || null,
    screen: p.screen || null, battery: p.battery || null,
    camara: p.camara || null, os: p.os || null,
    tipo_auri: p.tipoAuri || null, conect: p.conect || null,
    autonomia: p.autonomia || null, anc: p.anc || null,
    tipo_reloj: p.tipoReloj || null, compat: p.compat || null,
    bat_reloj: p.batReloj || null, resist: p.resist || null,
    potencia: p.potencia || null, conect_boc: p.conectBoc || null,
    auto_boc: p.autoBoc || null, agua: p.agua || null,
    tipo_carga: p.tipoCarga || null, watts: p.watts || null,
    compat_carg: p.compatCarg || null, puertos: p.puertos || null,
    tipo_acc: p.tipoAcc || null, compat_acc: p.compatAcc || null,
    material: p.material || null
  };
}

// ── OPERACIONES ───────────────────────────────────────────────────────────────

/** Carga todos los productos desde Supabase. Si no hay, hace seed. */
export async function loadProducts() {
  const { data, error } = await db
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[db] Error cargando productos:', error);
    return [];
  }

  let products = (data || []).map(mapFromDb);

  if (!products.length) {
    await seedSamples();
    const { data: d2 } = await db
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    products = (d2 || []).map(mapFromDb);
  }

  return products;
}

/** Guarda (insert o update) un producto en Supabase. */
export async function saveProduct(p) {
  const { error } = await db.from('products').upsert(mapToDb(p));
  if (error) {
    console.error('[db] Error guardando producto:', error);
    throw error;
  }
}

/** Elimina un producto por ID. */
export async function removeProduct(id) {
  const { error } = await db.from('products').delete().eq('id', id);
  if (error) {
    console.error('[db] Error eliminando producto:', error);
    throw error;
  }
}

/** Sube una imagen al bucket "productos" y devuelve su URL pública. */
export async function uploadImage(file) {
  const ext = file.name.split('.').pop();
  const path = `${uid()}.${ext}`;
  const { data, error } = await db.storage
    .from('productos')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = db.storage.from('productos').getPublicUrl(path);
  return urlData.publicUrl;
}

// ── SEED ──────────────────────────────────────────────────────────────────────

/** Inserta productos de ejemplo si la tabla está vacía. */
export async function seedSamples() {
  const samples = [
    {
      id: uid(), category: 'celulares', name: 'iPhone 15 Pro Max', brand: 'Apple',
      price: 13999, colors: ['Natural Titanium', 'Negro', 'Blanco', 'Azul'],
      estado: 'disponible', storage: '512GB', ram: '8GB', cpu: 'Apple A17 Pro',
      screen: '6.7" OLED 120Hz', battery: '4422 mAh', camara: '48MP + 5x', os: 'iOS 17',
      desc: 'El iPhone más avanzado con chip A17 Pro y carcasa de titanio.',
      images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&q=80']
    },
    {
      id: uid(), category: 'celulares', name: 'Galaxy S24 Ultra', brand: 'Samsung',
      price: 9499, colors: ['Titanium Gray', 'Titanium Black'], estado: 'disponible',
      storage: '256GB', ram: '12GB', cpu: 'Snapdragon 8 Gen 3',
      screen: '6.8" AMOLED 120Hz', battery: '5000 mAh', camara: '200MP', os: 'Android 14',
      desc: 'El S24 Ultra con S Pen y cámara de 200MP.',
      images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=900&q=80']
    },
    {
      id: uid(), category: 'auriculares', name: 'Sony WH-1000XM5', brand: 'Sony',
      price: 2799, colors: ['Negro', 'Plateado'], estado: 'disponible',
      tipoAuri: 'Over-ear', conect: 'Bluetooth 5.2', autonomia: '30 horas', anc: 'ANC premium',
      desc: 'El estándar de oro en cancelación de ruido.',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80']
    },
    {
      id: uid(), category: 'relojes', name: 'Apple Watch Ultra 2', brand: 'Apple',
      price: 7299, colors: ['Titanio Natural'], estado: 'disponible',
      tipoReloj: 'Smartwatch premium', compat: 'iOS', batReloj: '36 horas', resist: '100m',
      desc: 'El smartwatch más resistente de Apple.',
      images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=900&q=80']
    },
    {
      id: uid(), category: 'bocinas', name: 'JBL Charge 5', brand: 'JBL',
      price: 1399, colors: ['Azul', 'Rojo', 'Negro'], estado: 'disponible',
      potencia: '40W', conectBoc: 'Bluetooth 5.1', autoBoc: '20 horas', agua: 'IP67',
      desc: 'Bocina portátil con powerbank integrado.',
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=80']
    },
    {
      id: uid(), category: 'cargadores', name: 'Cargador GaN 65W', brand: 'Anker',
      price: 549, colors: ['Blanco', 'Negro'], estado: 'disponible',
      tipoCarga: 'USB-C PD', watts: '65W GaN', compatCarg: 'Universal',
      puertos: '2x USB-C + 1x USB-A', desc: '65W en un cubo compacto.',
      images: ['https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=900&q=80']
    },
    {
      id: uid(), category: 'accesorios', name: 'Funda iPhone 15 Pro MagSafe', brand: 'Apple',
      price: 349, colors: ['Negro', 'Azul', 'Verde', 'Rosa'], estado: 'disponible',
      tipoAcc: 'Funda', compatAcc: 'iPhone 15 Pro', material: 'FineWoven',
      desc: 'Funda oficial con MagSafe.',
      images: ['https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=900&q=80']
    }
  ];

  for (const p of samples) {
    try { await saveProduct(p); }
    catch (e) { console.warn('[db] Error en seed:', e); }
  }
}
