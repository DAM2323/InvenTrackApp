// Estado global de la sesión. El token JWT se guarda en sessionStorage (dura 2 horas en el backend).
const KEY = 'inventrack-sesion';

function leer() {
  try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; }
}

export const state = {
  user: leer(),          // { token, idUsuario, nombre, rol, idSucursal }
  sucursales: [],
  sucursalId: null       // sucursal activa; la usan inventario, ventas, compras y traslados
};

export function guardarSesion(user) {
  state.user = user;
  try { user ? sessionStorage.setItem(KEY, JSON.stringify(user)) : sessionStorage.removeItem(KEY); } catch { /* sin storage */ }
}

export const sucursalNombre = (id = state.sucursalId) => state.sucursales.find(s => s.id === id)?.nombre || 'Sucursal';
