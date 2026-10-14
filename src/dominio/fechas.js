// Utilidades de fecha. Las fechas de la app son claves 'AAAA-MM-DD' en la zona horaria local
// del dispositivo, para que un día no cambie al pasar por UTC.

const dosDigitos = (n) => String(n).padStart(2, '0');

export function claveFecha(fecha = new Date()) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

export function desdeClave(clave) {
  const [anio, mes, dia] = clave.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function sumarDias(clave, dias) {
  const fecha = desdeClave(clave);
  fecha.setDate(fecha.getDate() + dias);
  return claveFecha(fecha);
}

// 0 = domingo ... 6 = sábado (igual que Date.getDay).
export function diaSemana(clave) {
  return desdeClave(clave).getDay();
}

// Lunes de la semana que contiene la fecha.
export function inicioSemana(clave) {
  const indiceLunes = (diaSemana(clave) + 6) % 7;
  return sumarDias(clave, -indiceLunes);
}

export function diferenciaDias(desde, hasta) {
  return Math.round((desdeClave(hasta) - desdeClave(desde)) / 86400000);
}

// Claves de los últimos `cantidad` días, del más antiguo al más reciente, terminando en `hoy`.
export function ultimosDias(hoy, cantidad) {
  const claves = [];
  for (let i = cantidad - 1; i >= 0; i -= 1) {
    claves.push(sumarDias(hoy, -i));
  }
  return claves;
}

// Date desplaza fechas imposibles (13/01 → 01/del año siguiente), así que se comprueba
// que la fecha reconstruida sea igual al texto original.
export function esClaveValida(texto) {
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) && claveFecha(desdeClave(texto)) === texto;
}

// 'HH:MM' en formato 24 h → { hora, minuto }, o null si no es válido.
export function parsearHora(texto) {
  const coincidencia = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(texto ?? '');
  if (!coincidencia) return null;
  return { hora: Number(coincidencia[1]), minuto: Number(coincidencia[2]) };
}
