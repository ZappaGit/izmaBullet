// Subapps del cuaderno IzmaBullet (ver docs/requisitos-funcionales.md).
// El número es la identidad de la subapp: no cambia. `color` es su color clave mate.
// `ruta` es null mientras la subapp no está disponible (en el Índice sale atenuada).
export const APLICACIONES = Object.freeze([
  { numero: 1, nombre: 'Índice', color: '#2f3237', ruta: '/indice', disponible: true },
  { numero: 2, nombre: 'Registro futuro', color: '#5f7d6a', ruta: '/registro-futuro', disponible: true },
  { numero: 3, nombre: 'Conocimiento', color: '#9a6b5b', ruta: null, disponible: false },
  { numero: 4, nombre: 'Inventario personal', color: '#8c7a4e', ruta: null, disponible: false },
  { numero: 5, nombre: 'Seguimiento', color: '#7d6b8a', ruta: null, disponible: false },
  { numero: 6, nombre: 'Hábitos y objetivos', color: '#6b7f9a', ruta: '/habitos-objetivos', disponible: true },
  { numero: 7, nombre: 'Ajustes e info', color: '#6f7378', ruta: '/ajustes-info', disponible: true },
]);

export function buscarAplicacionPorNumero(numero) {
  return APLICACIONES.find((aplicacion) => aplicacion.numero === numero);
}

export function etiquetaAplicacion(aplicacion) {
  return `[${aplicacion.numero}]  ${aplicacion.nombre}`;
}

// Una marca por subapp para el índice lateral. `activa` es true solo para la subapp actual.
export function marcasIndice(numeroActual) {
  return APLICACIONES.map((aplicacion) => ({
    numero: aplicacion.numero,
    nombre: aplicacion.nombre,
    color: aplicacion.color,
    ruta: aplicacion.ruta,
    disponible: aplicacion.disponible,
    activa: aplicacion.numero === numeroActual,
  }));
}
