import { crearAlmacenSesion, TAMANO_TROZO } from '../src/cuenta/almacenSesion';

// SecureStore en memoria con la misma forma que expo-secure-store.
function crearAlmacenFalso() {
  const datos = new Map();
  return {
    datos,
    getItemAsync: async (clave) => (datos.has(clave) ? datos.get(clave) : null),
    setItemAsync: async (clave, valor) => {
      if (valor.length > 2048) throw new Error('valor demasiado largo para SecureStore');
      datos.set(clave, valor);
    },
    deleteItemAsync: async (clave) => {
      datos.delete(clave);
    },
  };
}

describe('crearAlmacenSesion', () => {
  test('devuelve null cuando no hay sesión guardada', async () => {
    const almacen = crearAlmacenSesion(crearAlmacenFalso());
    expect(await almacen.getItem('sb-test-auth-token')).toBeNull();
  });

  test('guarda y recupera una sesión más larga que el límite de SecureStore', async () => {
    const fake = crearAlmacenFalso();
    const almacen = crearAlmacenSesion(fake);
    const sesion = JSON.stringify({ access_token: 'a'.repeat(TAMANO_TROZO * 3), refresh_token: 'r' });

    await almacen.setItem('sb-test-auth-token', sesion);

    expect(await almacen.getItem('sb-test-auth-token')).toBe(sesion);
    expect(fake.datos.size).toBeGreaterThan(2);
  });

  test('al guardar otra sesión más corta no quedan trozos antiguos', async () => {
    const fake = crearAlmacenFalso();
    const almacen = crearAlmacenSesion(fake);
    await almacen.setItem('sb-test-auth-token', 'x'.repeat(TAMANO_TROZO * 3));

    await almacen.setItem('sb-test-auth-token', 'corta');

    expect(await almacen.getItem('sb-test-auth-token')).toBe('corta');
    expect(fake.datos.size).toBe(2);
  });

  test('removeItem borra todos los trozos', async () => {
    const fake = crearAlmacenFalso();
    const almacen = crearAlmacenSesion(fake);
    await almacen.setItem('sb-test-auth-token', 'x'.repeat(TAMANO_TROZO * 2));

    await almacen.removeItem('sb-test-auth-token');

    expect(fake.datos.size).toBe(0);
    expect(await almacen.getItem('sb-test-auth-token')).toBeNull();
  });
});
