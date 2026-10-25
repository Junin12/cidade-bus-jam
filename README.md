# Cidade Bus Jam v5

## Publicar
Envie a pasta inteira para `seusite.com/cidade_bus_jam/` (HTTPS). Abra `.../cidade_bus_jam/index.html`.
Os caminhos são relativos, então funciona em subpasta. O app instala na tela inicial (PWA) e roda offline.
Ao atualizar o jogo, mude `V` em `sw.js` (ex.: cbj-v5-2) para os celulares pegarem a versão nova.

## Nuvem (já ligada ao projeto Supabase cidade-bus-jam)
1. Crie um projeto no Supabase e rode `supabase.sql` no SQL Editor.
2. No `index.html`, no final, preencha `CLOUD={url:'https://SEU.supabase.co',key:'CHAVE_ANON'}`.
3. Liga: backup do save (código de recuperação nas Configurações), contador real da semana, ranking do desafio diário, eventos de análise.
Segurança: tabelas sem acesso direto (RLS sem políticas); tudo via funções. O código (UUID) do jogador funciona como senha do save.

## Simulado nesta versão
Anúncios (espera de 1,2 s), compras (passe, pacote inicial, remover anúncios), notificações push (exigem app Android nativo).
