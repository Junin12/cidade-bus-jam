"""Gera as imagens da Google Play: capturas 1080x2160 (pt e en), ícone 512 e destaque 1024x500.
Antes: python -m http.server 8766  (na pasta do jogo).   Depois: python play-store/capturas.py
Precisa do Playwright (pip install playwright; python -m playwright install chromium)."""
import json, os, time
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8766/index.html?sim'
AQUI = os.path.dirname(os.path.abspath(__file__))
HOJE = time.strftime('%Y-%m-%d')

def estado(lang):
    agora = int(time.time() * 1000)
    return {
        'level': 34, 'coins': 2480, 'city': [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15], 'cityAt': agora - 3 * 3600e3,
        'inv': {'magnet': 3, 'heart': 2, 'whistle': 2}, 'skins': ['base', 'neon', 'pizza', 'retro', 'ouro'], 'skin': 'base',
        'tutLeft': 0, 'regionSeen': 1, 'seen': {k: 1 for k in ['vip', 'broken', 'school', 'flip', 'long', 'ice', 'gate']},
        'login': {'last': HOJE, 'streak': 4, 'claimed': HOJE}, 'ws': 2, 'lang': lang, 'festSeen': HOJE,
        'rod': {'level': 7}, 'freeAt': agora + 2 * 3600e3,
        'race': {'start': agora - 9 * 3600e3, 'end': agora + 15 * 3600e3, 'me': 7, 'done': 0, 'place': 0, 'claimed': 0,
                 'bots': [{'n': 'Dona Cida', 'spd': 1.3}, {'n': 'Zé Buzão', 'spd': .9}, {'n': 'Marquinhos', 'spd': 1.1},
                          {'n': 'Lu do Corredor', 'spd': .7}, {'n': 'Seu Jorge', 'spd': .6}, {'n': 'Rita da Linha', 'spd': 1.0}]},
    }

def capturas(p, lang):
    pasta = os.path.join(AQUI, 'capturas' if lang == 'pt' else 'capturas-' + lang)
    os.makedirs(pasta, exist_ok=True)
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 540, 'height': 1080}, device_scale_factor=2)
    pg.goto(URL)
    pg.evaluate("s=>{localStorage.setItem('cbj',JSON.stringify(s));localStorage.setItem('cbj_nocloud','1')}", estado(lang))
    pg.reload(); pg.wait_for_timeout(1500)
    def foto(nome): pg.wait_for_timeout(700); pg.screenshot(path=os.path.join(pasta, nome))
    foto('1-campanha.png')
    pg.click('#rodBtn'); pg.wait_for_timeout(600); foto('2-rodoviaria.png')
    pg.click('#tabRew'); foto('3-premios.png')
    pg.click('#tabCity'); foto('4-cidade.png')
    pg.click('#tabCol'); foto('5-colecao.png')
    pg.click('#tabGame'); pg.wait_for_timeout(400)
    pg.evaluate("()=>{over=true;win()}")
    pg.wait_for_timeout(1500); foto('6-vitoria.png')
    b.close()

def graficos(p):
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1100, 'height': 600})
    pg.goto(URL); pg.wait_for_timeout(800)
    url = pg.evaluate("""()=>{
      const c=document.createElement('canvas');c.width=1024;c.height=500;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
      const gr=g.createLinearGradient(0,0,0,500);gr.addColorStop(0,'#4db8ff');gr.addColorStop(1,'#d7f3ff');g.fillStyle=gr;g.fillRect(0,0,1024,500);
      g.fillStyle='#4b5168';g.fillRect(0,330,1024,170);g.fillStyle='#f4f4f4';for(let x=10;x<1024;x+=60)g.fillRect(x,410,34,8);
      const draw=(src,x,y,s)=>new Promise(r=>{const i=new Image();i.onload=()=>{g.drawImage(i,x,y,i.width*s,i.height*s);r()};i.src=src});
      const cols=['#e63946','#2a9d8f','#f4a261','#8e6cef','#06a6d4'];
      return Promise.all([draw(bus(3,1,true,cols[0]),40,350,5),draw(bus(2,-1,true,cols[1]),330,350,5),draw(bus(3,1,true,'#2f2f46','vip'),540,420,5),
        draw(bus(2,1,true,cols[3]),820,350,5),...[0,1,2,3,4,5].map(i=>draw(BIMG[10+i],60+i*160,220,6))]).then(()=>{
        g.fillStyle='#0d1630';g.font="64px 'Press Start 2P'";g.fillText('CIDADE BUS JAM',96,138);
        g.fillStyle='#ffd23f';g.fillText('CIDADE BUS JAM',90,130);
        g.fillStyle='#1b2a55';g.font="22px 'Press Start 2P'";g.fillText('Libere a rua. Construa sua cidade.',150,190);
        return c.toDataURL()});
    }""")
    import base64
    os.makedirs(os.path.join(AQUI, 'graficos'), exist_ok=True)
    open(os.path.join(AQUI, 'graficos', 'destaque-1024x500.png'), 'wb').write(base64.b64decode(url.split(',')[1]))
    b.close()
    from PIL import Image
    Image.open(os.path.join(AQUI, '..', 'icons', 'icon-512.png')).save(os.path.join(AQUI, 'graficos', 'icone-512.png'))

with sync_playwright() as p:
    for lang in ['pt', 'en', 'es']:
        capturas(p, lang)
    graficos(p)
print('ok')
