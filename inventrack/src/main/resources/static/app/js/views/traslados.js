// HU03 · Trasladar mercadería entre sucursales
// Flujo: registrar (Pendiente, no mueve stock) -> enviar (descuenta en el origen) -> recibir (suma en el destino).
import { api } from '../api.js';
import { state, sucursalNombre } from '../state.js';
import { $, $$, escape, number, icon, empty, head, toast, openModal } from '../ui.js';

const ESTADOS = ['Todos', 'Pendiente', 'Enviado', 'Recibido'];
const PILL = { Pendiente: 'pill warn', Enviado: 'pill', Recibido: 'pill good' };
let filtro = 'Todos';

const fecha = valor => valor ? new Date(valor).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).replace('.', '') : '';
const anio = valor => valor ? new Date(valor).getFullYear() : '';

// Estilos propios de esta pantalla (se inyectan una sola vez; usan las variables de app.css).
function estilos() {
  if (document.getElementById('tr-css')) return;
  const css = document.createElement('style');
  css.id = 'tr-css';
  css.textContent = `
  .tr-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:22px}
  .tr-kpi{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 18px;display:flex;align-items:center;gap:14px;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color .15s,transform .15s}
  .tr-kpi:hover{border-color:#d9bd6b;transform:translateY(-1px)}
  .tr-kpi .ic{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#f3edd8;color:var(--blue);flex:none}
  .tr-kpi.out .ic{background:#fff0d7;color:#b07519}.tr-kpi.in .ic{background:#e3f7f0;color:#148367}
  .tr-kpi strong{display:block;font-size:26px;line-height:1.1;letter-spacing:-.03em}
  .tr-kpi span{font-size:12px;color:var(--muted)}
  .tr-sec{display:flex;align-items:center;gap:10px;margin:26px 0 12px;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
  .tr-sec b{background:#f3e7bf;color:#805214;border-radius:20px;padding:2px 9px;font-size:11px;letter-spacing:0}
  .tr-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px 20px;margin-bottom:14px;display:grid;gap:16px}
  .tr-card.accion{border-color:#d9bd6b;box-shadow:0 0 0 4px #f6edcc}
  .tr-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
  .tr-dir{display:inline-flex;align-items:center;gap:10px;font-size:13px;font-weight:650}
  .tr-dir i{display:grid;place-items:center;width:32px;height:32px;border-radius:11px;background:#fff0d7;color:#b07519}
  .tr-dir.in i{background:#e3f7f0;color:#148367}
  .tr-dir small{display:block;font-weight:500;font-size:11px;color:var(--muted)}
  .tr-route{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px}
  .tr-stop{padding:11px 14px;border-radius:14px;background:#faf8f1;border:1px solid var(--line)}
  .tr-stop small{display:block;font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
  .tr-stop b{font-size:14px;overflow-wrap:anywhere}
  .tr-stop.yo{background:#f6efd7;border-color:#e2cf94}
  .tr-arrow{color:var(--blue);display:grid;place-items:center}
  .tr-steps{list-style:none;margin:0;padding:0;display:flex}
  .tr-steps li{flex:1;position:relative;padding-top:20px;font-size:12px;font-weight:650;color:#a7a99a}
  .tr-steps li:before{content:"";position:absolute;top:5px;left:0;width:11px;height:11px;border-radius:50%;background:#e5e3d8}
  .tr-steps li:after{content:"";position:absolute;top:10px;left:15px;right:6px;height:2px;background:#e5e3d8}
  .tr-steps li:last-child:after{display:none}
  .tr-steps li small{display:block;font-weight:500;font-size:11px;color:#a7a99a}
  .tr-steps li.ok{color:var(--text)}.tr-steps li.ok small{color:var(--muted)}
  .tr-steps li.ok:before{background:var(--blue)}.tr-steps li.ok:after{background:var(--blue)}
  .tr-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:14px}
  .tr-meta{font-size:12px;color:var(--muted);display:grid;gap:2px}
  .tr-meta em{color:var(--text);font-style:normal;font-size:13px}
  .tr-resumen{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);padding:12px 2px 0}
  .tr-resumen b{color:var(--text)}
  .tr-confirm{display:grid;gap:14px}
  .tr-confirm p{font-size:14px;color:var(--muted);line-height:1.5}
  .tr-confirm .btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media(max-width:640px){
    .tr-kpis{gap:8px}
    .tr-kpi{padding:12px;flex-direction:column;align-items:flex-start;gap:8px}
    .tr-kpi .ic{width:34px;height:34px;border-radius:11px}
    .tr-kpi strong{font-size:22px}.tr-kpi span{font-size:11px;line-height:1.3;display:block}
    .tr-route{grid-template-columns:1fr}.tr-arrow{transform:rotate(90deg);justify-self:center}
    .tr-foot{flex-direction:column;align-items:stretch}.tr-foot .btn{width:100%}
  }`;
  document.head.appendChild(css);
}

