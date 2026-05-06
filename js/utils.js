// ── UTILS.JS ─────────────────────────────────────────────────────────────────
// Funciones utilitarias usadas por todos los módulos.
// Este archivo debe cargarse PRIMERO.
// ─────────────────────────────────────────────────────────────────────────────

/** Obtiene un elemento por ID */
export function el(id) {
  return document.getElementById(id);
}

/** Genera un ID único */
export function uid() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/** Formatea precio en formato guatemalteco */
export function fmtPrice(n) {
  return Number(n).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/** Obtiene el valor trimmed de un input por ID */
export function v(id) {
  return document.getElementById(id)?.value.trim() || '';
}

/** Establece el valor de un input por ID */
export function sv(id, val) {
  const e = document.getElementById(id);
  if (e) e.value = val || '';
}

/** Muestra una alerta con tipo (success | error | info) */
export function showAlert(id, type, text) {
  const e = el(id);
  if (!e) return;
  e.className = `alert ${type}`;
  e.textContent = text;
  e.classList.remove('hidden');
}

/** Oculta una alerta */
export function hideAlert(id) {
  el(id)?.classList.add('hidden');
}
