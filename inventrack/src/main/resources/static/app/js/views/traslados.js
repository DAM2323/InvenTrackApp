// HU03 · Trasladar mercadería entre sucursales
// Flujo: registrar (Pendiente, no mueve stock) -> enviar (descuenta en el origen) -> recibir (suma en el destino).
import { api } from '../api.js';
import { state, sucursalNombre } from '../state.js';
import { $, $$, escape, number, icon, empty, head, toast, openModal } from '../ui.js';

const ESTADOS = ['Todos', 'Pendiente', 'Enviado', 'Recibido'];
const PILL = { Pendiente: 'pill warn', Enviado: 'pill', Recibido: 'pill good' };
let filtro = 'Todos';

const fecha = valor => valor ? new Date(valor).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export async function render(view) {
  const params = { idSucursal: state.sucursalId };
  if (filtro !== 'Todos') params.estado = filtro;
  const traslados = await api('/traslado/listar', { params });

  view.innerHTML =
    head('Traslados', `${escape(sucursalNombre())} · Envíos y recepciones entre sucursales.`,
      `<button class="btn" id="nuevo-traslado">${icon('plus')} Nuevo traslado</button>`) +
    `<div class="filters">${ESTADOS.map(e => `<button class="filter ${e === filtro ? 'active' : ''}" data-estado="${e}">${e}</button>`).join('')}</div>` +
    (traslados.length ? traslados.map(tarjeta).join('') : empty('Sin traslados', 'No hay traslados con este filtro en la sucursal activa.', 'arrow'));

  $('#nuevo-traslado').onclick = () => modalNuevo(view);
  $$('[data-estado]', view).forEach(b => b.onclick = () => { filtro = b.dataset.estado; render(view); });
  $$('[data-accion]', view).forEach(b => b.onclick = () => accion(view, b.dataset.accion, Number(b.dataset.id)));
}

function tarjeta(t) {
  const esOrigen = t.sucursalOrigen?.id === state.sucursalId;
  const esDestino = t.sucursalDestino?.id === state.sucursalId;
  let boton = '';
  if (t.estado === 'Pendiente' && esOrigen) boton = `<button class="btn" data-accion="enviar" data-id="${t.id}">${icon('up')} Enviar</button>`;
  if (t.estado === 'Enviado' && esDestino) boton = `<button class="btn" data-accion="recibir" data-id="${t.id}">${icon('check')} Recibir</button>`;
  return `<article class="card spaced">
    <div class="section-head"><h2>${escape(t.sucursalOrigen?.nombre)} → ${escape(t.sucursalDestino?.nombre)}</h2><span class="${PILL[t.estado] || 'pill'}">${escape(t.estado)}</span></div>
    <p>Traslado #${t.id} · Solicitado ${fecha(t.fechaSolicitud)}${t.fechaEnvio ? ' · Enviado ' + fecha(t.fechaEnvio) : ''}${t.fechaRecepcion ? ' · Recibido ' + fecha(t.fechaRecepcion) : ''}</p>
    ${t.observacion ? `<p>${escape(t.observacion)}</p>` : ''}
    ${boton}
  </article>`;
}

async function accion(view, tipo, id) {
  const texto = tipo === 'enviar' ? 'Se descontará el stock en la sucursal de origen.' : 'Se sumará el stock en la sucursal de destino.';
  if (!confirm(`¿${tipo === 'enviar' ? 'Enviar' : 'Recibir'} el traslado #${id}? ${texto}`)) return;
  try {
    const r = await api(`/traslado/${tipo}`, { method: 'PUT', params: { idTraslado: id } });
    toast(r?.mensaje || 'Traslado actualizado.');
    await render(view);
  } catch (error) { toast(error.message); }
}