export async function render(view) {
  estilos();
  const todos = await api('/traslado/listar', { params: { idSucursal: state.sucursalId } });
  const mi = state.sucursalId;
  const requiereAccion = t => (t.estado === 'Pendiente' && t.sucursalOrigen?.id === mi) || (t.estado === 'Enviado' && t.sucursalDestino?.id === mi);
  const porEnviar = todos.filter(t => t.estado === 'Pendiente' && t.sucursalOrigen?.id === mi);
  const porRecibir = todos.filter(t => t.estado === 'Enviado' && t.sucursalDestino?.id === mi);
  const cuenta = e => e === 'Todos' ? todos.length : todos.filter(t => t.estado === e).length;

  const visibles = todos.filter(t => filtro === 'Todos' || t.estado === filtro).sort((a, b) => b.id - a.id);
  const urgentes = visibles.filter(requiereAccion);
  const resto = visibles.filter(t => !requiereAccion(t));

  view.innerHTML =
    head('Traslados', `${escape(sucursalNombre())} · Envíos y recepciones entre sucursales.`,
      `<button class="btn" id="nuevo-traslado">${icon('plus')} Nuevo traslado</button>`) +
    `<div class="tr-kpis">
      <button class="tr-kpi out" data-kpi="Pendiente" type="button"><div class="ic">${icon('up')}</div><div><strong>${porEnviar.length}</strong><span>Por enviar desde aquí</span></div></button>
      <button class="tr-kpi in" data-kpi="Enviado" type="button"><div class="ic">${icon('arrow')}</div><div><strong>${porRecibir.length}</strong><span>Por recibir aquí</span></div></button>
      <button class="tr-kpi" data-kpi="Recibido" type="button"><div class="ic">${icon('check')}</div><div><strong>${cuenta('Recibido')}</strong><span>Recibidos</span></div></button>
    </div>` +
    `<div class="filters">${ESTADOS.map(e => `<button class="filter ${e === filtro ? 'active' : ''}" data-estado="${e}">${e} · ${cuenta(e)}</button>`).join('')}</div>` +
    (urgentes.length ? `<div class="tr-sec">Requieren tu acción <b>${urgentes.length}</b></div>${urgentes.map(t => tarjeta(t, true)).join('')}` : '') +
    (resto.length ? `<div class="tr-sec">${urgentes.length ? 'Otros traslados' : 'Historial'} <b>${resto.length}</b></div>${resto.map(t => tarjeta(t, false)).join('')}` : '') +
    (!visibles.length ? empty('Sin traslados', filtro === 'Todos' ? 'Esta sucursal aún no tiene traslados. Crea el primero con «Nuevo traslado».' : `No hay traslados en estado ${filtro}.`, 'arrow') : '');

  $('#nuevo-traslado').onclick = () => modalNuevo(view);
  $$('[data-estado]', view).forEach(b => b.onclick = () => { filtro = b.dataset.estado; render(view); });
  $$('[data-kpi]', view).forEach(b => b.onclick = () => { filtro = b.dataset.kpi; render(view); });
  $$('[data-accion]', view).forEach(b => b.onclick = () => confirmar(view, todos.find(t => t.id === Number(b.dataset.id)), b.dataset.accion));
}

