// Cliente HTTP de la API. Agrega el header Authorization: Bearer <token> y traduce los errores JSON del backend.
import { state, guardarSesion } from './state.js';

let alExpirar = () => {};
export const onSesionExpirada = fn => { alExpirar = fn; };

export async function api(path, { method = 'GET', body, params } = {}) {
  const query = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')) : '';
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (state.user?.token) headers.Authorization = 'Bearer ' + state.user.token;
  let res;
  try {
    res = await fetch(path + query, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('No hay conexión con el servidor. Inténtalo de nuevo.');
  }
  if (res.status === 401 && path !== '/auth/login') {
    guardarSesion(null); alExpirar();
    throw new Error('Tu sesión expiró. Inicia sesión otra vez.');
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.mensaje || error.message || 'No pudimos completar la acción.');
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

export const login = (correo, contrasena) => api('/auth/login', { method: 'POST', body: { correo, contrasena } });
