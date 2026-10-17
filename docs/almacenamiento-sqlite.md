# Almacenamiento con SQLite

Cómo guarda IzmaBullet sus datos en el dispositivo: esquema, migraciones, repositorios y pruebas. Todo es local; no hay servidor.

## 1. Archivos implicados

| Archivo | Responsabilidad |
|---|---|
| `src/almacenamiento/bd.js` | Abre la base `izmabullet.db` con `expo-sqlite`, activa las claves foráneas y aplica las migraciones. Solo lo importa la app. |
| `src/almacenamiento/esquema.js` | Define las tablas (`MIGRACIONES`) y `aplicarMigraciones`. |
| `src/almacenamiento/repositorios.js` | Todas las consultas. Recibe un adaptador `bd` con la forma de expo-sqlite. |
| `src/contexto/ProveedorApp.js` | Llama a `abrirRepositorios()` una sola vez al arrancar y reparte `repos` a las pantallas. |
| `__tests__/ayudas/bdPrueba.js` | Adaptador de pruebas: SQLite real con `sql.js`, con la misma forma async. |
| `__tests__/almacenamiento.test.js` | Pruebas de migraciones y de repositorios. |

Regla del proyecto: las pantallas no escriben SQL. Todo pasa por `repositorios.js`.

## 2. Apertura de la base de datos

`src/almacenamiento/bd.js`:

1. `SQLite.openDatabaseAsync('izmabullet.db')`.
2. `PRAGMA foreign_keys = ON;`. SQLite no activa las claves foráneas por defecto y esta pragma es por conexión, así que va antes que cualquier otra cosa.
3. `aplicarMigraciones(bd)`.
4. `crearRepositorios(bd)`. El resultado se guarda en una variable de módulo: las llamadas siguientes devuelven la misma instancia.

## 3. Esquema

Versión actual: **1** (`MIGRACIONES.length === 1`).

```
objetivos              habitos                       registros
-----------            -------------------------     ---------------------
id (PK, autoinc)       id (PK, autoinc)              habito_id → habitos.id (CASCADE)
nombre                 nombre                        fecha            'AAAA-MM-DD'
descripcion            tipo  diaria|dias|veces       PK (habito_id, fecha)
modo  manual|habitos   dias  '1,3,5' (texto)
progreso_manual        veces (1–7)                   ajustes
fecha_limite           recordatorio_hora 'HH:MM'     ---------------------
estado en_curso|…      color                         clave (PK)
color                  estado activo|pausado|archivado valor
creado                 objetivo_id → objetivos.id (SET NULL)
actualizado            sincroniza_calendario 0|1     eventos_calendario
                       notificaciones  '[…]' (JSON)  ---------------------
                       creado, actualizado           referencia (PK)  'habito:<id>' | 'objetivo:<id>'
                                                     evento_id
                                                     calendario_id
```

Convenciones de los datos:

- **Fechas:** texto `AAAA-MM-DD` en hora local, sin hora. Las fechas `creado` y `actualizado` de las tablas son ISO completas (`new Date().toISOString()`).
- **Días de la semana:** texto con números separados por comas (`'1,3,5'`), 0 = domingo. Se guarda ordenado.
- **Booleanos:** `INTEGER` 0 / 1 (`sincroniza_calendario`).
- **Listas:** `notificaciones` guarda un array JSON con los ids de los recordatorios programados.
- **Ajustes:** todo se guarda como texto. Para "sin valor" se usa `''`, no `null`: `guardar(clave, null)` escribiría la cadena `'null'`. `ProveedorApp` ya lo hace así.

Restricciones que protegen los datos (todas en el propio esquema):

- `CHECK` en `tipo`, `modo` y `estado` (de hábitos y de objetivos): no se puede guardar un valor fuera de la lista.
- `registros (habito_id, fecha)` es clave primaria: un mismo día no se puede marcar dos veces. Por eso `marcar` usa `INSERT OR IGNORE`.
- `objetivo_id` con `ON DELETE SET NULL`: si se borrara un objetivo, sus hábitos quedan sin objetivo y no se pierden.
- `registros.habito_id` con `ON DELETE CASCADE`: si se borrara un hábito, se borra su histórico. En la app no hay borrado (se archiva), así que esta regla solo protege la integridad.

`eventos_calendario` es la lista de eventos que creó la app. Solo se modifican o borran los eventos que aparecen ahí (ver `CLAUDE.md`).

## 4. Migraciones

`PRAGMA user_version` guarda la versión aplicada. `aplicarMigraciones`:

1. Lee `user_version`.
2. Si ya está al día, no hace nada.
3. Si no, ejecuta las migraciones pendientes dentro de `withTransactionAsync` y fija `user_version` al final. Si una migración falla, la transacción se revierte y la versión no cambia.

**Para cambiar el esquema:**
- No editar una migración ya publicada. Añadir una entrada nueva al final de `MIGRACIONES`.
- La migración puede tener varias sentencias separadas por `;`. `execAsync` las ejecuta en orden.
- Añadir una prueba en `__tests__/almacenamiento.test.js` que compruebe la nueva columna o tabla.
- Si la migración cambia datos existentes, hacerla idempotente o dejar constancia en `CLAUDE.md`.

