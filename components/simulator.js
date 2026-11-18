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
 [-1.2,0,1.2].forEach(x=>{box(x,1.95,0,.22,.12,4.6,irOn?'#FF762E':'#5a3a28',irOn?'#e8452e':'#4a3020',irOn?'#e8452e':'#4a3020');});
 // rack solar
 const solOn=S.source==='solar';
 for(let i=0;i<3;i++){const x=-6.3,z=-1.6+i*1.6;
  quad([[x-.7,.9,z-.6],[x+.7,1.5,z-.6],[x+.7,1.5,z+.6],[x-.7,.9,z+.6]],solOn&&!night?'#1d5fa8':'#123a6e');
  box(x,0,z,1.4,.5,1.2,'#28527e','#1b3a5e','#1b3a5e');}
 // bomba de calor
 const hpOn=S.source==='hp'&&S.on&&s.heaterActive&&!s.done;
 box(6.2,0,-1.5,1.6,1.1,1.2,'#28527e','#1b3a5e',hpOn?'#155a8a':'#1b3a5e');
 // casa de bombas
 box(6.2,0,1.8,1.1,.7,1,'#28527e','#1b3a5e','#155a8a');
 // rolo da cobertura
 box(5.5,0,0,.3,.3,5.2,'#7ec8ff','#4a90c8','#4a90c8');
 // ordena e desenha
 polys.sort((a,b)=>b.z-a.z);
 polys.forEach(pl=>{c.globalAlpha=pl.alpha;c.fillStyle=pl.fill;c.beginPath();
  pl.pr.forEach((p,i)=>{i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.closePath();c.fill();});
 c.globalAlpha=1;
 // feixes IR aditivos
 if(irOn){const pw=TL.clamp(S.P/200,.2,1);
  [-1.2,0,1.2].forEach(x=>{const a=P(x,2,0),b=P(x,wy,-2.2),d=P(x,wy,2.2);
   const g=c.createLinearGradient(a.x,a.y,(b.x+d.x)/2,(b.y+d.y)/2);
   g.addColorStop(0,'rgba(255,150,46,'+(.4*pw)+')');g.addColorStop(1,'rgba(255,150,46,.03)');
   c.fillStyle=g;c.beginPath();c.moveTo(a.x-8,a.y);c.lineTo(a.x+8,a.y);c.lineTo(d.x+14,d.y);c.lineTo(b.x-14,b.y);c.closePath();c.fill();});
  const gl=P(0,2,0);c.save();c.shadowColor='#FF762E';c.shadowBlur=26;c.fillStyle='rgba(255,150,46,.5)';c.fillRect(gl.x-40,gl.y-4,80,6);c.restore();}
 // ventilador da bomba de calor
 if(S.source==='hp'){const f=P(6.2,.6,-.88);c.strokeStyle='#7ef0ff';c.lineWidth=2;
  c.beginPath();c.arc(f.x,f.y,12*f.s/40,0,7);c.stroke();
  const rot=hpOn&&TL.A11y.motion?t*6:0;
  for(let i=0;i<3;i++){const a=rot+i*2.09;c.beginPath();c.moveTo(f.x,f.y);
   c.lineTo(f.x+Math.cos(a)*10*f.s/40,f.y+Math.sin(a)*10*f.s/40);c.stroke();}}
 // vapor / shimmer
 if(TL.A11y.motion){const evap=s.lastL.evap/1000,n=Math.min(24,Math.round(evap/4));
  for(let i=0;i<n;i++){const ph=(t*.3+i*.13)%1,x=TL.lerp(-4,4,(i*.618)%1);
   const p=P(x+Math.sin(t+i)*.3,wy+ph*1.6,((i*.37)%1)*4-2);
   c.fillStyle='rgba(200,230,255,'+(1-ph)*.3+')';c.beginPath();c.arc(p.x,p.y,2+ph*4,0,7);c.fill();}}
 // sensores + tags
 const sw=P(-4.6,wy+.1,2.2),sa=P(5.8,1.3,-3.2);
 [[sw,TL.fmt(s.Tw,1)+'°'],[sa,TL.fmt(S.Tair,0)+'° ar']].forEach(([p,txt],i)=>{
  c.fillStyle=(t%1<.5||!TL.A11y.motion)?'#25D6A4':'#1a8a6a';c.beginPath();c.arc(p.x,p.y,4,0,7);c.fill();
  c.fillStyle='rgba(6,20,38,.85)';const tw=c.measureText(txt).width+12;
  c.fillRect(p.x+8,p.y-18,tw,16);c.strokeStyle='rgba(37,214,164,.6)';c.strokeRect(p.x+8,p.y-18,tw,16);
  c.fillStyle='#7ef0ff';c.font='10px JetBrains Mono,monospace';c.textAlign='left';c.fillText(txt,p.x+14,p.y-6);});
 // hit regions (screen-space)
 BIG.hits=[['agua',[P(-5,wy,-2.5),P(5,wy,-2.5),P(5,wy,2.5),P(-5,wy,2.5)]],
  ['ir',[P(-1.5,2.3,-2.4),P(1.5,2.3,-2.4),P(1.5,1.8,2.4),P(-1.5,1.8,2.4)]],
  ['solar',[P(-7,1.6,-2.4),P(-5.5,1.6,-2.4),P(-5.5,.8,2.4),P(-7,.8,2.4)]],
  ['hp',[P(5.4,1.2,-2.1),P(7,1.2,-2.1),P(7,0,-.9),P(5.4,0,-.9)]],
  ['pump',[P(5.6,.8,1.3),P(6.8,.8,1.3),P(6.8,0,2.3),P(5.6,0,2.3)]],
  ['cover',[P(5.2,.4,-2.6),P(5.8,.4,-2.6),P(5.8,0,2.6),P(5.2,0,2.6)]],
  ['sens',[{x:sw.x-10,y:sw.y-10},{x:sw.x+10,y:sw.y-10},{x:sw.x+10,y:sw.y+10},{x:sw.x-10,y:sw.y+10}]]];
 // destaque seleção/hover
 const hl=BIG.hover||BIG.sel;
 if(hl){const hit=BIG.hits.find(h=>h[0]===hl);
  if(hit){c.strokeStyle='rgba(255,200,87,.9)';c.lineWidth=2;c.setLineDash([6,4]);c.beginPath();
   hit[1].forEach((p,i)=>{i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.closePath();c.stroke();c.setLineDash([]);}}
 // HUD relógio
 c.fillStyle='rgba(6,20,38,.7)';c.fillRect(10,10,118,24);
 c.fillStyle='#7ef0ff';c.font='11px JetBrains Mono,monospace';c.textAlign='left';
 const hh=Math.floor(clock),mm=Math.floor((clock-hh)*60);
 c.fillText((night?'🌙':'☀')+' '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+' · '+TL.fmt(S.Tair,0)+'°C ar',18,26);}
function pointInPoly(x,y,pts){let inside=false;
 for(let i=0,j=pts.length-1;i<pts.length;j=i++){
  if(((pts[i].y>y)!==(pts[j].y>y))&&(x<(pts[j].x-pts[i].x)*(y-pts[i].y)/(pts[j].y-pts[i].y)+pts[i].x))inside=!inside;}
 return inside;}
/* ---- cenários ✔ (curvas verificadas) ---- */
const SCEN=[
 ['none','1 · Sem aquecimento',{source:'none',cover:false}],
 ['ir','2 · Infravermelho 150 kW',{source:'ir',P:150,dist:.8,cover:false}],
 ['solar','3 · Solar térmico 200 m²',{source:'solar',areaCol:200,cover:false}],
 ['hp','4 · Bomba de calor 50 kW',{source:'hp',P:50,cover:false}],
 ['hpc','5 · Bomba + cobertura',{source:'hp',P:50,cover:true}]];
function applyScenario(id){const sc=SCEN.find(s=>s[0]===id);if(!sc)return;
 Object.assign(S,sc[2]);S.on=true;BIG.scenario=id;
 BIG.h.src.set(S.source,true);BIG.h.on.set(true,true);
 BIG.h.P.set(S.P||150,true);BIG.h.col.set(S.areaCol||200,true);BIG.h.dist.set(S.dist||.8,true);
 BIG.h.cover.set(!!S.cover,true);syncSourceUI();
 TL.$$('#sc-chips button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sc===id)));
 reset();BIG.running=true;TL.el('pool-play').textContent='⏸ Pausar';
 TL.Sound.play('power');TL.toast('Cenário: '+sc[1],'info',2400);}
function syncSourceUI(){
 BIG.gIr.hidden=S.source!=='ir';BIG.gSol.hidden=S.source!=='solar';BIG.gHp.hidden=S.source!=='hp';}
function compare(){
 const base=cfg();const names=['Sem aquecimento','IR 150 kW','Solar 200 m²','Bomba de calor 50 kW','Bomba + cobertura'];
 const cols=['#9FB9D8','#FF762E','#FFC857','#39DDF2','#25D6A4'];
 SCEN.forEach((sc,i)=>{const c2=Object.assign({},base,sc[2],{on:true,period:'cycle'});
  const sim=new TL.PoolSim(c2);sim.coverF=c2.cover?1:0;sim.run(72,60);
  BIG.chart.setSeries('sc'+i,names[i],cols[i],sim.hist.slice(),i===0?[5,4]:undefined);});
 TL.toast('5 cenários comparados em 72 h (ciclo dia/noite, condições atuais)','ok');TL.Sound.play('ok');}
TL.modules.push(function(){
 const cv=TL.el('pool-cv');if(!cv)return;
 // chips
 SCEN.forEach(sc=>{const b=document.createElement('button');b.type='button';b.dataset.sc=sc[0];
  b.setAttribute('aria-pressed','false');b.textContent=sc[1];
  b.addEventListener('click',()=>applyScenario(sc[0]));TL.el('sc-chips').appendChild(b);});
 // controles
 const ctl=TL.el('pool-ctl');BIG.h={};
 BIG.h.src=TL.makeSelect(ctl,{label:'Fonte de aquecimento',options:[['none','Nenhuma'],['ir','Infravermelho direto'],['solar','Solar térmico'],['hp','Bomba de calor']],val:S.source,
  onchange:v=>{S.source=v;syncSourceUI();BIG.scenario=null;TL.$$('#sc-chips button').forEach(b=>b.setAttribute('aria-pressed','false'));reset()}});
 BIG.h.on=TL.makeToggle(ctl,{label:'Equipamento ligado',ico:'bolt',val:true,onchange:v=>{S.on=v;TL.Sound.play(v?'power':'off')}});
 BIG.gIr=document.createElement('div');ctl.appendChild(BIG.gIr);
 BIG.h.P=TL.makeRange(BIG.gIr,{label:'Potência elétrica IR',min:10,max:200,step:5,val:S.P,unit:'kW',dec:0,color:'var(--orange)',oninput:v=>S.P=v});
 BIG.h.dist=TL.makeRange(BIG.gIr,{label:'Distância emissor → água',min:.5,max:3,step:.05,val:S.dist,unit:'m',dec:2,color:'var(--yellow)',oninput:v=>S.dist=v});
 BIG.gSol=document.createElement('div');ctl.appendChild(BIG.gSol);
 BIG.h.col=TL.makeRange(BIG.gSol,{label:'Área de coletores',min:20,max:240,step:5,val:S.areaCol,unit:'m²',dec:0,color:'var(--yellow)',oninput:v=>S.areaCol=v});
 BIG.gHp=document.createElement('div');ctl.appendChild(BIG.gHp);
 BIG.h.Php=TL.makeRange(BIG.gHp,{label:'Potência elétrica da bomba',min:10,max:80,step:2,val:50,unit:'kW',dec:0,color:'var(--cyan)',oninput:v=>S.P=v});
 TL.makeRange(ctl,{label:'T inicial da água (reinicia)',min:10,max:35,step:.5,val:S.T0,unit:'°C',color:'var(--cyan)',oninput:v=>{S.T0=v;reset()}});
 TL.makeRange(ctl,{label:'Termostato (T alvo)',min:22,max:32,step:.5,val:S.target,unit:'°C',color:'var(--teal)',oninput:v=>S.target=v});
 BIG.h.cover=TL.makeToggle(ctl,{label:'Cobertura térmica',ico:'layers',val:false,onchange:v=>S.cover=v});
 TL.makeToggle(ctl,{label:'Isolamento paredes/fundo',ico:'shield',cool:true,val:true,onchange:v=>S.insulated=v});
 TL.makeRange(ctl,{label:'Temperatura do ar',min:-2,max:35,step:.5,val:S.Tair,unit:'°C',color:'var(--blue)',oninput:v=>S.Tair=v});
 TL.makeRange(ctl,{label:'Vento',min:0,max:8,step:.1,val:S.wind,unit:'m/s',oninput:v=>S.wind=v});
 TL.makeRange(ctl,{label:'Umidade relativa',min:30,max:95,step:1,val:S.rh,unit:'%',dec:0,oninput:v=>S.rh=v});
 TL.makeSelect(ctl,{label:'Período',options:[['cycle','Ciclo 24 h (início 8 h)'],['day','Dia fixo'],['night','Noite fixa']],val:'cycle',onchange:v=>S.period=v});
 TL.makeSelect(ctl,{label:'Velocidade da simulação',options:[[5,'1 s = 5 min'],[15,'1 s = 15 min'],[60,'1 s = 1 h'],[180,'1 s = 3 h']],val:60,onchange:v=>S.speed=+v});
 TL.makeToggle(ctl,{label:'Visão térmica (câmera IR)',ico:'camera',cool:true,val:false,onchange:v=>S.thermal=v});
 syncSourceUI();
 // botões
 TL.el('pool-play').addEventListener('click',()=>{if(BIG.sim.done){TL.toast('Limite de 96 h atingido — reinicie a simulação','warn');return}
  BIG.running=!BIG.running;TL.el('pool-play').textContent=BIG.running?'⏸ Pausar':'▶ Retomar';TL.Sound.play(BIG.running?'on':'off')});
 TL.el('pool-reset').addEventListener('click',()=>{reset();BIG.running=true;TL.el('pool-play').textContent='⏸ Pausar';TL.Sound.play('power')});
 TL.el('pool-view').addEventListener('click',()=>{cam.th=-.65;cam.ph=.52;cam.R=17;cam.lastUser=performance.now()/1000;TL.Sound.play('click')});
 TL.el('pool-save').addEventListener('click',()=>{BIG.saved++;
  const nm='Salva '+BIG.saved+' · '+(S.source==='ir'?'IR':S.source==='hp'?'BC':S.source==='solar'?'Solar':'sem')+(S.cover?'+capa':'');
  BIG.chart.setSeries('sv'+BIG.saved,nm,TL.CHART_COLORS[(BIG.saved+1)%8],BIG.sim.hist.slice());
  if(BIG.saved>6){BIG.chart.o.series=BIG.chart.o.series.filter(s=>s.id!=='sv'+(BIG.saved-6));BIG.chart.buildLegend()}
  TL.toast('Curva salva no gráfico ✔','ok');TL.Sound.play('ok')});
 TL.el('pool-compare').addEventListener('click',compare);
 TL.el('pool-clear').addEventListener('click',()=>{BIG.chart.clearAll(true);BIG.saved=0;TL.toast('Gráfico limpo (curva ao vivo mantida)','info',2000)});
 // legenda
 [['agua','Água'],['ir','Emissores IR'],['solar','Coletores solares'],['hp','Bomba de calor'],['pump','Circulação'],['cover','Cobertura'],['sens','Sensores']].forEach(([id,n])=>{
  const b=document.createElement('button');b.type='button';b.dataset.part=id;b.setAttribute('aria-pressed','false');b.textContent=n;
  b.addEventListener('click',()=>selectPart(id));TL.el('pool-legend').appendChild(b);});
 selectPart(null);BIG.sel=null;
 TL.el('pool-info').innerHTML='Clique num elemento da cena (ou na legenda) para inspecioná-lo. Arraste para girar · role/pince para zoom.';
 // interação de câmera
 const ptrs=new Map();let pinch0=0;
 cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  cv.classList.add('drag');cam.lastUser=performance.now()/1000;
  if(ptrs.size===2){const a=[...ptrs.values()];pinch0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}});
 cv.addEventListener('pointermove',e=>{
  const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  if(ptrs.has(e.pointerId)){const p=ptrs.get(e.pointerId);
   if(ptrs.size===1){cam.orbit(e.clientX-p.x,e.clientY-p.y);p.x=e.clientX;p.y=e.clientY;cam.lastUser=performance.now()/1000;}
   else if(ptrs.size===2){p.x=e.clientX;p.y=e.clientY;const a=[...ptrs.values()];
    const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);cam.zoom((pinch0-d)*.03);pinch0=d;}}
  else if(BIG.hits){BIG.hover=null;
   for(const h of BIG.hits)if(pointInPoly(mx,my,h[1])){BIG.hover=h[0];break}
   cv.style.cursor=BIG.hover?'pointer':'grab';}});
 const up=e=>{if(ptrs.has(e.pointerId)&&ptrs.size===1&&!cv.classList.contains('moved')){
   const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
   if(BIG.hits)for(const h of BIG.hits)if(pointInPoly(mx,my,h[1])){selectPart(h[0]);break}}
  ptrs.delete(e.pointerId);cv.classList.remove('drag')};
 cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 cv.addEventListener('wheel',e=>{e.preventDefault();cam.zoom(e.deltaY*.01);cam.lastUser=performance.now()/1000},{passive:false});
 // gráfico + stats
 BIG.chart=new TL.LineChart(TL.el('pool-chart'),{aria:'Temperatura da piscina versus tempo em horas, com cenários comparados e faixa de conforto',
  fmtX:v=>TL.fmt(v,0)+' h',fmtY:v=>TL.fmt(v,1)+' °C',yMin:10,yMax:30,
  bands:[{y0:26,y1:28,color:'rgba(37,214,164,.13)',label:'conforto 26–28 °C'}],empty:'Inicie a simulação ou compare cenários…'});
 TL.Charts.push({tab:'simulador',chart:BIG.chart});
 TL.statGrid(TL.el('pool-stats'),[{id:'ps-el',label:'eletricidade consumida',kind:'hot'},{id:'ps-th',label:'calor entregue',kind:'ok'},{id:'ps-cost',label:'custo acumulado',kind:'vio'},{id:'ps-eff',label:'eficiência atual'}]);
 TL.Engine.add({el:cv,tab:'simulador',sim:true,draw(dt,t,v){draw3d(dt,t,cv,v)}});
 reset();
 TL.$$('#sc-chips button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sc==='ir')));
});
})();