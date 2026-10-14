import {
  claveFecha,
  desdeClave,
  diaSemana,
  diferenciaDias,
  esClaveValida,
  inicioSemana,
  parsearHora,
  sumarDias,
  ultimosDias,
} from '../src/dominio/fechas';

describe('fechas', () => {
  test('claveFecha formatea en local con ceros a la izquierda', () => {
    expect(claveFecha(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  test('desdeClave y claveFecha son inversas', () => {
    expect(claveFecha(desdeClave('2026-10-14'))).toBe('2026-10-14');
  });

  test('sumarDias cruza meses y años', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('diaSemana sigue la convención de Date.getDay (0 = domingo)', () => {
    expect(diaSemana('2026-10-11')).toBe(0); // domingo
    expect(diaSemana('2026-10-12')).toBe(1); // lunes
  });

  test('inicioSemana devuelve el lunes, también si la fecha es domingo', () => {
    expect(inicioSemana('2026-10-14')).toBe('2026-10-12');
    expect(inicioSemana('2026-10-11')).toBe('2026-10-05');
  });

  test('diferenciaDias cuenta días completos entre dos claves', () => {
    expect(diferenciaDias('2026-10-01', '2026-10-14')).toBe(13);
    expect(diferenciaDias('2026-10-14', '2026-10-01')).toBe(-13);
  });

  test('ultimosDias termina en hoy y ordena del más antiguo al más reciente', () => {
    expect(ultimosDias('2026-10-14', 3)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14']);
  });

  test('esClaveValida rechaza formatos inexistentes', () => {
    expect(esClaveValida('2026-02-28')).toBe(true);
    expect(esClaveValida('2026-13-01')).toBe(false);
    expect(esClaveValida('14/10/2026')).toBe(false);
  });

  test('parsearHora acepta HH:MM en 24 h y rechaza el resto', () => {
    expect(parsearHora('07:30')).toEqual({ hora: 7, minuto: 30 });
    expect(parsearHora('23:59')).toEqual({ hora: 23, minuto: 59 });
    expect(parsearHora('24:00')).toBeNull();
    expect(parsearHora('7:30')).toBeNull();
    expect(parsearHora('')).toBeNull();
  });
});
