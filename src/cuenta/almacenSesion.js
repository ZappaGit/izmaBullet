// Guarda la sesión de Supabase en SecureStore. SecureStore admite valores de hasta 2048 bytes,
// y la sesión (tokens + usuario) puede superarlo, así que se reparte en trozos.

export const TAMANO_TROZO = 1800;

export function crearAlmacenSesion(almacen) {
  const claveContador = (clave) => `${clave}.trozos`;
  const claveTrozo = (clave, indice) => `${clave}.${indice}`;

  async function leerNumeroTrozos(clave) {
    const valor = await almacen.getItemAsync(claveContador(clave));
    return valor === null ? 0 : Number(valor);
  }

  async function borrarTrozos(clave, cantidad) {
    await almacen.deleteItemAsync(claveContador(clave));
    for (let indice = 0; indice < cantidad; indice += 1) {
      await almacen.deleteItemAsync(claveTrozo(clave, indice));
    }
  }

  return {
    async getItem(clave) {
      const cantidad = await leerNumeroTrozos(clave);
      if (cantidad === 0) return null;
      const trozos = [];
      for (let indice = 0; indice < cantidad; indice += 1) {
        const trozo = await almacen.getItemAsync(claveTrozo(clave, indice));
        if (trozo === null) return null;
        trozos.push(trozo);
      }
      return trozos.join('');
    },

    async setItem(clave, valor) {
      const anterior = await leerNumeroTrozos(clave);
      const nuevos = Math.ceil(valor.length / TAMANO_TROZO);
      for (let indice = 0; indice < nuevos; indice += 1) {
        const inicio = indice * TAMANO_TROZO;
        await almacen.setItemAsync(claveTrozo(clave, indice), valor.slice(inicio, inicio + TAMANO_TROZO));
      }
      await almacen.setItemAsync(claveContador(clave), String(nuevos));
      for (let indice = nuevos; indice < anterior; indice += 1) {
        await almacen.deleteItemAsync(claveTrozo(clave, indice));
      }
    },

    async removeItem(clave) {
      await borrarTrozos(clave, await leerNumeroTrozos(clave));
    },
  };
}
