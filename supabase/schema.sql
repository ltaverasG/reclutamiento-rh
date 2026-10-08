-- =====================================================================
-- Sistema de Reclutamiento y Selección de RH — UNAPEC
-- Esquema completo para Supabase (PostgreSQL)
-- Ejecutar completo en: Supabase Dashboard > SQL Editor > New query
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Validación de cédula dominicana (misma lógica que el código C#)
--    Se usa en un CHECK para que la base de datos nunca acepte
--    cédulas inválidas, aunque alguien salte la validación del frontend.
-- ---------------------------------------------------------------------
create or replace function public.validar_cedula(p_cedula text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_cedula text := replace(coalesce(p_cedula, ''), '-', '');
  v_mult   int[] := array[1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  v_total  int := 0;
  v_calc   int;
begin
  if v_cedula !~ '^[0-9]{11}$' then
    return false;
  end if;

  for i in 1..11 loop
    v_calc := substr(v_cedula, i, 1)::int * v_mult[i];
    if v_calc < 10 then
      v_total := v_total + v_calc;
    else
      v_total := v_total + (v_calc / 10) + (v_calc % 10);
    end if;
  end loop;

  return v_total % 10 = 0;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Catálogos
-- ---------------------------------------------------------------------
create table public.competencias (
  id          bigint generated always as identity primary key,
  descripcion text not null check (length(trim(descripcion)) > 0),
  estado      text not null default 'Activo' check (estado in ('Activo', 'Inactivo')),
  created_at  timestamptz not null default now()
);
create unique index competencias_descripcion_uq on public.competencias (lower(trim(descripcion)));

create table public.idiomas (
  id         bigint generated always as identity primary key,
  nombre     text not null check (length(trim(nombre)) > 0),
  estado     text not null default 'Activo' check (estado in ('Activo', 'Inactivo')),
  created_at timestamptz not null default now()
);
create unique index idiomas_nombre_uq on public.idiomas (lower(trim(nombre)));

create table public.capacitaciones (
  id          bigint generated always as identity primary key,
  descripcion text not null check (length(trim(descripcion)) > 0),
  nivel       text not null check (nivel in ('Grado', 'Postgrado', 'Maestría', 'Doctorado', 'Técnico', 'Gestión')),
  fecha_desde date not null,
  fecha_hasta date not null,
  institucion text not null check (length(trim(institucion)) > 0),
  created_at  timestamptz not null default now(),
  constraint capacitaciones_fechas_ck check (fecha_hasta >= fecha_desde)
);

create table public.puestos (
  id            bigint generated always as identity primary key,
  nombre        text not null check (length(trim(nombre)) > 0),
  nivel_riesgo  text not null check (nivel_riesgo in ('Alto', 'Medio', 'Bajo')),
  salario_min   numeric(12, 2) not null check (salario_min >= 0),
  salario_max   numeric(12, 2) not null,
  estado        text not null default 'Activo' check (estado in ('Activo', 'Inactivo')),
  created_at    timestamptz not null default now(),
  constraint puestos_salarios_ck check (salario_max >= salario_min)
);
create unique index puestos_nombre_uq on public.puestos (lower(trim(nombre)));

-- ---------------------------------------------------------------------
-- 3. Candidatos y sus relaciones
-- ---------------------------------------------------------------------
create table public.candidatos (
  id               bigint generated always as identity primary key,
  cedula           char(11) not null unique check (public.validar_cedula(cedula)),
  nombre           text not null check (length(trim(nombre)) > 0),
  puesto_id        bigint not null references public.puestos (id),
  departamento     text not null check (length(trim(departamento)) > 0),
  salario_aspirado numeric(12, 2) not null check (salario_aspirado > 0),
  recomendado_por  text,
  estado           text not null default 'En proceso' check (estado in ('En proceso', 'Contratado')),
  created_at       timestamptz not null default now()
);

create table public.candidato_competencias (
  candidato_id   bigint not null references public.candidatos (id) on delete cascade,
  competencia_id bigint not null references public.competencias (id),
  primary key (candidato_id, competencia_id)
);

create table public.candidato_capacitaciones (
  candidato_id     bigint not null references public.candidatos (id) on delete cascade,
  capacitacion_id  bigint not null references public.capacitaciones (id),
  primary key (candidato_id, capacitacion_id)
);

create table public.experiencias_laborales (
  id           bigint generated always as identity primary key,
  candidato_id bigint not null references public.candidatos (id) on delete cascade,
  empresa      text not null check (length(trim(empresa)) > 0),
  puesto       text not null check (length(trim(puesto)) > 0),
  fecha_desde  date not null,
  fecha_hasta  date,                       -- null = empleo actual
  salario      numeric(12, 2) not null check (salario >= 0),
  constraint experiencias_fechas_ck check (fecha_hasta is null or fecha_hasta >= fecha_desde)
);
create index experiencias_candidato_idx on public.experiencias_laborales (candidato_id);

-- ---------------------------------------------------------------------
-- 4. Empleados
--    candidato_id UNIQUE impide contratar dos veces al mismo candidato.
--    cedula UNIQUE impide duplicar empleados.
-- ---------------------------------------------------------------------
create table public.empleados (
  id             bigint generated always as identity primary key,
  candidato_id   bigint unique references public.candidatos (id),
  cedula         char(11) not null unique check (public.validar_cedula(cedula)),
  nombre         text not null,
  fecha_ingreso  date not null,
  departamento   text not null,
  puesto_id      bigint not null references public.puestos (id),
  salario        numeric(12, 2) not null check (salario > 0),
  estado         text not null default 'Activo' check (estado in ('Activo', 'Inactivo')),
  created_at     timestamptz not null default now()
);
create index empleados_fecha_ingreso_idx on public.empleados (fecha_ingreso);

-- ---------------------------------------------------------------------
-- 5. Contratación (RPC): crea el empleado y marca el candidato como
--    "Contratado" dentro de una misma transacción.
--    security invoker => respeta las políticas RLS del usuario que llama.
-- ---------------------------------------------------------------------
create or replace function public.contratar_candidato(
  p_candidato_id  bigint,
  p_fecha_ingreso date,
  p_salario       numeric
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cand        public.candidatos%rowtype;
  v_empleado_id bigint;
begin
  if p_fecha_ingreso is null then
    raise exception 'La fecha de ingreso es obligatoria';
  end if;
  if p_salario is null or p_salario <= 0 then
    raise exception 'El salario mensual debe ser mayor que cero';
  end if;

  -- Bloquea la fila para evitar dos contrataciones simultáneas
  select * into v_cand from public.candidatos where id = p_candidato_id for update;

  if not found then
    raise exception 'El candidato no existe';
  end if;
  if v_cand.estado = 'Contratado' then
    raise exception 'El candidato ya fue contratado';
  end if;
  if exists (select 1 from public.empleados where cedula = v_cand.cedula) then
    raise exception 'Ya existe un empleado con la cédula %', v_cand.cedula;
  end if;

  insert into public.empleados (candidato_id, cedula, nombre, fecha_ingreso, departamento, puesto_id, salario)
  values (v_cand.id, v_cand.cedula, v_cand.nombre, p_fecha_ingreso, v_cand.departamento, v_cand.puesto_id, p_salario)
  returning id into v_empleado_id;

  update public.candidatos set estado = 'Contratado' where id = v_cand.id;

  return v_empleado_id;
end;
$$;

revoke execute on function public.contratar_candidato(bigint, date, numeric) from public, anon;
grant execute on function public.contratar_candidato(bigint, date, numeric) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Seguridad (RLS)
--    MVP: un único usuario administrador creado en Supabase Auth.
--    Solo usuarios autenticados pueden leer/escribir. El rol "anon"
--    (clave pública sin sesión) no tiene acceso a ningún dato.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'competencias', 'idiomas', 'capacitaciones', 'puestos', 'candidatos',
    'candidato_competencias', 'candidato_capacitaciones',
    'experiencias_laborales', 'empleados'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "admin_full_access" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end;
$$;
