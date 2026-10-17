// Lee los tokens de un enlace de recuperación de contraseña. Supabase los envía en el fragmento de la URL
// (izmabullet://cuenta/nueva-clave#access_token=...&refresh_token=...&type=recovery).

const TIPO_RECUPERACION = 'recovery';

export function extraerTokensRecuperacion(url) {
  if (!url || !url.includes('#')) return null;

  const parametros = new URLSearchParams(url.slice(url.indexOf('#') + 1));
  if (parametros.get('type') !== TIPO_RECUPERACION) return null;

  const accessToken = parametros.get('access_token');
  const refreshToken = parametros.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}
