# Guía de Supabase para IzmaBullet

Esta guía te lleva paso a paso desde cero hasta tener el backend de login, dispositivos y pantallas dinámicas funcionando. Sigue los pasos en orden. Cada paso indica cómo comprobar que ha salido bien.

**Qué vas a montar:**

- Un proyecto de Supabase para desarrollo con autenticación por email.
- Las tablas `perfiles`, `dispositivos`, `eventos_seguridad` y `pantallas`, con RLS (Row Level Security) activado.
- Funciones SQL para registrar, autorizar y revocar dispositivos.
- Pruebas de seguridad en pgTAP que comprueban los accesos negativos.

**Archivos del proyecto que usa esta guía:**

| Archivo | Qué hace |
|---|---|
| `supabase/migrations/20261015090000_esquema_inicial.sql` | Esquema, funciones, RLS y permisos. Se aplica con `db push`. |
| `supabase/tests/seguridad_test.sql` | Pruebas de seguridad (pgTAP). |
| `.env.local` | Variables de la app. No se sube a git (`.gitignore` ya lo excluye). |

> **Estado:** la migración y las pruebas están escritas pero **no se han ejecutado todavía**. El entorno donde se escribieron no tenía Docker ni Supabase CLI. La primera vez que las ejecutes, anota el resultado; si algo falla, mira la sección [Problemas comunes](#problemas-comunes).

---

## 0. Requisitos

| Herramienta | Para qué | Cómo comprobarla |
|---|---|---|
| Cuenta en [supabase.com](https://supabase.com) | Proyecto remoto | Iniciar sesión en el panel |
| Node.js 20 o superior | CLI de Supabase | `node -v` |
| Docker Desktop con integración WSL2 | Pruebas locales (`supabase start`, `supabase test db`) | `docker info` desde WSL |

Sin Docker puedes completar los pasos 1–8 (proyecto remoto y migraciones), pero no las pruebas locales.

> **Nunca ejecutes `supabase test db` contra el proyecto de producción.** Las pruebas insertan usuarios ficticios dentro de una transacción que se deshace, pero el riesgo no compensa. Usa siempre el stack local o un proyecto de pruebas separado.

---

## 1. Crear el proyecto de desarrollo

1. En el panel de Supabase, pulsa **New project**.
2. Rellena:
   - **Name:** `izmabullet-dev`
   - **Database password:** genera una contraseña larga y guárdala en tu gestor de contraseñas. Supabase no la vuelve a mostrar.
   - **Region:** una europea (por ejemplo, Frankfurt o Paris).
3. Espera a que el proyecto termine de crearse (1–2 minutos).

**Comprobación:** en **Project Settings → General** ves el **Reference ID** (algo como `abcdefghijklmnop`). Lo necesitarás en el paso 5.

---

## 2. Configurar la autenticación por email

Ve a **Authentication** en el menú lateral.

### 2.1 Proveedor de email

1. **Authentication → Sign In / Providers → Email**.
2. Activa **Enable Email provider**.
3. Activa **Confirm email**. Así el usuario tiene que verificar su email antes de entrar.
4. Guarda.

### 2.2 Contraseñas

1. En **Authentication → Sign In / Providers → Email** (o en la sección **Password** si aparece aparte), fija:
   - **Minimum password length:** `12`
   - Activa las opciones de requisitos de caracteres que ofrezca tu versión (mayúsculas, minúsculas, números y símbolos).
2. Guarda.

> Si el nombre de algún campo ha cambiado en la interfaz, busca la opción equivalente. Lo importante: longitud mínima de 12 y verificación de email activada.

### 2.3 URLs de redirección

Las URLs de redirección permiten que el enlace del email vuelva a la app.

1. Mira el esquema de la app en `app.json` (campo `"scheme"`). Si es `izmabullet`, sigue con estos valores.
2. **Authentication → URL Configuration**:
   - **Site URL:** `izmabullet://`
   - **Redirect URLs:** añade `izmabullet://**`
3. Guarda.

### 2.4 Registro y sesiones

1. **Authentication → Sign In / Providers**: deja **Allow new users to sign up** activado. El registro es parte de los requisitos.
2. **Authentication → Sessions** (o la sección equivalente): deja la caducidad del JWT por defecto (3600 segundos) y la rotación de refresh token activada.

### 2.5 Límites de intentos

**Authentication → Rate Limits**: deja los valores por defecto. Supabase ya limita los intentos de login. No los subas.

### 2.6 Correo de envío

El correo por defecto de Supabase sirve para desarrollo, pero tiene un límite bajo de envíos por hora. Para producción **tendrás que configurar un SMTP propio** (por ejemplo, Resend o Brevo) en **Project Settings → Authentication → SMTP Settings**. Déjalo para antes de publicar la app.

**Comprobación:** en **Authentication → Sign In / Providers** el proveedor Email aparece como activado.

---

## 3. Guardar las claves de forma segura

Ve a **Project Settings → API Keys** (o **API**, según la versión del panel).

Vas a ver varias claves. Solo necesitas dos:

| Clave | Dónde va | Puede ir en la app |
|---|---|---|
| **Project URL** (`https://<ref>.supabase.co`) | `.env.local` | Sí |
| **anon / publishable key** | `.env.local` | Sí, porque la protege RLS |
| **service_role / secret key** | **Nunca** en el repositorio ni en la app | **No** |

Crea el archivo `.env.local` en la raíz del proyecto:

```bash
# .env.local  (no subir a git)
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<clave anon o publishable>
```

> Las variables con prefijo `EXPO_PUBLIC_` se incluyen en el bundle de la app. Por eso solo van ahí las claves públicas. La `service_role` da acceso total a la base de datos y salta RLS: si se filtra, hay que rotarla de inmediato en el mismo panel.

**Comprobación:** `git check-ignore -v .env.local` debe mostrar que el archivo está ignorado.

---

## 4. Instalar la CLI de Supabase

Desde la raíz del proyecto:

```bash
npm install --save-dev supabase
```

Si `npm` pide aprobar scripts de instalación, apruébalos: la CLI descarga su binario en ese paso. Si el proyecto da conflictos de peer dependencies, usa `--legacy-peer-deps`, igual que en el resto del proyecto (ver `CLAUDE.md`).

**Comprobación:**

```bash
npx supabase --version
```

Debe mostrar un número de versión.

---

## 5. Iniciar sesión y vincular el proyecto

```bash
npx supabase login
```

Se abre el navegador para autorizar la CLI. Después:

```bash
npx supabase init
```

Esto crea la carpeta `supabase/config.toml`. Si ya existe, omite este comando.

Vincula el proyecto remoto. Sustituye `<ref>` por el **Reference ID** del paso 1:

```bash
npx supabase link --project-ref <ref>
```

Te pedirá la contraseña de la base de datos del paso 1.

**Comprobación:** `npx supabase projects list` marca tu proyecto como vinculado.

---

## 6. Aplicar las migraciones al proyecto remoto

```bash
npx supabase db push
```

La CLI muestra las migraciones pendientes y pide confirmación. Acepta.

**Comprobación en el panel:** **SQL Editor** → ejecuta:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Deben aparecer `dispositivos`, `eventos_seguridad`, `perfiles` y `pantallas`, todas con `rowsecurity = true`.

> **Regla del proyecto:** no cambies el esquema desde el panel. Todo cambio va en una migración nueva (`npx supabase migration new <nombre>`) y se aplica con `db push`. Así el esquema se puede reproducir en desarrollo, pruebas y producción.

---

## 7. Comprobar que la sesión incluye `session_id` (paso crítico)

La seguridad de dispositivos depende de que el token de acceso (JWT) incluya la claim `session_id`. La función `sesion_actual()` la lee. Si no está, **ninguna operación de dispositivo funcionará**. Es un fallo cerrado: no abre nada, pero tampoco registra dispositivos.

Comprobación con un usuario de prueba (no uses una cuenta real):

1. En **Authentication → Users** crea un usuario de prueba (**Add user → Create new user**, con email y contraseña, y marca *Auto Confirm User*).
2. Inicia sesión con él desde la app o desde la herramienta que prefieras, y copia el `access_token`.
3. Decodifica solo la parte central del token **en tu máquina**. No pegues el token en ninguna web:

   ```bash
   node -e "const p = process.argv[1].split('.')[1]; console.log(JSON.parse(Buffer.from(p, 'base64url').toString()))" "<access_token>"
   ```

4. Busca la clave `session_id` en el resultado.

**Si aparece**, sigue con el paso 8.
**Si no aparece**, para. Consulta la documentación actual de Supabase sobre las claims del JWT antes de seguir. No cambies la función para evitar el error sin entender por qué.

Al terminar, borra el usuario de prueba desde el panel.

---

## 8. Crear el primer administrador

Un administrador es necesario para aprobar, bloquear o revocar dispositivos desde el SQL Editor, y para publicar pantallas.

1. Crea tu usuario en **Authentication → Users → Add user**, o regístrate desde la app.
2. Copia su **UID** (la columna `UID` de la lista de usuarios).
3. En **SQL Editor**:

   ```sql
   update public.perfiles
      set rol = 'admin'
    where id = '<UID>';
   ```

**Comprobación:**

```sql
select id, nombre, rol, limite_dispositivos from public.perfiles;
```

Tu perfil debe aparecer con `rol = 'admin'`.

> El rol solo se cambia desde el SQL Editor, que actúa como `postgres`. Un usuario normal no puede cambiar su propio rol: la prueba 8 lo comprueba.

---

## 9. Operaciones habituales de administración

Todas se hacen en **SQL Editor**. Sustituye los valores entre `<...>`.

### Ver los dispositivos de un usuario

```sql
select id, nombre, plataforma, version_app, estado, registrado_en, ultima_actividad
from public.dispositivos
where usuario_id = '<UID>'
order by registrado_en;
```

### Autorizar un dispositivo pendiente

```sql
update public.dispositivos
   set estado = 'autorizado'
 where id = '<id-dispositivo>' and estado = 'pendiente';
```

### Revocar un dispositivo

Desde el SQL Editor no hay sesión de dispositivo, así que la función `revocar_dispositivo` no sirve aquí. Se hace a mano, registrando el evento:

```sql
insert into public.eventos_seguridad (usuario_id, dispositivo_id, tipo, detalle)
select usuario_id, id, 'dispositivo_revocado', '{"via": "admin"}'::jsonb
from public.dispositivos
where id = '<id-dispositivo>';

update public.dispositivos
   set estado = 'revocado', revocado_en = now(), session_id = null
 where id = '<id-dispositivo>';
```

Tras esto, el dispositivo deja de leer datos protegidos de inmediato. Como no se puede volver a registrar, no basta con borrar la fila: quedaría en el historial.

### Bloquear un dispositivo

Igual que revocar, pero con `estado = 'bloqueado'`. Se usa cuando quieres impedir el acceso sin darlo por retirado.

### Cambiar el límite de dispositivos de un usuario

```sql
update public.perfiles
   set limite_dispositivos = 5
 where id = '<UID>';
```

El límite está en 3 por defecto. Los valores válidos van de 1 a 20.

### Publicar o actualizar una pantalla dinámica

```sql
insert into public.pantallas (clave, version, payload, visibilidad, publicada)
values (
  'aviso',
  1,
  '{"titulo": "Mantenimiento", "texto": "Esta noche habrá una parada breve."}'::jsonb,
  '{}'::jsonb,
  true
)
on conflict (clave) do update
  set version = public.pantallas.version + 1,
      payload = excluded.payload,
      visibilidad = excluded.visibilidad,
      publicada = excluded.publicada;
```

Reglas de la tabla `pantallas`:

- **`clave`:** solo minúsculas, números, guion y guion bajo (máximo 60 caracteres).
- **`payload`:** objeto JSON de hasta 64 KB. Son datos, no código: la app los muestra con sus propios componentes.
- **`visibilidad`:** `{}` significa visible para cualquier usuario con dispositivo autorizado. `{"roles": ["admin"]}` restringe a administradores.
- **`publicada`:** `false` oculta la pantalla sin borrarla.

Para ocultar una pantalla:

```sql
update public.pantallas set publicada = false where clave = 'aviso';
```

### Revisar eventos de seguridad

```sql
select creado_en, tipo, usuario_id, dispositivo_id, detalle
from public.eventos_seguridad
order by creado_en desc
limit 100;
```

Tipos que genera el sistema: `dispositivo_registrado`, `dispositivo_autorizado`, `dispositivo_revocado`, `registro_rechazado`, `limite_alcanzado`.

---

## 10. Retención de eventos (180 días)

La función `purgar_eventos_seguridad()` borra los eventos con más de 180 días. Para que se ejecute sola:

1. **Database → Extensions**: activa `pg_cron` si está disponible en tu plan.
2. En **SQL Editor**:

   ```sql
   select cron.schedule(
     'purgar-eventos-seguridad',
     '0 3 * * *',
     $$ select public.purgar_eventos_seguridad(); $$
   );
   ```

Esto la ejecuta cada día a las 03:00 UTC. Para ver las tareas programadas: `select * from cron.job;`.

Si `pg_cron` no está disponible, ejecuta `select public.purgar_eventos_seguridad();` a mano cada cierto tiempo.

---

## 11. Pruebas locales

Requiere Docker en marcha.

```bash
npx supabase start      # levanta Postgres, Auth y el resto del stack en local
npx supabase db reset   # recrea la base local y aplica todas las migraciones
npx supabase test db    # ejecuta supabase/tests/*.sql
```

**Resultado esperado:** `10` pruebas, todas en `ok`. Si alguna falla, la salida indica cuál y por qué.

Al terminar, `npx supabase stop` apaga el stack local.

> **Pendiente de comprobar:** la prueba inserta filas directamente en `auth.users`. Si la versión local de Supabase exige columnas obligatorias que no estamos rellenando, el error aparecerá en el primer `insert`. Añádelas en `supabase/tests/seguridad_test.sql` al principio.

---

## 12. Cómo funciona la seguridad (resumen para revisar)

| Pregunta | Respuesta |
|---|---|
| ¿Puede un usuario leer datos de otro? | No. Todas las políticas filtran por `auth.uid()`. |
| ¿Puede un cliente cambiar el estado de un dispositivo? | No. Solo mediante `autorizar_dispositivo` o `revocar_dispositivo`, que exigen un dispositivo autorizado. |
| ¿Puede un cliente ver `identificador_app` o `session_id`? | No. Los permisos de columna lo impiden. |
| ¿Puede un cliente subirse el rol a admin? | No. `rol` no tiene permiso de escritura para `authenticated`. |
| ¿Qué pasa si revoco un dispositivo? | Deja de leer pantallas de inmediato, porque `session_id` se borra. El token sigue vivo hasta caducar (~1 h) pero no sirve para nada protegido. |
| ¿Puede un dispositivo revocado volver a entrar? | Puede iniciar sesión, pero `registrar_dispositivo` rechaza su identificador. |
| ¿Qué pasa con la primera cuenta? | Su primer dispositivo se autoriza solo. Si la cuenta ya tuvo dispositivos, los nuevos quedan pendientes, incluso si todos están revocados. |

**Pendiente para la Fase 3:** la revocación no elimina todavía la sesión en Supabase Auth. Eso requiere una Edge Function con la `service_role`, que se escribirá en su fase.

---

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `registrar_dispositivo` devuelve error `sesion_no_valida` | El JWT no tiene `session_id` | Repite el paso 7. No cambies la función sin entender el motivo. |
| `permission denied for table dispositivos` al leer desde la app | Se pide una columna no permitida (`identificador_app`, `session_id`) | Pide solo las columnas que concede el `grant select (...)` de la migración. |
| Las pantallas no aparecen para un usuario recién registrado | Su dispositivo está pendiente | Autorízalo (paso 9) o usa el primer dispositivo. |
| `db push` falla diciendo que una migración ya existe | Se editó una migración ya aplicada | No edites migraciones aplicadas. Crea una nueva. |
| `supabase test db` falla en el `insert into auth.users` | Faltan columnas obligatorias en la versión local | Ver la nota del paso 11. |
| `supabase start` no arranca | Docker no está en marcha o WSL no está integrado | Abre Docker Desktop y revisa la integración con WSL2. |
| El email de confirmación no llega | Límite del SMTP por defecto | Revisa spam; para producción configura SMTP propio (paso 2.6). |
| Al revocar desde la app, el dispositivo sigue viendo datos un rato | Es el JWT de acceso: sigue válido hasta caducar | Esperado en esta fase. La Fase 3 cierra la sesión en Auth. |

---

## Checklist antes de producción

- [ ] Proyecto de producción separado del de desarrollo, con su propia contraseña de base de datos.
- [ ] Migraciones aplicadas con `db push` y ninguna cambiada a mano en el panel.
- [ ] RLS activado en las cuatro tablas (paso 6).
- [ ] `service_role` fuera del repositorio, de la app y de cualquier captura o documento.
- [ ] SMTP propio configurado y probado con un email real.
- [ ] Contraseña mínima de 12 y verificación de email activadas.
- [ ] Pruebas `supabase test db` en verde en el stack local.
- [ ] Al menos un administrador con acceso a una segunda vía (otro email o 2FA del panel).
- [ ] `pg_cron` programado para la purga de eventos, o un recordatorio manual.
- [ ] Revisado el resultado de `select * from eventos_seguridad` tras las pruebas.

---

## Siguientes pasos del proyecto

Esta guía cubre la **Fase 1** (backend mínimo). Lo que viene:

- **Fase 2:** login, registro y recuperación en la app, con la sesión guardada en `expo-secure-store`. Requiere un build nuevo con EAS porque es un módulo nativo.
- **Fase 3:** registro de dispositivos desde la app y Edge Function para cerrar sesiones al revocar.
- **Fase 4:** pantallas dinámicas con caché en SQLite.
- **Fase 5:** Google (opcional) y documentación final.
