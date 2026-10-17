import { PAGINAS_FUTURO, mesDesplazado } from '../src/dominio/futuro';

describe('mesDesplazado', () => {
  test('calcula el mes siguiente a la fecha de hoy', () => {
    const mes = mesDesplazado(new Date(2026, 9, 16), 1);

    expect(mes).toEqual({ etiqueta: 'Mes +1', nombre: 'noviembre de 2026' });
  });

  test('pasa al año siguiente cuando se cruza diciembre', () => {
    expect(mesDesplazado(new Date(2026, 9, 16), 3).nombre).toBe('enero de 2027');
    expect(mesDesplazado(new Date(2026, 9, 16), 4).nombre).toBe('febrero de 2027');
  });
});

describe('PAGINAS_FUTURO', () => {
  test('reparte los meses +1 a +4 en dos páginas: Registro y Futuro', () => {
    expect(PAGINAS_FUTURO.map((pagina) => pagina.titulo)).toEqual(['Registro', 'Futuro']);
    expect(PAGINAS_FUTURO.flatMap((pagina) => pagina.meses)).toEqual([1, 2, 3, 4]);
  });
});
