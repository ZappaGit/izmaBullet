# Desarrollo con Expo desde WSL y emulador Android

Notas de puesta en marcha que hemos seguido para probar IzmaBullet desde WSL (Ubuntu) en Windows, con un móvil real o con el emulador de Android Studio. Sirve como referencia para repetir el proceso o diagnosticar fallos.

## 1. Estado del proyecto

- Expo SDK 57 (`expo ^57.0.28`, React 19.2.3, React Native 0.86.3).
- Pruebas: `npm test` (51 pruebas en verde).
- Comprobaciones: `npx expo-doctor` (21/21) y `npx expo export --platform android` compilan.
- Expo Go **no sirve** para este proyecto: `expo-notifications` no incluye push remoto en Expo Go desde SDK 53. Hace falta un development build (ver sección 5).
- Calendario: se usa `expo-calendar/legacy`. La API nueva de `expo-calendar` no cubre las operaciones que usa la app y, en desarrollo, lanza error al llamarlas desde `expo-calendar`.
- Fechas de objetivos: el formulario usa `dd/mm/aaaa`. Internamente se guarda como `AAAA-MM-DD` (conversión en `src/dominio/fechas.js`).

## 2. Conectar un móvil real por Wi-Fi

Problema: WSL usa red NAT. El QR del servidor apunta a una IP interna de WSL (`172.x.x.x`) que el móvil no puede alcanzar.

Soluciones probadas:

- **Túnel (`--tunnel`)**: falló con `CommandError: TypeError: Cannot read properties of undefined (reading 'body')`, y después se cortaba con "Tunnel connection has been closed". Es un fallo intermitente de ngrok, no del proyecto. No recomendado.
- **Modo espejo de WSL (recomendado)**:
  1. Crear `C:\Users\<usuario>\.wslconfig` con:
     ```ini
     [wsl2]
     networkingMode=mirrored
     ```
  2. En PowerShell: `wsl --shutdown` y volver a abrir Ubuntu.
  3. Permitir el puerto 8081 en el firewall de Windows (red privada):
     ```powershell
     New-NetFirewallRule -DisplayName "Expo Metro 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private
     ```
  4. Arrancar en modo LAN: `npx expo start --lan -c`. El QR usa la IP de Windows en la Wi-Fi.

Con el modo espejo, la conexión funciona, pero en el móvil real el bundle se quedó al 99 %. El servidor respondía bien (bundle de 7 MB descargado en 0,07 s en local), así que el problema estaba en el móvil y en la app al arrancar, no en la red. Por eso pasamos al emulador y al development build.

## 3. Versión de Expo Go y SDK

- Expo Go del móvil: SDK 57 (client 57.0.9). Coincide con el proyecto, pero Expo Go no sirve para este proyecto (ver sección 1).
- Si aparece "incompatible con esta versión de Expo Go", comprueba el SDK que anuncia el servidor:
  ```bash
  curl -s -H "Expo-Platform: android" -H "Accept: application/expo+json" http://localhost:8081/ | head -c 200
  ```
  Debe mostrar `runtimeVersion: exposdk:57.0.0`.
- Si el servidor sigue anunciando un SDK antiguo, para el proceso y arranca de nuevo con `npx expo start -c`. Un servidor arrancado antes de actualizar `node_modules` sigue sirviendo el estado anterior.

## 4. Emulador Android en Windows

Instalación existente: Android SDK en `C:\Users\<usuario>\AppData\Local\Android\Sdk`, con AVD `Medium_Phone_API_36.1` (imagen `google_apis_playstore`).

Arrancar desde Android Studio (Device Manager → ▶) o desde PowerShell:
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_36.1
```

Comprobar la conexión:
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell getprop sys.boot_completed
```
Debe mostrar `emulator-5554 device` y `1`.

Desde WSL, el mismo `adb.exe` está en `/mnt/c/Users/<usuario>/AppData/Local/Android/Sdk/platform-tools/adb.exe`.

Otros comandos útiles:
```powershell
# Reenviar el puerto 8081 al emulador (hay que repetirlo tras reiniciar el emulador)
adb reverse tcp:8081 tcp:8081

# Ver los puertos reenviados
adb reverse --list

# Ver los registros de JavaScript y de Expo en directo
adb logcat -s ReactNativeJS ExpoGo

# Volcar los últimos registros
adb logcat -d -t 400 | findstr /i "ReactNativeJS ExpoGo FATAL AndroidRuntime"

# Listar los calendarios que ve Android (con cuenta Google sincronizada deben aparecer)
adb shell content query --uri content://com.android.calendar/calendars

# Reiniciar el servidor de adb si no detecta el emulador
adb kill-server
```

Conectar la app al servidor dentro del emulador:
- Con **Expo Go** (solo si no usa módulos nativos ajenos a Expo Go): Play Store → instalar Expo Go → "Enter URL manually" → `exp://127.0.0.1:8081`.
- Con el **development build** (recomendado para este proyecto): abre "IzmaBullet" en el emulador. En la pantalla de desarrollo, pulsa "Fetch development servers" o escribe `http://127.0.0.1:8081`.
- El emulador llega al 8081 del PC mediante `adb reverse`. El servidor debe arrancar con `npx expo start --localhost` o `--lan`.

