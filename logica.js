/* Regras das fases (sem DOM): geração, quem pode sair e se a fase tem solução.
   Usado pelo index.html e pelos testes (node tests/fases.test.js). */
let N=5;
const COLORS=['#e63946','#2a9d8f','#f4a261','#8e6cef','#06a6d4','#e76f9a','#7cb518','#9aa7ff'];
function cellsOf(p){const a=[];for(let i=0;i<p.len;i++)a.push(p.h?[p.x+i,p.y]:[p.x,p.y+i]);return a}
function pathDir(p,d){
  const a=[];
  if(p.h){if(d>0)for(let x=p.x+p.len;x<N;x++)a.push([x,p.y]);else for(let x=0;x<p.x;x++)a.push([x,p.y])}
  else{if(d>0)for(let y=p.y+p.len;y<N;y++)a.push([p.x,y]);else for(let y=0;y<p.y;y++)a.push([p.x,y])}
  return a;
}
const pathCells=p=>pathDir(p,p.d);
/* cancela aberta não ocupa a rua */
const blocks=q=>!(q.gate&&q.open);
function canMove(p,list){
  const occ=new Set();
  list.forEach(q=>{if(q!==p&&blocks(q))cellsOf(q).forEach(c=>occ.add(c[0]+','+c[1]))});
  const ok=d=>pathDir(p,d).every(c=>!occ.has(c[0]+','+c[1]));
  return p.kind==='flip'?(ok(1)||ok(-1)):ok(p.d);
}
/* gone = quantos ônibus já saíram (o gelo derrete com as saídas) */
function freeList(rest,fx,gone=0){
  const all=rest.concat(fx);
  const ready=p=>(p.ice||0)<=gone&&canMove(p,all);
  return rest.filter(p=>{
    if(!ready(p))return false;
    if(!p.grp)return true;
    const m=rest.find(q=>q.grp===p.grp&&q!==p);
    return !m||ready(m);
  });
}
/* rodadas até esvaziar a rua tirando todos os livres de uma vez (Infinity = travada).
   Cancelas contam como fechadas: abrir só ajuda, então a fase continua com solução. */