Las pruebas `migraciones › ejecutarlas dos veces no falla ni duplica nada` garantizan que no se vuelve a aplicar una migración ya hecha.

## 5. Repositorios

`crearRepositorios(bd)` devuelve cinco grupos. Todos son `async`:

| Grupo | Métodos | Notas |
|---|---|---|
| `habitos` | `listar({ incluirArchivados })`, `obtener(id)`, `crear(datos)`, `actualizar(id, cambios)` | `listar` oculta los archivados por defecto. `actualizar` solo toca los campos que recibe. |
| `registros` | `deHabito(habitoId)`, `habitosMarcadosEl(fecha)`, `marcar(habitoId, fecha)`, `desmarcar(habitoId, fecha)` | `deHabito` devuelve un `Set` de fechas. |
| `objetivos` | `listar()`, `obtener(id)`, `crear(datos)`, `actualizar(id, cambios)` | |
| `ajustes` | `obtener(clave, valorPorDefecto)`, `guardar(clave, valor)` | Usa `ON CONFLICT ... DO UPDATE` (upsert). |
| `eventosCalendario` | `obtener(referencia)`, `guardar(referencia, eventoId, calendarioId)`, `borrar(referencia)` | `referencia` es `'habito:<id>'` u `'objetivo:<id>'`. |

Detalles de implementación:

- **Conversión de columnas:** `aHabito` y `aObjetivo` convierten las filas a objetos JS (`dias` → array de números, `sincroniza_calendario` → booleano, `notificaciones` → array). Las pantallas trabajan siempre con objetos, nunca con filas.
- **Actualizaciones parciales:** `sentenciaActualizar` construye el `UPDATE` solo con los campos recibidos, y solo acepta campos de la lista blanca (`COLUMNAS_HABITO`, `COLUMNAS_OBJETIVO`). Un campo que no esté en la lista se ignora.
- **Id tras insertar:** `ultimoId()` ejecuta `SELECT last_insert_rowid()`. Funciona igual en expo-sqlite y en sql.js.
- **Sin SQL en las pantallas:** si una pantalla necesita un dato nuevo, se añade un método a `repositorios.js`.

Ejemplo de uso desde una acción (`src/servicios/acciones.js`):

```js
const id = await repos.habitos.crear({ ...cambios, creado: hoy });
await repos.registros.marcar(id, '2026-10-14');
const marcas = await repos.registros.deHabito(id); // Set { '2026-10-14' }
```

## 6. Pruebas

Las pruebas usan **SQLite real** a través de `sql.js` (SQLite compilado a WebAssembly, que corre en Node). No hace falta emulador.

`__tests__/ayudas/bdPrueba.js` implementa el mismo contrato que expo-sqlite:

- `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`, `withTransactionAsync`.
- Cada prueba crea su propia base en memoria (`beforeEach`) y la cierra al terminar (`afterEach`).

Comando:
```bash
npm test
```

Cobertura actual de la capa de almacenamiento:
- Migraciones: crean las tablas y fijan la versión; aplicarlas dos veces no duplica nada.
- Repositorios: crear y leer hábitos con sus conversiones; actualizaciones parciales; listar sin archivados; marcar idempotente y deshacer; `habitosMarcadosEl`; archivar conserva el histórico; objetivos ligados a hábitos; ajustes con valor por defecto y sobrescritura; eventos de calendario (guardar, actualizar, borrar).

Limitación: `sql.js` no es expo-sqlite. Las pruebas validan el SQL y la lógica de los repositorios, pero no el comportamiento nativo del dispositivo (por ejemplo, el bloqueo de la base o su ubicación). Eso se comprueba en el emulador.

## 7. Por qué SQLite y no JSON o AsyncStorage

- **Consultas por fecha y por hábito:** rachas, cumplimiento de 7 y 30 días y el histórico de 14 días leen rangos de registros. Con SQL se leen solo las filas necesarias.
- **Integridad:** claves primarias, `CHECK` y claves foráneas impiden datos incoherentes que con JSON habría que validar en código.
- **Migraciones:** el esquema evoluciona con `user_version` sin perder datos.
- **Volumen:** con unos pocos hábitos y un año de histórico son miles de filas. JSON bastaría, pero cada cambio reescribiría todo el archivo y las consultas se harían en JavaScript.

Alternativa si se quisiera simplificar: cambiar `repositorios.js` por un almacén JSON con la misma interfaz. El resto de la app no cambiaría, pero habría que reescribir las pruebas de almacenamiento. Decisión pendiente y registrada en `CLAUDE.md`.

## 8. Depuración

Consultar la versión del esquema y los datos (con cualquier cliente de SQLite, por ejemplo DB Browser for SQLite, sobre una copia de la base):

```sql
SELECT * FROM pragma_user_version;   -- debe devolver 1
SELECT clave, valor FROM ajustes;
SELECT habito_id, fecha FROM registros ORDER BY fecha DESC LIMIT 10;
```

Para obtener una copia de la base del emulador (solo funciona con builds de depuración, como el build de desarrollo, cuyo paquete es `com.izmabullet.app`):

```bash
adb exec-out run-as com.izmabullet.app cat databases/izmabullet.db > izmabullet.db
```

Para borrar los datos de prueba del emulador: Ajustes de Android → Aplicaciones → IzmaBullet → Almacenamiento → Borrar datos.