function tarjeta(t, urgente) {
  const mi = state.sucursalId;
  const saliente = t.sucursalOrigen?.id === mi;
  const otra = saliente ? t.sucursalDestino?.nombre : t.sucursalOrigen?.nombre;
  const puedeEnviar = t.estado === 'Pendiente' && saliente;
  const puedeRecibir = t.estado === 'Enviado' && t.sucursalDestino?.id === mi;
  const boton = puedeEnviar ? `<button class="btn" data-accion="enviar" data-id="${t.id}">${icon('up')} Enviar traslado</button>`
    : puedeRecibir ? `<button class="btn" data-accion="recibir" data-id="${t.id}">${icon('check')} Recibir mercadería</button>` : '';
  const ayuda = t.estado === 'Pendiente' && !saliente ? 'Lo enviará la sucursal de origen.' : t.estado === 'Enviado' && saliente ? 'En camino: lo recibirá el destino.' : '';
  const paso = (ok, nombre, f) => `<li class="${ok ? 'ok' : ''}">${nombre}<small>${ok ? fecha(f) + ' ' + anio(f) : 'Pendiente'}</small></li>`;
  return `<article class="tr-card ${urgente ? 'accion' : ''}">
    <div class="tr-top">
      <div class="tr-dir ${saliente ? '' : 'in'}"><i>${icon(saliente ? 'up' : 'arrow')}</i><div>${saliente ? 'Saliente' : 'Entrante'}<small>${saliente ? 'hacia' : 'desde'} ${escape(otra)}</small></div></div>
      <span class="${PILL[t.estado] || 'pill'}">${escape(t.estado)}</span>
    </div>
    <div class="tr-route">
      <div class="tr-stop ${saliente ? 'yo' : ''}"><small>Origen</small><b>${escape(t.sucursalOrigen?.nombre)}</b></div>
      <div class="tr-arrow">${icon('chevron')}</div>
      <div class="tr-stop ${saliente ? '' : 'yo'}"><small>Destino</small><b>${escape(t.sucursalDestino?.nombre)}</b></div>
    </div>
    <ol class="tr-steps">${paso(true, 'Solicitado', t.fechaSolicitud)}${paso(!!t.fechaEnvio, 'Enviado', t.fechaEnvio)}${paso(!!t.fechaRecepcion, 'Recibido', t.fechaRecepcion)}</ol>
    <div class="tr-foot">
      <div class="tr-meta"><span>Traslado #${t.id}</span>${t.observacion ? `<em>“${escape(t.observacion)}”</em>` : ''}${ayuda ? `<span>${ayuda}</span>` : ''}</div>
      ${boton}
    </div>
  </article>`;
}

function confirmar(view, t, tipo) {
  if (!t) return;
  const enviar = tipo === 'enviar';
  const efecto = enviar
    ? `Se descontará el stock de <b>${escape(t.sucursalOrigen?.nombre)}</b> y el traslado quedará en tránsito.`
    : `Se sumará el stock en <b>${escape(t.sucursalDestino?.nombre)}</b> y el traslado quedará cerrado.`;
  openModal(enviar ? 'Enviar traslado' : 'Recibir mercadería', `Traslado #${t.id} · ${t.sucursalOrigen?.nombre} → ${t.sucursalDestino?.nombre}`,
    `<div class="tr-confirm"><p>${efecto}</p><div id="error" class="form-error" role="alert"></div></div>`,
    `<div class="tr-confirm"><div class="btns"><button class="btn secondary" id="cancelar" type="button">Cancelar</button><button class="btn" id="confirmar" type="button">${icon('check')} ${enviar ? 'Sí, enviar' : 'Sí, recibir'}</button></div></div>`);
  $('#cancelar').onclick = () => $('#modal').close();
  $('#confirmar').onclick = async () => {
    const boton = $('#confirmar');
    boton.disabled = true;
    try {
      const r = await api(`/traslado/${tipo}`, { method: 'PUT', params: { idTraslado: t.id } });
      $('#modal').close();
      toast(r?.mensaje || 'Traslado actualizado.');
      await render(view);
    } catch (error) {
      $('#error').textContent = error.message; $('#error').style.display = 'block';
      boton.disabled = false;
    }
  };
}

