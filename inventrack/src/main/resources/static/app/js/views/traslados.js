// HU03 · Trasladar mercadería entre sucursales
import { api } from '../api.js';
import { state, sucursalNombre } from '../state.js';
import { head, empty, escape, icon, toast } from '../ui.js';

export async function render(view) {
  view.innerHTML = head('Traslados', escape(sucursalNombre()) + ' · Trasladar mercadería entre sucursales.') +
    empty('Pantalla pendiente (HU03)', 'Aquí va la pantalla de Traslados. Usa head(), empty(), openModal() y las clases de app.css.', 'arrow');
}
