# IzmaBullet — notas para Claude

## Qué es

App móvil (Android primero) para llevar hábitos, objetivos y el calendario del teléfono.

- **Hábitos:** crear, editar, pausar y archivar. Frecuencia diaria, días concretos o N veces por semana. Hora de recordatorio opcional y color. Marcar y deshacer días; rachas y cumplimiento a 7 y 30 días.
- **Objetivos:** agrupan hábitos o tienen progreso manual; fecha límite opcional (`dd/mm/aaaa` en el formulario); estado en curso, completado o abandonado.
- **Calendario del dispositivo (expo-calendar):** eventos repetidos para hábitos con hora y eventos de día completo para fechas límite. Solo se tocan eventos cuyo id guarda la app.
- **Recordatorios locales (expo-notifications).**
- Todas las funciones de la app funcionan sin conexión y sin cuenta, de momento. Los datos del backend (Supabase: cuentas, autorización de dispositivos, pantallas remotas) todavía no se usan en la app; el esquema existe pero no está conectado al cliente.

Textos en español, tono directo. Código con nombres en español cuando es natural.

## Stack y decisiones

| Decisión | Elección | Por qué |
|---|---|---|
| Plataforma | Expo SDK 57 (`expo ^57.0.28`, RN 0.86.3, React 19.2.3), plantilla `blank` | Se actualizó desde SDK 54 porque Expo Go del móvil y del emulador es SDK 57. Las versiones de los módulos `expo-*` se tomaron de `node_modules/expo/bundledNativeModules.json`. |
| Lenguaje | JavaScript | Lo pidió el encargo y la plantilla es JS. Sin TypeScript para no ampliar el alcance. |
| Navegación | **expo-router**, rutas en `src/app/` | `AGENTS.md` del proyecto lo exige. Las pantallas viven en `src/pantallas/` y las rutas solo reexportan. |
| Almacenamiento | **expo-sqlite** (SQLite) con migraciones por `PRAGMA user_version` | Hay relaciones (hábito → registros, hábito → objetivo) y muchos días de histórico que consultar. La clave única (hábito + fecha) evita duplicados. Está implementado y probado. Si se cambiara a JSON, el impacto queda en `repositorios.js`, `esquema.js` y sus pruebas. |
| Calendario | **expo-calendar/legacy** | La API nueva (orientada a objetos) no cubre estas operaciones y, en desarrollo, lanza error si se importa desde `expo-calendar`. Los calendarios de Google aparecen ahí sin OAuth. |
| Backend opcional | **Supabase** (Postgres + Auth + RLS), proyecto `nilbnlariqgvzqhdwsxg`. Esquema en `supabase/migrations/`, aplicado el 15/10/2026 | Cuentas, límite y autorización de dispositivos, pantallas remotas. Solo funciones de escritura; el cliente nunca escribe tablas. Las pruebas pgTAP de `supabase/tests/` no están ejecutadas aún en remoto |
| Recordatorios | **expo-notifications**, locales | Lo pidió el encargo (bloque 4). No requieren servidor ni push remoto. Necesita development build: Expo Go no lo soporta. |
| Build de desarrollo | **expo-dev-client** + EAS Build (perfil `development`, APK) | Expo Go no sirve para este proyecto (notificaciones). `eas.json` define los perfiles. |
| Pruebas | Jest con `jest-expo` + `sql.js` | `sql.js` es SQLite real en Node: las pruebas de la capa de almacenamiento ejecutan SQL de verdad sin dispositivo. |
| Tema | Claro, oscuro o automático (por defecto, el del sistema) | Tokens en `src/tema/colores.js`; el usuario puede fijar el tema en Ajustes. |

Dependencias instaladas con `--legacy-peer-deps`: en general, por un peer transitivo de `react-dom@19.3.0` que `npm` no resuelve. Los avisos de `react-native-worklets` no impiden el build.

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
  calendario/           calendario.js (expo-calendar/legacy), sincronizacion.js (eventos ↔ datos)
  notificaciones/       recordatorios.js
  servicios/acciones.js guardar/cambiar datos manteniendo recordatorios y calendario al día
  tema/                 colores.js (tokens claro/oscuro), escalas.js (espaciado, tipografía, radios)
