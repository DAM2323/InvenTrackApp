// HU01 · Registrar y anular ventas
// Flujo: «Nueva venta» (modal) -> registrar (baja el stock de la sucursal) -> si fue un error, «Anular» (el stock vuelve).
import { api } from '../api.js';
import { state, sucursalNombre } from '../state.js';
import { $, $$, escape, number, money, icon, empty, head, toast, openModal } from '../ui.js';

const ESTADOS = ['Todas', 'Registrada', 'Anulada'];
const ETIQUETA = { Todas: 'Todas', Registrada: 'Registradas', Anulada: 'Anuladas' };
const PILL = { Registrada: 'pill good', Anulada: 'pill warn' };
let filtro = 'Todas';

const esHoy = valor => valor && new Date(valor).toDateString() === new Date().toDateString();
const fechaHora = valor => valor
  ? new Date(valor).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', '')
  : '';

// Estilos propios de esta pantalla (se inyectan una sola vez; usan las variables de app.css).
function estilos() {
  if (document.getElementById('vt-css')) return;
  const css = document.createElement('style');
  css.id = 'vt-css';
  css.textContent = `
  .vt-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:22px}
  .vt-kpi{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 18px;display:flex;align-items:center;gap:14px;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:border-color .15s,transform .15s}
  .vt-kpi:hover{border-color:#d9bd6b;transform:translateY(-1px)}
  .vt-kpi .ic{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:#f3edd8;color:var(--blue);flex:none}
  .vt-kpi.money .ic{background:#e3f7f0;color:#148367}.vt-kpi.anul .ic{background:#fff0d7;color:#b07519}
  .vt-kpi strong{display:block;font-size:26px;line-height:1.1;letter-spacing:-.03em}
  .vt-kpi span{font-size:12px;color:var(--muted)}
  .vt-sec{display:flex;align-items:center;gap:10px;margin:26px 0 12px;font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
  .vt-sec b{background:#f3e7bf;color:#805214;border-radius:20px;padding:2px 9px;font-size:11px;letter-spacing:0}
  .vt-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px 20px;margin-bottom:14px;display:grid;gap:14px}
  .vt-card.hoy{border-color:#d9bd6b;box-shadow:0 0 0 4px #f6edcc}
  .vt-card.anulada .vt-total{color:var(--muted);text-decoration:line-through}
  .vt-top{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:12px;color:var(--muted)}
  .vt-main{display:flex;justify-content:space-between;align-items:flex-end;gap:14px}
  .vt-cliente{font-size:17px;font-weight:700;letter-spacing:-.02em;overflow-wrap:anywhere}
  .vt-sub{display:block;font-size:12px;color:var(--muted);margin-top:3px}
  .vt-total{font-size:26px;font-weight:800;letter-spacing:-.03em;white-space:nowrap}
  .vt-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:14px}
  .vt-meta{font-size:12px;color:var(--muted);display:grid;gap:2px}
  .vt-meta em{color:var(--text);font-style:normal;font-size:13px}
  .vt-pay{display:flex;flex-wrap:wrap;gap:8px}
  .vt-lbl{font-size:12px;font-weight:700;color:#52677f;margin:0 0 7px;display:block}
  .vt-unit{display:block;font-size:11px;color:var(--muted)}
  .vt-sum{display:flex;justify-content:space-between;align-items:center;padding:14px 2px 0;font-size:13px;color:var(--muted)}
  .vt-sum b{font-size:20px;color:var(--text);letter-spacing:-.02em}
  .vt-confirm{display:grid;gap:14px}
  .vt-confirm p{font-size:14px;color:var(--muted);line-height:1.5}
  .vt-confirm .btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media(max-width:640px){
    .vt-kpis{gap:8px}
    .vt-kpi{padding:12px;flex-direction:column;align-items:flex-start;gap:8px}
    .vt-kpi .ic{width:34px;height:34px;border-radius:11px}
    .vt-kpi strong{font-size:19px}.vt-kpi span{font-size:11px;line-height:1.3;display:block}
    .vt-total{font-size:23px}
    .vt-foot{flex-direction:column;align-items:stretch}.vt-foot .btn{width:100%}
  }`;
  document.head.appendChild(css);
}

