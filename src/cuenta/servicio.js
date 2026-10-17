// Operaciones de cuenta sobre Supabase Auth. Recibe el cliente por parámetro para poder probarlas sin red.
// Los errores salen traducidos al español y sin detalles técnicos.

// Destinos de los enlaces que llegan por correo. Deben estar en "Redirect URLs" de Supabase (docs/supabase-guia.md, 2.3).
export const URL_ENLACE_CUENTA = 'izmabullet://cuenta/entrar';
export const URL_NUEVA_CLAVE = 'izmabullet://cuenta/nueva-clave';

const MENSAJE_GENERICO = 'No se pudo completar la operación. Inténtalo de nuevo.';

const REGLAS_ERROR = [
  { patron: /invalid login credentials/i, mensaje: 'Correo o contraseña incorrectos.' },
  { patron: /email not confirmed/i, mensaje: 'Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.' },
  { patron: /user already registered/i, mensaje: 'Ya existe una cuenta con ese correo.' },
  { patron: /password should be/i, mensaje: 'La contraseña no cumple los requisitos.' },
  { patron: /network|fetch/i, mensaje: 'Sin conexión. Revisa la red e inténtalo de nuevo.' },
];

const PATRON_LIMITE_ENVIOS = /seconds|rate limit/i;
const MENSAJE_LIMITE_ENVIOS = 'Espera un momento antes de volver a pedir el correo.';

export function traducirErrorCuenta(error) {
  const texto = error?.message ?? '';
  const regla = REGLAS_ERROR.find(({ patron }) => patron.test(texto));
  return new Error(regla ? regla.mensaje : MENSAJE_GENERICO);
}

function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

export function crearServicioCuenta(cliente) {
  const auth = cliente.auth;

  return {
    async iniciarSesion(email, clave) {
      const { data, error } = await auth.signInWithPassword({ email: normalizarEmail(email), password: clave });
      if (error) throw traducirErrorCuenta(error);
      return data.user;
    },

    async darDeAlta({ nombre, email, clave }) {
      const { data, error } = await auth.signUp({
        email: normalizarEmail(email),
        password: clave,
        options: { data: { nombre: nombre.trim() }, emailRedirectTo: URL_ENLACE_CUENTA },
      });
      if (error) throw traducirErrorCuenta(error);
      return { necesitaConfirmacion: !data?.session };
    },

    async pedirRecuperacion(email) {
      const { error } = await auth.resetPasswordForEmail(normalizarEmail(email), { redirectTo: URL_NUEVA_CLAVE });
      if (error && PATRON_LIMITE_ENVIOS.test(error.message ?? '')) throw new Error(MENSAJE_LIMITE_ENVIOS);
      if (error) throw traducirErrorCuenta(error);
    },

    async abrirSesionRecuperacion({ accessToken, refreshToken }) {
      const { error } = await auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) throw traducirErrorCuenta(error);
    },

    async fijarNuevaClave(clave) {
      const { error } = await auth.updateUser({ password: clave });
      if (error) throw traducirErrorCuenta(error);
    },
  };
}
