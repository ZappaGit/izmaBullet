# IzmaBullet — notas para Claude

## Qué es

App móvil (Android primero) para llevar hábitos, objetivos y el calendario del teléfono.

- **Hábitos:** crear, editar, pausar y archivar. Frecuencia diaria, días concretos o N veces por semana. Hora de recordatorio opcional y color. Marcar y deshacer días; rachas y cumplimiento a 7 y 30 días.
- **Objetivos:** agrupan hábitos o tienen progreso manual; fecha límite opcional; estado en curso, completado o abandonado.
- **Calendario del dispositivo (expo-calendar):** eventos repetidos para hábitos con hora y eventos de día completo para fechas límite. Solo se tocan eventos cuyo id guarda la app.
- **Recordatorios locales (expo-notifications).**
- Todo funciona sin conexión. No hay backend ni cuentas.

Textos en español, tono directo. Código con nombres en español cuando es natural.

## Stack y decisiones

| Decisión | Elección | Por qué |
|---|---|---|
| Plataforma | Expo SDK 54 (`expo ~54.0.36`, RN 0.81.5, React 19.1.0), plantilla `blank` | Versión que pidió el encargo. La plantilla trae 54.0.36 (último parche de SDK 54), compatible. |
| Lenguaje | JavaScript | Lo pidió el encargo y la plantilla es JS. Sin TypeScript para no ampliar el alcance. |
| Navegación | **expo-router**, rutas en `src/app/` | `AGENTS.md` del proyecto lo exige. Las pantallas viven en `src/pantallas/` y las rutas solo reexportan. |
| Almacenamiento | **expo-sqlite** (SQLite) con migraciones por `PRAGMA user_version` | Hay relaciones (hábito → registros, hábito → objetivo) y muchos días de histórico que consultar. SQL lo resuelve sin cargar todo en memoria. AsyncStorage obligaría a leer y reescribir todo. |
| Calendario | **expo-calendar** | Lee y escribe los calendarios del dispositivo; los de Google aparecen ahí sin OAuth. |
| Recordatorios | **expo-notifications**, locales | Lo pidió el encargo (bloque 4). No requieren servidor ni push remoto. |
| Pruebas | Jest con `jest-expo` + `sql.js` | `sql.js` es SQLite real en Node: las pruebas de la capa de almacenamiento ejecutan SQL de verdad sin dispositivo. |
| Tema | Claro, oscuro o automático (por defecto, el del sistema) | Tokens en `src/tema/colores.js`; el usuario puede fijar el tema en Ajustes. |

Dependencia de desarrollo instalada con `--legacy-peer-deps`: `sql.js`. Sin esa opción, `npm` falla con ERESOLVE por un peer de `react-dom@19.3.0` que llega transitivamente. No afecta al bundle de la app.

## Estructura

```
src/
  app/                  rutas de expo-router (solo reexportan pantallas; _layout.js define navegación)
    (tabs)/             Hoy, Hábitos, Objetivos, Ajustes
    habito/[id].js, habito/editar.js
    objetivo/[id].js, objetivo/editar.js
  pantallas/            pantallas reales
  componentes/ui.js     componentes compartidos (Boton, Tarjeta, Chip, Campo, Vacio, BotonMarcar…)
  contexto/ProveedorApp.js   base de datos, ajustes, tema y `recargar()`
  dominio/              funciones PURAS: fechas, habitos (frecuencias, rachas, cumplimiento), objetivos, validacion
  almacenamiento/       esquema.js (migraciones), repositorios.js (acceso a datos), bd.js (abre expo-sqlite)
  calendario/           calendario.js (expo-calendar), sincronizacion.js (eventos ↔ datos)
  notificaciones/       recordatorios.js
  servicios/acciones.js guardar/cambiar datos manteniendo recordatorios y calendario al día
  tema/                 colores.js (tokens claro/oscuro), escalas.js (espaciado, tipografía, radios)
__tests__/              pruebas Jest (*.test.js). ayudas/bdPrueba.js = adaptador sql.js
```

## Comandos

```bash
npx expo start            # servidor de desarrollo (Expo Go o build de desarrollo)
npm test                  # pruebas unitarias y de almacenamiento (Jest)
npx expo-doctor           # diagnóstico de dependencias y configuración
npx expo export --platform android --output-dir <dir>   # comprobar que el bundle compila
```

Ver `README.md` para generar el APK.

## Convenciones

