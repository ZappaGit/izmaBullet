// Meses del Registro futuro. Se cuentan desde el mes actual: "Mes +1" es el siguiente.
const NOMBRES_MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Páginas que se deslizan con el dedo. Cada una muestra sus meses en orden.
export const PAGINAS_FUTURO = Object.freeze([
  { titulo: 'Registro', meses: [1, 2] },
  { titulo: 'Futuro', meses: [3, 4] },
]);

export function mesDesplazado(fechaHoy, desplazamiento) {
  const primerDia = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() + desplazamiento, 1);
  const mes = NOMBRES_MESES[primerDia.getMonth()];
  const anio = primerDia.getFullYear();
  const clave = `${anio}-${String(primerDia.getMonth() + 1).padStart(2, '0')}`;
  return { etiqueta: `Mes +${desplazamiento}`, mes, anio, nombre: `${mes} de ${anio}`, clave };
}

// Elementos con los que empieza cada mes. Se pueden eliminar con «−».
export const ELEMENTOS_POR_DEFECTO = Object.freeze(['Cumpleaños', 'Citas', 'Pagos']);
const LONGITUD_MAXIMA_ELEMENTO = 80;

// Devuelve el mensaje de error, o null si el texto vale.
export function validarElemento(texto) {
  const limpio = (texto ?? '').trim();
  if (!limpio) return 'Escribe algo.';
  if (limpio.length > LONGITUD_MAXIMA_ELEMENTO) return `Hasta ${LONGITUD_MAXIMA_ELEMENTO} caracteres.`;
  return null;
}
