// Utilidades de interfaz compartidas por todas las pantallas (diseño tomado de InvenTrackApp de Mauricio).
export const $ = (q, root = document) => root.querySelector(q);
export const $$ = (q, root = document) => [...root.querySelectorAll(q)];
export const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const number = v => new Intl.NumberFormat('es-PE').format(v ?? 0);
export const money = v => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v ?? 0);

const paths = {
  home: 'M3 10l9-7 9 7v10H4V10 M9 20v-7h6v7',
  box: 'M3 7l9-5 9 5v10l-9 5-9-5V7 M3 7l9 5 9-5 M12 12v10 M7 4.8l10 5.5',
  arrow: 'M12 4v16 M5 13l7 7 7-7', up: 'M12 20V4 M5 11l7-7 7 7',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', plus: 'M12 5v14 M5 12h14',
  x: 'M6 6l12 12 M6 18L18 6', check: 'M5 12l4 4L19 6', list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.1 M3 12h.1 M3 18h.1',
  file: 'M14 2H5v20h14V7l-5-5 M14 2v5h5 M8 12h8 M8 16h8', edit: 'M4 16l12-12 4 4-12 12-5 1 1-5 M14 6l4 4',
  chevron: 'M9 5l7 7-7 7', left: 'M15 5l-7 7 7 7', logout: 'M10 3H3v18h7 M8 12h13 M16 7l5 5-5 5',
  clock: 'M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  shield: 'M12 2l8 3v7c0 5-8 10-8 10s-8-5-8-10V5l8-3 M8 12l3 3 5-6',
  wifi: 'M3 8a15 15 0 0 1 18 0 M6 12a10 10 0 0 1 12 0 M9 16a5 5 0 0 1 6 0 M12 20h.1'
};
export const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.box}"/></svg>`;
export const brand = () => '<div class="brand"><img src="icon.svg" alt="">InvenTrack</div>';
export const empty = (title, text, ic = 'box') => `<div class="empty"><div class="symbol">${icon(ic)}</div><b>${escape(title)}</b>${escape(text)}</div>`;
export const head = (title, description = '', button = '') =>
  `<div class="page-head"><div><div class="eyebrow">INVENTRACK</div><h1>${title}</h1>${description ? `<p>${description}</p>` : ''}</div>${button}</div>`;

let toastTimer;
export function toast(message) {
  const el = $('#toast');
  el.textContent = message; el.style.display = 'block';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.style.display = 'none'), 5000);
}

export function openModal(title, subtitle, content, footer = '') {
  const dialog = $('#modal');
  if (dialog.open) dialog.close();
  dialog.innerHTML = `<div class="modal-head"><div><h2>${escape(title)}</h2><p>${escape(subtitle)}</p></div><button class="icon-button" id="close-modal" aria-label="Cerrar">${icon('x')}</button></div><div class="modal-body">${content}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ''}`;
  $('#close-modal').onclick = () => dialog.close();
  dialog.showModal();
  return dialog;
}