- Toda operación de datos pasa por `src/almacenamiento/repositorios.js`. Las pantallas no escriben SQL.
- Las escrituras que afectan a recordatorios o calendario van por `src/servicios/acciones.js`.
- La lógica de rachas, cumplimiento, frecuencias y progreso es pura y vive en `src/dominio/`, con pruebas.
- Colores solo desde `useApp().tema` o `coloresHabito`. Medidas solo desde `src/tema/escalas.js`.
- Áreas táctiles de al menos 44 px (`areaTactil`). Los componentes respetan movimiento reducido (`BotonMarcar`).
- Los permisos (calendario, notificaciones) se explican en un `Alert` antes del diálogo del sistema. Si se rechazan, la app sigue funcionando.
- Nunca se modifican ni borran eventos de calendario cuyo id no esté en `eventos_calendario`.
- Las fechas son claves `AAAA-MM-DD` en hora local (`src/dominio/fechas.js`).

## Reglas de dominio

- **Frecuencia:** `diaria` (todos los días), `dias` (días de la semana concretos, 0 = domingo), `veces` (N por semana ISO, lunes a domingo).
- **Hoy:** un hábito `veces` aparece mientras no llegue a su cupo semanal, o si se marcó hoy (para poder deshacerlo).
- **Racha actual:** días o semanas cumplidos seguidos. Hoy (o la semana actual) sin cumplir no rompe la racha.
- **Cumplimiento (7/30 días):** `diaria`/`dias`: programados marcados / programados (hoy sin marcar no cuenta). `veces`: suma de min(marcas, cupo) / cupo total de las semanas de la ventana.
- **Progreso de objetivo:** modo `manual` = valor fijado (0–100). Modo `habitos` = media del cumplimiento de 30 días de sus hábitos.
- **Calendario de hábitos:** solo si tiene hora, no es `veces` y está activo. Evento de 30 minutos con repetición diaria o semanal. Pausar o archivar quita el evento.
- **Calendario de objetivos:** evento de día completo en la fecha límite, solo mientras está en curso.
- **Recordatorios:** diaria y `veces` → un aviso diario a la hora; `dias` → un aviso semanal por cada día. Pausar o archivar los cancela.
- **Archivar** conserva el histórico. No hay borrado de hábitos.

## Estado actual

### Hecho
- Proyecto Expo SDK 54 con expo-router, expo-sqlite, expo-calendar, expo-notifications.
- Dominio completo: fechas, frecuencias, rachas, cumplimiento, progreso de objetivos, validación.
- Almacenamiento con migraciones y repositorios.
- Calendario (crear, actualizar, borrar solo lo propio; leer eventos del día).
- Recordatorios locales.
- Pantallas: Hoy, Hábitos (lista y detalle con histórico de 14 días), Objetivos (lista y detalle), formularios de hábito y objetivo, Ajustes (calendario por defecto, permisos, tema).
- Tema claro/oscuro/automático con los tokens de Familizma.

### Verificado
- `npm test`: **48 pruebas en verde** (fechas, frecuencias, rachas, cumplimiento, progreso de objetivos, validación, migraciones y repositorios sobre SQLite real).
- `npx expo export --platform android`: el bundle compila sin errores.
- `npx expo-doctor`: 18/18 checks.

### No verificado
- **No se ha ejecutado en un emulador ni en un móvil.** En este equipo no hay `adb` ni emulador. Falta probar en Expo Go o un build de desarrollo: permisos, creación de eventos en un calendario de Google, recordatorios a la hora indicada y el tema del sistema.
- Recurrencia de calendario: el mapeo de días (1 = domingo) sigue la documentación de expo-calendar, pero no se ha comprobado en Android.
- No hay ESLint configurado (`npx expo lint` no está preparado).
- No hay build EAS ni APK generado.

### Pendiente o limitaciones conocidas
- Un recordatorio se programa aunque el hábito ya esté marcado ese día. Se podría cancelar al marcar.
- Los hábitos `veces` tienen recordatorio diario a la hora indicada, no uno por cada día que falte para el cupo.
- Si un evento de calendario se borra a mano, la app lo recrea al guardar el hábito. No lo detecta sola.
- La sección "Calendario de hoy" de Hoy muestra los eventos de todos los calendarios si no hay uno por defecto.

## Git

- El repositorio lo inicializó `create-expo-app`, con un commit "Initial commit" de la plantilla. No se ha hecho ningún commit ni push desde aquí.
- `.gitignore` excluye `node_modules`, `.expo`, builds (`*.apk`, `*.aab`), `.env*` y las carpetas nativas generadas.
- No hay secretos ni `.env`, así que no hay `.env.example`.

## ECC

- `/ecc:project-init` se ejecutó en modo dry-run. El perfil `developer` del instalador de ECC se resolvió sobre los stacks detectados (`javascript`, `react`). El plan **escribe en el directorio global `~/.claude`** (767 operaciones: reglas, agentes, comandos, skills, hooks y `settings.json`), no en este proyecto. No se ha aplicado. Pendiente de decisión.
