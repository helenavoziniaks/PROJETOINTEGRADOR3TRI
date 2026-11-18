/* Piscina pseudo-3D orbitável · 5 cenários · termostato · LCD · gráfico ✔ */
'use strict';
(function(){
const TL=window.TL;
const S={source:'ir',on:true,P:150,areaCol:200,dist:.8,T0:18,target:27,cover:false,insulated:true,
 Tair:20,wind:.8,rh:75,period:'cycle',speed:60,thermal:false};
const BIG={running:true,acc:0,lastDom:0,lastChart:0,lastLive:0,prevT:18,prevTt:0,sel:null,hover:null,saved:0,scenario:'ir'};
function cfg(){const L=TL.Lab?TL.Lab.s:{L:25,W:12.5,D:1.4};
 const area=L.L*L.W,wall=area+2*(L.L+L.W)*L.D;
 return Object.assign({},S,{area,wallArea:wall,m:area*L.D*1000});}
function reset(){BIG.sim=new TL.PoolSim(cfg());BIG.prevT=BIG.sim.Tw;BIG.prevTt=0;BIG.acc=0;
 if(BIG.chart)BIG.chart.setSeries('live','Ao vivo','#FFC857',[[0,BIG.sim.Tw]]);dom(true);}
/* câmera ✔ (projeção testada) */
const cam={th:-.65,ph:.52,R:17,lastUser:0,
 proj(x,y,z,W,H){const ct=Math.cos(this.th),st=Math.sin(this.th),cp=Math.cos(this.ph),sp=Math.sin(this.ph);
  const x1=x*ct-z*st,z1=x*st+z*ct,y2=(y-.4)*cp-z1*sp,z2=(y-.4)*sp+z1*cp,zc=z2+R0(this),s=650/zc;
  return {x:W/2+x1*s,y:H*.52-y2*s,z:zc,s};}};
function R0(c){return c.R}
function waterColor(T,light,thermal){
 if(thermal){const f=TL.clamp((T-12)/22,0,1);
  const r=Math.round(TL.lerp(20,255,f)),g=Math.round(f<.5?TL.lerp(20,140,f*2):TL.lerp(140,240,(f-.5)*2)),b=Math.round(f<.4?TL.lerp(90,40,f/.4):TL.lerp(40,180,(f-.4)/.6));
  return 'rgb('+Math.round(r*light)+','+Math.round(g*light)+','+Math.round(b*light)+')';}
 const f=TL.clamp((T-10)/24,0,1);
 const r=Math.round(TL.lerp(46,87,f)),g=Math.round(TL.lerp(124,208,f)),b=Math.round(TL.lerp(214,160,f));
 return 'rgb('+Math.round(r*light)+','+Math.round(g*light)+','+Math.round(b*light)+')';}
const PARTS_INFO={
 agua:()=>{const s=BIG.sim;return '<b>Água</b> · '+TL.fmt(s.Tw,2)+' °C · '+TL.fmtInt(s.cfg.m)+' kg. Perdas agora: '+TL.fmt(s.lastL.total/1000,1)+' kW (evaporação '+TL.fmt(s.lastL.evap/1000,1)+' kW). A tonalidade acompanha a temperatura.'},
 ir:()=>{const s=BIG.sim,g=s.geomF(s.cfg.dist);return '<b>Emissores IR</b> · '+S.P+' kW elétricos a '+TL.fmt(S.dist,2)+' m. Fator geométrico '+TL.fmt(g*100,0)+'% → absorvidos ≈ '+TL.fmt(s.lastIn.th/1000,1)+' kW. IR distante é absorvido na superfície: cobertura bloqueia o feixe.'},
 solar:()=>{const s=BIG.sim;return '<b>Coletores solares</b> · '+S.areaCol+' m², η 55%. Irradiância agora ≈ '+TL.fmtInt(s.lastIn.G||0)+' W/m² → '+TL.fmt(s.lastIn.th/1000,1)+' kW térmicos. Só funciona de dia — veja o dente de serra no gráfico.'},
 hp:()=>{const s=BIG.sim,cop=Math.max(2.1,4.9-.085*(27-S.Tair));return '<b>Bomba de calor</b> · '+S.P+' kW elétricos × COP '+TL.fmt(cop,1)+' = '+TL.fmt(S.P*cop,0)+' kW térmicos. Move calor do ar para a água — não cria energia. COP cai no frio.'},
 pump:()=>'<b>Bomba de circulação</b> · convecção forçada distribui o calor e evita camadas térmicas. Consumo ≈ 0,4 kW contínuos.',
 cover:()=>{const s=BIG.sim;return '<b>Cobertura térmica</b> · '+TL.fmt(s.coverF*100,0)+'% estendida. Corta ~92% da evaporação e ~75% de convecção/radiação — mas bloqueia o IR direto. Use à noite ou com bomba de calor.'},
 sens:()=>{const s=BIG.sim;return '<b>Sensores</b> · água '+TL.fmt(s.Tw,2)+' °C · ar '+TL.fmt(S.Tair,1)+' °C. Alimentam o termostato (alvo '+TL.fmt(S.target,1)+' °C, histerese 0,5 °C).'}};
function selectPart(id){BIG.sel=id;
 TL.$$('#pool-legend button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.part===id)));
 TL.el('pool-info').innerHTML=id?PARTS_INFO[id]():'Clique num elemento da cena (ou na legenda) para inspecioná-lo. Arraste para girar a câmera.';
 TL.Sound.play('click');}
function dom(force){
 const s=BIG.sim;if(!s)return;
 const th=TL.el('th-num');th.textContent=TL.fmt(s.Tw,1);th.classList.toggle('warm',s.Tw>=25);
 const rate=s.t>60?(s.Tw-BIG.prevT)/((s.t-BIG.prevTt)/3600):0;
 TL.setTxt('th-rate',(rate>=0?'+':'')+TL.fmt(rate,2)+' °C/h');
 TL.el('th-merc').style.height=TL.clamp((s.Tw-10)/30*100,2,100)+'%';
 TL.setTxt('pool-time',TL.fmtDur(s.t));
 let st,col;
 if(!S.on||S.source==='none'){st='Sem aquecimento';col='var(--faint)'}
 else if(s.done){st='Concluída (96 h)';col='var(--teal)'}
 else if(!BIG.running){st='Pausada';col='var(--faint)'}
 else if(s.Tw>=S.target-.2&&S.source!=='none'){st='Termostato · mantendo';col='var(--teal)'}
 else if(s.lastIn.th>s.lastL.total+500){st='Aquecendo';col='var(--orange)'}
 else if(s.lastIn.th<s.lastL.total-500){st='Perdendo calor';col='var(--cyan)'}
 else{st='Quase em equilíbrio';col='var(--yellow)'}
 TL.setTxt('pool-status',st);
 const chip=TL.el('th-state');chip.innerHTML='<i style="background:'+col+'"></i>'+st;
 TL.setTxt('ps-el',TL.fmt(s.kWhel,1)+' kWh');TL.setTxt('ps-th',TL.fmt(s.kWhth,1)+' kWh');
 const tariff=TL.Lab?TL.Lab.s.tariff:.65;
 TL.setTxt('ps-cost',TL.money(s.kWhel*tariff));
 const eff=S.source==='hp'?'COP '+TL.fmt(Math.max(2.1,4.9-.085*(27-S.Tair)),1):S.source==='ir'?'η efetiva '+TL.fmt(s.lastIn.el>0?s.lastIn.th/s.lastIn.el*100:0,0)+'%':S.source==='solar'?'η coletor 55%':'—';
 TL.setTxt('ps-eff',eff);
 BIG.prevT=s.Tw;BIG.prevTt=s.t;
 if(BIG.sel)TL.el('pool-info').innerHTML=PARTS_INFO[BIG.sel]();}
/* ---- render 3D ---- */
const stars=[];for(let i=0;i<90;i++)stars.push([Math.random(),Math.random()*.4,Math.random()*7]);
function draw3d(dt,t,cv,v){
 const s=BIG.sim;if(!s)return;
 // integração
 if(BIG.running&&!s.done){BIG.acc+=dt*S.speed*60;let n=0;
  while(BIG.acc>=30&&n<400){s.step(30);BIG.acc-=30;n++}
  if(s.done){BIG.running=false;TL.el('pool-play').textContent='▶ Retomar';TL.toast('Simulação concluída (96 h simuladas)','ok')}}
 // cobertura desliza (tempo real)
 const target=S.cover?1:0;
 if(Math.abs(s.coverF-target)>.001)s.coverF=TL.clamp(s.coverF+(target>s.coverF?1:-1)*dt*.8,0,1);
 if(t-BIG.lastDom>.2){BIG.lastDom=t;dom()}
 if(t-BIG.lastChart>.5&&BIG.chart){BIG.lastChart=t;BIG.chart.setSeries('live','Ao vivo','#FFC857',s.hist.slice())}
 if(t-BIG.lastLive>8){BIG.lastLive=t;TL.el('pool-live').textContent='Piscina: '+TL.fmt(s.Tw,1)+' graus. '+TL.el('pool-status').textContent+'.';}
 const drawOk=v.vis&&(TL.A11y.motion||t-(BIG._ld||0)>.5||v.dirty);
 if(!drawOk)return;BIG._ld=t;
 if(!TL.fitCanvas(cv)&&!cv._w)return;const c=cv._ctx,W=cv._w,H=cv._h;
 // drift suave de câmera
 if(TL.A11y.motion&&t-cam.lastUser>8)cam.th+=dt*.02;
 const night=s.isNight(),clock=s.clock();
 // céu
 const sky=c.createLinearGradient(0,0,0,H*.55);
 if(S.thermal){sky.addColorStop(0,'#120b3a');sky.addColorStop(1,'#1a1250')}
 else if(night){sky.addColorStop(0,'#050a1e');sky.addColorStop(1,'#0B2340')}
 else{sky.addColorStop(0,'#123a6e');sky.addColorStop(1,'#1d5fa8')}
 c.fillStyle=sky;c.fillRect(0,0,W,H*.55);
 c.fillStyle=S.thermal?'#0d0a2a':night?'#04101f':'#0d2c50';c.fillRect(0,H*.55,W,H*.45);
 if(night&&!S.thermal){stars.forEach(st=>{c.globalAlpha=.3+.5*Math.abs(Math.sin(t*.7+st[2]));c.fillStyle='#cfe8ff';c.fillRect(st[0]*W,st[1]*H,1.6,1.6)});c.globalAlpha=1;}
 // sol / lua
 const dayF=TL.clamp((clock-6)/12,0,1);
 const sx=W*(.12+.76*dayF),sy=H*(.3-.2*Math.sin(Math.PI*dayF));
 c.save();c.shadowBlur=30;
 if(night){c.shadowColor='#cfe8ff';c.fillStyle='#e8f2fa';c.beginPath();c.arc(W*.82,H*.14,13,0,7);c.fill();}
 else{c.shadowColor='#FFC857';c.fillStyle='#FFC857';c.beginPath();c.arc(sx,sy,16,0,7);c.fill();}
 c.restore();
 // silhueta do colégio
 c.fillStyle=S.thermal?'#1a1250':night?'#08152a':'#0e2a4a';
 const hy=H*.55;
 c.fillRect(W*.05,hy-46,W*.16,46);c.fillRect(W*.24,hy-30,W*.1,30);c.fillRect(W*.7,hy-38,W*.22,38);
 c.fillRect(W*.11,hy-72,26,26); // torre
 if(night){c.fillStyle='rgba(255,200,87,.75)';for(let i=0;i<6;i++)c.fillRect(W*.06+i*W*.024,hy-36,7,9);c.fillRect(W*.74,hy-28,7,9);c.fillRect(W*.8,hy-28,7,9);}
 // polys ordenados (painter)
 const polys=[];const P=(x,y,z)=>cam.proj(x,y,z,W,H);
 const quad=(pts,fill,alpha)=>{const pr=pts.map(p=>P(p[0],p[1],p[2]));polys.push({pr,fill,alpha:alpha||1,z:pr.reduce((a,p)=>a+p.z,0)/pr.length});};
 const deckC=S.thermal?'#241a5e':'#123156',deckC2=S.thermal?'#1c1450':'#0e2a4a';
 // deck em moldura
 quad([[-7,0,-4.5],[7,0,-4.5],[5,0,-2.5],[-5,0,-2.5]],deckC);
 quad([[-7,0,4.5],[7,0,4.5],[5,0,2.5],[-5,0,2.5]],deckC);
 quad([[-7,0,-4.5],[-5,0,-2.5],[-5,0,2.5],[-7,0,4.5]],deckC2);
 quad([[7,0,-4.5],[5,0,-2.5],[5,0,2.5],[7,0,4.5]],deckC2);
 // bacia
 quad([[-5,-1.5,-2.5],[5,-1.5,-2.5],[5,-1.5,2.5],[-5,-1.5,2.5]],S.thermal?'#171040':'#0a2038');
 quad([[-5,0,-2.5],[5,0,-2.5],[5,-1.5,-2.5],[-5,-1.5,-2.5]],S.thermal?'#1c1450':'#0d2c50');
 quad([[-5,0,2.5],[5,0,2.5],[5,-1.5,2.5],[-5,-1.5,2.5]],S.thermal?'#1c1450':'#0d2c50');
 quad([[-5,0,-2.5],[-5,0,2.5],[-5,-1.5,2.5],[-5,-1.5,-2.5]],S.thermal?'#201856':'#10345e');
 quad([[5,0,-2.5],[5,0,2.5],[5,-1.5,2.5],[5,-1.5,-2.5]],S.thermal?'#201856':'#10345e');
 // água em malha com ondas
 const NX=24,NZ=10,wy=-.15,amp=TL.A11y.motion?(.02+S.wind*.008):.02;
 const verts=[];
 for(let i=0;i<=NX;i++){verts[i]=[];for(let j=0;j<=NZ;j++){
  const x=-5+10*i/NX,z=-2.5+5*j/NZ;
  const y=wy+amp*(Math.sin(x*1.3+t*1.7)+Math.sin(z*1.7+t*1.3+1)+Math.sin((x+z)*.8+t*2.1))/3;
  verts[i][j]={p:P(x,y,z),y};}}
 for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++){
  const a=verts[i][j],b=verts[i+1][j],d=verts[i+1][j+1],e=verts[i][j+1];
  const slope=(b.y-a.y)+(e.y-a.y);
  const light=TL.clamp(.8+slope*6+(night?-.12:.06),.5,1.25);
  polys.push({pr:[a.p,b.p,d.p,e.p],fill:waterColor(s.Tw,light,S.thermal),alpha:1,z:(a.p.z+b.p.z+d.p.z+e.p.z)/4});}
 // raias
 for(let r=0;r<4;r++){const z=-1.5+r;
  for(let i=0;i<10;i++){const x0=-5+i,x1=x0+1;
   polys.push({pr:[P(x0,wy+.02,z-.03),P(x1,wy+.02,z-.03),P(x1,wy+.02,z+.03),P(x0,wy+.02,z+.03)],fill:i%2?'#e8f2fa':'#FF5D6C',alpha:.8,z:P((x0+x1)/2,wy,z).z-.01});}}
 // cobertura translúcida
 if(s.coverF>.01){const cx=-5+10*s.coverF;
  quad([[-5,wy+.06,-2.5],[cx,wy+.06,-2.5],[cx,wy+.06,2.5],[-5,wy+.06,2.5]],'rgba(180,220,255,.5)',.55);}
 // equipamentos (caixas)
 const box=(cx,cy,cz,sx,sy,sz,top,side,front)=>{
  const x0=cx-sx/2,x1=cx+sx/2,y0=cy,y1=cy+sy,z0=cz-sz/2,z1=cz+sz/2;
  quad([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],top);
  quad([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],front);
  quad([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],side);
  quad([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],side);
  quad([[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],side);};
 // pórtico + emissores
 box(0,0,-3,.18,2.2,.18,'#28527e','#1b3a5e','#1b3a5e');box(0,0,3,.18,2.2,.18,'#28527e','#1b3a5e','#1b3a5e');
 quad([[-.1,2.2,-3],[.1,2.2,-3],[.1,2.2,3],[-.1,2.2,3]],'#28527e');
 const irOn=S.source==='ir'&&S.on&&s.heaterActive&&!s.done;
 [-1.2,0,1