async function modalNuevo(view) {
  const destinos = state.sucursales.filter(s => s.id !== state.sucursalId);
  if (!destinos.length) return toast('No hay otra sucursal a la que trasladar.');
  const inventario = (await api('/inventario/listar', { params: { idSucursal: state.sucursalId } })).filter(i => i.cantidadDisponible > 0);
  const carrito = new Map(); // idProducto -> { producto, disponible, cantidad }

  openModal('Nuevo traslado', `Sale de ${sucursalNombre()}. El stock no cambia hasta que lo envíes.`,
    `<div class="field"><label for="destino">Sucursal de destino</label><select id="destino">${destinos.map(s => `<option value="${s.id}">${escape(s.nombre)}</option>`).join('')}</select></div>
     <label class="searchbar">${icon('search')}<input id="buscar" type="search" placeholder="Busca productos con stock por nombre o código" maxlength="100" aria-label="Buscar productos"></label>
     <div class="pick-results" id="resultados" hidden></div>
     <div id="carrito"></div>
     <div class="tr-resumen" id="resumen"></div>
     <div class="field spaced"><label for="nota">Observación opcional</label><textarea id="nota" rows="2" maxlength="500" placeholder="Ej.: reposición mensual"></textarea></div>
     <div id="error" class="form-error" role="alert"></div>`,
    `<button class="btn full" id="guardar">${icon('check')} Registrar traslado</button>`);

  const dibujarCarrito = () => {
    const filas = [...carrito.values()];
    $('#carrito').innerHTML = filas.length
      ? filas.map(f => `<div class="cart-row"><div class="cart-product"><b>${escape(f.producto.nombre)}</b><small>${escape(f.producto.codigo)} · ${number(f.disponible)} disponibles</small></div>
          <label class="quantity-field" for="cant-${f.producto.id}"><span>Unidades</span><input id="cant-${f.producto.id}" data-cant="${f.producto.id}" type="number" inputmode="numeric" min="1" max="${f.disponible}" step="1" value="${f.cantidad}"></label>
          <button class="icon-button" data-quitar="${f.producto.id}" aria-label="Quitar producto">${icon('x')}</button></div>`).join('')
      : empty('Agrega los productos', 'Busca por nombre o código en el campo de arriba.');
    const unidades = filas.reduce((n, f) => n + (Number(f.cantidad) || 0), 0);
    $('#resumen').innerHTML = filas.length ? `<span>${filas.length} producto${filas.length === 1 ? '' : 's'}</span><b>${number(unidades)} unidades en total</b>` : '';
    $('#guardar').disabled = !filas.length;
    $$('[data-cant]').forEach(i => i.oninput = () => {
      carrito.get(Number(i.dataset.cant)).cantidad = i.value;
      $('#error').style.display = 'none';
      const total = [...carrito.values()].reduce((n, f) => n + (Number(f.cantidad) || 0), 0);
      $('#resumen').innerHTML = `<span>${carrito.size} producto${carrito.size === 1 ? '' : 's'}</span><b>${number(total)} unidades en total</b>`;
    });
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
      toast('Traslado registrado como Pendiente. Envíalo cuando esté listo.');
      await render(view);
    } catch (error) {
      $('#error').textContent = error.message; $('#error').style.display = 'block';
      boton.disabled = false;
    }
  };
}
