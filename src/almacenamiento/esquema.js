// Esquema de la base de datos SQLite y migraciones.
// Cada entrada de MIGRACIONES es una versión. No edites una migración ya publicada: añade una nueva al final.
// La versión aplicada se guarda en PRAGMA user_version.

export const MIGRACIONES = [
  `
  CREATE TABLE objetivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    modo TEXT NOT NULL CHECK (modo IN ('manual', 'habitos')),
    progreso_manual INTEGER NOT NULL DEFAULT 0,
    fecha_limite TEXT,
    estado TEXT NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'completado', 'abandonado')),
    color TEXT NOT NULL,
    creado TEXT NOT NULL,
    actualizado TEXT NOT NULL
  );

  CREATE TABLE habitos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('diaria', 'dias', 'veces')),
    dias TEXT NOT NULL DEFAULT '',
    veces INTEGER NOT NULL DEFAULT 1,
    recordatorio_hora TEXT,
    color TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pausado', 'archivado')),
    objetivo_id INTEGER REFERENCES objetivos(id) ON DELETE SET NULL,
    sincroniza_calendario INTEGER NOT NULL DEFAULT 0,
    notificaciones TEXT NOT NULL DEFAULT '[]',
    creado TEXT NOT NULL,
    actualizado TEXT NOT NULL
  );

  CREATE TABLE registros (
    habito_id INTEGER NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    fecha TEXT NOT NULL,
    PRIMARY KEY (habito_id, fecha)
  );

  CREATE TABLE ajustes (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );

  -- Solo guarda los eventos que ha creado la app. Así nunca tocamos eventos ajenos.
  CREATE TABLE eventos_calendario (
    referencia TEXT PRIMARY KEY,
    evento_id TEXT NOT NULL,
    calendario_id TEXT NOT NULL
  );
  `,
  // v2: elementos del registro futuro. `meses_futuro` recuerda qué meses ya recibieron
  // sus elementos por defecto, para no volver a crearlos si el usuario los borra.
  `
  CREATE TABLE meses_futuro (
    mes TEXT PRIMARY KEY
  );

  CREATE TABLE elementos_futuro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes TEXT NOT NULL,
    texto TEXT NOT NULL,
    orden INTEGER NOT NULL,
    creado TEXT NOT NULL
  );

  CREATE INDEX elementos_futuro_mes ON elementos_futuro (mes, orden);
  `,
  // v3: una posición por mes. Impide duplicar los elementos por defecto si un mes se carga
  // dos veces a la vez; antes se limpian los duplicados que ya existan.
  `
  DELETE FROM elementos_futuro
  WHERE id NOT IN (SELECT MIN(id) FROM elementos_futuro GROUP BY mes, orden);

  CREATE UNIQUE INDEX elementos_futuro_mes_orden ON elementos_futuro (mes, orden);
  `,
];

// Aplica las migraciones pendientes dentro de una transacción. Devuelve la versión final.
export async function aplicarMigraciones(bd) {
  const fila = await bd.getFirstAsync('PRAGMA user_version');
  const versionActual = fila?.user_version ?? 0;
  if (versionActual >= MIGRACIONES.length) return versionActual;

  await bd.withTransactionAsync(async () => {
    for (let version = versionActual; version < MIGRACIONES.length; version += 1) {
      await bd.execAsync(MIGRACIONES[version]);
    }
    await bd.execAsync(`PRAGMA user_version = ${MIGRACIONES.length}`);
  });
  return MIGRACIONES.length;
}
