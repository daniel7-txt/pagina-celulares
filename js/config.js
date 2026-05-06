// ── CONFIG.JS ─────────────────────────────────────────────────────────────────
// Constantes globales: categorías, estados y mapa de colores.
// ─────────────────────────────────────────────────────────────────────────────

export const CATS = {
  celulares: { label: 'Celulares', icon: '📱', sub: 'Los mejores smartphones del mercado' },
  auriculares: { label: 'Auriculares', icon: '🎧', sub: 'Audio de alta calidad para cada momento' },
  relojes: { label: 'Relojes', icon: '⌚', sub: 'Smartwatches y relojes de última generación' },
  bocinas: { label: 'Bocinas', icon: '🔊', sub: 'Sonido potente para cualquier ambiente' },
  cargadores: { label: 'Cargadores', icon: '⚡', sub: 'Carga rápida y segura para tus dispositivos' },
  accesorios: { label: 'Accesorios', icon: '🎒', sub: 'Fundas, cables, vidrios y más' }
};

export const CAT_ORDER = [
  'celulares', 'auriculares', 'relojes', 'bocinas', 'cargadores', 'accesorios'
];

export const STATUS = {
  disponible: { label: 'Disponible', cls: 's-disponible' },
  pocas: { label: 'Pocas unidades', cls: 's-pocas' },
  agotado: { label: 'Agotado', cls: 's-agotado' },
  preventa: { label: 'Próximamente', cls: 's-preventa' }
};

export const COLOR_MAP = {
  negro: '#1a1a1a', blanco: '#f5f5f5', rojo: '#ef4444', azul: '#3b82f6',
  verde: '#22c55e', amarillo: '#eab308', naranja: '#f97316', morado: '#a855f7',
  rosa: '#ec4899', gris: '#6b7280', plateado: '#94a3b8', dorado: '#d97706',
  cafe: '#92400e', beige: '#d2b48c', celeste: '#38bdf8', turquesa: '#14b8a6',
  coral: '#fb923c', lila: '#c084fc', navy: '#1e3a5f', titanio: '#b0b8c1',
  titanium: '#b0b8c1', natural: '#d4c5b0', graphite: '#4b5563',
  midnight: '#1c1c2e', starlight: '#f0ece4',
  black: '#1a1a1a', white: '#f5f5f5', gray: '#6b7280', red: '#dc2626',
  blue: '#2563eb', green: '#16a34a', pink: '#db2777', silver: '#9ca3af',
  gold: '#b45309', purple: '#9333ea', orange: '#ea580c', teal: '#0d9488',
  cyan: '#0891b2', transparente: 'rgba(200,220,240,0.5)'
};

/** Devuelve el color CSS para un nombre de color */
export function colorCss(name) {
  const k = name.toLowerCase().split(' ')[0];
  return COLOR_MAP[k] || COLOR_MAP[name.toLowerCase()] || '#a0a0a0';
}
