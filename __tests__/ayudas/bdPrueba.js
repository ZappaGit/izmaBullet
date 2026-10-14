// Adaptador de pruebas: SQLite real (sql.js) con la misma forma async que expo-sqlite.
import initSqlJs from 'sql.js';

async function todasLasFilas(bd, sql, params = []) {
  const sentencia = bd.prepare(sql);
  try {
    sentencia.bind(params);
    const filas = [];
    while (sentencia.step()) filas.push(sentencia.getAsObject());
    return filas;
  } finally {
    sentencia.free();
  }
}

export async function crearBdPrueba() {
  const SQL = await initSqlJs();
  const bd = new SQL.Database();

  return {
    execAsync: async (sql) => bd.exec(sql),
    runAsync: async (sql, params = []) => bd.run(sql, params),
    getAllAsync: async (sql, params = []) => todasLasFilas(bd, sql, params),
    getFirstAsync: async (sql, params = []) => (await todasLasFilas(bd, sql, params))[0] ?? null,
    withTransactionAsync: async (funcion) => {
      bd.exec('BEGIN');
      try {
        await funcion();
        bd.exec('COMMIT');
      } catch (error) {
        bd.exec('ROLLBACK');
        throw error;
      }
    },
    cerrar: () => bd.close(),
  };
}
