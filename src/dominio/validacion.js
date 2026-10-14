// Validación de los formularios de hábitos y objetivos. Devuelve { campo: mensaje } vacío si todo está bien.

import { esClaveValida, parsearHora } from './fechas';
import { TIPOS_FRECUENCIA } from './habitos';
import { MODOS_OBJETIVO } from './objetivos';

export function validarHabito(datos) {
  const errores = {};
  const nombre = (datos.nombre ?? '').trim();
  if (!nombre) errores.nombre = 'Ponle un nombre al hábito.';
  else if (nombre.length > 60) errores.nombre = 'El nombre puede tener hasta 60 caracteres.';

  if (datos.tipo === TIPOS_FRECUENCIA.DIAS && (datos.diasSemana ?? []).length === 0) {
    errores.diasSemana = 'Elige al menos un día de la semana.';
  }
  if (datos.tipo === TIPOS_FRECUENCIA.VECES) {
    const veces = Number(datos.vecesPorSemana);
    if (!Number.isInteger(veces) || veces < 1 || veces > 7) {
      errores.vecesPorSemana = 'Indica entre 1 y 7 veces por semana.';
    }
  }

  if (datos.recordatorioHora && !parsearHora(datos.recordatorioHora)) {
    errores.recordatorioHora = 'La hora debe tener el formato HH:MM (24 h).';
  }
  if (datos.sincronizaCalendario) {
    if (datos.tipo === TIPOS_FRECUENCIA.VECES) {
      errores.sincronizaCalendario = 'Los hábitos por semana no tienen días fijos para el calendario.';
    } else if (!datos.recordatorioHora) {
      errores.sincronizaCalendario = 'Para añadirlo al calendario necesita una hora.';
    }
  }
  return errores;
}

export function validarObjetivo(datos) {
  const errores = {};
  const nombre = (datos.nombre ?? '').trim();
  if (!nombre) errores.nombre = 'Ponle un nombre al objetivo.';
  else if (nombre.length > 80) errores.nombre = 'El nombre puede tener hasta 80 caracteres.';

  if (datos.fechaLimite && !esClaveValida(datos.fechaLimite)) {
    errores.fechaLimite = 'La fecha debe tener el formato AAAA-MM-DD.';
  }
  if (datos.modo === MODOS_OBJETIVO.MANUAL) {
    const progreso = Number(datos.progresoManual);
    if (!Number.isFinite(progreso) || progreso < 0 || progreso > 100) {
      errores.progresoManual = 'El progreso debe estar entre 0 y 100.';
    }
  }
  return errores;
}
