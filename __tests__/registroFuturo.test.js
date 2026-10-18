import { crearBdPrueba } from './ayudas/bdPrueba';
import { aplicarMigraciones } from '../src/almacenamiento/esquema';
import { crearRepositorios } from '../src/almacenamiento/repositorios';
import { ELEMENTOS_POR_DEFECTO, validarElemento } from '../src/dominio/futuro';

async function preparar() {
  const bd = await crearBdPrueba();
  await aplicarMigraciones(bd);
  return { bd, repos: crearRepositorios(bd) };
}

describe('elementos del registro futuro', () => {
  test('la primera vez que se abre un mes trae los elementos por defecto', async () => {
    const { repos } = await preparar();

    const elementos = await repos.elementosFuturo.deMes('2026-11');

    expect(elementos.map((e) => e.texto)).toEqual(ELEMENTOS_POR_DEFECTO);
  });

  test('añadir pone el elemento al final del mes', async () => {
    const { repos } = await preparar();
    await repos.elementosFuturo.deMes('2026-11');

    await repos.elementosFuturo.anadir('2026-11', 'Viaje a Benidorm');

    const textos = (await repos.elementosFuturo.deMes('2026-11')).map((e) => e.texto);
    expect(textos[textos.length - 1]).toBe('Viaje a Benidorm');
  });

  test('un elemento por defecto eliminado no vuelve a aparecer', async () => {
    const { repos } = await preparar();
    const [primero] = await repos.elementosFuturo.deMes('2026-11');

    await repos.elementosFuturo.eliminar(primero.id);

    const textos = (await repos.elementosFuturo.deMes('2026-11')).map((e) => e.texto);
    expect(textos).not.toContain(primero.texto);
    expect(textos).toHaveLength(ELEMENTOS_POR_DEFECTO.length - 1);
  });

  test('cada mes tiene sus propios elementos', async () => {
    const { repos } = await preparar();
    await repos.elementosFuturo.deMes('2026-11');
    await repos.elementosFuturo.anadir('2026-11', 'Solo noviembre');

    const diciembre = (await repos.elementosFuturo.deMes('2026-12')).map((e) => e.texto);

    expect(diciembre).not.toContain('Solo noviembre');
  });
});

test('dos cargas simultáneas del mismo mes no duplican los elementos por defecto', async () => {
  const { repos } = await preparar();

  await Promise.all([repos.elementosFuturo.deMes('2026-11'), repos.elementosFuturo.deMes('2026-11')]);

  const textos = (await repos.elementosFuturo.deMes('2026-11')).map((e) => e.texto);
  expect(textos).toEqual(ELEMENTOS_POR_DEFECTO);
});

describe('validarElemento', () => {
  test('rechaza un texto vacío o solo con espacios', () => {
    expect(validarElemento('   ')).toBe('Escribe algo.');
  });

  test('rechaza más de 80 caracteres', () => {
    expect(validarElemento('a'.repeat(81))).toBe('Hasta 80 caracteres.');
  });

  test('acepta un texto normal', () => {
    expect(validarElemento('Cumpleaños de Ana')).toBeNull();
  });
});
