// Acciones de la app: guardar y cambiar datos y, a la vez, mantener recordatorios y calendario al día.
// Las pantallas llaman aquí en lugar de hablar con el repositorio directamente.
// Devuelven `avisos` (lista de textos) cuando el dato se guardó pero el calendario o los recordatorios fallaron.

import { claveFecha } from '../dominio/fechas';
import { validarHabito, validarObjetivo } from '../dominio/validacion';
import { TIPOS_FRECUENCIA } from '../dominio/habitos';
import { MODOS_OBJETIVO } from '../dominio/objetivos';
import { sincronizarEventoHabito, sincronizarEventoObjetivo } from '../calendario/sincronizacion';
import { cancelarRecordatorios, programarRecordatorios } from '../notificaciones/recordatorios';

function cambiosHabito(formulario) {
  const { tipo } = formulario;
  const tieneHora = Boolean(formulario.recordatorioHora);
  return {
    nombre: formulario.nombre.trim(),
    tipo,
    diasSemana: tipo === TIPOS_FRECUENCIA.DIAS ? formulario.diasSemana : [],
    vecesPorSemana: tipo === TIPOS_FRECUENCIA.VECES ? Number(formulario.vecesPorSemana) : 1,
    recordatorioHora: tieneHora ? formulario.recordatorioHora : null,
    color: formulario.color,
    objetivoId: formulario.objetivoId ?? null,
    sincronizaCalendario: Boolean(formulario.sincronizaCalendario) && tieneHora && tipo !== TIPOS_FRECUENCIA.VECES,
  };
}

// Vuelve a programar los recordatorios y el evento de calendario según el estado actual del hábito.
async function reprogramarHabito(repos, habito, calendarioId) {
  const avisos = [];
  await cancelarRecordatorios(habito.notificaciones);
  let ids = [];
  try {
    ids = await programarRecordatorios(habito);
  } catch {
    avisos.push('No se pudieron programar los recordatorios. Revisa los permisos de notificaciones.');
  }
  await repos.habitos.actualizar(habito.id, { notificaciones: ids });

  const avisoCalendario = await sincronizarEventoHabito(repos, habito, calendarioId);
  if (avisoCalendario) avisos.push(avisoCalendario);
  return avisos;
}

// Crea o edita un hábito. `formulario` tiene los campos del formulario.
export async function guardarHabito(repos, formulario, { id = null, calendarioId = null, hoy = claveFecha() } = {}) {
  const errores = validarHabito(formulario);
  if (Object.keys(errores).length > 0) return { errores, avisos: [] };

  const cambios = cambiosHabito(formulario);
  let habitoId = id;
  if (id) {
    await repos.habitos.actualizar(id, cambios);
  } else {
    habitoId = await repos.habitos.crear({ ...cambios, creado: hoy });
  }

  const habito = await repos.habitos.obtener(habitoId);
  const avisos = await reprogramarHabito(repos, habito, calendarioId);
  return { id: habitoId, errores: {}, avisos };
}

export async function cambiarEstadoHabito(repos, habito, estado, calendarioId = null) {
  await repos.habitos.actualizar(habito.id, { estado });
  const actualizado = await repos.habitos.obtener(habito.id);
  return reprogramarHabito(repos, actualizado, calendarioId);
}

export async function marcarHabito(repos, habitoId, fecha, marcado) {
  if (marcado) await repos.registros.marcar(habitoId, fecha);
  else await repos.registros.desmarcar(habitoId, fecha);
}

function cambiosObjetivo(formulario) {
  return {
    nombre: formulario.nombre.trim(),
    descripcion: (formulario.descripcion ?? '').trim(),
    modo: formulario.modo,
    progresoManual: formulario.modo === MODOS_OBJETIVO.MANUAL ? Number(formulario.progresoManual) : 0,
    fechaLimite: formulario.fechaLimite || null,
    color: formulario.color,
  };
}

export async function guardarObjetivo(repos, formulario, { id = null, calendarioId = null, hoy = claveFecha() } = {}) {
  const errores = validarObjetivo(formulario);
  if (Object.keys(errores).length > 0) return { errores, avisos: [] };

  const cambios = cambiosObjetivo(formulario);
  let objetivoId = id;
  if (id) {
    await repos.objetivos.actualizar(id, cambios);
  } else {
    objetivoId = await repos.objetivos.crear({ ...cambios, creado: hoy });
  }

  const objetivo = await repos.objetivos.obtener(objetivoId);
  const aviso = await sincronizarEventoObjetivo(repos, objetivo, calendarioId);
  return { id: objetivoId, errores: {}, avisos: aviso ? [aviso] : [] };
}

export async function cambiarEstadoObjetivo(repos, objetivo, estado, calendarioId = null) {
  await repos.objetivos.actualizar(objetivo.id, { estado });
  const actualizado = await repos.objetivos.obtener(objetivo.id);
  const aviso = await sincronizarEventoObjetivo(repos, actualizado, calendarioId);
  return aviso ? [aviso] : [];
}

export async function fijarProgresoManual(repos, objetivoId, progreso) {
  await repos.objetivos.actualizar(objetivoId, { progresoManual: Math.min(100, Math.max(0, progreso)) });
}

// Tras cambiar el calendario por defecto, mueve (o quita, si es null) los eventos de todos los hábitos y objetivos.
// Los hábitos archivados ya no tienen evento, así que basta con listar los visibles.
export async function resincronizarCalendario(repos, calendarioId) {
  const avisos = [];
  for (const habito of await repos.habitos.listar()) {
    const aviso = await sincronizarEventoHabito(repos, habito, calendarioId);
    if (aviso) avisos.push(aviso);
  }
  for (const objetivo of await repos.objetivos.listar()) {
    const aviso = await sincronizarEventoObjetivo(repos, objetivo, calendarioId);
    if (aviso) avisos.push(aviso);
  }
  return avisos;
}
