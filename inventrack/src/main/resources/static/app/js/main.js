// Arranque, login, shell y enrutador por #hash. Cada HU vive en js/views/<nombre>.js y exporta render(view).
import { state, guardarSesion, sucursalNombre } from './state.js';
import { api, login, onSesionExpirada } from './api.js';
import { $, $$, escape, icon, brand, head, empty } from './ui.js';

const rutas = [
  ['ventas', 'Ventas', 'list'], ['compras', 'Compras', 'file'], ['traslados', 'Traslados', 'arrow'],
  ['inventario', 'Inventario', 'box'], ['kardex', 'Kárdex', 'clock']
];

const ruta = () => {
  const key = location.hash.slice(1).split('?')[0];
  return rutas.some(r => r[0] === key) ? key : 'inventario';
};

const nav = activa => rutas.map(([k, t, ic]) => `<a href="#${k}" class="${k === activa ? 'active' : ''}">${icon(ic)}<span>${t}</span></a>`).join('');

function renderLogin() {
  $('#app').innerHTML = `<main class="auth"><section class="auth-art">${brand()}<div><img src="icon.svg" class="art-cube" alt=""><h1>Cada venta, compra y traslado,<br>en su kárdex.</h1><p>El stock de cada sucursal siempre al día.</p></div><div class="art-foot">InvenTrack · Inventario para pymes con sucursales</div></section><section class="auth-panel"><form class="auth-form" id="auth-form">${brand()}<div class="eyebrow">INVENTRACK</div><h1>Ingresa a tu cuenta</h1><p>Usa tu correo y contraseña. La sesión dura 2 horas.</p><div class="form-error" id="auth-error" role="alert"></div><div class="field"><label for="email">Correo electrónico</label><input id="email" name="correo" type="email" autocomplete="username" required></div><div class="field"><label for="password">Contraseña</label><input id="password" name="contrasena" type="password" autocomplete="current-password" required></div><button class="btn full" type="submit">Entrar${icon('chevron')}</button><div class="auth-foot">${icon('shield')} Acceso solo para tu equipo.</div></form></section></main>`;
  $('#auth-form').onsubmit = async e => {
    e.preventDefault();
    const btn = $('button', e.currentTarget); btn.disabled = true; $('#auth-error').style.display = 'none';
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      const r = await login(f.correo, f.contrasena);
      guardarSesion({ token: r.token, idUsuario: r.idUsuario, nombre: r.nombreCompleto, rol: r.rol, idSucursal: r.idSucursal });
      await cargarSucursales(); await render();
    } catch (error) { $('#auth-error').textContent = error.message; $('#auth-error').style.display = 'block'; }
    finally { btn.disabled = false; }
  };
}

async function cargarSucursales() {
  const lista = await api('/sucursal/listar');
  state.sucursales = lista.filter(s => s.activo !== false);
  const guardada = Number(localStorage.getItem('inventrack-sucursal-' + state.user.idUsuario));
  state.sucursalId = state.sucursales.find(s => s.id === guardada)?.id ?? state.sucursales.find(s => s.id === state.user.idSucursal)?.id ?? state.sucursales[0]?.id;
}

function shell(activa) {
  const iniciales = state.user.nombre.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  $('#app').innerHTML = `<aside class="side">${brand()}<nav>${nav(activa)}</nav><div class="side-foot"><strong>Sucursal actual</strong>${escape(sucursalNombre())}<button class="btn secondary" id="salir" type="button">${icon('logout')} Salir</button></div></aside><div class="layout"><header class="topbar">${brand()}<span class="pill">${icon('box')} ${escape(sucursalNombre())}</span><div class="user-top"><span><b>${escape(state.user.nombre)}</b>${escape(state.user.rol)}</span><div class="avatar">${escape(iniciales)}</div></div></header><div class="warehouse-bar"><div class="warehouse-icon">${icon('box')}</div><div><label for="sucursal-selector">Sucursal actual</label><select id="sucursal-selector">${state.sucursales.map(s => `<option value="${s.id}" ${s.id === state.sucursalId ? 'selected' : ''}>${escape(s.nombre)}</option>`).join('')}</select></div></div><main class="content" id="view"></main></div><nav class="bottom-nav" aria-label="Navegación principal">${nav(activa)}</nav>`;
  $('#sucursal-selector').onchange = e => {
    state.sucursalId = Number(e.target.value);
    try { localStorage.setItem('inventrack-sucursal-' + state.user.idUsuario, String(state.sucursalId)); } catch { /* sin storage */ }
    render();
  };
  $('#salir').onclick = () => { guardarSesion(null); renderLogin(); };
}

async function render() {
  if (!state.user) return renderLogin();
  const activa = ruta();
  shell(activa);
  const view = $('#view');
  view.innerHTML = head('Cargando…') + '<div class="skeleton"></div>';
  try {
    const modulo = await import(`./views/${activa}.js`);
    await modulo.render(view);
  } catch (error) {
    if (state.user) view.innerHTML = head('No pudimos cargar esta pantalla') + empty('Revisa tu conexión', error.message, 'wifi') + '<button class="btn full" id="reload">Volver a intentar</button>';
    $('#reload')?.addEventListener('click', render);
  }
}

onSesionExpirada(renderLogin);
window.addEventListener('hashchange', render);
(async () => {
  if (!state.user) return renderLogin();
  try { await cargarSucursales(); await render(); } catch { renderLogin(); }
})();
