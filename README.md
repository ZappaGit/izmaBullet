# IzmaBullet

App móvil para registrar hábitos, definir objetivos y ver tus eventos del calendario del teléfono. Funciona sin conexión: los datos se guardan en el propio dispositivo.

## Requisitos

- Node.js 20 o superior y npm.
- Expo Go en el móvil, o un emulador Android (Android Studio).

## Arrancar en desarrollo

```bash
npm install
npx expo start
```

Escanea el código QR con Expo Go, o pulsa `a` para abrirlo en el emulador Android.

Nota: los módulos nativos de la app (calendario, base de datos, notificaciones) están incluidos en Expo Go. Para probar siempre la versión final, usa un build de desarrollo (ver más abajo).

## Pruebas

```bash
npm test
```

Ejecuta Jest con `jest-expo`. Cubre la lógica pura (fechas, frecuencias, rachas, cumplimiento, progreso de objetivos y validación) y la capa de almacenamiento sobre SQLite real (`sql.js`).

## Generar el APK

Opción 1, con EAS Build (en la nube, no necesita Android Studio):

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure      # crea eas.json la primera vez
npx eas-cli@latest build -p android --profile preview
```

Revisa que el perfil `preview` de `eas.json` genere un APK: si genera un AAB, añade `"android": { "buildType": "apk" }` a ese perfil.

Opción 2, en local con Gradle:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/`. Hay que firmarlo antes de instalarlo en un móvil que no sea de desarrollo.

## Estructura

Consulta `CLAUDE.md` para ver la arquitectura, las reglas de dominio y el estado actual del proyecto.

## Datos y privacidad

- No hay backend, cuentas ni envío de datos.
- Los hábitos, registros y objetivos se guardan en una base SQLite local (`izmabullet.db`).
- La app solo modifica eventos del calendario que ella misma ha creado.
