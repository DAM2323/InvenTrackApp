// HU01 · Registrar y anular ventas
import { api } from '../api.js';
import { state, sucursalNombre } from '../state.js';
import { head, empty, escape, icon, toast } from '../ui.js';

export async function render(view) {
  view.innerHTML = head('Ventas', escape(sucursalNombre()) + ' · Registrar y anular ventas.') +
    empty('Pantalla pendiente (HU01)', 'Aquí va la pantalla de Ventas. Usa head(), empty(), openModal() y las clases de app.css.', 'list');
}
