// HU05 · Movimientos, kárdex y reporte de ventas
import { api } from '../api.js';
import { state, sucursalNombre } from '../state.js';
import { head, empty, escape, icon, toast } from '../ui.js';

export async function render(view) {
  view.innerHTML = head('Kárdex', escape(sucursalNombre()) + ' · Movimientos, kárdex y reporte de ventas.') +
    empty('Pantalla pendiente (HU05)', 'Aquí va la pantalla de Kárdex. Usa head(), empty(), openModal() y las clases de app.css.', 'clock');
}
