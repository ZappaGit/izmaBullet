// Frecuencias, rachas y cumplimiento de hábitos. Funciones puras: no tocan base de datos ni UI.
//
// Modelo de un hábito (tal como lo devuelve el repositorio):
//   tipo: 'diaria' | 'dias' | 'veces'
//   diasSemana: number[]        (0 = domingo … 6 = sábado; solo para tipo 'dias')
//   vecesPorSemana: number      (solo para tipo 'veces', 1–7)
//   creado: 'AAAA-MM-DD'        (no se cuenta nada antes de esta fecha)
//
// `registros` es un Set de claves de fecha en las que el hábito se marcó como hecho.

import { diaSemana, diferenciaDias, inicioSemana, sumarDias, ultimosDias } from './fechas';

export const TIPOS_FRECUENCIA = {
  DIARIA: 'diaria',
  DIAS: 'dias',
  VECES: 'veces',
};

export const NOMBRES_DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Describe la frecuencia en español para mostrarla en la UI.
export function describirFrecuencia(habito) {
  if (habito.tipo === TIPOS_FRECUENCIA.DIARIA) return 'Todos los días';
  if (habito.tipo === TIPOS_FRECUENCIA.VECES) {
    return habito.vecesPorSemana === 1 ? '1 vez por semana' : `${habito.vecesPorSemana} veces por semana`;
  }
  const ordenados = [...habito.diasSemana].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  return ordenados.map((dia) => NOMBRES_DIAS[dia]).join(', ');
}

// ¿Toca este día según la frecuencia? Para 'veces' cualquier día cuenta como posible.
export function esProgramadoEl(habito, clave) {
  if (habito.tipo === TIPOS_FRECUENCIA.DIAS) {
    return habito.diasSemana.includes(diaSemana(clave));
  }
  return true;
}

// Registros de la semana ISO (lunes a domingo) que contiene `clave`.
export function registrosDeLaSemana(registros, clave) {
  const lunes = inicioSemana(clave);
  let cuenta = 0;
  for (let i = 0; i < 7; i += 1) {
    if (registros.has(sumarDias(lunes, i))) cuenta += 1;
  }
  return cuenta;
}

// Un hábito 'veces' aparece en Hoy mientras no llegue a su cupo semanal,
// o si ya se marcó hoy (para poder deshacerlo).
export function aparecerEnHoy(habito, registros, hoy) {
  if (habito.tipo !== TIPOS_FRECUENCIA.VECES) return esProgramadoEl(habito, hoy);
  return registros.has(hoy) || registrosDeLaSemana(registros, hoy) < habito.vecesPorSemana;
}

// Periodos en orden cronológico desde la creación hasta hoy.
// Para diaria/dias el periodo es un día programado; para veces, una semana ISO.
// Cada periodo: { clave, esperado, hecho, cumplido, actual }
//   - hecho: cuántas marcas tiene el periodo (tope: esperado).
//   - cumplido: si el periodo está completo.
//   - actual: si el periodo contiene hoy (puede estar aún pendiente).
export function periodosDelHabito(habito, registros, hoy) {
  const periodos = [];
  if (habito.tipo === TIPOS_FRECUENCIA.VECES) {
    const primeraSemana = inicioSemana(habito.creado);
    const semanaActual = inicioSemana(hoy);
    for (let lunes = primeraSemana; lunes <= semanaActual; lunes = sumarDias(lunes, 7)) {
      const hecho = registrosDeLaSemana(registros, lunes);
      const esperado = habito.vecesPorSemana;
      periodos.push({
        clave: lunes,
        esperado,
        hecho: Math.min(hecho, esperado),
        cumplido: hecho >= esperado,
        actual: lunes === semanaActual,
      });
    }
    return periodos;
  }

  const dias = diferenciaDias(habito.creado, hoy);
  for (let i = 0; i <= dias; i += 1) {
    const clave = sumarDias(habito.creado, i);
    if (!esProgramadoEl(habito, clave)) continue;
    const hecho = registros.has(clave) ? 1 : 0;
    periodos.push({ clave, esperado: 1, hecho, cumplido: hecho === 1, actual: clave === hoy });
  }
  return periodos;
}

// Racha actual y mejor racha.
// Un periodo actual que todavía no está cumplido no rompe la racha: aún hay tiempo.
export function calcularRachas(habito, registros, hoy) {
  const periodos = periodosDelHabito(habito, registros, hoy);

  let actual = 0;
  for (let i = periodos.length - 1; i >= 0; i -= 1) {
    const periodo = periodos[i];
    if (periodo.cumplido) {
      actual += 1;
    } else if (!periodo.actual) {
      break;
    }
  }

  let mejor = 0;
  let enCurso = 0;
  for (const periodo of periodos) {
    if (periodo.cumplido) {
      enCurso += 1;
      mejor = Math.max(mejor, enCurso);
    } else if (!periodo.actual) {
      enCurso = 0;
    }
  }

  return { actual, mejor };
}

// Porcentaje de cumplimiento (0–100) en los últimos `dias` días, o null si no había nada programado.
// - diaria/dias: días programados marcados / días programados. Hoy no cuenta si está sin marcar.
// - veces: suma de min(marcas, cupo) / cupo total de las semanas que intersecan la ventana.
//   La semana actual no cuenta si aún no llega al cupo.
export function cumplimiento(habito, registros, hoy, dias) {
  const ventana = ultimosDias(hoy, dias).filter((clave) => clave >= habito.creado);
  if (ventana.length === 0) return null;

  if (habito.tipo === TIPOS_FRECUENCIA.VECES) {
    const primerLunes = inicioSemana(ventana[0]);
    const ultimoLunes = inicioSemana(hoy);
    let obtenido = 0;
    let esperado = 0;
    for (let lunes = primerLunes; lunes <= ultimoLunes; lunes = sumarDias(lunes, 7)) {
      const hecho = registrosDeLaSemana(registros, lunes);
      const esSemanaActual = lunes === ultimoLunes;
      if (esSemanaActual && hecho < habito.vecesPorSemana) continue;
      obtenido += Math.min(hecho, habito.vecesPorSemana);
      esperado += habito.vecesPorSemana;
    }
    if (esperado === 0) return null;
    return Math.round((obtenido / esperado) * 100);
  }

  let programados = 0;
  let hechos = 0;
  for (const clave of ventana) {
    if (!esProgramadoEl(habito, clave)) continue;
    const marcado = registros.has(clave);
    if (clave === hoy && !marcado) continue;
    programados += 1;
    if (marcado) hechos += 1;
  }
  if (programados === 0) return null;
  return Math.round((hechos / programados) * 100);
}
