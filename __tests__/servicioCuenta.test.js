import { crearServicioCuenta, traducirErrorCuenta, URL_ENLACE_CUENTA, URL_NUEVA_CLAVE } from '../src/cuenta/servicio';

// Cliente falso con la forma que usa Supabase Auth. Cada prueba fija la respuesta que devuelve.
function crearClienteFalso(respuestas = {}) {
  const llamadas = [];
  const registrar = (nombre) => async (...argumentos) => {
    llamadas.push({ nombre, argumentos });
    return respuestas[nombre] ?? { data: {}, error: null };
  };
  return {
    llamadas,
    auth: {
      signInWithPassword: registrar('signInWithPassword'),
      signUp: registrar('signUp'),
      resetPasswordForEmail: registrar('resetPasswordForEmail'),
      updateUser: registrar('updateUser'),
    },
  };
}

const errorAuth = (message) => ({ message, name: 'AuthApiError' });

describe('iniciarSesion', () => {
  test('llama a Supabase con el email sin espacios y devuelve el usuario', async () => {
    const usuario = { id: 'u1' };
    const cliente = crearClienteFalso({ signInWithPassword: { data: { user: usuario }, error: null } });
    const servicio = crearServicioCuenta(cliente);

    const resultado = await servicio.iniciarSesion('  Diego@Example.com ', 'clave-larga-123');

    expect(cliente.llamadas[0].argumentos[0]).toEqual({ email: 'diego@example.com', password: 'clave-larga-123' });
    expect(resultado).toEqual(usuario);
  });

  test('traduce el error de credenciales a un mensaje en español', async () => {
    const cliente = crearClienteFalso({
      signInWithPassword: { data: {}, error: errorAuth('Invalid login credentials') },
    });
    const servicio = crearServicioCuenta(cliente);

    await expect(servicio.iniciarSesion('a@b.es', 'x')).rejects.toThrow('Correo o contraseña incorrectos.');
  });
});

describe('darDeAlta', () => {
  test('envía el nombre como metadato y la URL de confirmación de la app', async () => {
    const cliente = crearClienteFalso();
    const servicio = crearServicioCuenta(cliente);

    await servicio.darDeAlta({ nombre: ' Diego ', email: 'diego@example.com', clave: 'clave-larga-123' });

    expect(cliente.llamadas[0].argumentos[0]).toEqual({
      email: 'diego@example.com',
      password: 'clave-larga-123',
      options: { data: { nombre: 'Diego' }, emailRedirectTo: URL_ENLACE_CUENTA },
    });
  });

  test('avisa de que hay que confirmar el correo', async () => {
    const servicio = crearServicioCuenta(crearClienteFalso());

    const resultado = await servicio.darDeAlta({ nombre: '', email: 'a@b.es', clave: 'clave-larga-123' });

    expect(resultado.necesitaConfirmacion).toBe(true);
  });

  test('traduce una contraseña rechazada por el servidor', async () => {
    const cliente = crearClienteFalso({
      signUp: { data: {}, error: errorAuth('Password should be at least 12 characters.') },
    });
    const servicio = crearServicioCuenta(cliente);

    await expect(servicio.darDeAlta({ nombre: '', email: 'a@b.es', clave: 'x' })).rejects.toThrow(
      'La contraseña no cumple los requisitos.',
    );
  });
});

describe('pedirRecuperacion', () => {
  test('pide el correo de recuperación con la URL de nueva clave de la app', async () => {
    const cliente = crearClienteFalso();
    const servicio = crearServicioCuenta(cliente);

    await servicio.pedirRecuperacion('diego@example.com');

    expect(cliente.llamadas[0]).toEqual({
      nombre: 'resetPasswordForEmail',
      argumentos: ['diego@example.com', { redirectTo: URL_NUEVA_CLAVE }],
    });
  });

  test('avisa del límite de envíos sin revelar si el correo existe', async () => {
    const cliente = crearClienteFalso({
      resetPasswordForEmail: { data: {}, error: errorAuth('For security purposes, you can only request this after 60 seconds.') },
    });
    const servicio = crearServicioCuenta(cliente);

    await expect(servicio.pedirRecuperacion('a@b.es')).rejects.toThrow(
      'Espera un momento antes de volver a pedir el correo.',
    );
  });
});

describe('abrirSesionRecuperacion', () => {
  test('abre la sesión con los tokens del enlace de correo', async () => {
    const cliente = crearClienteFalso();
    cliente.auth.setSession = async (...argumentos) => {
      cliente.llamadas.push({ nombre: 'setSession', argumentos });
      return { data: {}, error: null };
    };
    const servicio = crearServicioCuenta(cliente);

    await servicio.abrirSesionRecuperacion({ accessToken: 'acceso-1', refreshToken: 'refresco-1' });

    expect(cliente.llamadas[0]).toEqual({
      nombre: 'setSession',
      argumentos: [{ access_token: 'acceso-1', refresh_token: 'refresco-1' }],
    });
  });
});

describe('fijarNuevaClave', () => {
  test('actualiza la contraseña de la sesión de recuperación', async () => {
    const cliente = crearClienteFalso();
    const servicio = crearServicioCuenta(cliente);

    await servicio.fijarNuevaClave('clave-nueva-123');

    expect(cliente.llamadas[0]).toEqual({ nombre: 'updateUser', argumentos: [{ password: 'clave-nueva-123' }] });
  });
});

describe('traducirErrorCuenta', () => {
  test('un fallo de red se explica como falta de conexión', () => {
    expect(traducirErrorCuenta({ message: 'TypeError: Network request failed' }).message).toBe(
      'Sin conexión. Revisa la red e inténtalo de nuevo.',
    );
  });

  test('un error desconocido devuelve un mensaje genérico sin detalles técnicos', () => {
    const mensaje = traducirErrorCuenta({ message: 'Internal: stack trace xyz' }).message;
    expect(mensaje).toBe('No se pudo completar la operación. Inténtalo de nuevo.');
  });
});
