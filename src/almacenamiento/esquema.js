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
