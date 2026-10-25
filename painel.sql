-- Cidade Bus Jam: painel de métricas. Rode no SQL Editor do Supabase (depois do supabase.sql).
-- Fica no esquema "painel", que a API pública não enxerga: só você, pelo SQL Editor.
-- Consultas prontas no fim do arquivo.
create schema if not exists painel;
revoke all on schema painel from public, anon, authenticated;

-- onde o jogador desiste: por fase da campanha, quantos começaram, venceram, perderam e abandonaram
create or replace view painel.funil_fases as
select (props->>'level')::int as fase,
       count(*) filter (where name='level_start') as inicios,
       count(*) filter (where name='level_win')   as vitorias,
       count(*) filter (where name='level_fail')  as derrotas,
       count(*) filter (where name='level_abandon') as abandonos,
       count(distinct pid) filter (where name='level_start') as jogadores,
       round(100.0*count(*) filter (where name in ('level_fail','level_abandon'))
             / nullif(count(*) filter (where name='level_start'),0),1) as pct_falha
from events where props ? 'level' and name like 'level_%'
group by 1 order by 1;

-- até que fase os jogadores chegam (a "parede" aparece como queda brusca)
create or replace view painel.alcance as
with maxf as (select pid, max((props->>'level')::int) f from events where name='level_win' group by pid)
select f as fase_maxima, count(*) as jogadores,
       sum(count(*)) over (order by f desc) as chegaram_ate_aqui
from maxf group by f order by f;

-- retenção: dos que começaram num dia, quantos voltaram no dia 1, 7 e 30
create or replace view painel.retencao as
with dias as (select pid, created_at::date d from events group by pid, created_at::date),
     ini as (select pid, min(d) d0 from dias group by pid)
select ini.d0 as coorte, count(*) as novos,
       round(100.0*count(*) filter (where exists(select 1 from dias x where x.pid=ini.pid and x.d=ini.d0+1))/count(*),1) as d1_pct,
       round(100.0*count(*) filter (where exists(select 1 from dias x where x.pid=ini.pid and x.d=ini.d0+7))/count(*),1) as d7_pct,
       round(100.0*count(*) filter (where exists(select 1 from dias x where x.pid=ini.pid and x.d=ini.d0+30))/count(*),1) as d30_pct
from ini group by ini.d0 order by ini.d0 desc;

-- anúncios e compras por dia
create or replace view painel.monetizacao as
select created_at::date as dia,
       count(distinct pid) as jogadores,
       count(*) filter (where name='ad_reward_ok') as premiados_vistos,
       count(*) filter (where name='ad_inter') as intersticiais,
       count(*) filter (where name='buy_click') as cliques_loja,
       count(*) filter (where name='buy_ok') as compras,
       round(1.0*count(*) filter (where name='ad_reward_ok')/nullif(count(distinct pid),0),2) as premiados_por_jogador
from events group by 1 order by 1 desc;

-- quais anúncios premiados as pessoas mais pedem
create or replace view painel.premiados_por_lugar as
select props->>'w' as lugar, count(*) as pedidos
from events where name='ad_reward' group by 1 order by 2 desc;

-- Rodoviária e corrida
create or replace view painel.modos as
select created_at::date as dia,
       count(*) filter (where name='rod_start') as rodoviaria_inicios,
       count(*) filter (where name='rod_win') as rodoviaria_vitorias,
       count(*) filter (where name='race_join') as corridas,
       count(*) filter (where name='race_done') as corridas_terminadas
from events group by 1 order by 1 desc;

revoke all on all tables in schema painel from public, anon, authenticated;

-- limpeza: eventos com mais de 18 meses (como diz a política de privacidade)
-- delete from events where created_at < now() - interval '18 months';

-- Consultas prontas:
-- select * from painel.funil_fases where inicios >= 20 order by pct_falha desc limit 15;
-- select * from painel.alcance;
-- select * from painel.retencao limit 30;
-- select * from painel.monetizacao limit 30;
-- select * from painel.premiados_por_lugar;
-- select * from painel.modos limit 30;
