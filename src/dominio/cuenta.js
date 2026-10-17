// Validación de los formularios de cuenta (entrar, alta, recuperar, nueva contraseña). Devuelve { campo: mensaje }.

// Mínimo que exige la guía de Supabase (docs/supabase-guia.md, paso 2.2).
export const LONGITUD_MINIMA_CLAVE = 12;

const NOMBRE_MAXIMO = 80;
const FORMA_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorEmail(email) {
  if (!email.trim()) return 'Escribe tu correo electrónico.';
  if (!FORMA_CORREO.test(email.trim())) return 'El correo no tiene un formato válido.';
  return null;
}

function errorClaveNueva(clave) {
  if (!clave) return 'Escribe una contraseña.';
  if (clave.length < LONGITUD_MINIMA_CLAVE) {
    return `La contraseña necesita al menos ${LONGITUD_MINIMA_CLAVE} caracteres.`;
  }
  return null;
}

function sinErrores(errores) {
  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje));
}

export function validarCredenciales(datos) {
  return sinErrores({
    email: errorEmail(datos.email ?? ''),
    clave: datos.clave ? null : 'Escribe tu contraseña.',
  });
}

export function validarAlta(datos) {
  const nombre = (datos.nombre ?? '').trim();
  return sinErrores({
    nombre: nombre.length > NOMBRE_MAXIMO ? `El nombre puede tener hasta ${NOMBRE_MAXIMO} caracteres.` : null,
    email: errorEmail(datos.email ?? ''),
    clave: errorClaveNueva(datos.clave ?? ''),
    repetirClave: datos.repetirClave === datos.clave ? null : 'Las contraseñas no coinciden.',
  });
}

export function validarRecuperacion(datos) {
  return sinErrores({ email: errorEmail(datos.email ?? '') });
}

export function validarNuevaClave(datos) {
  return sinErrores({
    clave: errorClaveNueva(datos.clave ?? ''),
    repetirClave: datos.repetirClave === datos.clave ? null : 'Las contraseñas no coinciden.',
  });
}
