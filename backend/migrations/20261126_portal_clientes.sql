-- Ejecutar manualmente en el SQL Editor de Supabase.
begin;

update public.rol
set estado = 'A'
where upper(trim(nombre_rol)) = 'CLIENTE'
  and estado <> 'A';

insert into public.rol (nombre_rol, descripcion, estado)
select 'CLIENTE', 'Acceso al portal de cliente y consulta del catálogo.', 'A'
where not exists (
    select 1
    from public.rol
    where upper(trim(nombre_rol)) = 'CLIENTE'
);

commit;
