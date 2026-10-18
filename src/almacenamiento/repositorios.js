// Acceso a datos. Recibe un adaptador `bd` con la forma de expo-sqlite (async):
//   execAsync(sql), runAsync(sql, params), getAllAsync(sql, params), getFirstAsync(sql, params)
// Así la misma lógica funciona en la app (expo-sqlite) y en las pruebas (sql.js).

import { ELEMENTOS_POR_DEFECTO } from '../dominio/futuro';

const ahora = () => new Date().toISOString();

// Columnas que se pueden cambiar al actualizar, con su nombre en la base de datos.
const COLUMNAS_HABITO = {
  nombre: 'nombre',
  tipo: 'tipo',
  diasSemana: 'dias',
  vecesPorSemana: 'veces',
  recordatorioHora: 'recordatorio_hora',
  color: 'color',
  estado: 'estado',
  objetivoId: 'objetivo_id',
  sincronizaCalendario: 'sincroniza_calendario',
  notificaciones: 'notificaciones',
};

const COLUMNAS_OBJETIVO = {
  nombre: 'nombre',
  descripcion: 'descripcion',
  modo: 'modo',
  progresoManual: 'progreso_manual',
  fechaLimite: 'fecha_limite',
  estado: 'estado',
  color: 'color',
};

function valorParaColumna(campo, valor) {
  if (campo === 'diasSemana') return [...valor].sort((a, b) => a - b).join(',');
  if (campo === 'sincronizaCalendario') return valor ? 1 : 0;
  if (campo === 'notificaciones') return JSON.stringify(valor ?? []);
  return valor ?? null;
}

// Construye un UPDATE solo con los campos presentes en `cambios`. Devuelve null si no hay nada que cambiar.
function sentenciaActualizar(tabla, columnas, cambios, valorClave, actualizado) {
  const asignaciones = [];
  const valores = [];
  for (const [campo, valor] of Object.entries(cambios)) {
    if (!(campo in columnas)) continue;
    asignaciones.push(`${columnas[campo]} = ?`);
    valores.push(valorParaColumna(campo, valor));
  }
  if (asignaciones.length === 0) return null;
  asignaciones.push('actualizado = ?');
  valores.push(actualizado, valorClave);
  return { sql: `UPDATE ${tabla} SET ${asignaciones.join(', ')} WHERE id = ?`, valores };
}

function aHabito(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    diasSemana: fila.dias ? fila.dias.split(',').map(Number) : [],
    vecesPorSemana: fila.veces,
    recordatorioHora: fila.recordatorio_hora,
    color: fila.color,
    estado: fila.estado,
    objetivoId: fila.objetivo_id,
    sincronizaCalendario: fila.sincroniza_calendario === 1,
    notificaciones: JSON.parse(fila.notificaciones || '[]'),
    creado: fila.creado,
  };
}

function aObjetivo(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    modo: fila.modo,
    progresoManual: fila.progreso_manual,
    fechaLimite: fila.fecha_limite,
    estado: fila.estado,
    color: fila.color,
    creado: fila.creado,
  };
}