async function modalNuevo(view) {
  const destinos = state.sucursales.filter(s => s.id !== state.sucursalId);
  if (!destinos.length) return toast('No hay otra sucursal a la que trasladar.');
  const inventario = (await api('/inventario/listar', { params: { idSucursal: state.sucursalId } })).filter(i => i.cantidadDisponible > 0);
  const carrito = new Map(); // idProducto -> { producto, disponible, cantidad }

  openModal('Nuevo traslado', `Origen: ${sucursalNombre()}. El stock no cambia hasta que lo envíes.`,
    `<div class="field"><label for="destino">Sucursal de destino</label><select id="destino">${destinos.map(s => `<option value="${s.id}">${escape(s.nombre)}</option>`).join('')}</select></div>
     <label class="searchbar">${icon('search')}<input id="buscar" type="search" placeholder="Busca productos con stock" maxlength="100" aria-label="Buscar productos"></label>
     <div class="pick-results" id="resultados" hidden></div>
     <div id="carrito"></div>
     <div class="field spaced"><label for="nota">Observación opcional</label><textarea id="nota" rows="2" maxlength="500"></textarea></div>
     <div id="error" class="form-error" role="alert"></div>`,
    `<button class="btn full" id="guardar">${icon('check')} Registrar traslado</button>`);

  const dibujarCarrito = () => {
    const filas = [...carrito.values()];
    $('#carrito').innerHTML = filas.length
      ? filas.map(f => `<div class="cart-row"><div class="cart-product"><b>${escape(f.producto.nombre)}</b><small>${escape(f.producto.codigo)} · ${number(f.disponible)} disponibles</small></div>
          <label class="quantity-field" for="cant-${f.producto.id}"><span>Unidades</span><input id="cant-${f.producto.id}" data-cant="${f.producto.id}" type="number" inputmode="numeric" min="1" max="${f.disponible}" step="1" value="${f.cantidad}"></label>
          <button class="icon-button" data-quitar="${f.producto.id}" aria-label="Quitar producto">${icon('x')}</button></div>`).join('')
      : empty('Agrega los productos', 'Busca por nombre o código en el campo de arriba.');
    $('#guardar').disabled = !filas.length;
    $$('[data-cant]').forEach(i => i.oninput = () => { carrito.get(Number(i.dataset.cant)).cantidad = i.value; $('#error').style.display = 'none'; });
    $$('[data-quitar]').forEach(b => b.onclick = () => { carrito.delete(Number(b.dataset.quitar)); dibujarCarrito(); });
  };
  dibujarCarrito();

  $('#buscar').oninput = e => {
    const q = e.target.value.trim().toLowerCase();
    const coincidencias = q ? inventario.filter(i => `${i.producto.nombre} ${i.producto.codigo}`.toLowerCase().includes(q)).slice(0, 12) : [];
    const caja = $('#resultados');
    caja.hidden = !q;
    caja.innerHTML = coincidencias.map(i => `<button class="pick-row" data-pick="${i.producto.id}"><div><b>${escape(i.producto.nombre)}</b><small>${escape(i.producto.codigo)} · ${number(i.cantidadDisponible)} unid.</small></div><span class="plus">+</span></button>`).join('') || empty('Sin resultados', 'Prueba otro nombre o código.');
    $$('[data-pick]', caja).forEach(b => b.onclick = () => {
      const inv = inventario.find(i => i.producto.id === Number(b.dataset.pick));
      if (!carrito.has(inv.producto.id)) carrito.set(inv.producto.id, { producto: inv.producto, disponible: inv.cantidadDisponible, cantidad: 1 });
      caja.hidden = true; e.target.value = '';
      dibujarCarrito();
    });
  };

  $('#guardar').onclick = async () => {
    const boton = $('#guardar');
    try {
      const filas = [...carrito.values()];
      const mala = filas.find(f => !Number.isInteger(Number(f.cantidad)) || Number(f.cantidad) < 1);
      if (mala) throw new Error('Ingresa cantidades enteras mayores a 0.');
      if (filas.some(f => Number(f.cantidad) > f.disponible)) throw new Error('Una cantidad supera el stock disponible en el origen.');
      boton.disabled = true;
      await api('/traslado/registrar', {
        method: 'POST',
        body: {
          idSucursalOrigen: state.sucursalId,
          idSucursalDestino: Number($('#destino').value),
          idUsuario: state.user.idUsuario,
          observacion: $('#nota').value,
          detalle: filas.map(f => ({ idProducto: f.producto.id, cantidad: Number(f.cantidad) }))
        }
      });
      $('#modal').close();
      toast('Traslado registrado como Pendiente.');
      await render(view);
    } catch (error) {
      $('#error').textContent = error.message; $('#error').style.display = 'block';
      boton.disabled = false;
    }
  };
}