Escribir en el emulador: el teclado físico de la ventana del emulador a veces no llega. Se puede enviar texto con `adb shell input text "texto"` (el campo debe estar seleccionado). Las contraseñas las escribe siempre el usuario.

**Calendarios en el emulador:** Android solo ofrece calendarios si hay una cuenta de Google añadida con la sincronización de Calendario activada. Hay que añadir la cuenta en Ajustes → Cuentas → Google, no basta con tener Google Calendar instalado.

## 5. Development build (en lugar de Expo Go)

Motivo: Expo Go no incluye `expo-notifications` remoto desde SDK 53. Se usa un development build generado con EAS.

Archivos y cambios implicados:
- `eas.json` con perfiles `development` (APK, `developmentClient: true`), `preview` y `production`.
- `expo-dev-client` instalado en la versión de SDK 57. `expo install` falló por timeouts de red; se usó la versión de `node_modules/expo/bundledNativeModules.json`. EAS CLI también lo instaló al lanzar el build.
- Proyecto EAS enlazado a la cuenta `dieizqu`: `npx eas-cli@latest init --non-interactive --force`. Añadió `projectId` y `owner` a `app.json`.
- Keystore de Android generado en EAS (se guarda en la nube; no hace falta repetirlo).

Pasos:
```bash
npx eas-cli@latest login                     # una vez, en la terminal
npx eas-cli@latest build --platform android --profile development
```
Cuando termine, EAS da un enlace para descargar el APK. Instálalo en el emulador (arrastrándolo a la ventana o con `adb install ruta\al\archivo.apk`).

Estado: el último build llegó a la fase `Run gradlew` (compilación nativa). Pendiente de confirmar que termina y de descargar el APK desde la página del build en expo.dev.

Lo que ya funciona en el emulador con el build de desarrollo: la app arranca y muestra las pantallas. Quedan por confirmar los permisos de calendario y la creación de eventos.

## 6. Errores vistos y su causa

| Mensaje | Causa | Solución |
|---|---|---|
| `Cannot read properties of undefined (reading 'body')` (tunnel) | Fallo de ngrok | Usar modo espejo con `--lan` |
| Se queda al 99 % en el móvil | Problema del lado del móvil o de la app al arrancar | Usar development build; borrar datos de Expo Go |
| `expo-notifications: Android Push notifications ... removed from Expo Go with the release of SDK 53` | Expo Go no incluye notificaciones remotas | Development build con EAS |
| `Method getCalendarPermissionsAsync imported from "expo-calendar" is deprecated` | La API nueva de expo-calendar no cubre estas funciones y lanza error en desarrollo | Importar `expo-calendar/legacy` (ya aplicado en `src/calendario/calendario.js`) |
| `No hay calendarios donde escribir` en Ajustes | La cuenta de Google no está añadida al emulador | Añadir la cuenta en Ajustes → Cuentas, con Calendario sincronizado |
| `Failed to connect to /127.0.0.1:8081` | El reenvío de puertos se pierde al reiniciar el emulador, o el servidor no está en marcha | `adb reverse tcp:8081 tcp:8081` y comprobar que `npx expo start` sigue activo |
| `Port 8081 is being used by another process` | Otro servidor de Metro abierto | Usar el que ya está en marcha o cerrar el otro |
| `request to https://api.expo.dev/graphql failed` / `read ECONNRESET` | Fallo de red al hablar con EAS | Reintentar el build; si se repite, cambiar de red |
| `Unable to resolve module @expo/vector-icons` | Dependencia que `npm install` eliminó al actualizar | `npm install @expo/vector-icons@^15.1.1 --legacy-peer-deps` |
| `@react-native/jest-preset` / jest-expo error | jest-expo 57 necesita el preset aparte | `npm install @react-native/jest-preset@0.86.3 --legacy-peer-deps` |
| ERESOLVE al instalar | Peer transitivo de `react-dom@19.3.0` (y de `react-native-worklets` en SDK 57) | Usar `--legacy-peer-deps`; los avisos de worklets no impiden el build |
| `app.json` incompatible con SDK 57 | Campos eliminados en SDK 57 (`newArchEnabled`, `splash`, `edgeToEdgeEnabled`) | Usar el plugin `expo-splash-screen` |

## 7. Limpieza de caché

Cuando algo no se actualiza:
```bash
rm -rf .expo node_modules/.cache
npx expo start --lan -c
```
En el móvil o emulador: Ajustes → Aplicaciones → la app (Expo Go o IzmaBullet) → Almacenamiento → Borrar datos.

Si el emulador sigue mostrando código antiguo, recarga la app: `r` en la terminal de Expo, o `Ctrl+M` en el emulador → Reload.
