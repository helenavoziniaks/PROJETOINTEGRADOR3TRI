/* Dashboard A–D: Q=mcΔT · P=Q/t com η e perdas · 4 perdas · custos ✔ */
'use strict';
(function(){
const TL=window.TL;
const DEF={L:25,W:12.5,D:1.4,T0:18,T1:27,P:60,eta:90,Tair:16,Tw:27,wind:1.2,rh:70,cover:false,insulated:true,tariff:.65,cop:4.5,gas:5.5};
const Lab={s:Object.assign({},DEF,TL.P.d.lab||{}),h:{}};
TL.Lab=Lab;
Lab.calc=function(){
 const s=Lab.s,V=s.L*s.W*s.D,m=V*1000,dT=s.T1-s.T0,Q=Math.max(0,m*TL.Phys.CW*dT),Qk=Q/3.6e6;
 const area=s.L*s.W,wall=area+2*(s.L+s.W)*s.D;
 const lossAt=T=>TL.Phys.losses({Tw:T,Tair:s.Tair,wind:s.wind,rh:s.rh,area,wallArea:wall,cover:s.cover?1:0,insulated:s.insulated,night:false}).total;
 const Pw=s.P*1000*s.eta/100;
 const tIdeal=s.P>0?Q/(s.P*1000):Infinity,tReal=Pw>0?Q/Pw:Infinity;
 let tLoss=Infinity;
 if(dT>0&&Pw>lossAt(s.T0)){let T=s.T0,t=0;const n=400,ds=dT/n;
  for(let i=0;i<n;i++){const net=Pw-lossAt(T+ds/2);if(net<=0){t=Infinity;break}t+=m*TL.Phys.CW*ds/net;T+=ds}tLoss=t;}
 let Teq=null;
 if(Pw>0){let lo=-5,hi=60;
  if(lossAt(hi)<Pw)Teq='> 60';else if(lossAt(lo)>Pw)Teq='< −5';
  else{for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(lossAt(mid)<Pw)lo=mid;else hi=mid}Teq=(lo+hi)/2}}
 const lc=TL.Phys.losses({Tw:s.Tw,Tair:s.Tair,wind:s.wind,rh:s.rh,area,wallArea:wall,cover:s.cover?1:0,insulated:s.insulated,night:false});
 const L1=lossAt(s.T1);
 const perKWh={ir:s.tariff/(s.eta/100),hp:s.tariff/s.cop,solar:s.tariff*.02,gas:s.gas/(10*.85)};
 const monthly=Math.max(0,L1)/1000*24*30;
 return {V,m,dT,Q,Qk,area,wall,tIdeal,tReal,tLoss,Teq,lc,L1,perKWh,monthly,Pw};};
function render(){
 const s=Lab.s,r=Lab.calc();
 // A
 TL.setTxt('la-v',TL.fmt(r.V,1)+' m³');TL.setTxt('la-l',TL.fmtInt(r.V*1000)+' L');TL.setTxt('la-m',TL.fmtInt(r.m)+' kg');
 TL.setTxt('la-dt',TL.fmt(r.dT,1)+' °C');TL.setTxt('la-q',TL.fmtSci(r.Q)+' J');TL.setTxt('la-qk',TL.fmt(r.Qk,1)+' kWh');
 TL.el('lab-a-fx').innerHTML='<span class="fx">Q</span><span class="op">=</span><span class="fm">'+TL.fmtInt(r.m)+'</span><span class="op">×</span><span class="fm">4 186</span><span class="op">×</span><span class="fm">'+TL.fmt(r.dT,1)+'</span><span class="op">=</span><span class="res">'+TL.fmtSci(r.Q)+' J ≈ '+TL.fmt(r.Qk,0)+' kWh</span>';
 const warn=TL.el('lab-a-warn');
 if(r.dT<=0){warn.hidden=false;warn.innerHTML='<b>ΔT ≤ 0:</b> a temperatura desejada não supera a inicial — não há energia de aquecimento a calcular.';}else warn.hidden=true;
 // B
 TL.setTxt('lb-ti',TL.fmtDur(r.tIdeal));TL.setTxt('lb-tr',TL.fmtDur(r.tReal));
 TL.setTxt('lb-tl',TL.fmtDur(r.tLoss));
 TL.setTxt('lb-teq',r.Teq===null?'—':(typeof r.Teq==='string'?r.Teq+' °C':TL.fmt(r.Teq,1)+' °C'));
 const mx=Math.max(r.tIdeal,Number.isFinite(r.tReal)?r.tReal:0,Number.isFinite(r.tLoss)?r.tLoss:0,1);
 TL.el('lab-b-bars').innerHTML=TL.barRow('Ideal (η=100%)','#39DDF2',r.tIdeal,mx,TL.fmtDur(r.tIdeal))
  +TL.barRow('Real (η='+s.eta+'%)','#FFC857',r.tReal,mx,TL.fmtDur(r.tReal))
  +TL.barRow('Com perdas','#FF762E',Number.isFinite(r.tLoss)?r.tLoss:mx,Number.isFinite(r.tLoss)?mx:1,TL.fmtDur(r.tLoss));
 const note=TL.el('lab-b-note');
 if(r.dT<=0)note.innerHTML='Defina T desejada > T inicial no módulo A.';
 else if(!Number.isFinite(r.tLoss))note.innerHTML='<b>Potência insuficiente:</b> com estas condições, as perdas igualam a potência útil antes de atingir '+TL.fmt(s.T1,1)+' °C — equilíbrio em ≈ <b>'+(typeof r.Teq==='number'?TL.fmt(r.Teq,1):r.Teq)+' °C</b>. Ative a cobertura térmica, reduza o vento ou aumente a potência.';
 else note.innerHTML='Com perdas ativas, o aquecimento leva <b>'+TL.fmtDur(r.tLoss)+'</b> (≈ '+TL.fmt(r.tLoss/3600,1)+' h). A temperatura de equilíbrio máximo nestas condições é ≈ <b>'+(typeof r.Teq==='number'?TL.fmt(r.Teq,1):r.Teq)+' °C</b>.';
 // C
 const L=r.lc,sum=Math.abs(L.evap)+Math.abs(L.conv)+Math.abs(L.rad)+Math.abs(L.cond)||1;
 TL.el('lab-c-bars').innerHTML=TL.barRow('Evaporação','#208DFF',L.evap,sum,TL.fmt(L.evap/1000,1)+' kW')
  +TL.barRow('Convecção','#25D6A4',L.conv,sum,TL.fmt(L.conv/1000,1)+' kW')
  +TL.barRow('Radiação','#FF762E',L.rad,sum,TL.fmt(L.rad/1000,1)+' kW')
  +TL.barRow('Condução','#8F7BFF',L.cond,sum,TL.fmt(L.cond/1000,1)+' kW');
 TL.setTxt('lc-tot',TL.fmt(L.total/1000,1)+' kW');TL.setTxt('lc-kwh',TL.fmt(L.total/1000*24,0)+' kWh/dia');
 TL.setTxt('lc-cost',TL.money(Math.max(0,L.total)/1000*24*s.tariff)+'/dia');
 TL.setTxt('lc-evap',TL.fmt(L.evapKgH,0)+' kg/h de água');
 // D
 const EQ=[['ir','IR resistivo','heater','η = '+s.eta+'%'],['hp','Bomba de calor','sensor','COP = '+TL.fmt(s.cop,1)],
  ['solar','Solar térmico','sun','bombeamento ≈2%'],['gas','Gás natural','flame','η = 85% · 10 kWh/m³']];
 const costs=EQ.map(e=>({id:e[0],ev:r.Qk*r.perKWh[e[0]],mo:r.monthly*r.perKWh[e[0]]}));
 const mxEv=Math.max(...costs.map(c=>c.ev),1);
 const cheap=costs.reduce((a,b)=>a.ev<b.ev?a:b);
 TL.el('lab-d-out').innerHTML=EQ.map((e,i)=>{const cst=costs[i];
  return '<div class="card" style="margin:.5rem 0;padding:.8rem 1rem"><div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center">'
  +'<b style="display:flex;gap:.4rem;align-items:center;min-width:170px">'+TL.icon(e[2])+e[1]+'</b>'
  +'<span class="chip">'+e[3]+'</span><span class="chip cool">'+TL.money(r.perKWh[e[0]])+'/kWh térmico</span>'
  +(cst.id===cheap.id?'<span class="chip ok">★ mais econômico</span>':'')+'</div>'
  +TL.barRow('Aquecer uma vez','#FFC857',cst.ev,mxEv,TL.money(cst.ev))
  +TL.barRow('Manter por mês','#39DDF2',cst.mo,Math.max(...costs.map(c=>c.mo),1),TL.money(cst.mo))
  +'</div>';}).join('');
 TL.Bus.emit('lab');TL.P.d.lab=Lab.s;TL.saveSoon();}
Lab.render=render;
function bind(key,mount,o){Lab.h[key]=TL.makeRange(mount,Object.assign({num:true,oninput:v=>{Lab.s[key]=v;render()}},o));Lab.h[key].set(Lab.s[key],true);}
TL.modules.push(function(){
 if(!TL.el('lab-a-in'))return;
 bind('L',TL.el('lab-a-in'),{label:'Comprimento',min:5,max:50,step:.5,unit:'m'});
 bind('W',TL.el('lab-a-in'),{label:'Largura',min:2,max:25,step:.5,unit:'m'});
 bind('D',TL.el('lab-a-in'),{label:'Profundidade média',min:.5,max:3,step:.05,unit:'m',dec:2});
 bind('T0',TL.el('lab-a-in'),{label:'Temperatura inicial',min:5,max:35,step:.5,unit:'°C',color:'var(--cyan)'});
 bind('T1',TL.el('lab-a-in'),{label:'Temperatura desejada',min:20,max:40,step:.5,unit:'°C',color:'var(--orange)'});
 TL.statGrid(TL.el('lab-a-out'),[{id:'la-v',label:'volume',kind:'hot'},{id:'la-l',label:'capacidade'},{id:'la-m',label:'massa de água'},{id:'la-dt',label:'ΔT'},{id:'la-q',label:'Q em joules',kind:'ok'},{id:'la-qk',label:'Q em kWh',kind:'hot'}]);
 bind('P',TL.el('lab-b-in'),{label:'Potência do equipamento',min:5,max:300,step:5,unit:'kW',dec:0,color:'var(--orange)'});
 bind('eta',TL.el('lab-b-in'),{label:'Eficiência do sistema η',min:50,max:100,step:1,unit:'%',dec:0,color:'var(--yellow)'});
 TL.statGrid(TL.el('lab-b-out'),[{id:'lb-ti',label:'tempo ideal'},{id:'lb-tr',label:'tempo real (η)',kind:'hot'},{id:'lb-tl',label:'tempo com perdas',kind:'ok'},{id:'lb-teq',label:'T de equilíbrio',kind:'vio'}]);
 bind('Tair',TL.el('lab-c-in'),{label:'Temperatura do ar',min:-5,max:40,step:.5,unit:'°C',color:'var(--cyan)'});
 bind('Tw',TL.el('lab-c-in'),{label:'Temperatura da água',min:10,max:40,step:.5,unit:'°C',color:'var(--orange)'});
 bind('wind',TL.el('lab-c-in'),{label:'Velocidade do vento',min:0,max:10,step:.1,unit:'m/s'});
 bind('rh',TL.el('lab-c-in'),{label:'Umidade relativa',min:20,max:100,step:1,unit:'%',dec:0});
 Lab.h.cover=TL.makeToggle(TL.el('lab-c-in'),{label:'Cobertura térmica',ico:'layers',val:Lab.s.cover,onchange:v=>{Lab.s.cover=v;render()}});
 Lab.h.ins=TL.makeToggle(TL.el('lab-c-in'),{label:'Paredes/fundo isolados',ico:'shield',cool:true,val:Lab.s.insulated,onchange:v=>{Lab.s.insulated=v;render()}});
 TL.statGrid(TL.el('lab-c-out'),[{id:'lc-tot',label:'perda total',kind:'hot'},{id:'lc-kwh',label:'perda diária'},{id:'lc-cost',label:'custo da perda',kind:'vio'},{id:'lc-evap',label:'água evaporada',kind:'ok'}]);
 bind('tariff',TL.el('lab-d-in'),{label:'Tarifa de energia',min:.2,max:2,step:.01,unit:'R$/kWh',dec:2,color:'var(--yellow)'});
 bind('cop',TL.el('lab-d-in'),{label:'COP da bomba de calor',min:2,max:6,step:.1,unit:'',dec:1,color:'var(--cyan)'});
 bind('gas',TL.el('lab-d-in'),{label:'Preço do gás natural',min:2,max:12,step:.1,unit:'R$/m³',color:'var(--orange)'});
 TL.el('lab-reset').addEventListener('click',()=>{Lab.s=Object.assign({},DEF);
  Object.keys(Lab.h).forEach(k=>{const key=k==='ins'?'insulated':k;if(key in Lab.s)Lab.h[k].set(Lab.s[key],true)});
  render();TL.Sound.play('power');TL.toast('Padrão CEP (hipotético) restaurado','ok');});
 TL.el('lab-copy').addEventListener('click',()=>{const r=Lab.calc(),s=Lab.s;
  const txt='RESUMO — Piscina CEP (hipotética)\n'+s.L+'×'+s.W+'×'+s.D+' m | '+TL.fmt(r.V,1)+' m³ | '+TL.fmtInt(r.m)+' kg\nΔT '+TL.fmt(r.dT,1)+' °C → Q = '+TL.fmtSci(r.Q)+' J = '+TL.fmt(r.Qk,1)+' kWh\n'+s.P+' kW (η '+s.eta+'%): ideal '+TL.fmtDur(r.tIdeal)+' | real '+TL.fmtDur(r.tReal)+' | c/ perdas '+TL.fmtDur(r.tLoss)+'\nPerdas a '+s.Tw+' °C: '+TL.fmt(r.lc.total/1000,1)+' kW\nTarifa R$ '+TL.fmt(s.tariff,2)+' → IR '+TL.money(r.Qk*r.perKWh.ir)+' | BC '+TL.money(r.Qk*r.perKWh.hp)+' por aquecimento';
  const done=()=>TL.toast('Resumo copiado ✔','ok');
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,()=>fallback());
  else fallback();
  function fallback(){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();
   try{document.execCommand('copy');done()}catch(e){TL.toast('Não foi possível copiar','err')}ta.remove();}});
 render();
});
})();