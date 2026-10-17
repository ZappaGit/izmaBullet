-- IzmaBullet · esquema inicial de Supabase (Fase 1)
--
-- Reglas de diseño:
--  - Ninguna tabla se escribe directamente desde el cliente. Las escrituras van por funciones.
--  - El cliente nunca lee identificador_app ni session_id (son el vínculo del dispositivo).
--  - Un dispositivo accede a datos protegidos solo si su sesión está vinculada y su estado es 'autorizado'.
--  - Las funciones que devuelven error lo hacen como {"error": "..."} para que el evento de seguridad
--    quede registrado (una excepción de PL/pgSQL deshace también el INSERT del evento).

-- 1. Perfiles ----------------------------------------------------------------

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '' check (char_length(nombre) <= 80),
  rol text not null default 'usuario' check (rol in ('usuario', 'admin')),
  limite_dispositivos integer not null default 3 check (limite_dispositivos between 1 and 20),
  creado_en timestamptz not null default now()
);

create function public.crear_perfil_al_registrarse()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'nombre', ''), 80));
  return new;
end;
$$;

create trigger crear_perfil_al_registrarse
after insert on auth.users
for each row execute function public.crear_perfil_al_registrarse();

-- 2. Dispositivos ------------------------------------------------------------

create table public.dispositivos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  identificador_app uuid not null,
  nombre text not null check (char_length(nombre) between 1 and 80),
  plataforma text not null check (plataforma in ('android', 'ios', 'linux', 'web')),
  version_app text not null check (char_length(version_app) between 1 and 20),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'autorizado', 'bloqueado', 'revocado')),
  session_id uuid,
  registrado_en timestamptz not null default now(),
  ultima_actividad timestamptz not null default now(),
  revocado_en timestamptz,
  unique (usuario_id, identificador_app)
);

create index dispositivos_usuario_estado on public.dispositivos (usuario_id, estado);

-- 3. Eventos de seguridad (solo escritura desde funciones) -------------------

create table public.eventos_seguridad (
  id bigint generated always as identity primary key,
  usuario_id uuid references public.perfiles (id) on delete set null,
  dispositivo_id uuid references public.dispositivos (id) on delete set null,
  tipo text not null check (char_length(tipo) <= 60),
  detalle jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create index eventos_seguridad_usuario_fecha on public.eventos_seguridad (usuario_id, creado_en desc);

-- 4. Pantallas dinámicas -----------------------------------------------------

create table public.pantallas (
  clave text primary key check (clave ~ '^[a-z0-9_-]{1,60}$'),
  version integer not null default 1 check (version >= 1),
  payload jsonb not null
    check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 65536),
  -- Reglas de visibilidad. Ejemplo: {"roles": ["usuario", "admin"]}. Sin "roles" = visible para todos los autenticados.
  visibilidad jsonb not null default '{}'::jsonb check (jsonb_typeof(visibilidad) = 'object'),
  publicada boolean not null default false,
  actualizado_en timestamptz not null default now()
);

create function public.marcar_actualizacion_pantalla()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger marcar_actualizacion_pantalla
before update on public.pantallas
for each row execute function public.marcar_actualizacion_pantalla();

-- 5. Funciones auxiliares ----------------------------------------------------

-- session_id del JWT actual. Requiere que Supabase incluya esa claim (ver docs/supabase.md, paso 9).
create function public.sesion_actual()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'session_id', '')::uuid;
$$;

-- ¿La sesión actual pertenece a un dispositivo autorizado del usuario?
-- Security definer: evita recursión con las políticas RLS de dispositivos.
create function public.dispositivo_autorizado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.dispositivos d
    where d.usuario_id = auth.uid()
      and d.session_id = public.sesion_actual()
      and d.estado = 'autorizado'
  );
$$;

-- Vista segura de un dispositivo para el cliente: sin identificador_app ni session_id.
create function public.dispositivo_publico(d public.dispositivos)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', d.id,
    'nombre', d.nombre,
    'plataforma', d.plataforma,
    'version_app', d.version_app,
    'estado', d.estado,
    'registrado_en', d.registrado_en,
    'ultima_actividad', d.ultima_actividad,
    'revocado_en', d.revocado_en
  );
$$;