export function crearRepositorios(bd) {
  async function ultimoId() {
    const fila = await bd.getFirstAsync('SELECT last_insert_rowid() AS id');
    return fila.id;
  }

  const habitos = {
    // Por defecto no devuelve los archivados.
    async listar({ incluirArchivados = false } = {}) {
      const filtro = incluirArchivados ? '' : "WHERE estado != 'archivado'";
      const filas = await bd.getAllAsync(`SELECT * FROM habitos ${filtro} ORDER BY creado, id`);
      return filas.map(aHabito);
    },

    async obtener(id) {
      const fila = await bd.getFirstAsync('SELECT * FROM habitos WHERE id = ?', [id]);
      return fila ? aHabito(fila) : null;
    },

    async crear(datos) {
      const momento = ahora();
      await bd.runAsync(
        `INSERT INTO habitos (nombre, tipo, dias, veces, recordatorio_hora, color, estado, objetivo_id,
           sincroniza_calendario, notificaciones, creado, actualizado)
         VALUES (?, ?, ?, ?, ?, ?, 'activo', ?, ?, '[]', ?, ?)`,
        [
          datos.nombre,
          datos.tipo,
          valorParaColumna('diasSemana', datos.diasSemana ?? []),
          datos.vecesPorSemana ?? 1,
          datos.recordatorioHora ?? null,
          datos.color,
          datos.objetivoId ?? null,
          datos.sincronizaCalendario ? 1 : 0,
          datos.creado,
          momento,
        ],
      );
      return ultimoId();
    },

    async actualizar(id, cambios) {
      const sentencia = sentenciaActualizar('habitos', COLUMNAS_HABITO, cambios, id, ahora());
      if (sentencia) await bd.runAsync(sentencia.sql, sentencia.valores);
    },
  };

  const registros = {
    // Fechas ('AAAA-MM-DD') en las que el hábito se marcó.
    async deHabito(habitoId) {
      const filas = await bd.getAllAsync('SELECT fecha FROM registros WHERE habito_id = ?', [habitoId]);
      return new Set(filas.map((fila) => fila.fecha));
    },

    // Ids de los hábitos marcados en una fecha.
    async habitosMarcadosEl(fecha) {
      const filas = await bd.getAllAsync('SELECT habito_id FROM registros WHERE fecha = ?', [fecha]);
      return new Set(filas.map((fila) => fila.habito_id));
    },

    async marcar(habitoId, fecha) {
      await bd.runAsync('INSERT OR IGNORE INTO registros (habito_id, fecha) VALUES (?, ?)', [habitoId, fecha]);
    },

    async desmarcar(habitoId, fecha) {
      await bd.runAsync('DELETE FROM registros WHERE habito_id = ? AND fecha = ?', [habitoId, fecha]);
    },
  };

  const objetivos = {
    async listar() {
      const filas = await bd.getAllAsync('SELECT * FROM objetivos ORDER BY creado, id');
      return filas.map(aObjetivo);
    },

    async obtener(id) {
      const fila = await bd.getFirstAsync('SELECT * FROM objetivos WHERE id = ?', [id]);
      return fila ? aObjetivo(fila) : null;
    },

    async crear(datos) {
      const momento = ahora();
      await bd.runAsync(
        `INSERT INTO objetivos (nombre, descripcion, modo, progreso_manual, fecha_limite, estado, color, creado, actualizado)
         VALUES (?, ?, ?, ?, ?, 'en_curso', ?, ?, ?)`,
        [
          datos.nombre,
          datos.descripcion ?? '',
          datos.modo,
          datos.progresoManual ?? 0,
          datos.fechaLimite ?? null,
          datos.color,
          datos.creado,
          momento,
        ],
      );
      return ultimoId();
    },

    async actualizar(id, cambios) {
      const sentencia = sentenciaActualizar('objetivos', COLUMNAS_OBJETIVO, cambios, id, ahora());
      if (sentencia) await bd.runAsync(sentencia.sql, sentencia.valores);
    },
  };

  const ajustes = {
    async obtener(clave, valorPorDefecto = null) {
      const fila = await bd.getFirstAsync('SELECT valor FROM ajustes WHERE clave = ?', [clave]);
      return fila ? fila.valor : valorPorDefecto;
    },

    async guardar(clave, valor) {
      await bd.runAsync(
        'INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor',
        [clave, String(valor)],
      );
    },
  };

  // Eventos del calendario creados por la app. `referencia` es 'habito:<id>' u 'objetivo:<id>'.
  const eventosCalendario = {
    async obtener(referencia) {
      const fila = await bd.getFirstAsync(
        'SELECT evento_id, calendario_id FROM eventos_calendario WHERE referencia = ?',
        [referencia],
      );
      return fila ? { eventoId: fila.evento_id, calendarioId: fila.calendario_id } : null;
    },

    async guardar(referencia, eventoId, calendarioId) {
      await bd.runAsync(
        `INSERT INTO eventos_calendario (referencia, evento_id, calendario_id) VALUES (?, ?, ?)
         ON CONFLICT(referencia) DO UPDATE SET evento_id = excluded.evento_id, calendario_id = excluded.calendario_id`,
        [referencia, eventoId, calendarioId],
      );
    },

    async borrar(referencia) {
      await bd.runAsync('DELETE FROM eventos_calendario WHERE referencia = ?', [referencia]);
    },
  };

  // Elementos del registro futuro, por mes 'AAAA-MM'.
  const elementosFuturo = {
    async deMes(mes) {
      // Sin transacción: varios meses se cargan a la vez y expo-sqlite no admite transacciones
      // simultáneas en la misma conexión. Cada INSERT solo actúa si el mes no se ha preparado aún,
      // y el índice único (mes, orden) evita duplicados si dos cargas se cruzan.
      const creado = new Date().toISOString();
      for (const [orden, texto] of ELEMENTOS_POR_DEFECTO.entries()) {
        await bd.runAsync(
          `INSERT OR IGNORE INTO elementos_futuro (mes, texto, orden, creado)
           SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM meses_futuro WHERE mes = ?)`,
          [mes, texto, orden, creado, mes],
        );
      }
      await bd.runAsync('INSERT OR IGNORE INTO meses_futuro (mes) VALUES (?)', [mes]);
      const filas = await bd.getAllAsync(
        'SELECT id, mes, texto FROM elementos_futuro WHERE mes = ? ORDER BY orden, id',
        [mes],
      );
      return filas.map((fila) => ({ id: fila.id, mes: fila.mes, texto: fila.texto }));
    },

    async anadir(mes, texto) {
      const fila = await bd.getFirstAsync(
        'SELECT COALESCE(MAX(orden), -1) + 1 AS siguiente FROM elementos_futuro WHERE mes = ?',
        [mes],
      );
      await bd.runAsync(
        'INSERT INTO elementos_futuro (mes, texto, orden, creado) VALUES (?, ?, ?, ?)',
        [mes, texto.trim(), fila.siguiente, new Date().toISOString()],
      );
    },

    async eliminar(id) {
      await bd.runAsync('DELETE FROM elementos_futuro WHERE id = ?', [id]);
    },
  };

  return { habitos, registros, objetivos, ajustes, eventosCalendario, elementosFuturo };
}