function rounds(list){
  let rest=list.filter(p=>!p.fixed);const fx=list.filter(p=>p.fixed).map(q=>q.gate?Object.assign({},q,{open:false}):q);
  let r=0,gone=0;
  while(rest.length){
    const fl=freeList(rest,fx,gone);
    if(!fl.length)return Infinity;
    rest=rest.filter(p=>!fl.includes(p));gone+=fl.length;r++;
  }
  return r;
}
const solvable=list=>rounds(list)!==Infinity;
function fallbackLevel(){
  N=5;
  return [
    {x:0,y:0,len:2,h:true,d:1,color:COLORS[0],ci:0},
    {x:3,y:0,len:2,h:false,d:1,color:COLORS[1],ci:1},
    {x:0,y:2,len:2,h:true,d:1,color:COLORS[2],ci:2},
    {x:1,y:3,len:2,h:false,d:1,color:COLORS[3],ci:3}
  ];
}
/* fase em que cada tipo novo aparece pela primeira vez */
const KIND_AT={vip:4,broken:8,school:12,flip:16,long:20,ice:26,gate:34};
function addSpecials(list,level,rnd){
  const mv=list.filter(p=>!p.fixed);
  const pv=level>=KIND_AT.vip?.12:0,pb=level>=KIND_AT.broken?.12:0,pf=level>=KIND_AT.flip?.10:0;
  mv.forEach(p=>{const x=rnd();if(x<pv)p.kind='vip';else if(x<pv+pb)p.kind='broken';else if(x<pv+pb+pf)p.kind='flip'});
  const pairs=level>=30?2:level>=KIND_AT.school?1:0;
  const pool=mv.filter(p=>!p.kind);
  for(let g=0;g<pairs;g++){
    for(let a=0;a<60;a++){
      const x=pool[(rnd()*pool.length)|0],y=pool[(rnd()*pool.length)|0];
      if(!x||!y||x===y||x.kind||y.kind)continue;
      const px=new Set(pathCells(x).map(c=>c.join(','))),py=new Set(pathCells(y).map(c=>c.join(',')));
      if(cellsOf(y).some(c=>px.has(c.join(',')))||cellsOf(x).some(c=>py.has(c.join(','))))continue;
      x.kind=y.kind='school';x.grp=y.grp=g+1;x.tag=y.tag=['#ff3b5c','#4db8ff','#7cff6b'][g];break;
    }
  }
  if(level>=KIND_AT.ice){
    const nIce=level>=60?2:1;
    for(let i=0;i<nIce;i++){const c=pool.filter(q=>!q.kind),p=c[(rnd()*c.length)|0];if(p){p.kind='ice';p.ice=2+((rnd()*2)|0)}}
  }
  if(level>=KIND_AT.gate){
    const cones=list.filter(p=>p.fixed);
    cones.slice(0,level>=60?2:1).forEach(c=>{c.gate=true;c.open=false});
  }
  if(!solvable(list)){
    list.forEach(p=>{if(p.kind==='ice'){p.kind=undefined;p.ice=undefined}});
    if(!solvable(list))list.forEach(p=>{if(p.kind==='flip')p.kind=undefined});
    if(!solvable(list))list.forEach(p=>{if(p.kind==='school'){p.kind=undefined;p.grp=undefined;p.tag=undefined}});
  }
  return list;
}
function gen(level,rnd=Math.random){
  N=Math.min(5+Math.floor((level-1)/4),8);
  const hard=level%5===0;
  const nObs=level>=6?Math.min(1+Math.floor((level-6)/4),5):0;
  const count=Math.min(4+level+(hard?2:0),Math.floor(N*N*0.3));
  const wantRounds=Math.min(2+Math.floor(level/5),6);
  const pLong=level>=KIND_AT.long&&N>=7?.15:0;
  let best=null,bestScore=-1;
  for(let t=0;t<120;t++){
    const list=[],occ=new Set();
    for(let i=0;i<nObs;i++){
      const x=Math.floor(rnd()*N),y=Math.floor(rnd()*N),k=x+','+y;
      if(occ.has(k))continue;occ.add(k);list.push({x,y,len:1,h:true,d:1,fixed:true});
    }
    let buses=0,fails=0;
    while(buses<count&&fails<250){
      const h=rnd()<.5,u=rnd(),len=u<pLong?4:u<.6?2:3;
      const x=Math.floor(rnd()*(h?N-len+1:N)),y=Math.floor(rnd()*(h?N:N-len+1));
      const ci=buses%COLORS.length;
      const p={x,y,len,h,d:rnd()<.5?1:-1,color:COLORS[ci],ci};
      const cs=cellsOf(p).map(c=>c.join(','));
      if(cs.some(c=>occ.has(c))){fails++;continue}
      list.push(p);
      if(!solvable(list)){list.pop();fails++;continue}
      cs.forEach(c=>occ.add(c));buses++;
    }
    if(buses<Math.max(4,Math.ceil(count*.8)))continue;
    const r=rounds(list);
    if(r===Infinity||r<2)continue;
    const score=Math.min(r,wantRounds)*100+buses;
    if(score>bestScore){bestScore=score;best=list}
    if(r>=wantRounds&&buses>=count-1)return addSpecials(list,level,rnd);
  }
  return best?addSpecials(best,level,rnd):fallbackLevel();
}

/* ---------- Modo Rodoviária: passageiros por cor ----------
   Grade W x H: -1 vazio, -2 parede, 0..k-1 cor do passageiro. A saída fica em cima (linha 0).
   Um passageiro sai se estiver na linha 0 ou tiver caminho de casas vazias até a linha 0.
   Ônibus chegam um por vez (3 lugares). Quem não é da cor do ônibus espera no banco; banco cheio = derrota. */
