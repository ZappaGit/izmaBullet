import { MIGRACIONES, aplicarMigraciones } from '../src/almacenamiento/esquema';
import { crearRepositorios } from '../src/almacenamiento/repositorios';
import { crearBdPrueba } from './ayudas/bdPrueba';

describe('migraciones', () => {
  test('crean el esquema y fijan la versión', async () => {
    const bd = await crearBdPrueba();
    const version = await aplicarMigraciones(bd);
    expect(version).toBe(MIGRACIONES.length);
    const tablas = (await bd.getAllAsync("SELECT name FROM sqlite_master WHERE type = 'table'")).map((f) => f.name);
    expect(tablas).toEqual(expect.arrayContaining(['habitos', 'objetivos', 'registros', 'ajustes', 'eventos_calendario']));
  });

  test('ejecutarlas dos veces no falla ni duplica nada', async () => {
    const bd = await crearBdPrueba();
    await aplicarMigraciones(bd);
    await expect(aplicarMigraciones(bd)).resolves.toBe(MIGRACIONES.length);
  });
});

describe('repositorios', () => {
  let bd;
  let repos;

  beforeEach(async () => {
    bd = await crearBdPrueba();
    await aplicarMigraciones(bd);
    repos = crearRepositorios(bd);
  });

  afterEach(() => bd.cerrar());

  const habitoEjemplo = (extra = {}) => ({
    nombre: 'Leer 20 minutos',
    tipo: 'dias',
    diasSemana: [3, 1],
    vecesPorSemana: 1,
    recordatorioHora: '21:30',
    color: '#7d9bb0',
    sincronizaCalendario: true,
    creado: '2026-10-01',
    ...extra,
  });

  test('crea un hábito y lo devuelve con sus días ordenados y booleanos correctos', async () => {
    const id = await repos.habitos.crear(habitoEjemplo());
    const habito = await repos.habitos.obtener(id);
    expect(habito).toMatchObject({
      id,
      nombre: 'Leer 20 minutos',
      tipo: 'dias',
      diasSemana: [1, 3],
      recordatorioHora: '21:30',
      estado: 'activo',
      sincronizaCalendario: true,
      notificaciones: [],
    });
  });

  test('actualizar cambia solo los campos enviados', async () => {
    const id = await repos.habitos.crear(habitoEjemplo());
    await repos.habitos.actualizar(id, { estado: 'pausado', notificaciones: ['n1', 'n2'] });
    const habito = await repos.habitos.obtener(id);
    expect(habito.estado).toBe('pausado');
    expect(habito.notificaciones).toEqual(['n1', 'n2']);
    expect(habito.nombre).toBe('Leer 20 minutos');
  });

  test('listar oculta los archivados salvo que se pida', async () => {
    const activo = await repos.habitos.crear(habitoEjemplo({ nombre: 'Activo' }));
    const archivado = await repos.habitos.crear(habitoEjemplo({ nombre: 'Archivado' }));
    await repos.habitos.actualizar(archivado, { estado: 'archivado' });

    const visibles = await repos.habitos.listar();
    expect(visibles.map((h) => h.id)).toEqual([activo]);
    expect(await repos.habitos.listar({ incluirArchivados: true })).toHaveLength(2);
  });

  test('marcar es idempotente y desmarcar deshace', async () => {
    const id = await repos.habitos.crear(habitoEjemplo({ tipo: 'diaria', diasSemana: [] }));
    await repos.registros.marcar(id, '2026-10-12');
    await repos.registros.marcar(id, '2026-10-12');
    expect(await repos.registros.deHabito(id)).toEqual(new Set(['2026-10-12']));

    await repos.registros.desmarcar(id, '2026-10-12');
    expect((await repos.registros.deHabito(id)).size).toBe(0);
  });

  test('habitosMarcadosEl devuelve los hábitos marcados en un día', async () => {
    const primero = await repos.habitos.crear(habitoEjemplo({ nombre: 'A', tipo: 'diaria', diasSemana: [] }));
    const segundo = await repos.habitos.crear(habitoEjemplo({ nombre: 'B', tipo: 'diaria', diasSemana: [] }));
    await repos.registros.marcar(primero, '2026-10-14');
    await repos.registros.marcar(segundo, '2026-10-13');
    expect(await repos.registros.habitosMarcadosEl('2026-10-14')).toEqual(new Set([primero]));
  });

  test('archivar un hábito conserva su histórico de registros', async () => {
    const id = await repos.habitos.crear(habitoEjemplo({ tipo: 'diaria', diasSemana: [] }));
    await repos.registros.marcar(id, '2026-10-12');
    await repos.habitos.actualizar(id, { estado: 'archivado' });
    expect(await repos.registros.deHabito(id)).toEqual(new Set(['2026-10-12']));
  });

  test('crea objetivos y los liga a un hábito', async () => {
    const objetivoId = await repos.objetivos.crear({
      nombre: 'Correr 5 km',
      modo: 'habitos',
      fechaLimite: '2026-12-31',
      color: '#8fa88a',
      creado: '2026-10-01',
    });
    const habitoId = await repos.habitos.crear(habitoEjemplo({ objetivoId }));

    const objetivo = await repos.objetivos.obtener(objetivoId);
    expect(objetivo).toMatchObject({ nombre: 'Correr 5 km', estado: 'en_curso', fechaLimite: '2026-12-31' });
    expect((await repos.habitos.obtener(habitoId)).objetivoId).toBe(objetivoId);
  });

  test('ajustes: valor por defecto y guardado sobrescribible', async () => {
    expect(await repos.ajustes.obtener('tema', 'sistema')).toBe('sistema');
    await repos.ajustes.guardar('tema', 'oscuro');
    await repos.ajustes.guardar('tema', 'claro');
    expect(await repos.ajustes.obtener('tema', 'sistema')).toBe('claro');
  });

  test('eventos de calendario: guarda, actualiza y borra solo referencias de la app', async () => {
    await repos.eventosCalendario.guardar('habito:1', 'evento-9', 'cal-1');
    await repos.eventosCalendario.guardar('habito:1', 'evento-10', 'cal-2');
    expect(await repos.eventosCalendario.obtener('habito:1')).toEqual({ eventoId: 'evento-10', calendarioId: 'cal-2' });

    await repos.eventosCalendario.borrar('habito:1');
    expect(await repos.eventosCalendario.obtener('habito:1')).toBeNull();
  });
});