export async function render(view) {
  estilos();
  const [clientes, metodos, inventario, todas] = await Promise.all([
    api('/cliente/listar'),
    api('/metodo-pago/listar'),
    api('/inventario/listar', { params: { idSucursal: state.sucursalId } }),
    api('/venta/listar', { params: { idSucursal: state.sucursalId } })
  ]);

  const registradasHoy = todas.filter(v => v.estado === 'Registrada' && esHoy(v.fechaVenta));
  const totalHoy = registradasHoy.reduce((suma, v) => suma + Number(v.total || 0), 0);
  const cuenta = e => e === 'Todas' ? todas.length : todas.filter(v => v.estado === e).length;

  const visibles = todas.filter(v => filtro === 'Todas' || v.estado === filtro).sort((a, b) => b.id - a.id);
  const deHoy = visibles.filter(v => v.estado === 'Registrada' && esHoy(v.fechaVenta));
  const resto = visibles.filter(v => !deHoy.includes(v));

  view.innerHTML =
    head('Ventas', `${escape(sucursalNombre())} · Registra ventas y anula las que fueron un error.`,
      `<button class="btn" id="nueva-venta">${icon('plus')} Nueva venta</button>`) +
    `<div class="vt-kpis">
      <button class="vt-kpi" data-kpi="Registrada" type="button"><div class="ic">${icon('check')}</div><div><strong>${registradasHoy.length}</strong><span>Ventas registradas hoy</span></div></button>
      <button class="vt-kpi money" data-kpi="Registrada" type="button"><div class="ic">${icon('file')}</div><div><strong>${money(totalHoy)}</strong><span>Total vendido hoy</span></div></button>
      <button class="vt-kpi anul" data-kpi="Anulada" type="button"><div class="ic">${icon('x')}</div><div><strong>${cuenta('Anulada')}</strong><span>Ventas anuladas</span></div></button>
    </div>` +
    `<div class="filters">${ESTADOS.map(e => `<button class="filter ${e === filtro ? 'active' : ''}" data-estado="${e}">${ETIQUETA[e]} · ${cuenta(e)}</button>`).join('')}</div>` +
    (deHoy.length ? `<div class="vt-sec">Ventas de hoy · aún puedes anularlas <b>${deHoy.length}</b></div>${deHoy.map(v => tarjeta(v, true)).join('')}` : '') +
    (resto.length ? `<div class="vt-sec">${deHoy.length ? 'Ventas anteriores' : 'Historial'} <b>${resto.length}</b></div>${resto.map(v => tarjeta(v, false)).join('')}` : '') +
    (!visibles.length ? empty('Sin ventas', filtro === 'Todas' ? 'Esta sucursal aún no tiene ventas. Registra la primera con «Nueva venta».' : `No hay ventas ${ETIQUETA[filtro].toLowerCase()}.`, 'list') : '');

  $('#nueva-venta').onclick = () => modalNueva(view, { clientes, metodos, inventario });
  $$('[data-estado]', view).forEach(b => b.onclick = () => { filtro = b.dataset.estado; render(view); });
  $$('[data-kpi]', view).forEach(b => b.onclick = () => { filtro = b.dataset.kpi; render(view); });
  $$('[data-anular]', view).forEach(b => b.onclick = () => confirmarAnular(view, todas.find(v => v.id === Number(b.dataset.anular))));
}

function tarjeta(v, destacada) {
  const anulada = v.estado === 'Anulada';
  return `<article class="vt-card ${destacada ? 'hoy' : ''} ${anulada ? 'anulada' : ''}">
    <div class="vt-top"><span>Venta #${v.id} · ${escape(fechaHora(v.fechaVenta))}</span><span class="${PILL[v.estado] || 'pill'}">${escape(v.estado)}</span></div>
    <div class="vt-main">
      <div><div class="vt-cliente">${escape(v.cliente?.nombre || 'Cliente')}</div><span class="vt-sub">Pago: ${escape(v.metodoPago?.nombre || '—')}</span></div>
      <div class="vt-total">${money(v.total)}</div>
    </div>
    ${v.observacion || !anulada ? `<div class="vt-foot">
      <div class="vt-meta">${v.observacion ? `<em>“${escape(v.observacion)}”</em>` : ''}${anulada ? '' : '<span>Si fue un error, anúlala y el stock vuelve al inventario.</span>'}</div>
      ${anulada ? '' : `<button class="btn secondary" data-anular="${v.id}" type="button">${icon('x')} Anular</button>`}
    </div>` : ''}
  </article>`;
}

