-- ============================================================
-- Mejora de la base de datos BiblioTech (Supabase / PostgreSQL)
-- Fecha: 2026-11-26
--
-- Este script mejora el esquema real usado por la aplicacion:
-- autor, categoria, editorial, libro, ejemplar, lector,
-- prestamo, detalle_prestamo, reserva, rol, usuario.
--
-- Se aplica MANUALMENTE en el SQL Editor de Supabase.
-- Es idempotente: puede ejecutarse varias veces sin romper el esquema.
-- No elimina datos ni tablas legacy; las sentencias destructivas
-- quedan comentadas para revision explicita.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. CORRECCION DE TIPOS DE DATOS
-- ------------------------------------------------------------

alter table public.lector
    alter column dni type varchar(20)
    using nullif(trim(dni), '')::varchar;

alter table public.lector
    alter column codigo_carnet type varchar(30)
    using nullif(trim(codigo_carnet), '')::varchar;

-- ------------------------------------------------------------
-- 2. REGLAS DE INTEGRIDAD (CHECKS)
-- ------------------------------------------------------------

do $$ begin
  if not exists (select 1 from pg_constraint where conname='autor_estado_check' and conrelid='public.autor'::regclass) then
    alter table public.autor add constraint autor_estado_check check (estado in ('A', 'I'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='categoria_estado_check' and conrelid='public.categoria'::regclass) then
    alter table public.categoria add constraint categoria_estado_check check (estado in ('A', 'I'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='editorial_estado_check' and conrelid='public.editorial'::regclass) then
    alter table public.editorial add constraint editorial_estado_check check (estado in ('A', 'I'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='libro_estado_check' and conrelid='public.libro'::regclass) then
    alter table public.libro add constraint libro_estado_check check (estado in ('A', 'I'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='ejemplar_estado_check' and conrelid='public.ejemplar'::regclass) then
    alter table public.ejemplar add constraint ejemplar_estado_check check (estado in ('A', 'I'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='ejemplar_estado_fisico_check' and conrelid='public.ejemplar'::regclass) then
    alter table public.ejemplar add constraint ejemplar_estado_fisico_check check (estado_fisico in ('BUENO', 'REGULAR', 'MALO'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='lector_estado_check' and conrelid='public.lector'::regclass) then
    alter table public.lector add constraint lector_estado_check check (estado in ('A', 'I'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='prestamo_estado_check' and conrelid='public.prestamo'::regclass) then
    alter table public.prestamo add constraint prestamo_estado_check check (estado in ('A', 'I'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='prestamo_fecha_check' and conrelid='public.prestamo'::regclass) then
    alter table public.prestamo add constraint prestamo_fecha_check check (fecha_devolucion_esperada >= (fecha_prestamo::date));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='reserva_estado_check' and conrelid='public.reserva'::regclass) then
    alter table public.reserva add constraint reserva_estado_check check (estado in ('PENDIENTE', 'ATENDIDA', 'VENCIDA', 'CANCELADA'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='reserva_fecha_check' and conrelid='public.reserva'::regclass) then
    alter table public.reserva add constraint reserva_fecha_check check (fecha_expiracion >= (fecha_reserva::date));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='rol_estado_check' and conrelid='public.rol'::regclass) then
    alter table public.rol add constraint rol_estado_check check (estado in ('A', 'I'));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='usuario_estado_check' and conrelid='public.usuario'::regclass) then
    alter table public.usuario add constraint usuario_estado_check check (estado in ('A', 'I'));
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. UNICIDAD Y RELACIONES 1:1
-- ------------------------------------------------------------

do $$ begin
  if not exists (select 1 from pg_constraint where conname='lector_id_usuario_unique' and conrelid='public.lector'::regclass) then
    alter table public.lector add constraint lector_id_usuario_unique unique (id_usuario);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='libro_isbn_unique' and conrelid='public.libro'::regclass) then
    alter table public.libro add constraint libro_isbn_unique unique (isbn);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='ejemplar_codigo_barras_unique' and conrelid='public.ejemplar'::regclass) then
    alter table public.ejemplar add constraint ejemplar_codigo_barras_unique unique (codigo_barras);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='lector_codigo_carnet_unique' and conrelid='public.lector'::regclass) then
    alter table public.lector add constraint lector_codigo_carnet_unique unique (codigo_carnet);
  end if;
end $$;

-- ------------------------------------------------------------
-- 4. INDICES DE RENDIMIENTO
-- ------------------------------------------------------------

create index if not exists idx_autor_nombres
    on public.autor (apellido_paterno, nombres)
    where estado = 'A';

create index if not exists idx_categoria_nombre
    on public.categoria (nombre_categoria)
    where estado = 'A';

create index if not exists idx_editorial_nombre
    on public.editorial (nombre_editorial)
    where estado = 'A';

create index if not exists idx_libro_titulo
    on public.libro (titulo);

create index if not exists idx_libro_autor
    on public.libro (id_autor);

create index if not exists idx_libro_categoria
    on public.libro (id_categoria);

create index if not exists idx_libro_editorial
    on public.libro (id_editorial);

create index if not exists idx_ejemplar_libro
    on public.ejemplar (id_libro);

create index if not exists idx_ejemplar_disponible
    on public.ejemplar (disponible, estado)
    where estado = 'A';

create index if not exists idx_lector_codigo
    on public.lector (codigo_carnet);

create index if not exists idx_lector_dni
    on public.lector (dni);

create index if not exists idx_lector_usuario
    on public.lector (id_usuario);

create index if not exists idx_prestamo_lector
    on public.prestamo (id_lector, fecha_prestamo desc);

create index if not exists idx_prestamo_estado
    on public.prestamo (estado, fecha_devolucion_real);

create index if not exists idx_prestamo_bibliotecario
    on public.prestamo (id_bibliotecario);

create index if not exists idx_detalle_prestamo_prestamo
    on public.detalle_prestamo (id_prestamo);

create index if not exists idx_detalle_prestamo_ejemplar
    on public.detalle_prestamo (id_ejemplar);

create index if not exists idx_detalle_prestamo_devuelto
    on public.detalle_prestamo (devuelto, fecha_devolucion);

create index if not exists idx_reserva_lector
    on public.reserva (id_lector);

create index if not exists idx_reserva_libro
    on public.reserva (id_libro);

create index if not exists idx_reserva_estado
    on public.reserva (estado, fecha_expiracion);

create index if not exists idx_usuario_correo
    on public.usuario (correo);

create index if not exists idx_usuario_rol
    on public.usuario (id_rol);

create index if not exists idx_usuario_nombre_usuario
    on public.usuario (nombre_usuario);

-- ------------------------------------------------------------
-- 5. AUDITORIA AUTOMATICA
-- ------------------------------------------------------------

create or replace function public.set_fecha_actualizacion()
returns trigger
language plpgsql
as $$
begin
    new.fecha_actualizacion = now();
    return new;
end;
$$;

drop trigger if exists usuario_set_fecha_actualizacion on public.usuario;
create trigger usuario_set_fecha_actualizacion
before update on public.usuario
for each row
execute function public.set_fecha_actualizacion();

-- ------------------------------------------------------------
-- 6. VISTAS DE CONSULTA FRECUENTE
-- ------------------------------------------------------------

create or replace view public.v_prestamos_activos as
select
    p.id_prestamo,
    p.id_lector,
    l.nombres as lector_nombres,
    l.apellido_paterno as lector_apellido_paterno,
    p.id_bibliotecario,
    p.fecha_prestamo,
    p.fecha_devolucion_esperada,
    p.estado,
    p.observaciones
from public.prestamo p
join public.lector l on l.id_lector = p.id_lector
where p.estado = 'A'
  and p.fecha_devolucion_real is null;

create or replace view public.v_ejemplares_disponibles as
select
    e.id_ejemplar,
    e.codigo_barras,
    e.ubicacion,
    e.estado_fisico,
    l.id_libro,
    l.titulo,
    l.isbn
from public.ejemplar e
join public.libro l on l.id_libro = e.id_libro
where e.estado = 'A'
  and e.disponible = true
  and l.estado = 'A';

-- ------------------------------------------------------------
-- 7. LIMPIEZA DE TABLAS LEGACY (OPCIONAL, REVISAR ANTES)
-- ------------------------------------------------------------
-- Las tablas legacy (libros, material, socio, lista_deseos) no forman
-- parte del esquema final. Se dejan intactas por seguridad.
-- Para archivarlas, descomenta y ejecuta manualmente:
--
-- create schema if not exists legacy;
-- alter table if exists public.libros set schema legacy;
-- alter table if exists public.material set schema legacy;
-- alter table if exists public.socio set schema legacy;
-- alter table if exists public.lista_deseos set schema legacy;

-- ------------------------------------------------------------
-- 8. SEGURIDAD (RLS) - OPCIONAL
-- ------------------------------------------------------------
-- Habilitar RLS solo despues de definir politicas adecuadas para el
-- frontend. De lo contrario, el cliente anon quedara bloqueado.
--
-- alter table public.lector enable row level security;
-- alter table public.libro enable row level security;
-- ...

commit;
