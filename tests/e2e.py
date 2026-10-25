"""Teste no navegador: joga fases da campanha e da Rodoviária e confere que não há erros.
Antes: python -m http.server 8766 (na pasta do jogo).  Rodar: python tests/e2e.py"""
import sys, time
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8766/index.html?sim'
HOJE = time.strftime('%Y-%m-%d')
erros = []

def novo(p, estado):
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 420, 'height': 860})
    pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.goto(URL)
    base = {'tutLeft': 0, 'login': {'last': HOJE, 'streak': 1, 'claimed': HOJE}, 'festSeen': HOJE,
            'seen': {k: 1 for k in ['vip', 'broken', 'school', 'flip', 'long', 'ice', 'gate']}}
    base.update(estado)
    pg.evaluate("s=>{localStorage.clear();localStorage.setItem('cbj',JSON.stringify(s));localStorage.setItem('cbj_nocloud','1')}", base)
    pg.reload(); pg.wait_for_timeout(1200)
    return b, pg

def confere(cond, msg):
    print(('ok   ' if cond else 'FALHA ') + msg)
    if not cond: erros.append(msg)

with sync_playwright() as p:
    # campanha: tira sempre um ônibus livre até vencer (fase 40 tem gelo e cancela)
    for nivel in [3, 40]:
        b, pg = novo(p, {'level': nivel, 'coins': 0})
        for _ in range(200):
            fim = pg.evaluate("""()=>{
              if(over)return true;
              const p=pieces.find(q=>canGo(q));
              if(!p)return false;
              if(p.kind==='broken'&&!p.fixedUp)tap(p);
              tap(p);return false}""")
            if fim: break
            pg.wait_for_timeout(60)
        pg.wait_for_timeout(900)
        confere(pg.evaluate("S.level") == nivel + 1, f'fase {nivel} vencida jogando só ônibus livres')
        confere('concluída' in pg.inner_text('#ovT'), f'janela de vitória da fase {nivel}')
        b.close()
    # apito: tira os livres de uma vez
    b, pg = novo(p, {'level': 12, 'inv': {'magnet': 0, 'heart': 0, 'whistle': 1}})
    antes = pg.evaluate("pieces.filter(q=>!q.fixed).length")
    livres = pg.evaluate("pieces.filter(q=>canGo(q)&&!(q.kind==='broken'&&!q.fixedUp)).length")
    pg.click('#pwWhistle'); pg.wait_for_timeout(400 + 160 * livres)
    depois = pg.evaluate("pieces.filter(q=>!q.fixed).length")
    confere(depois <= antes - livres, f'apito tirou {antes - depois} ônibus ({livres} livres)')
    confere(pg.evaluate("S.inv.whistle") == 0, 'apito gasto do inventário')
    b.close()
    # Rodoviária: segue a solução da fase
    b, pg = novo(p, {'level': 15, 'rod': {'level': 4}})
    pg.click('#rodBtn'); pg.wait_for_timeout(500)
    sol = pg.evaluate("RD.lv.sol")
    for i in sol:
        pg.evaluate("i=>{const e=[...document.querySelectorAll('#rodGrid .ps')];rodTap(i,e[0]||document.createElement('div'))}", i)
        pg.wait_for_timeout(450)
    pg.wait_for_timeout(800)
    confere(pg.evaluate("S.rod.level") == 5, 'Rodoviária 4 vencida seguindo a solução')
    b.close()
    # inglês e espanhol: sem texto em português na tela de prêmios
    for lang, palavra in [('en', 'Rewards'), ('es', 'Premios')]:
        b, pg = novo(p, {'level': 20, 'lang': lang})
        pg.click('#tabRew'); pg.wait_for_timeout(500)
        txt = pg.inner_text('#rewView')
        confere(palavra in pg.inner_text('.tabs'), f'abas em {lang}')
        sobrou = [w for w in ['Resgatar', 'moedas', 'Prêmio', 'Abrir', 'Sequência'] if w in txt]
        confere(not sobrou, f'prêmios em {lang} sem português' + (f' (sobrou: {sobrou})' if sobrou else ''))
        b.close()

print('\n' + ('TUDO OK' if not erros else f'{len(erros)} problema(s): ' + ' | '.join(erros[:5])))
sys.exit(1 if erros else 0)
