// Confere que toda fase gerada tem solução e não tem peças sobrepostas ou fora da rua.
// Rodar: node tests/fases.test.js
const L=require('../logica.js');
let erros=0;
const falha=m=>{erros++;if(erros<20)console.log('FALHA:',m)};
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

const vistos={};
for(let level=1;level<=300;level++){
  for(let s=0;s<(level<=60?12:4);s++){
    const list=L.gen(level,rng(level*1000+s)),N=L.getN(),occ=new Set();
    for(const p of list){
      for(const [x,y] of L.cellsOf(p)){
        const k=x+','+y;
        if(x<0||y<0||x>=N||y>=N)falha(`fase ${level}: peça fora da rua`);
        if(occ.has(k))falha(`fase ${level}: peças sobrepostas em ${k}`);
        occ.add(k);
      }
      if(p.kind)vistos[p.kind]=Math.min(vistos[p.kind]||1e9,level);
      if(p.len===4)vistos.long=Math.min(vistos.long||1e9,level);
      if(p.gate)vistos.gate=Math.min(vistos.gate||1e9,level);
    }
    if(!L.solvable(list))falha(`fase ${level} (semente ${s}) sem solução`);
    if(list.filter(p=>!p.fixed).length<4)falha(`fase ${level}: menos de 4 ônibus`);
    const pares={};list.forEach(p=>{if(p.grp)pares[p.grp]=(pares[p.grp]||0)+1});
    Object.values(pares).forEach(n=>{if(n!==2)falha(`fase ${level}: dupla escolar incompleta`)});
  }
}
// cada tipo novo precisa aparecer em algum momento, e não antes da fase prevista
for(const [k,lv] of Object.entries(L.KIND_AT)){
  if(!vistos[k])falha(`tipo ${k} nunca aparece`);
  else if(vistos[k]<lv)falha(`tipo ${k} aparece na fase ${vistos[k]}, antes da ${lv}`);
}
// gelo: o ônibus congelado só sai depois de outros saírem
{
  const a={x:0,y:0,len:2,h:true,d:-1,kind:'ice',ice:1},b={x:0,y:2,len:2,h:true,d:-1};
  if(L.freeList([a,b],[],0).includes(a))falha('ônibus congelado saiu antes da hora');
  if(!L.solvable([a,b]))falha('gelo deveria derreter depois de 1 saída');
  const c={x:0,y:0,len:2,h:true,d:-1,kind:'ice',ice:3};
  if(L.solvable([c,b]))falha('gelo 3 com só 1 ônibus deveria travar');
}
// cancela fechada bloqueia, aberta não
{
  const g={x:3,y:0,len:1,h:true,d:1,fixed:true,gate:true,open:false},p={x:0,y:0,len:2,h:true,d:1};
  if(L.canMove(p,[p,g]))falha('cancela fechada não bloqueou');
  g.open=true;if(!L.canMove(p,[p,g]))falha('cancela aberta bloqueou');
}
if(typeof L.genRod==='function'){
  for(let level=1;level<=120;level++)for(let s=0;s<6;s++){
    const lv=L.genRod(level,rng(level*77+s));
    if(!L.rodSolve(lv))falha(`rodoviária ${level} (semente ${s}) sem solução`);
  }
}
console.log(erros?`${erros} falha(s)`:'OK: fases com solução, tipos novos nas fases certas');
process.exit(erros?1:0);
