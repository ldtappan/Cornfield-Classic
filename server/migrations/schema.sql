create table if not exists riders (
  id uuid default gen_random_uuid() primary key,
  bib text unique not null,
  name text,
  division text,
  created_at timestamptz default now()
);

create table if not exists events (
  id text primary key,
  name text,
  start_at timestamptz,
  end_at timestamptz
);

create table if not exists laps (
  id bigserial primary key,
  event_id text not null,
  rider_id uuid not null references riders(id) on delete cascade,
  lap_no integer not null,
  ts timestamptz not null default now(),
  gate_id text not null default 'main',
  source text not null default 'user',
  constraint uniq_lap unique(event_id, rider_id, lap_no)
);

create index if not exists idx_laps_event_ts on laps(event_id, ts);
create index if not exists idx_laps_event_rider on laps(event_id, rider_id);
