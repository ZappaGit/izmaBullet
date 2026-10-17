-- Pruebas de seguridad del esquema inicial (pgTAP). Ejecutar con: npx supabase test db
-- Todo ocurre dentro de una transacción que se deshace al final: no deja datos.

begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

-- Dos usuarios ficticios. El trigger crea sus perfiles.
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'ana@prueba.local'),
  ('b0000000-0000-0000-0000-000000000002', 'beto@prueba.local');

-- Pantalla publicada para comprobar la lectura por dispositivo.
insert into public.pantallas (clave, payload, publicada)
values ('bienvenida', '{"titulo": "Hola"}', true);

-- Cambia la sesión a un usuario concreto con un session_id (claims del JWT).
create function pg_temp.como(p_usuario uuid, p_sesion uuid) returns void
language plpgsql as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_usuario, 'session_id', p_sesion, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
end;
$$;

-- Devuelve el id interno de un dispositivo a partir de su identificador de app.
-- Corre con privilegios del propietario, porque el cliente no puede leer identificador_app.
create function pg_temp.id_dispositivo(p_identificador uuid) returns uuid
language sql security definer set search_path = '' as $$
  select id from public.dispositivos where identificador_app = p_identificador;
$$;

-- 1. El primer dispositivo de la cuenta queda autorizado.
select pg_temp.como('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001');
select is(
  public.registrar_dispositivo('11111111-1111-1111-1111-111111111111', 'Móvil de Ana', 'android', '1.0.0')
    -> 'dispositivo' ->> 'estado',
  'autorizado',
  'el primer dispositivo de la cuenta queda autorizado'
);

-- 2. Un segundo dispositivo queda pendiente.
select pg_temp.como('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
select is(
  public.registrar_dispositivo('22222222-2222-2222-2222-222222222222', 'Tablet de Ana', 'android', '1.0.0')
    -> 'dispositivo' ->> 'estado',
  'pendiente',
  'un dispositivo nuevo, con la cuenta ya usada, queda pendiente'
);

-- 3. Un dispositivo pendiente no puede aprobar a otro.
select throws_ok(
  $$ select public.autorizar_dispositivo(pg_temp.id_dispositivo('11111111-1111-1111-1111-111111111111')) $$,
  '42501',
  'dispositivo_no_autorizado',
  'un dispositivo pendiente no puede autorizar'
);

-- 4. Una sesión de dispositivo pendiente no lee pantallas protegidas.
select is(
  (select count(*)::integer from public.pantallas),
  0,
  'un dispositivo pendiente no lee pantallas protegidas'
);

-- 5. El dispositivo autorizado aprueba al pendiente.
select pg_temp.como('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001');
select is(
  public.autorizar_dispositivo(pg_temp.id_dispositivo('22222222-2222-2222-2222-222222222222'))
    -> 'dispositivo' ->> 'estado',
  'autorizado',
  'un dispositivo autorizado aprueba a un pendiente'
);

-- 6. El cliente no puede cambiar el estado escribiendo la tabla directamente.
select throws_ok(
  $$ update public.dispositivos set estado = 'revocado' $$,
  '42501',
  null,
  'el cliente no puede escribir dispositivos directamente'
);

-- 7. Otro usuario no ve los dispositivos de Ana.
select pg_temp.como('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003');
select is(
  (select count(*)::integer from public.dispositivos),
  0,
  'un usuario no ve los dispositivos de otro usuario'
);

-- 8. Un usuario no puede subirse el rol a admin.
select pg_temp.como('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001');
select throws_ok(
  $$ update public.perfiles set rol = 'admin' $$,
  '42501',
  null,
  'el usuario no puede cambiar su propio rol'
);

-- 9. Al revocar la tablet, su sesión deja de leer pantallas.
select public.revocar_dispositivo(pg_temp.id_dispositivo('22222222-2222-2222-2222-222222222222'));
select pg_temp.como('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
select is(
  (select count(*)::integer from public.pantallas),
  0,
  'un dispositivo revocado no lee pantallas protegidas'
);

-- 10. Un dispositivo revocado no puede volver a registrarse con su identificador.
select is(
  public.registrar_dispositivo('22222222-2222-2222-2222-222222222222', 'Tablet de Ana', 'android', '1.0.0')
    ->> 'error',
  'dispositivo_bloqueado',
  'un dispositivo revocado no puede volver a registrarse'
);

select * from finish();

rollback;
