import {
  aparecerEnHoy,
  calcularRachas,
  cumplimiento,
  describirFrecuencia,
  esProgramadoEl,
  registrosDeLaSemana,
} from '../src/dominio/habitos';

const diario = (creado) => ({ id: 1, tipo: 'diaria', creado });
const porDias = (creado, diasSemana) => ({ id: 2, tipo: 'dias', diasSemana, creado });
const porVeces = (creado, vecesPorSemana) => ({ id: 3, tipo: 'veces', vecesPorSemana, creado });
const marcas = (...claves) => new Set(claves);

describe('frecuencias', () => {
  test('describirFrecuencia en español', () => {
    expect(describirFrecuencia(diario('2026-01-01'))).toBe('Todos los días');
    expect(describirFrecuencia(porVeces('2026-01-01', 1))).toBe('1 vez por semana');
    expect(describirFrecuencia(porVeces('2026-01-01', 3))).toBe('3 veces por semana');
    // Se muestran empezando por lunes: Lun, Mié, Dom
    expect(describirFrecuencia(porDias('2026-01-01', [0, 3, 1]))).toBe('Lun, Mié, Dom');
  });

  test('esProgramadoEl respeta los días concretos', () => {
    const lunesYMiercoles = porDias('2026-01-01', [1, 3]);
    expect(esProgramadoEl(lunesYMiercoles, '2026-10-12')).toBe(true); // lunes
    expect(esProgramadoEl(lunesYMiercoles, '2026-10-13')).toBe(false); // martes
  });

  test('aparecerEnHoy: un hábito N veces desaparece al llegar al cupo semanal', () => {
    const dosVeces = porVeces('2026-10-01', 2);
    // Lunes 12 y martes 13 ya marcados: cupo lleno, hoy es miércoles 14.
    expect(aparecerEnHoy(dosVeces, marcas('2026-10-12', '2026-10-13'), '2026-10-14')).toBe(false);
    // Mismo cupo lleno, pero se marcó hoy: sigue visible para poder deshacer.
    expect(aparecerEnHoy(dosVeces, marcas('2026-10-12', '2026-10-13', '2026-10-14'), '2026-10-14')).toBe(true);
  });

  test('registrosDeLaSemana cuenta solo la semana ISO de la fecha', () => {
    const registros = marcas('2026-10-11', '2026-10-12', '2026-10-18');
    // La semana del 12 al 18 de octubre contiene el lunes 12 y el domingo 18; el domingo 11 es de la anterior.
    expect(registrosDeLaSemana(registros, '2026-10-14')).toBe(2);
  });
});

describe('rachas', () => {
  test('racha diaria: hoy sin marcar no rompe la racha de ayer', () => {
    const hoy = '2026-10-14';
    const registros = marcas('2026-10-11', '2026-10-12', '2026-10-13');
    expect(calcularRachas(diario('2026-10-10'), registros, hoy)).toEqual({ actual: 3, mejor: 3 });
  });

  test('una falta corta la racha actual pero no la mejor', () => {
    const hoy = '2026-10-14';
    const registros = marcas('2026-10-01', '2026-10-02', '2026-10-03', '2026-10-13', '2026-10-14');
    const habito = diario('2026-10-01');
    expect(calcularRachas(habito, registros, hoy)).toEqual({ actual: 2, mejor: 3 });
  });

  test('días concretos: los días no programados no rompen la racha', () => {
    // Lunes y viernes programados desde el 1 de octubre: 2, 5, 9 y 12. Hoy (miércoles) no está programado.
    const habito = porDias('2026-10-01', [1, 5]);
    const registros = marcas('2026-10-02', '2026-10-05', '2026-10-09', '2026-10-12');
    expect(calcularRachas(habito, registros, '2026-10-14')).toEqual({ actual: 4, mejor: 4 });
  });

  test('veces por semana: racha de semanas cumplidas; la semana actual pendiente no rompe', () => {
    // Cupo 2. Semana del 28 sep: cumplida. Semana del 5 oct: cumplida. Semana del 12 oct (actual): 1 de 2.
    const habito = porVeces('2026-09-28', 2);
    const registros = marcas('2026-09-28', '2026-09-29', '2026-10-05', '2026-10-06', '2026-10-12');
    expect(calcularRachas(habito, registros, '2026-10-14')).toEqual({ actual: 2, mejor: 2 });
  });

  test('veces por semana: una semana pasada incumplida corta la racha actual', () => {
    const habito = porVeces('2026-09-28', 2);
    // Semana del 28 sep: cumplida. Semana del 5 oct: solo 1 marca. Semana actual: cumplida.
    const registros = marcas('2026-09-28', '2026-09-29', '2026-10-05', '2026-10-12', '2026-10-13');
    expect(calcularRachas(habito, registros, '2026-10-14')).toEqual({ actual: 1, mejor: 1 });
  });

  test('sin registros no hay racha', () => {
    expect(calcularRachas(diario('2026-10-10'), marcas(), '2026-10-14')).toEqual({ actual: 0, mejor: 0 });
  });
});

describe('cumplimiento', () => {
  test('diario: porcentaje sobre los últimos 7 días, sin contar hoy si está pendiente', () => {
    const hoy = '2026-10-14';
    // Ventana: del 8 al 14. Hoy sin marcar no cuenta, así que se evalúan 6 días; se marcan 3.
    const registros = marcas('2026-10-09', '2026-10-11', '2026-10-13');
    expect(cumplimiento(diario('2026-01-01'), registros, hoy, 7)).toBe(50);
  });

  test('hoy marcado sí cuenta', () => {
    const hoy = '2026-10-14';
    const registros = marcas('2026-10-13', '2026-10-14');
    // Evaluados del 8 al 14 (7 días), hoy marcado: 2 de 7 => 29 %
    expect(cumplimiento(diario('2026-01-01'), registros, hoy, 7)).toBe(29);
  });

  test('días concretos: solo cuentan los días programados', () => {
    const habito = porDias('2026-01-01', [1]); // solo lunes
    const hoy = '2026-10-14';
    // Lunes en los últimos 30 días: 2026-09-21, 09-28, 10-05, 10-12 => 4. Se cumplen 3.
    const registros = marcas('2026-09-21', '2026-10-05', '2026-10-12');
    expect(cumplimiento(habito, registros, hoy, 30)).toBe(75);
  });

  test('veces: suma de min(marcas, cupo) frente al cupo de las semanas', () => {
    const habito = porVeces('2026-01-01', 2);
    const hoy = '2026-10-14';
    // Semana 5 oct: 2 de 2. Semana 28 sep: 1 de 2. Semana 12 oct (actual): 0 y se omite.
    const registros = marcas('2026-10-05', '2026-10-06', '2026-09-29');
    expect(cumplimiento(habito, registros, hoy, 14)).toBe(75);
  });

  test('sin días programados en la ventana devuelve null', () => {
    const habito = porDias('2026-10-14', [0]); // solo domingos; hoy es miércoles
    expect(cumplimiento(habito, marcas(), '2026-10-14', 7)).toBeNull();
  });

  test('no evalúa antes de la fecha de creación', () => {
    // Solo existen 10-13 y 10-14 dentro de la ventana. Hoy está pendiente y no cuenta: 1 de 1 => 100.
    // Si los días anteriores a la creación contaran, el resultado sería mucho menor.
    const habito = diario('2026-10-13');
    const hoy = '2026-10-14';
    expect(cumplimiento(habito, marcas('2026-10-13'), hoy, 30)).toBe(100);
  });
});
