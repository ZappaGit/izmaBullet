import { APLICACIONES, buscarAplicacionPorNumero, etiquetaAplicacion, marcasIndice } from '../src/dominio/aplicaciones';

describe('APLICACIONES', () => {
  test('numera las aplicaciones desde 1 y sin saltos', () => {
    const numeros = APLICACIONES.map((aplicacion) => aplicacion.numero);

    expect(numeros).toEqual(APLICACIONES.map((_, indice) => indice + 1));
  });

  test('la aplicación 2 es Registro futuro', () => {
    expect(buscarAplicacionPorNumero(2).nombre).toBe('Registro futuro');
  });
});

describe('buscarAplicacionPorNumero', () => {
  test('devuelve undefined si no existe ese número', () => {
    expect(buscarAplicacionPorNumero(99)).toBeUndefined();
  });
});

describe('etiquetaAplicacion', () => {
  test('pone el número delante del nombre en el menú lateral', () => {
    expect(etiquetaAplicacion(buscarAplicacionPorNumero(1))).toBe('1  IzmaBullet');
  });
});

describe('color clave de cada aplicación', () => {
  test('cada aplicación tiene un color hexadecimal', () => {
    for (const aplicacion of APLICACIONES) {
      expect(aplicacion.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  test('ningún color se repite entre aplicaciones', () => {
    const colores = APLICACIONES.map((aplicacion) => aplicacion.color.toLowerCase());

    expect(new Set(colores).size).toBe(colores.length);
  });

  test('Registro futuro es verde mate', () => {
    expect(buscarAplicacionPorNumero(2).color).toBe('#5f7d6a');
  });
});

describe('marcasIndice', () => {
  test('devuelve una marca por aplicación con su color clave', () => {
    const marcas = marcasIndice(2);

    expect(marcas.map((marca) => marca.numero)).toEqual([1, 2]);
    expect(marcas[1].color).toBe('#5f7d6a');
  });

  test('marca como activa solo la aplicación actual', () => {
    const marcas = marcasIndice(2);

    expect(marcas.filter((marca) => marca.activa).map((marca) => marca.numero)).toEqual([2]);
  });

  test('sin aplicación actual no hay ninguna marca activa', () => {
    expect(marcasIndice(null).every((marca) => marca.activa === false)).toBe(true);
  });
});
