-- Cidade Bus Jam: backend mínimo. Rode no SQL Editor do Supabase.
-- Segurança: tabelas com RLS ligada e SEM políticas (ninguém lê/escreve direto).
-- Todo acesso passa por funções security definer. O UUID do jogador é o "segredo" do save.

create table if not exists players(id uuid primary key, data jsonb not null default '{}', updated_at timestamptz not null default now());
create table if not exists events(id bigserial primary key, pid uuid, name text not null, props jsonb, created_at timestamptz not null default now());
create table if not exists weekly(week text primary key, total bigint not null default 0);
create table if not exists daily_scores(day int, pid uuid, nick text, stars int, errs int, created_at timestamptz default now(), primary key(day,pid));
alter table players enable row level security;
alter table events enable row level security;
alter table weekly enable row level security;
alter table daily_scores enable row level security;

create or replace function save_player(p uuid, d jsonb) returns void language sql security definer set search_path=public as $$
  insert into players(id,data,updated_at) values(p,d,now())
  on conflict(id) do update set data=excluded.data, updated_at=now()
  where pg_column_size(excluded.data) < 200000;
$$;
create or replace function load_player(p uuid) returns jsonb language sql security definer set search_path=public as $$
  select data from players where id=p;
$$;
create or replace function log_events(p uuid, evs jsonb) returns void language plpgsql security definer set search_path=public as $$
begin
  if jsonb_typeof(evs)<>'array' or jsonb_array_length(evs)>50 then return; end if;
  insert into events(pid,name,props) select p, left(e->>'n',40), e->'p' from jsonb_array_elements(evs) e;
end $$;
create or replace function add_weekly(w text, n int) returns bigint language plpgsql security definer set search_path=public as $$
declare t bigint;
begin
  n:=greatest(0,least(n,500));
  insert into weekly(week,total) values(left(w,12),n) on conflict(week) do update set total=weekly.total+n returning total into t;
  return t;
end $$;
create or replace function get_weekly(w text) returns bigint language sql security definer set search_path=public as $$
  select coalesce((select total from weekly where week=left(w,12)),0);
$$;
create or replace function submit_daily(d int, p uuid, nk text, s int, e int) returns void language sql security definer set search_path=public as $$
  insert into daily_scores(day,pid,nick,stars,errs) values(d,p,left(coalesce(nk,'Jogador'),14),least(3,greatest(0,s)),least(99,greatest(0,e)))
  on conflict(day,pid) do update set stars=greatest(daily_scores.stars,excluded.stars), errs=least(daily_scores.errs,excluded.errs);
$$;
create or replace function leaderboard(d int) returns table(nick text, stars int, errs int) language sql security definer set search_path=public as $$
  select nick,stars,errs from daily_scores where day=d order by stars desc, errs asc, created_at asc limit 20;
$$;
revoke all on function save_player,load_player,log_events,add_weekly,get_weekly,submit_daily,leaderboard from public;
grant execute on function save_player,load_player,log_events,add_weekly,get_weekly,submit_daily,leaderboard to anon;

-- ===== v6: exclusão dos dados (LGPD / Google Play) =====
create or replace function delete_player(p uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  delete from players where id=p;
  delete from events where pid=p;
  delete from daily_scores where pid=p;
end $$;
revoke all on function delete_player from public;
grant execute on function delete_player to anon;
