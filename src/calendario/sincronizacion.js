// Mantiene sincronizados los eventos de calendario de hábitos y objetivos con sus datos.
// Cada función devuelve un aviso (string) si algo no se pudo hacer, o null.
// Los errores no interrumpen el guardado: la app sigue funcionando sin calendario.

import { claveFecha } from '../dominio/fechas';

import * as calendario from './calendario';

const refHabito = (id) => `habito:${id}`;
const refObjetivo = (id) => `objetivo:${id}`;

// Borra solo el evento que guardó la app. Si el usuario ya lo borró a mano, no pasa nada.
async function quitarEvento(repos, referencia) {
  const guardado = await repos.eventosCalendario.obtener(referencia);
  if (!guardado) return;
  try {
    await calendario.borrarEvento(guardado.eventoId);
  } catch {
    // Ya no existe en el calendario: solo olvidamos la referencia.
  }
  await repos.eventosCalendario.borrar(referencia);
}

async function crearOActualizar(repos, referencia, calendarioId, crear, actualizar) {
  const existente = await repos.eventosCalendario.obtener(referencia);
  if (existente && existente.calendarioId === calendarioId) {
    try {
      await actualizar(existente.eventoId);
      return;
    } catch {
      // El evento ya no existe o no se puede editar: se crea uno nuevo.
      await repos.eventosCalendario.borrar(referencia);
    }
  } else if (existente) {
    // Cambió el calendario por defecto: el evento antiguo se borra y se crea en el nuevo.
    await quitarEvento(repos, referencia);
  }
  const eventoId = await crear();
  await repos.eventosCalendario.guardar(referencia, eventoId, calendarioId);
}

export async function sincronizarEventoHabito(repos, habito, calendarioId) {
  const referencia = refHabito(habito.id);
  const debeExistir = habito.sincronizaCalendario && habito.estado === 'activo' && calendarioId;
  if (!debeExistir) {
    await quitarEvento(repos, referencia);
    return null;
  }
  try {
    const hoy = claveFecha();
    await crearOActualizar(
      repos,
      referencia,
      calendarioId,
      () => calendario.crearEventoHabito(habito, calendarioId, hoy),
      (eventoId) => calendario.actualizarEventoHabito(eventoId, habito, hoy),
    );
    return null;
  } catch {
    return `No se pudo actualizar el evento de «${habito.nombre}» en el calendario.`;
  }
}

export async function sincronizarEventoObjetivo(repos, objetivo, calendarioId) {
  const referencia = refObjetivo(objetivo.id);
  const debeExistir = objetivo.fechaLimite && objetivo.estado === 'en_curso' && calendarioId;
  if (!debeExistir) {
    await quitarEvento(repos, referencia);
    return null;
  }
  try {
    await crearOActualizar(
      repos,
      referencia,
      calendarioId,
      () => calendario.crearEventoObjetivo(objetivo, calendarioId),
      (eventoId) => calendario.actualizarEventoObjetivo(eventoId, objetivo),
    );
    return null;
  } catch {
    return `No se pudo actualizar la fecha límite de «${objetivo.nombre}» en el calendario.`;
  }
}

export async function quitarEventoHabito(repos, habitoId) {
  await quitarEvento(repos, refHabito(habitoId));
}

export async function quitarEventoObjetivo(repos, objetivoId) {
  await quitarEvento(repos, refObjetivo(objetivoId));
}