__tests__/              pruebas Jest (*.test.js). ayudas/bdPrueba.js = adaptador sql.js
docs/                   desarrollo-windows-wsl.md (WSL, emulador, EAS, errores conocidos)
```

## Comandos

```bash
npx expo start --localhost   # servidor para el emulador (con adb reverse)
npx expo start --lan -c      # servidor para un móvil en la misma Wi-Fi (con WSL en modo espejo)
npm test                     # pruebas unitarias y de almacenamiento (Jest)
npx expo-doctor              # diagnóstico de dependencias y configuración
npx expo export --platform android --output-dir <dir>   # comprobar que el bundle compila
npx eas-cli@latest build --platform android --profile development   # build de desarrollo (APK)
```

Ver `README.md` para generar el APK y `docs/desarrollo-windows-wsl.md` para el entorno.

## Convenciones

- Toda operación de datos pasa por `src/almacenamiento/repositorios.js`. Las pantallas no escriben SQL.
- Las escrituras que afectan a recordatorios o calendario van por `src/servicios/acciones.js`.
- La lógica de rachas, cumplimiento, frecuencias y progreso es pura y vive en `src/dominio/`, con pruebas.
- Colores solo desde `useApp().tema` o `coloresHabito`. Medidas solo desde `src/tema/escalas.js`.
- Áreas táctiles de al menos 44 px (`areaTactil`). Los componentes respetan movimiento reducido (`BotonMarcar`).
- Los permisos (calendario, notificaciones) se explican en un `Alert` antes del diálogo del sistema. Si se rechazan, la app sigue funcionando.
- Nunca se modifican ni borran eventos de calendario cuyo id no esté en `eventos_calendario`.
- Fechas: internamente son claves `AAAA-MM-DD` en hora local (`src/dominio/fechas.js`). El formulario de objetivos usa `dd/mm/aaaa`; la conversión está en `convertirFechaLocal` y `formatearFechaLocal`.

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
- Proyecto Expo SDK 57 con expo-router, expo-sqlite, expo-calendar (legacy), expo-notifications, expo-dev-client y expo-splash-screen.
- Dominio completo: fechas, frecuencias, rachas, cumplimiento, progreso de objetivos, validación.
- Fecha de objetivos en formato `dd/mm/aaaa` (formulario y validación); internamente `AAAA-MM-DD`.
- Almacenamiento con migraciones y repositorios.
- Calendario (crear, actualizar, borrar solo lo propio; leer eventos del día).
- Recordatorios locales.
- Pantallas: Hoy, Hábitos (lista y detalle con histórico de 14 días), Objetivos (lista y detalle), formularios de hábito y objetivo, Ajustes (calendario por defecto, permisos, tema).
- Tema claro/oscuro/automático con los tokens de Familizma.
- Configuración para WSL: modo espejo, emulador Android (`Medium_Phone_API_36.1`) y `adb`. Ver `docs/desarrollo-windows-wsl.md`.
- Expo Go se descartó para este proyecto. El build de desarrollo está en compilación en EAS (proyecto `dieizqu/izmabullet`).

### Verificado
- `npm test`: **51 pruebas en verde** (fechas, conversión de fechas, frecuencias, rachas, cumplimiento, progreso de objetivos, validación, migraciones y repositorios sobre SQLite real).
- `npx expo export --platform android`: el bundle compila sin errores.
- `npx expo-doctor`: 21/21 checks.
- En el emulador: la app arranca con el build de desarrollo y muestra las pantallas Hoy y Ajustes. Permiso de calendario concedido.
- El calendario de Google de la cuenta `dgizquierdo@gmail.com` está sincronizado en el emulador y Android lo ve (`content://com.android.calendar/calendars`).

### No verificado
- Creación de eventos en el calendario de Google desde la app, y recurrencia de días (mapeo 1 = domingo según la documentación de expo-calendar).
- Recordatorios a la hora indicada.
- Tema del sistema en el dispositivo.
- Flujo completo de objetivos con fecha `dd/mm/aaaa` en el emulador (validación y guardado).
- No hay ESLint configurado (`npx expo lint` no está preparado).
- No hay APK descargado del build de EAS todavía.

### Pendiente o limitaciones conocidas
- Confirmar que el build de EAS termina y descargar el APK.
- Un recordatorio se programa aunque el hábito ya esté marcado ese día. Se podría cancelar al marcar.
- Los hábitos `veces` tienen recordatorio diario a la hora indicada, no uno por cada día que falte para el cupo.
- Si un evento de calendario se borra a mano, la app lo recrea al guardar el hábito. No lo detecta sola.
- La sección "Calendario de hoy" de Hoy muestra los eventos de todos los calendarios si no hay uno por defecto.
- Decisión abierta: mantener SQLite (recomendado) o cambiar a JSON/AsyncStorage.

## Git

- Rama `main`, remoto `origin` = `https://github.com/ZappaGit/izmaBullet.git` (público).
- Commit inicial `e7fc780` "Primera versión de IzmaBullet", con autor **Diego Izquierdo <dgizquierdo@gmail.com>**. Subido a `origin/main` con force push aprobado por el usuario, para sustituir el commit `22ccd75` de la plantilla que tenía el autor antiguo.
- Los cambios posteriores (SDK 57, calendario legacy, formato de fecha, documentación, `eas.json`, `expo-dev-client`) no están commiteados.
- Identidad del repositorio: `user.name` y `user.email` locales a este repositorio (no globales). Usar siempre `dgizquierdo@gmail.com`.
- `.gitignore` excluye `node_modules`, `.expo`, builds (`*.apk`, `*.aab`), `.env*` y las carpetas nativas generadas.
- No hay secretos ni `.env`, así que no hay `.env.example`.
- Antes de cualquier push, confirmar con el usuario.

## ECC

- Instalado en el directorio global `~/.claude` con el perfil `developer` y **sin hooks** (`--no-hooks`). Reglas, agentes, comandos y skills de ECC están en `~/.claude/rules/ecc`, `~/.claude/agents`, `~/.claude/commands` y `~/.claude/skills`.
- Las dependencias del repositorio de ECC (`sql.js`) se instalaron en `~/.claude/plugins/marketplaces/ecc` para poder ejecutar el instalador.
- Para instalar hooks más tarde: volver a ejecutar el instalador con `--enable-hooks`.