function rodCanExit(g,W,H,i){
  const x=i%W,y=(i/W)|0;if(y===0)return true;
  const seen=new Uint8Array(W*H),st=[];
  [[x+1,y],[x-1,y],[x,y+1],[x,y-1]].forEach(([a,b])=>{if(a>=0&&b>=0&&a<W&&b<H&&g[b*W+a]===-1){seen[b*W+a]=1;st.push(b*W+a)}});
  while(st.length){
    const j=st.pop(),jx=j%W,jy=(j/W)|0;if(jy===0)return true;
    [[jx+1,jy],[jx-1,jy],[jx,jy+1],[jx,jy-1]].forEach(([a,b])=>{const k=b*W+a;if(a>=0&&b>=0&&a<W&&b<H&&!seen[k]&&g[k]===-1){seen[k]=1;st.push(k)}});
  }
  return false;
}
/* joga uma sequência de toques: devolve {ok, maxBench} (estado: ônibus atual, assentos, banco) */
function rodPlay(lv,order){
  const g=lv.grid.slice();let bi=0,seats=0,bench=[],maxB=0;
  const board=()=>{ // o ônibus que chega leva quem já espera no banco
    let again=true;
    while(again&&bi<lv.buses.length){
      again=false;
      for(let i=0;i<bench.length&&seats<3;)if(bench[i]===lv.buses[bi]){bench.splice(i,1);seats++}else i++;
      if(seats===3){bi++;seats=0;again=true}
    }
  };
  for(const i of order){
    if(g[i]<0||!rodCanExit(g,lv.W,lv.H,i))return {ok:false,maxB};
    const c=g[i];g[i]=-1;
    if(bi<lv.buses.length&&c===lv.buses[bi]){seats++;if(seats===3){bi++;seats=0;board()}}
    else{bench.push(c);maxB=Math.max(maxB,bench.length);if(bench.length>lv.bench)return {ok:false,maxB}}
  }
  return {ok:bi===lv.buses.length&&!bench.length&&g.every(v=>v<0),maxB};
}
function genRod(level,rnd=Math.random){
  const W=Math.min(4+Math.floor(level/6),7),H=Math.min(4+Math.floor(level/5),8),k=Math.min(2+Math.floor(level/4),6);
  const walls=level>=8?Math.min(Math.floor(level/8),4):0,bench=5;
  const nb=Math.max(2,Math.min(Math.floor((W*H-walls)/3),3+level));
  const limit=level<5?2:level<15?3:4;
  for(let t=0;t<300;t++){
    const g=new Array(W*H).fill(-1),free=[...Array(W*H).keys()];
    for(let i=0;i<walls;i++){const j=free.splice(W+((rnd()*(free.length-W))|0),1)[0];g[j]=-2}
    const cols=[];for(let b=0;b<nb;b++){const c=(rnd()*k)|0;cols.push(c,c,c)}
    for(let i=cols.length-1;i>0;i--){const j=(rnd()*(i+1))|0;[cols[i],cols[j]]=[cols[j],cols[i]]}
    const cells=free.slice().sort((a,b)=>a-b);  // passageiros preenchem de cima para baixo
    cells.slice(0,cols.length).forEach((c,i)=>g[c]=cols[i]);
    // joga uma partida simulada e anota a ordem dos ônibus que ela pediu:
    // quase sempre tira alguém da cor do ônibus atual, às vezes outro (que vai para o banco)
    const w=g.slice(),order=[],buses=[],ben=[];let seats=0,cur=-1,maxB=0;
    const nextBus=c=>{cur=c;seats=0;if(c<0)return;buses.push(c);for(let i=0;i<ben.length&&seats<3;)if(ben[i]===cur){ben.splice(i,1);seats++}else i++;if(seats===3)nextBus(ben.length?ben[0]:-1)};
    while(true){
      const can=[];for(let i=0;i<w.length;i++)if(w[i]>=0&&rodCanExit(w,W,H,i))can.push(i);
      if(!can.length)break;
      const same=can.filter(i=>w[i]===cur),pool=same.length&&rnd()<.85?same:can;
      const i=pool[(rnd()*pool.length)|0],c=w[i];order.push(i);w[i]=-1;
      if(cur<0)nextBus(c);
      if(c===cur){seats++;if(seats===3)nextBus(ben.length?ben[0]:-1)}
      else{ben.push(c);maxB=Math.max(maxB,ben.length)}
    }
    if(order.length!==cols.length)continue;
    const lv={W,H,grid:g,buses,bench,sol:order};
    if(maxB<=limit&&!ben.length&&rodPlay(lv,order).ok)return lv;
  }
  return null;
}
const rodSolve=lv=>!!lv&&rodPlay(lv,lv.sol).ok;

if(typeof module!=='undefined')module.exports={gen,rounds,solvable,cellsOf,canMove,freeList,KIND_AT,getN:()=>N,genRod,rodSolve,rodPlay,rodCanExit};