function confirmarAnular(view, v) {
  if (!v) return;
  openModal('Anular venta', `Venta #${v.id} · ${v.cliente?.nombre || 'Cliente'} · ${money(v.total)}`,
    `<div class="vt-confirm"><p>La venta quedará como <b>Anulada</b> y el stock de cada producto <b>volverá al inventario de ${escape(sucursalNombre())}</b>. Esta acción no se puede deshacer.</p><div id="error" class="form-error" role="alert"></div></div>`,
    `<div class="vt-confirm"><div class="btns"><button class="btn secondary" id="cancelar" type="button">No, volver</button><button class="btn" id="confirmar" type="button">${icon('check')} Sí, anular</button></div></div>`);
  $('#cancelar').onclick = () => $('#modal').close();
  $('#confirmar').onclick = async () => {
    const boton = $('#confirmar');
    boton.disabled = true;
    try {
      const r = await api('/venta/anular', { method: 'PUT', params: { idVenta: v.id } });
      $('#modal').close();
      toast(r?.mensaje || 'Venta anulada y stock reincorporado.');
      await render(view);
    } catch (error) {
      $('#error').textContent = error.message; $('#error').style.display = 'block';
      boton.disabled = false;
    }
  };
}

function modalNueva(view, { clientes, metodos, inventario }) {
  const disponibles = inventario.filter(i => i.cantidadDisponible > 0);
  const activos = metodos.filter(m => m.activo !== false);
  const carrito = new Map(); // idProducto -> { producto, disponible, cantidad }
  let metodo = activos[0]?.id ?? null;

  const total = () => [...carrito.values()].reduce((s, f) => s + Number(f.producto.precioVenta || 0) * (Number(f.cantidad) || 0), 0);
  const pintarTotal = () => {
    const unidades = [...carrito.values()].reduce((n, f) => n + (Number(f.cantidad) || 0), 0);
    $('#vt-sum').innerHTML = carrito.size ? `<span>${carrito.size} producto${carrito.size === 1 ? '' : 's'} · ${number(unidades)} unidades</span><b>${money(total())}</b>` : '';
    $('#guardar').innerHTML = `${icon('check')} Registrar venta · ${money(total())}`;
  };

  openModal('Nueva venta', `Sale de ${sucursalNombre()}. El stock baja al registrar la venta.`,
    `<div class="field"><label for="cliente">Cliente</label><select id="cliente">${clientes.map(c => `<option value="${c.id}">${escape(c.nombre)}${c.documento ? ' · ' + escape(c.documento) : ''}</option>`).join('')}</select></div>
     <span class="vt-lbl">Método de pago</span>
     <div class="vt-pay field" id="pagos">${activos.map(m => `<button type="button" class="filter ${m.id === metodo ? 'active' : ''}" data-pago="${m.id}">${escape(m.nombre)}</button>`).join('')}</div>
     <label class="searchbar">${icon('search')}<input id="buscar" type="search" placeholder="Busca productos con stock por nombre o código" maxlength="100" aria-label="Buscar productos"></label>
     <div class="pick-results" id="resultados" hidden></div>
     <div id="carrito"></div>
     <div class="vt-sum" id="vt-sum"></div>
     <div class="field spaced"><label for="nota">Observación opcional</label><textarea id="nota" rows="2" maxlength="500" placeholder="Ej.: entrega en tienda"></textarea></div>
     <div id="error" class="form-error" role="alert"></div>`,
    `<button class="btn full" id="guardar" type="button">${icon('check')} Registrar venta · ${money(0)}</button>`);

  $$('[data-pago]').forEach(b => b.onclick = () => {
    metodo = Number(b.dataset.pago);
    $$('[data-pago]').forEach(x => x.classList.toggle('active', x === b));
  });

  const dibujarCarrito = () => {
    const filas = [...carrito.values()];
    $('#carrito').innerHTML = filas.length
      ? filas.map(f => `<div class="cart-row"><div class="cart-product"><b>${escape(f.producto.nombre)}</b><small>${escape(f.producto.codigo)} · ${money(f.producto.precioVenta)} c/u · ${number(f.disponible)} disponibles</small></div>
          <label class="quantity-field" for="cant-${f.producto.id}"><span>Unidades</span><input id="cant-${f.producto.id}" data-cant="${f.producto.id}" type="number" inputmode="numeric" min="1" max="${f.disponible}" step="1" value="${f.cantidad}"></label>
          <button class="icon-button" data-quitar="${f.producto.id}" type="button" aria-label="Quitar producto">${icon('x')}</button></div>`).join('')
      : empty('Agrega los productos', 'Busca por nombre o código en el campo de arriba.');
    $('#guardar').disabled = !filas.length;
    pintarTotal();
    $$('[data-cant]').forEach(i => i.oninput = () => {
      carrito.get(Number(i.dataset.cant)).cantidad = i.value;
      $('#error').style.display = 'none';
      pintarTotal();
    });
    $$('[data-quitar]').forEach(b => b.onclick = () => { carrito.delete(Number(b.dataset.quitar)); dibujarCarrito(); });
  };
  dibujarCarrito();

  $('#buscar').oninput = e => {
    const q = e.target.value.trim().toLowerCase();
    const coincidencias = q ? disponibles.filter(i => `${i.producto.nombre} ${i.producto.codigo}`.toLowerCase().includes(q)).slice(0, 12) : [];
    const caja = $('#resultados');
    caja.hidden = !q;
    caja.innerHTML = coincidencias.map(i => `<button class="pick-row" type="button" data-pick="${i.producto.id}"><div><b>${escape(i.producto.nombre)}</b><small>${escape(i.producto.codigo)} · ${money(i.producto.precioVenta)} · ${number(i.cantidadDisponible)} unid.</small></div><span class="plus">+</span></button>`).join('') || empty('Sin resultados', 'Prueba otro nombre o código, o revisa que tenga stock.');
    $$('[data-pick]', caja).forEach(b => b.onclick = () => {
      const inv = disponibles.find(i => i.producto.id === Number(b.dataset.pick));
      if (!carrito.has(inv.producto.id)) carrito.set(inv.producto.id, { producto: inv.producto, disponible: inv.cantidadDisponible, cantidad: 1 });
      caja.hidden = true; e.target.value = '';
      dibujarCarrito();
    });
  };

  $('#guardar').onclick = async () => {
    const boton = $('#guardar');
    try {
      const filas = [...carrito.values()];
      if (!$('#cliente').value) throw new Error('Elige un cliente.');
      if (!metodo) throw new Error('Elige un método de pago.');
      if (filas.some(f => !Number.isInteger(Number(f.cantidad)) || Number(f.cantidad) < 1)) throw new Error('Ingresa cantidades enteras mayores a 0.');
      if (filas.some(f => Number(f.cantidad) > f.disponible)) throw new Error('Una cantidad supera el stock disponible en la sucursal.');
      boton.disabled = true;
      const r = await api('/venta/registrar', {
        method: 'POST',
        body: {
          idCliente: Number($('#cliente').value),
          idSucursal: state.sucursalId,
          idMetodoPago: metodo,
          idUsuario: state.user.idUsuario,
          observacion: $('#nota').value,
          detalle: filas.map(f => ({ idProducto: f.producto.id, cantidad: Number(f.cantidad) }))
        }
      });
      $('#modal').close();
      toast(`Venta #${r?.idVenta ?? ''} registrada por ${money(r?.total)}.`);
      await render(view);
    } catch (error) {
      $('#error').textContent = error.message; $('#error').style.display = 'block';
      boton.disabled = false;
    }
  };
}
