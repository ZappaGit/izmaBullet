import { APLICACIONES, buscarAplicacionPorNumero, etiquetaAplicacion, marcasIndice } from '../src/dominio/aplicaciones';

describe('APLICACIONES (subapps)', () => {
  test('numera las siete subapps desde 1 y sin saltos', () => {
    expect(APLICACIONES.map((a) => a.numero)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  test('sigue el orden de los requisitos', () => {
    expect(APLICACIONES.map((a) => a.nombre)).toEqual([
      'Índice', 'Registro futuro', 'Conocimiento', 'Inventario personal',
      'Seguimiento', 'Hábitos y objetivos', 'Ajustes e info',
    ]);
  });

  test('las subapps disponibles tienen ruta y las demás no', () => {
    for (const a of APLICACIONES) {
      if (a.disponible) expect(a.ruta).toMatch(/^\//);
      else expect(a.ruta).toBeNull();
    }
  });

  test('Registro futuro es verde mate y está disponible', () => {
    const registro = buscarAplicacionPorNumero(2);
    expect(registro.color).toBe('#5f7d6a');
    expect(registro.disponible).toBe(true);
  });

  test('devuelve undefined si no existe ese número', () => {
    expect(buscarAplicacionPorNumero(99)).toBeUndefined();
  });
});

describe('color clave', () => {
  test('cada subapp tiene un color hexadecimal distinto', () => {
    const colores = APLICACIONES.map((a) => a.color.toLowerCase());
    for (const c of colores) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(colores).size).toBe(colores.length);
  });
});

describe('etiquetaAplicacion', () => {
  test('pone el número entre corchetes delante del nombre', () => {
    expect(etiquetaAplicacion(buscarAplicacionPorNumero(2))).toBe('[2]  Registro futuro');
  });
});

describe('marcasIndice', () => {
  test('marca como activa solo la subapp actual', () => {
    expect(marcasIndice(2).filter((m) => m.activa).map((m) => m.numero)).toEqual([2]);
  });

  test('sin subapp actual no hay ninguna activa', () => {
    expect(marcasIndice(null).some((m) => m.activa)).toBe(false);
  });

  test('incluye si la subapp está disponible', () => {
    expect(marcasIndice(2).find((m) => m.numero === 3).disponible).toBe(false);
  });
});
