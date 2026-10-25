# Cidade Bus Jam — quebra-cabeça de ônibus

Repositório: github.com/Junin12/cidade-bus-jam. Leia o README.md antes de começar. Publicado em wiapps.com.br/cidade_bus_jam (pasta public_html/cidade_bus_jam do cPanel).

HTML/CSS/JS puro, sem build: `index.html` (tela), `logica.js` (regras testáveis), `i18n.js` (EN/ES). App Android em `android/`, material da loja em `play-store/`.

## Regras
- Textos do jogo em português do Brasil; todo texto novo visível ganha uma linha em `i18n.js` (inglês e espanhol).
- Mantenha a stack atual; não adicione frameworks ou build sem o usuário pedir.
- Mudou geração de fases ou Rodoviária: rode `node tests/fases.test.js`.
- Ao publicar, aumente `V` em `sw.js`.
- O Gradle não compila com acento no caminho: para testar o Android, copie `android/` para um caminho sem acento e use o JBR 21 (`C:\Users\Wiliam\.jdks\jbr-21.0.11`).
- Faça commit das mudanças; não faça push sem o usuário pedir.
