# Cidade Bus Jam v6

Quebra-cabeça de ônibus em pixel art: tire os ônibus da rua sem bater e construa sua cidade. HTML/CSS/JS puro, sem build. No ar em https://wiapps.com.br/cidade_bus_jam/ e pronto para virar app Android (pasta `android/`).

## Arquivos
| Arquivo | O que é |
|---|---|
| `index.html` | o jogo (telas, sons, cidade, prêmios, loja, Rodoviária) |
| `logica.js` | regras sem tela: geração das fases, quem pode sair, Modo Rodoviária |
| `i18n.js` | tradução para inglês e espanhol (troca os textos da tela) |
| `sw.js` | PWA offline. **Ao publicar, mude `V`** (ex.: `cbj-v6-2`) |
| `privacidade.html` | política de privacidade (exigida pela Play) |
| `supabase.sql` / `painel.sql` | banco (save na nuvem, ranking, eventos) e painel de métricas |
| `android/` | app Android: WebView + AdMob + Google Play Billing + lembretes |
| `play-store/` | textos da loja, capturas, imagem de destaque e passo a passo (`PUBLICAR.md`) |
| `tests/fases.test.js` | confere que toda fase gerada tem solução |

## Rodar e testar
```
python -m http.server 8766        # abra http://localhost:8766
node tests/fases.test.js           # ou: npm test
```
No `localhost` (ou com `?sim` no endereço) as compras são simuladas para teste. No site publicado, a loja avisa que as compras ficam no app.

## Novidades da v6
- **Tipos novos de ônibus:** articulado (fase 20), congelado (26, derrete depois que outros saem) e cancela (34, abre e fecha a cada 2 saídas).
- **Apito:** todos os ônibus livres saem de uma vez.
- **Sequência de vitórias:** moedas extras e escudo (a 1ª batida não tira coração) a partir de 3 vitórias seguidas.
- **Corrida de ônibus:** 24 h contra 6 motoristas simulados, a partir da fase 10.
- **Festas do calendário:** Carnaval, Páscoa, Festa Junina, Festa do Saci e Natal, com moedas x1,5 e skin exclusiva.
- **Passaporte do Mundo:** Buenos Aires, Lisboa, Paris, Nova York e Tóquio depois de Foz do Iguaçu (fases 176 a 300).
- **Modo Rodoviária:** passageiros por cor, ônibus em fila e banco de espera (a partir da fase 10).
- **Monetização real no app:** AdMob (premiado e intersticial com limite), consentimento UMP, Play Billing (5 produtos), novos premiados (item sem moedas, baú agora, renda em dobro, vaga extra).
- **Lembretes** no app (baú pronto, cofre cheio, desafio do dia, fim da corrida).
- **Inglês e espanhol** (detecta o idioma do aparelho; troca em Configurações).
- **Privacidade:** política, botão de privacidade dos anúncios e "Apagar dados da nuvem".

## Nuvem (Supabase)
Projeto `cidade-bus-jam`, já ligado no fim do `index.html`. Tabelas sem acesso direto (RLS sem políticas); tudo por funções. O código (UUID) do jogador funciona como senha do save. Rode `supabase.sql` (inclusive a parte v6) e `painel.sql` no SQL Editor.
