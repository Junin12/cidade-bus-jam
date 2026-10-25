# Publicar o Cidade Bus Jam na Google Play

O app Android (`android/`) abre o jogo publicado em https://wiapps.com.br/cidade_bus_jam/ e liga a ele o AdMob, o Google Play Billing e os lembretes. Atualizar o site atualiza o jogo dentro do app, sem nova versão na loja (só mudanças em `android/` exigem novo envio).

## 1. Banco de dados (uma vez)
No SQL Editor do Supabase (projeto `cidade-bus-jam`), rode a parte "v6" do fim de `supabase.sql` (função `delete_player`, usada pelo botão "Apagar dados da nuvem") e depois `painel.sql` (painel de métricas, só visível para você).

## 2. AdMob
1. Em admob.google.com: **Apps → Adicionar app → Android** (ainda não publicado) com o nome *Cidade Bus Jam*.
2. Crie dois blocos: **Intersticial** e **Premiado**.
3. Em **Privacidade e mensagens**, crie a mensagem de consentimento (GDPR) para o app. O jogo já mostra o formulário quando for necessário.
4. Troque em `android/gradle.properties`: `ADMOB_APP_ID`, `INTERSTITIAL_ID` e `REWARDED_ID` (hoje estão os IDs de **teste** do Google; nunca publique com eles nem clique nos seus próprios anúncios).

## 3. Play Console
1. **Criar app** → nome "Cidade Bus Jam", jogo, gratuito.
2. **Monetizar → Produtos no app** — crie como *produto único*, com estes ids exatos:

| id | o que é | preço sugerido |
|---|---|---|
| `remove_ads` | Remover anúncios | R$ 14,90 |
| `welcome_pack` | Pacote Inicial | R$ 4,90 |
| `pass_month` | Passe Premium do mês | R$ 9,90 |
| `coins_small` | Saco de moedas (1.200) | R$ 6,90 |
| `coins_big` | Cofre de moedas (4.000 + itens) | R$ 19,90 |

3. Preencha a ficha com `TEXTOS-DA-LOJA.md` e as imagens de `graficos/` e `capturas*/`.
4. Conta pessoal nova: teste fechado com pelo menos 12 testadores por 14 dias antes de liberar a produção.

## 4. Gerar o pacote (AAB)
O Gradle do Android não aceita acento no caminho (`Área de Trabalho`). Copie a pasta `android` para um caminho simples, por exemplo `C:\dev\busjam-android`, e abra no Android Studio, ou rode:

```
set JAVA_HOME=C:\Users\Wiliam\.jdks\jbr-21.0.11
gradlew bundleRelease
```

(Java 25 do Android Studio é novo demais para o Gradle 8.14; use o JBR 21.)

Assinatura: copie `keystore.properties.example` para `keystore.properties` e aponte para a sua chave de upload (crie no Android Studio em *Build → Generate Signed Bundle*). Guarde a chave e as senhas fora do Git.

A cada nova versão, aumente `versionCode` em `android/app/build.gradle.kts`.

## 5. Antes de enviar
- `node tests/fases.test.js` (todas as fases com solução).
- No celular, com o APK de teste: anúncio premiado (dica), intersticial (vença 3 fases a partir da fase 8), compra de teste (use um "testador de licença" no Play Console) e um lembrete (feche o jogo com o baú em contagem).

## O que fica no aparelho e o que vai para o servidor
- Progresso: `localStorage` do aparelho, com cópia no Supabase ligada a um código aleatório.
- As compras são entregues no próprio aparelho (sem validação no servidor). Para um jogo só de um jogador isso é o normal; se um dia houver ranking com prêmios de verdade, valide o recibo no servidor.
