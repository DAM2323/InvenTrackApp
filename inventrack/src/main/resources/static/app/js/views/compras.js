// HU02 · Reponer mercadería con órdenes de compra
import { api } from '../api.js';
import { state, sucursalNombre } from '../state.js';
import { head, empty, escape, icon, toast } from '../ui.js';

export async function render(view) {
  view.innerHTML = head('Compras', escape(sucursalNombre()) + ' · Reponer mercadería con órdenes de compra.') +
    empty('Pantalla pendiente (HU02)', 'Aquí va la pantalla de Compras. Usa head(), empty(), openModal() y las clases de app.css.', 'file');
}
