create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  peso numeric(5,2) not null,
  altura integer not null,
  edad integer not null,
  sexo text not null check (sexo in ('masculino', 'femenino')),
  actividad text not null,
  objetivo text not null check (objetivo in ('perder', 'mantener', 'aumentar')),
  tmb numeric(8,2) not null,
  meta_diaria numeric(8,2) not null,
  meta_semanal numeric(8,2) generated always as (meta_diaria * 7) stored,
  created_at timestamptz default now()
);

create table if not exists consumos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  meta_id uuid references metas(id) on delete set null,
  fecha date not null,
  momento text not null check (momento in ('desayuno', 'almuerzo', 'cena', 'snack')),
  nombre_comida text not null,
  calorias_estimadas numeric(8,2) not null,
  fuente_calculo text default 'manual',
  observaciones text,
  created_at timestamptz default now()
);

create index if not exists consumos_user_fecha_idx on consumos(user_id, fecha);
