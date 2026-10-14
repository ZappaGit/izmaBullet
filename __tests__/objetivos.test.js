import { diasRestantes, progresoObjetivo } from '../src/dominio/objetivos';

const hoy = '2026-10-14';

describe('progresoObjetivo', () => {
  test('modo manual: usa el valor fijado y lo limita a 0–100', () => {
    expect(progresoObjetivo({ modo: 'manual', progresoManual: 40 }, [], {}, hoy)).toBe(40);
    expect(progresoObjetivo({ modo: 'manual', progresoManual: 150 }, [], {}, hoy)).toBe(100);
    expect(progresoObjetivo({ modo: 'manual', progresoManual: -5 }, [], {}, hoy)).toBe(0);
  });

  test('modo hábitos: media del cumplimiento de sus hábitos', () => {
    const objetivo = { modo: 'habitos' };
    const habitos = [
      { id: 1, tipo: 'diaria', creado: '2026-10-01' },
      { id: 2, tipo: 'diaria', creado: '2026-10-01' },
    ];
    const registrosPorHabito = {
      1: new Set(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']),
      2: new Set(),
    };
    // Hábito 1: 4 de 13 días evaluados (hoy no marcado no cuenta) => 31 %.
    // Hábito 2: 0 %. Media => 15,5 → 16 %.
    expect(progresoObjetivo(objetivo, habitos, registrosPorHabito, hoy)).toBe(16);
  });

  test('modo hábitos sin hábitos devuelve 0', () => {
    expect(progresoObjetivo({ modo: 'habitos' }, [], {}, hoy)).toBe(0);
  });
});

describe('diasRestantes', () => {
  test('cuenta hasta la fecha límite; negativo si ya pasó; null sin fecha', () => {
    expect(diasRestantes({ fechaLimite: '2026-10-24' }, hoy)).toBe(10);
    expect(diasRestantes({ fechaLimite: '2026-10-04' }, hoy)).toBe(-10);
    expect(diasRestantes({ fechaLimite: null }, hoy)).toBeNull();
  });
});
