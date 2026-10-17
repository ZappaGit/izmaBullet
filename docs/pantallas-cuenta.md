# Pantallas de cuenta

Documentación de las pantallas de entrar, crear cuenta, recuperar contraseña y nueva contraseña.
Describe lo que hay en el código. El diseño en Figma todavía no existe (ver [Pendiente](#pendiente)).

## Rutas

| Ruta | Archivo de pantalla | Título | Uso |
|---|---|---|---|
| `/cuenta/entrar` | `src/pantallas/cuenta/Entrar.js` | Entrar | Correo y contraseña |
| `/cuenta/alta` | `src/pantallas/cuenta/Alta.js` | Crear cuenta | Alta con confirmación por correo |
| `/cuenta/recuperar` | `src/pantallas/cuenta/Recuperar.js` | Recuperar contraseña | Pide el enlace para cambiarla |
| `/cuenta/nueva-clave` | `src/pantallas/cuenta/NuevaClave.js` | Nueva contraseña | Se abre desde el enlace del correo |

Las rutas en `src/app/cuenta/` solo reexportan la pantalla. Las cabeceras se definen en `src/app/_layout.js`.

Punto de entrada: Ajustes → sección **Cuenta** (botones Entrar y Crear cuenta). Solo aparece si la app tiene configurado Supabase.

## Estados de cada pantalla

### Entrar
- **Formulario:** campos Correo electrónico y Contraseña. Botón **Entrar** (con texto "Entrando…" mientras envía).
- **Enlaces secundarios:** "He olvidado la contraseña" → Recuperar; "Crear cuenta" → Alta.
- **Éxito:** vuelve a la pantalla anterior.
- **Error:** texto rojo bajo el formulario con el mensaje de `traducirErrorCuenta`.
- **Sin configuración:** pantalla "Cuenta no disponible".

### Crear cuenta
- **Formulario:** Nombre (opcional), Correo, Contraseña (mínimo 12 caracteres), Repite la contraseña. Botón **Crear cuenta** ("Creando cuenta…" mientras envía).
- **Confirmación pendiente:** si Supabase exige confirmar el correo, muestra el aviso "Te hemos enviado un correo para confirmar tu cuenta…" y el botón **Ir a entrar**.
- **Sin confirmación:** vuelve a la pantalla anterior.
- **Enlace:** "Ya tengo cuenta" → Entrar.

### Recuperar contraseña
- **Formulario:** Correo electrónico. Botón **Enviar enlace** ("Enviando…" mientras envía).
- **Enviado:** el mensaje es el mismo exista o no la cuenta: "Si hay una cuenta con ese correo, te hemos enviado un enlace…". Botón **Volver a entrar**.
- **Límite de envíos:** "Espera un momento antes de volver a pedir el correo."

### Nueva contraseña
- **Sin enlace válido:** aviso "Este enlace no es válido o ha caducado. Pide uno nuevo." y botón **Pedir otro enlace**. Se considera válido un enlace con `type=recovery` y los dos tokens en el fragmento de la URL.
- **Formulario:** Contraseña nueva, Repite la contraseña nueva. Botón **Guardar contraseña**.
- **Hecho:** "Contraseña cambiada. Ya puedes seguir usando la app." y botón **Ir a Ajustes**.

## Reglas de validación

Definidas en `src/dominio/cuenta.js`:

| Campo | Regla |
|---|---|
| Correo | Obligatorio y con forma `texto@texto.texto` |
| Contraseña al entrar | Obligatoria. No se exige longitud (la cuenta existente puede tener otra) |
| Contraseña nueva | Obligatoria y de al menos 12 caracteres (`LONGITUD_MINIMA_CLAVE`) |
| Repetición | Debe coincidir con la contraseña |
| Nombre | Opcional, hasta 80 caracteres |

Los errores aparecen bajo cada campo al pulsar el botón, no mientras se escribe.

## Mensajes de error

`traducirErrorCuenta` en `src/cuenta/servicio.js` convierte los errores de Supabase:

| Error de Supabase | Mensaje en pantalla |
|---|---|
| Invalid login credentials | Correo o contraseña incorrectos. |
| Email not confirmed | Confirma tu correo antes de entrar. Revisa tu bandeja de entrada. |
| User already registered | Ya existe una cuenta con ese correo. |
| Password should be… | La contraseña no cumple los requisitos. |
| Red (network / fetch) | Sin conexión. Revisa la red e inténtalo de nuevo. |
| Cualquier otro | No se pudo completar la operación. Inténtalo de nuevo. |

Los detalles técnicos no llegan a la pantalla.

## Configuración necesaria

1. `.env.local` con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Sin ellas, las pantallas muestran "Cuenta no disponible" y el resto de la app funciona igual.
2. En Supabase, **Authentication → URL Configuration → Redirect URLs**, añadir:
   - `izmabullet://cuenta/entrar` (confirmación de alta)
   - `izmabullet://cuenta/nueva-clave` (recuperación)
3. Build nuevo con EAS: `expo-secure-store` es un módulo nativo.

## Limitaciones conocidas

- No hay cerrar sesión todavía.
- Tras confirmar el correo, el usuario entra a mano desde la pantalla Entrar. El enlace de confirmación no inicia sesión dentro de la app.
- No hay pruebas automáticas de las pantallas. La lógica sí tiene pruebas: `__tests__/cuenta.test.js`, `servicioCuenta.test.js`, `almacenSesion.test.js` y `enlaces.test.js`.
- El flujo de recuperación completo (correo real → enlace → nueva contraseña) no se ha probado en un dispositivo.

## Pendiente

- **Figma:** las pantallas no están en el archivo `IzmaBullet — Pantallas` (fileKey `crIuxPD9NLIaMDAPFi4Gqh`). Hay que dibujarlas (Entrar, Crear cuenta, Recuperar, Nueva contraseña y Arranque) en claro y oscuro, con los tokens de la página Tokens. Falta también el frame de arranque: la app solo muestra un indicador de carga mientras abre la base de datos (`ProveedorApp`).
- Actualizar este documento con los enlaces de Figma cuando existan.
