// Progreso y estado de los objetivos. Funciones puras.
//
// Un objetivo tiene:
//   modo: 'manual' | 'habitos'
//   progresoManual: 0–100 (solo se usa en modo 'manual')
//   fechaLimite: 'AAAA-MM-DD' | null
//   estado: 'en_curso' | 'completado' | 'abandonado'

import { cumplimiento } from './habitos';
import { diferenciaDias } from './fechas';

export const MODOS_OBJETIVO = { MANUAL: 'manual', HABITOS: 'habitos' };
export const ESTADOS_OBJETIVO = { EN_CURSO: 'en_curso', COMPLETADO: 'completado', ABANDONADO: 'abandonado' };
export const NOMBRES_ESTADO = {
  en_curso: 'En curso',
  completado: 'Completado',
  abandonado: 'Abandonado',
};

const VENTANA_PROGRESO_DIAS = 30;

// Progreso 0–100.
// - manual: el valor que el usuario fija.
// - habitos: media del cumplimiento de los últimos 30 días de los hábitos del objetivo.
//   Los hábitos sin nada programado en esa ventana no cuentan.
export function progresoObjetivo(objetivo, habitosDelObjetivo, registrosPorHabito, hoy) {
  if (objetivo.modo === MODOS_OBJETIVO.MANUAL) {
    return Math.min(100, Math.max(0, objetivo.progresoManual ?? 0));
  }

  const valores = habitosDelObjetivo
    .map((habito) => cumplimiento(habito, registrosPorHabito[habito.id] ?? new Set(), hoy, VENTANA_PROGRESO_DIAS))
    .filter((valor) => valor !== null);

  if (valores.length === 0) return 0;
  return Math.round(valores.reduce((suma, valor) => suma + valor, 0) / valores.length);
}

// Días que faltan hasta la fecha límite (negativo si ya pasó), o null si no tiene fecha.
export function diasRestantes(objetivo, hoy) {
  if (!objetivo.fechaLimite) return null;
  return diferenciaDias(hoy, objetivo.fechaLimite);
}
