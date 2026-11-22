// HU04 · Stock por sucursal y alertas de stock bajo
import { api } from '../api.js';
import { state, sucursalNombre } from '../state.js';
import { head, empty, escape, icon, toast } from '../ui.js';

export async function render(view) {
  view.innerHTML = head('Inventario', escape(sucursalNombre()) + ' · Stock por sucursal y alertas de stock bajo.') +
    empty('Pantalla pendiente (HU04)', 'Aquí va la pantalla de Inventario. Usa head(), empty(), openModal() y las clases de app.css.', 'box');
}
