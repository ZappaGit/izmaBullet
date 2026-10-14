// Acceso al calendario del dispositivo (expo-calendar). Los calendarios de la cuenta de Google
// sincronizada en Android aparecen aquí, así que no hace falta OAuth.
//
// Regla: solo se modifican o borran eventos cuyo id guardó la propia app (tabla eventos_calendario).
import * as Calendar from 'expo-calendar';

import { desdeClave, parsearHora, sumarDias } from '../dominio/fechas';
import { TIPOS_FRECUENCIA } from '../dominio/habitos';

const NOTA_APP = 'Creado por IzmaBullet. No edites este evento desde el calendario: se actualiza solo.';
const DURACION_HABITO_MINUTOS = 30;

export async function estadoPermisoCalendario() {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status;
}

export async function pedirPermisoCalendario() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status;
}

// Solo calendarios donde la app puede escribir.
export async function listarCalendariosEscribibles() {
  const calendarios = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendarios.filter((calendario) => calendario.allowsModifications);
}

// Regla de repetición para el hábito, o null si no tiene días fijos (hábitos por semana).
// Los días de expo-calendar van de 1 (domingo) a 7 (sábado), igual que Date.getDay() + 1.
export function reglaRecurrenciaHabito(habito) {
  if (habito.tipo === TIPOS_FRECUENCIA.DIARIA) {
    return { frequency: Calendar.Frequency.DAILY };
  }
  if (habito.tipo === TIPOS_FRECUENCIA.DIAS) {
    return {
      frequency: Calendar.Frequency.WEEKLY,
      daysOfTheWeek: habito.diasSemana.map((dia) => ({ dayOfTheWeek: dia + 1 })),
    };
  }
  return null;
}

// Primera fecha con hora que cae en un día programado, a partir de hoy.
export function primeraOcurrenciaHabito(habito, hoy, { hora, minuto }) {
  for (let i = 0; i < 7; i += 1) {
    const clave = sumarDias(hoy, i);
    const fecha = desdeClave(clave);
    const toca = habito.tipo !== TIPOS_FRECUENCIA.DIAS || habito.diasSemana.includes(fecha.getDay());
    if (!toca) continue;
    fecha.setHours(hora, minuto, 0, 0);
    if (fecha > new Date()) return fecha;
  }
  return null;
}

function detallesEventoHabito(habito, hoy) {
  const hora = parsearHora(habito.recordatorioHora);
  const inicio = primeraOcurrenciaHabito(habito, hoy, hora) ?? new Date();
  return {
    title: habito.nombre,
    startDate: inicio,
    endDate: new Date(inicio.getTime() + DURACION_HABITO_MINUTOS * 60000),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    allDay: false,
    alarms: [],
    notes: NOTA_APP,
    recurrenceRule: reglaRecurrenciaHabito(habito),
  };
}

export async function crearEventoHabito(habito, calendarioId, hoy) {
  return Calendar.createEventAsync(calendarioId, detallesEventoHabito(habito, hoy));
}

export async function actualizarEventoHabito(eventoId, habito, hoy) {
  return Calendar.updateEventAsync(eventoId, detallesEventoHabito(habito, hoy));
}

// Evento de día completo en la fecha límite del objetivo.
export async function crearEventoObjetivo(objetivo, calendarioId) {
  return Calendar.createEventAsync(calendarioId, detallesEventoObjetivo(objetivo));
}

export async function actualizarEventoObjetivo(eventoId, objetivo) {
  return Calendar.updateEventAsync(eventoId, detallesEventoObjetivo(objetivo));
}

function detallesEventoObjetivo(objetivo) {
  return {
    title: `Objetivo: ${objetivo.nombre}`,
    startDate: desdeClave(objetivo.fechaLimite),
    endDate: desdeClave(sumarDias(objetivo.fechaLimite, 1)),
    allDay: true,
    alarms: [],
    notes: NOTA_APP,
  };
}

export async function borrarEvento(eventoId) {
  await Calendar.deleteEventAsync(eventoId);
}

// Eventos de un día (solo lectura). Si `calendarioId` es null se leen todos los calendarios.
export async function eventosDelDia(fecha, calendarioId) {
  const calendarios = calendarioId
    ? [calendarioId]
    : (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).map((calendario) => calendario.id);
  if (calendarios.length === 0) return [];

  const inicio = desdeClave(fecha);
  const fin = desdeClave(sumarDias(fecha, 1));
  const eventos = await Calendar.getEventsAsync(calendarios, inicio, fin);
  return eventos
    .map((evento) => ({ id: evento.id, titulo: evento.title, inicio: new Date(evento.startDate), todoElDia: evento.allDay }))
    .sort((a, b) => a.inicio - b.inicio);
}
