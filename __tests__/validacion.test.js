import { validarHabito, validarObjetivo } from '../src/dominio/validacion';

describe('validarHabito', () => {
  const base = { nombre: 'Meditar', tipo: 'diaria', recordatorioHora: '07:00', sincronizaCalendario: false };

  test('un hábito diario con nombre y hora válidos no tiene errores', () => {
    expect(validarHabito(base)).toEqual({});
  });

  test('pide nombre y limita su longitud', () => {
    expect(validarHabito({ ...base, nombre: '   ' }).nombre).toBeDefined();
    expect(validarHabito({ ...base, nombre: 'x'.repeat(61) }).nombre).toBeDefined();
  });

  test('días concretos exige al menos un día', () => {
    expect(validarHabito({ ...base, tipo: 'dias', diasSemana: [] }).diasSemana).toBeDefined();
    expect(validarHabito({ ...base, tipo: 'dias', diasSemana: [2] })).toEqual({});
  });

  test('N veces por semana acota entre 1 y 7', () => {
    expect(validarHabito({ ...base, tipo: 'veces', vecesPorSemana: 0 }).vecesPorSemana).toBeDefined();
    expect(validarHabito({ ...base, tipo: 'veces', vecesPorSemana: 8 }).vecesPorSemana).toBeDefined();
    expect(validarHabito({ ...base, tipo: 'veces', vecesPorSemana: 7 })).toEqual({});
  });

  test('la hora de recordatorio debe ser HH:MM', () => {
    expect(validarHabito({ ...base, recordatorioHora: '7 am' }).recordatorioHora).toBeDefined();
    expect(validarHabito({ ...base, recordatorioHora: null })).toEqual({});
  });

  test('sincronizar con el calendario necesita hora y no vale para hábitos por semana', () => {
    expect(validarHabito({ ...base, sincronizaCalendario: true, recordatorioHora: null }).sincronizaCalendario).toBeDefined();
    expect(
      validarHabito({ ...base, tipo: 'veces', vecesPorSemana: 2, sincronizaCalendario: true }).sincronizaCalendario,
    ).toBeDefined();
    expect(validarHabito({ ...base, sincronizaCalendario: true })).toEqual({});
  });
});

describe('validarObjetivo', () => {
  test('pide nombre y comprueba la fecha límite', () => {
    expect(validarObjetivo({ nombre: '', modo: 'manual', progresoManual: 0 }).nombre).toBeDefined();
    expect(validarObjetivo({ nombre: 'Ahorro', modo: 'manual', progresoManual: 0, fechaLimite: '2026-02-30' }).fechaLimite)
      .toBeDefined();
    expect(validarObjetivo({ nombre: 'Ahorro', modo: 'manual', progresoManual: 0, fechaLimite: '2026-02-28' })).toEqual({});
  });

  test('en modo manual el progreso va de 0 a 100', () => {
    expect(validarObjetivo({ nombre: 'A', modo: 'manual', progresoManual: 101 }).progresoManual).toBeDefined();
    expect(validarObjetivo({ nombre: 'A', modo: 'habitos', progresoManual: 999 })).toEqual({});
  });
});