create function public.registrar_evento(
  p_usuario uuid,
  p_dispositivo uuid,
  p_tipo text,
  p_detalle jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.eventos_seguridad (usuario_id, dispositivo_id, tipo, detalle)
  values (p_usuario, p_dispositivo, p_tipo, coalesce(p_detalle, '{}'::jsonb));
$$;

-- 6. Funciones de dispositivos (la única vía de escritura del cliente) -------

-- Registra el dispositivo actual o reactiva el existente si sigue pendiente/autorizado.
-- Devuelve {"dispositivo": {...}} o {"error": "..."}.
create function public.registrar_dispositivo(
  p_identificador uuid,
  p_nombre text,
  p_plataforma text,
  p_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_sesion uuid := public.sesion_actual();
  v_limite integer;
  v_activos integer;
  v_existente public.dispositivos;
  v_fila public.dispositivos;
begin
  if v_usuario is null or v_sesion is null then
    raise exception 'sesion_no_valida' using errcode = '42501';
  end if;
  if char_length(coalesce(p_nombre, '')) not between 1 and 80
     or p_plataforma not in ('android', 'ios', 'linux', 'web')
     or char_length(coalesce(p_version, '')) not between 1 and 20 then
    raise exception 'datos_no_validos' using errcode = '22023';
  end if;

  select * into v_existente
  from public.dispositivos
  where usuario_id = v_usuario and identificador_app = p_identificador;

  if found then
    if v_existente.estado in ('bloqueado', 'revocado') then
      perform public.registrar_evento(v_usuario, v_existente.id, 'registro_rechazado', '{}'::jsonb);
      return jsonb_build_object('error', 'dispositivo_bloqueado');
    end if;

    update public.dispositivos
       set nombre = p_nombre,
           plataforma = p_plataforma,
           version_app = p_version,
           session_id = v_sesion,
           ultima_actividad = now()
     where id = v_existente.id
    returning * into v_fila;

    return jsonb_build_object('dispositivo', public.dispositivo_publico(v_fila));
  end if;

  select limite_dispositivos into v_limite from public.perfiles where id = v_usuario;
  select count(*) into v_activos
  from public.dispositivos
  where usuario_id = v_usuario and estado in ('autorizado', 'pendiente');

  if v_activos >= v_limite then
    perform public.registrar_evento(v_usuario, null, 'limite_alcanzado', '{}'::jsonb);
    return jsonb_build_object('error', 'limite_dispositivos');
  end if;

  -- Solo el primer dispositivo que la cuenta haya tenido nunca se autoriza solo.
  -- Si la cuenta ya tuvo dispositivos (aunque estén revocados), el nuevo queda pendiente.
  insert into public.dispositivos (
    usuario_id, identificador_app, nombre, plataforma, version_app, estado, session_id
  )
  values (
    v_usuario,
    p_identificador,
    p_nombre,
    p_plataforma,
    p_version,
    case when exists (select 1 from public.dispositivos where usuario_id = v_usuario)
         then 'pendiente' else 'autorizado' end,
    v_sesion
  )
  returning * into v_fila;

  perform public.registrar_evento(
    v_usuario, v_fila.id, 'dispositivo_registrado', jsonb_build_object('estado', v_fila.estado)
  );
  return jsonb_build_object('dispositivo', public.dispositivo_publico(v_fila));
end;
$$;

-- Aprueba un dispositivo pendiente. Solo lo puede hacer un dispositivo autorizado.
create function public.autorizar_dispositivo(p_dispositivo uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_fila public.dispositivos;
begin
  if not public.dispositivo_autorizado() then
    raise exception 'dispositivo_no_autorizado' using errcode = '42501';
  end if;

  update public.dispositivos
     set estado = 'autorizado'
   where id = p_dispositivo and usuario_id = v_usuario and estado = 'pendiente'
  returning * into v_fila;

  if not found then
    return jsonb_build_object('error', 'no_pendiente');
  end if;

  perform public.registrar_evento(v_usuario, v_fila.id, 'dispositivo_autorizado', '{}'::jsonb);
  return jsonb_build_object('dispositivo', public.dispositivo_publico(v_fila));
end;
$$;

-- Revoca un dispositivo pendiente o autorizado. Quita el vínculo de sesión, así que deja de
-- acceder a datos protegidos de inmediato. La eliminación de la sesión en Supabase Auth
-- se hace en una Edge Function (Fase 3).
create function public.revocar_dispositivo(p_dispositivo uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_actual uuid;
  v_fila public.dispositivos;
begin
  if not public.dispositivo_autorizado() then
    raise exception 'dispositivo_no_autorizado' using errcode = '42501';
  end if;

  select id into v_actual
  from public.dispositivos
  where usuario_id = v_usuario and session_id = public.sesion_actual();

  update public.dispositivos
     set estado = 'revocado', revocado_en = now(), session_id = null
   where id = p_dispositivo and usuario_id = v_usuario and estado in ('pendiente', 'autorizado')
  returning * into v_fila;

  if not found then
    return jsonb_build_object('error', 'no_revocable');
  end if;

  perform public.registrar_evento(
    v_usuario, v_fila.id, 'dispositivo_revocado', jsonb_build_object('por_dispositivo', v_actual)
  );
  return jsonb_build_object('dispositivo', public.dispositivo_publico(v_fila));
end;
$$;

-- 7. Retención de eventos de seguridad (180 días). Programable con pg_cron (ver docs/supabase.md).

create function public.purgar_eventos_seguridad()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_borrados integer;
begin
  delete from public.eventos_seguridad where creado_en < now() - interval '180 days';
  get diagnostics v_borrados = row_count;
  return v_borrados;
end;
$$;

-- 8. Permisos y RLS ----------------------------------------------------------
-- Supabase concede privilegios por defecto a anon y authenticated. Se revocan explícitamente.

-- perfiles: el usuario lee su perfil y cambia solo su nombre. Rol y límite los cambia un admin.
alter table public.perfiles enable row level security;
revoke all on public.perfiles from anon, authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre) on public.perfiles to authenticated;

create policy "perfiles: leer el propio"
  on public.perfiles for select to authenticated
  using (id = auth.uid());

create policy "perfiles: actualizar el propio"
  on public.perfiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- dispositivos: el cliente solo lee sus dispositivos, sin los campos sensibles. Escribe por funciones.
alter table public.dispositivos enable row level security;
revoke all on public.dispositivos from anon, authenticated;
grant select (id, usuario_id, nombre, plataforma, version_app, estado,
              registrado_en, ultima_actividad, revocado_en)
  on public.dispositivos to authenticated;

create policy "dispositivos: leer los propios"
  on public.dispositivos for select to authenticated
  using (usuario_id = auth.uid());

-- eventos_seguridad: sin acceso para clientes. Solo funciones y el rol de servicio.
alter table public.eventos_seguridad enable row level security;
revoke all on public.eventos_seguridad from anon, authenticated;

-- pantallas: lectura solo si el dispositivo está autorizado y la pantalla cumple su visibilidad.
alter table public.pantallas enable row level security;
revoke all on public.pantallas from anon, authenticated;
grant select on public.pantallas to authenticated;

create policy "pantallas: leer con dispositivo autorizado"
  on public.pantallas for select to authenticated
  using (
    publicada
    and public.dispositivo_autorizado()
    and (
      not (visibilidad ? 'roles')
      or (visibilidad -> 'roles') ? (select p.rol from public.perfiles p where p.id = auth.uid())
    )
  );

-- Funciones: cerrar la ejecución por defecto (PUBLIC) y abrir solo lo que el cliente necesita.
revoke all on function public.crear_perfil_al_registrarse() from public, anon, authenticated;
revoke all on function public.marcar_actualizacion_pantalla() from public, anon, authenticated;
revoke all on function public.dispositivo_publico(public.dispositivos) from public, anon, authenticated;
revoke all on function public.registrar_evento(uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.purgar_eventos_seguridad() from public, anon, authenticated;

revoke all on function public.sesion_actual() from public, anon;
grant execute on function public.sesion_actual() to authenticated;
revoke all on function public.dispositivo_autorizado() from public, anon;
grant execute on function public.dispositivo_autorizado() to authenticated;

revoke all on function public.registrar_dispositivo(uuid, text, text, text) from public, anon;
grant execute on function public.registrar_dispositivo(uuid, text, text, text) to authenticated;
revoke all on function public.autorizar_dispositivo(uuid) from public, anon;
grant execute on function public.autorizar_dispositivo(uuid) to authenticated;
revoke all on function public.revocar_dispositivo(uuid) from public, anon;
grant execute on function public.revocar_dispositivo(uuid) to authenticated;
