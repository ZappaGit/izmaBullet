// Aplicaciones que se pueden abrir desde el Índice. El número es el que ve el usuario
// en el menú lateral y se mantiene en todas las aplicaciones.
//
// `pantalla` es el nombre del segmento de expo-router dentro del menú lateral;
// `ruta` es la URL a la que se navega desde el Índice.
// `color` es el color clave de la aplicación (verde mate, azul mate…): tiñe su número y su título.
export const APLICACIONES = Object.freeze([
  {
    numero: 1,
    nombre: 'IzmaBullet',
    descripcion: 'Hábitos, objetivos y calendario',
    pantalla: '(tabs)',
    ruta: '/hoy',
    color: '#6b7f9a',
  },
  {
    numero: 2,
    nombre: 'Registro futuro',
    descripcion: 'Próximamente',
    pantalla: 'registro-futuro',
    ruta: '/registro-futuro',
    color: '#5f7d6a',
  },
]);

export function buscarAplicacionPorNumero(numero) {
  return APLICACIONES.find((aplicacion) => aplicacion.numero === numero);
}

export function etiquetaAplicacion(aplicacion) {
  return `${aplicacion.numero}  ${aplicacion.nombre}`;
}

// Una marca por aplicación para el índice lateral. `activa` es true solo para la aplicación en la que estamos.
export function marcasIndice(numeroActual) {
  return APLICACIONES.map((aplicacion) => ({
    numero: aplicacion.numero,
    nombre: aplicacion.nombre,
    color: aplicacion.color,
    activa: aplicacion.numero === numeroActual,
  }));
}
