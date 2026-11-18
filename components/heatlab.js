/* 3 mecanismos animados + penetração espectral + mini-piscina IR */
'use strict';
(function(){
const TL=window.TL;
/* ---- mecanismos ---- */
function mech(id,fn){const cv=TL.el(id);if(!cv)return;
 TL.Engine.add({el:cv,tab:'transferencia',draw(dt,t){if(!TL.fitCanvas(cv)&&!cv._w)return;fn(cv._ctx,cv._w,cv._h,t)}});}
function initMechs(){
 mech('me-rad',(c,W,H,t)=>{c.clearRect(0,0,W,H);
  c.save();c.shadowColor='#FF762E';c.shadowBlur=14;c.fillStyle='#FF762E';c.fillRect(W*.06,H*.3,W*.1,H*.4);c.restore();
  c.fillStyle='#208DFF';c.fillRect(W*.8,H*.25,W*.12,H*.5);
  for(let i=0;i<4;i++){const p=((t*.4+i/4)%1),x=TL.lerp(W*.18,W*.78,p);
   c.strokeStyle='rgba(255,150,46,'+(1-p)*.9+')';c.lineWidth=2.5;
   c.beginPath();c.arc(x,H*.5,H*.22,-.9,.9);c.stroke();}
  c.fillStyle=TL.Pal.dim;c.font='9px JetBrains Mono,monospace';c.textAlign='center';
  c.fillText('EMISSOR',W*.11,H*.9);c.fillText('SUPERFÍCIE',W*.86,H*.9);});
 mech('me-con',(c,W,H,t)=>{c.clearRect(0,0,W,H);
  const g=c.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba(255,118,46,.5)');g.addColorStop(1,'rgba(32,141,255,.25)');
  c.fillStyle=g;c.fillRect(W*.05,H*.38,W*.9,H*.24);
  for(let i=0;i<12;i++){const f=i/11,x=TL.lerp(W*.09,W*.91,f),amp=(1-f)*5+1;
   const jx=Math.sin(t*9+i*1.3)*amp,jy=Math.cos(t*11+i)*amp*.6;
   const hot=1-f;c.fillStyle='rgb('+Math.round(TL.lerp(57,255,hot))+','+Math.round(TL.lerp(221,150,hot))+','+Math.round(TL.lerp(242,46,hot))+')';
   c.beginPath();c.arc(x+jx,H*.5+jy,5.5,0,7);c.fill();}
  c.fillStyle=TL.Pal.dim;c.font='9px JetBrains Mono,monospace';c.textAlign='left';c.fillText('QUENTE → vibração passa adiante → FRIO',W*.06,H*.2);});
 mech('me-cnv',(c,W,H,t)=>{c.clearRect(0,0,W,H);
  c.fillStyle='rgba(32,141,255,.3)';c.fillRect(W*.1,H*.2,W*.8,H*.62);
  c.fillStyle='rgba(255,118,46,.6)';c.fillRect(W*.3,H*.86,W*.4,H*.06);
  for(let i=0;i<16;i++){const ph=(t*.25+i/16)%1,cell=i%2,cx=W*(cell?.32:.68);
   const ang=ph*Math.PI*2*(cell?1:-1);
   const x=cx+Math.cos(ang)*W*.14,y=H*.5+Math.sin(ang)*H*.22;
   const warm=Math.sin(ang)>0;
   c.fillStyle=warm?'rgba(255,180,80,.9)':'rgba(126,220,255,.9)';
   c.beginPath();c.arc(x,y,3.4,0,7);c.fill();}
  c.fillStyle=TL.Pal.dim;c.font='9px JetBrains Mono,monospace';c.textAlign='center';c.fillText('quente sobe · fria desce',W*.5,H*.12);});
}
/* ---- penetração ---- */
const PN={lam:940e-9};
const ANCH=[[400,.01],[500,.02],[600,.24],[700,.65],[800,2.2],[900,7],[970,45],[1100,80],[1200,120],[1450,3000],[2000,1e4],[3000,8e5],[10000,1e5],[12000,1.2e5]];
function alphaAt(lNm){
 if(lNm<=ANCH[0][0])return ANCH[0][1];
 for(let i=1;i<ANCH.length;i++){if(lNm<=ANCH[i][0]){
  const [l0,a0]=ANCH[i-1],[l1,a1]=ANCH[i],f=Math.log(lNm/l0)/Math.log(l1/l0);
  return Math.exp(TL.lerp(Math.log(a0),Math.log(a1),f));}}
 return ANCH[ANCH.length-1][1];}
function pnRender(){
 const a=alphaAt(PN.lam*1e9),d=1/a;
 TL.setTxt('pn-l','λ '+TL.fmtWave(PN.lam));TL.setTxt('pn-a','α ≈ '+TL.fmtSci(a,1)+' m⁻¹');TL.setTxt('pn-d',TL.fmtLen(d));
 TL.el('pn-lam').textContent='λ = '+TL.fmtWave(PN.lam);
 const note=PN.lam<700e-9?'Luz visível atravessa metros de água limpa — por isso enxergamos o fundo da piscina.':
  PN.lam<1.4e-6?'IR próximo penetra de centímetros a dezenas de centímetros: candidatos reais ao aquecimento volumétrico.':
  'IR médio/distante é absorvido na superfície (<1 mm). O calor nasce onde a evaporação é mais forte — aquecimento direto exige cuidado.';
 TL.el('pn-note').innerHTML='<b>'+TL.fmtWave(PN.lam)+':</b> '+note;
 if(PN.v)PN.v.dirty=true;}
function pnDraw(cv){
 if(!TL.fitCanvas(cv)&&!cv._w)return;const c=cv._ctx,W=cv._w,H=cv._h;
 c.clearRect(0,0,W,H);
 const a=alphaAt(PN.lam*1e9),d=1/a;
 const steps=[1,2,5];let S=1e-6;
 outer:for(let e=-6;e<=2;e++)for(const s of steps){const cand=s*Math.pow(10,e);if(cand>=d*1.25){S=cand;break outer}}
 const bx=W*.3,bw=W*.62,by=H*.2,bh=H*.56;
 c.fillStyle='rgba(32,141,255,.28)';c.fillRect(bx,by,bw,bh);
 c.strokeStyle='rgba(126,240,255,.5)';c.strokeRect(bx,by,bw,bh);
 const col=PN.lam<700e-9?'57,221,120':'255,140,46';
 const g=c.createLinearGradient(bx,0,bx+bw,0);
 for(let i=0;i<=8;i++){const x=i/8,depth=x*S;g.addColorStop(x,'rgba('+col+','+(.85*Math.exp(-a*depth))+')');}
 c.fillStyle=g;c.fillRect(bx,by+bh*.3,bw,bh*.4);
 c.strokeStyle='rgba(255,200,87,.9)';c.lineWidth=2;c.beginPath();c.moveTo(W*.06,by+bh*.5);c.lineTo(bx,by+bh*.5);c.stroke();
 const fx=bx+Math.min(1,d/S)*bw;
 c.strokeStyle=TL.Pal.yellow;c.setLineDash([5,4]);c.beginPath();c.moveTo(fx,by-8);c.lineTo(fx,by+bh+8);c.stroke();c.setLineDash([]);
 c.fillStyle=TL.Pal.yellow;c.font='10px JetBrains Mono,monospace';c.textAlign=fx>W*.7?'right':'left';
 c.fillText('1/α = '+TL.fmtLen(d),fx+(fx>W*.7?-5:5),by-12);
 c.fillStyle=TL.Pal.dim;c.textAlign='center';c.fillText('escala: '+TL.fmtLen(S),bx+bw/2,by+bh+22);
 c.textAlign='left';c.fillText('0',bx,by+bh+22);c.textAlign='right';c.fillText(TL.fmtLen(S),bx+bw,by+bh+22);}
/* ---- mini-piscina ---- */
const MINI={running:true,speed:20,mols:[],phot:[],acc:0,lastDom:0,lastChart:0,prevT:22,prevTt:0};
function miniCfg(){return {source:'ir',on:MINI.on!==false,P:MINI.P||3,dist:MINI.d||.8,T0:MINI.T0||22,target:45,
 area:2,wallArea:6.8,m:1600,Tair:20,wind:.3,rh:60,period:'day',cover:false,insulated:true};}
function miniReset(){MINI.sim=new TL.PoolSim(miniCfg());MINI.prevT=MINI.sim.Tw;MINI.prevTt=0;
 MINI.mols=[];for(let i=0;i<90;i++)MINI.mols.push({x:Math.random(),y:Math.random(),a:Math.random()*7});
 if(MINI.chart)MINI.chart.setSeries('live','Mini-piscina','#FFC857',[[0,MINI.sim.Tw]]);miniDom(true);}
function miniDom(force){
 const s=MINI.sim;if(!s)return;
 TL.setTxt('mini-t',TL.fmt(s.Tw,2)+' °C');
 const rate=s.t>60?(s.Tw-MINI.prevT)/((s.t-MINI.prevTt)/3600):0;
 TL.setTxt('mini-rate',(rate>=0?'+':'')+TL.fmt(rate,2)+' °C/h');
 TL.setTxt('mini-pabs',TL.fmtInt(s.lastIn.th)+' W');TL.setTxt('mini-loss',TL.fmtInt(s.lastL.total)+' W');
 TL.setTxt('mini-kwh',TL.fmt(s.kWhth,2)+' kWh');TL.setTxt('mini-clock',TL.fmtDur(s.t));
 const L=s.lastL,mx=Math.max(L.evap,L.conv,L.rad,Math.abs(L.cond),1);
 TL.el('mini-loss-bars').innerHTML=TL.barRow('Evaporação','#208DFF',L.evap,mx,TL.fmtInt(L.evap)+' W')
  +TL.barRow('Convecção','#25D6A4',L.conv,mx,TL.fmtInt(L.conv)+' W')
  +TL.barRow('Radiação','#FF762E',L.rad,mx,TL.fmtInt(L.rad)+' W')
  +TL.barRow('Condução','#8F7BFF',L.cond,mx,TL.fmtInt(L.cond)+' W');
 MINI.prevT=s.Tw;MINI.prevTt=s.t;}
function miniDraw(dt,t,cv,v){
 const s=MINI.sim;if(!s)return;
 if(MINI.running&&!s.done){MINI.acc+=dt*MINI.speed*60;let n=0;
  while(MINI.acc>=30&&n<400){s.step(30);MINI.acc-=30;n++}
  if(s.done){MINI.running=false;TL.el('mini-play').textContent='▶ Retomar';TL.toast('Mini-simulação concluída (96 h)','info')}}
 const drawOk=v.vis&&(TL.A11y.motion||t-(MINI._ld||0)>.5||v.dirty);
 if(t-MINI.lastDom>.25){MINI.lastDom=t;miniDom()}
 if(t-MINI.lastChart>.6&&MINI.chart){MINI.lastChart=t;MINI.chart.setSeries('live','Mini-piscina','#FFC857',s.hist.map(p=>[p[0]*60,p[1]]))}
 if(!drawOk)return;MINI._ld=t;
 if(!TL.fitCanvas(cv)&&!cv._w)return;const c=cv._ctx,W=cv._w,H=cv._h;
 c.clearRect(0,0,W,H);
 const wx=W*.14,ww=W*.66,wy=H*.46,wh=H*.4;
 const pxm=H*.13,py=wy-(MINI.d||.8)*pxm;
 // deck e tanque
 c.fillStyle='rgba(96,170,255,.1)';c.fillRect(0,wy-6,W,6);
 c.fillStyle='rgba(11,35,64,.9)';c.fillRect(wx-8,wy-6,ww+16,wh+14);
 const Tw=s.Tw,warm=TL.clamp((Tw-14)/20,0,1);
 const g=c.createLinearGradient(0,wy,0,wy+wh);
 g.addColorStop(0,'rgba('+Math.round(TL.lerp(32,255,warm*.7))+','+Math.round(TL.lerp(141,160,warm))+','+Math.round(TL.lerp(255,80,warm))+',.75)');
 g.addColorStop(1,'rgba(13,58,110,.9)');
 c.fillStyle=g;c.fillRect(wx,wy,ww,wh);
 // emissor + cone
 const bw=ww*.42,bx=wx+ww/2-bw/2;
 const on=s.cfg.on&&s.heaterActive;
 c.save();if(on){c.shadowColor='#FF762E';c.shadowBlur=18}
 c.fillStyle=on?'#FF762E':'#5a3a28';c.fillRect(bx,py,bw,9);c.restore();
 if(on){const spread=(MINI.d||.8)*pxm*.9;
  const gg=c.createLinearGradient(0,py,0,wy);gg.addColorStop(0,'rgba(255,150,46,.3)');gg.addColorStop(1,'rgba(255,150,46,.05)');
  c.fillStyle=gg;c.beginPath();c.moveTo(bx,py+9);c.lineTo(bx+bw,py+9);c.lineTo(bx+bw+spread,wy);c.lineTo(bx-spread,wy);c.closePath();c.fill();
  if(TL.A11y.motion){MINI._pa=(MINI._pa||0)+dt;
   while(MINI._pa>.05){MINI._pa-=.05;if(MINI.phot.length<40)MINI.phot.push({x:bx+Math.random()*bw,y:py+9,vx:(Math.random()-.5)*spread*1.4,l:1})}
   MINI.phot=MINI.phot.filter(p=>{p.y+=170*dt;p.x+=p.vx*dt;
    const hit=p.y>=wy,inWater=p.x>wx&&p.x<wx+ww;
    c.fillStyle=hit&&inWater?'rgba(255,220,120,.95)':'rgba(255,150,46,.7)';
    c.beginPath();c.arc(p.x,Math.min(p.y,wy),2.2,0,7);c.fill();return !hit});}}
 // moléculas (agitação ∝ √T)
 const agit=Math.sqrt((Tw+273.15)/300)*(1+warm*2.2);
 c.save();c.beginPath();c.rect(wx,wy,ww,wh);c.clip();
 MINI.mols.forEach(m=>{if(TL.A11y.motion){m.a+=(Math.random()-.5)*.6;m.x+=Math.cos(m.a)*agit*dt*.05;m.y+=Math.sin(m.a)*agit*dt*.05;
   if(m.x<0||m.x>1){m.a=Math.PI-m.a;m.x=TL.clamp(m.x,0,1)}if(m.y<0||m.y>1){m.a=-m.a;m.y=TL.clamp(m.y,0,1)}}
  c.fillStyle='rgba('+Math.round(TL.lerp(126,255,warm))+','+Math.round(TL.lerp(220,200,warm))+','+Math.round(TL.lerp(255,120,warm))+',.8)';
  c.beginPath();c.arc(wx+m.x*ww,wy+m.y*wh,2.6,0,7);c.fill();});
 c.restore();
 // termômetro lateral
 const tx=W*.88,th=H*.6,ty=H*.2;
 c.fillStyle='rgba(11,35,64,.9)';c.fillRect(tx,ty,14,th);c.strokeStyle=TL.Pal.line;c.strokeRect(tx,ty,14,th);
 const frac=TL.clamp((Tw-10)/30,0,1);
 const mg=c.createLinearGradient(0,ty+th,0,ty);mg.addColorStop(0,'#208DFF');mg.addColorStop(.6,'#FFC857');mg.addColorStop(1,'#FF762E');
 c.fillStyle=mg;c.fillRect(tx+2,ty+th-(th-4)*frac,10,(th-4)*frac);
 c.fillStyle=TL.Pal.ink;c.font='11px JetBrains Mono,monospace';c.textAlign='center';
 c.fillText(TL.fmt(Tw,1)+'°',tx+7,ty-8);
 c.fillStyle=TL.Pal.dim;c.font='9px JetBrains Mono,monospace';c.textAlign='left';
 c.fillText('d = '+TL.fmt(MINI.d||.8,2)+' m',bx,py-8);
 c.fillText('P = '+TL.fmt(MINI.P||3,1)+' kW'+(on?' · ON':' · OFF'),bx+bw*.5,py-8);}
TL.modules.push(function(){
 initMechs();
 // penetração
 if(TL.el('pn-cv')){
  PN.slider=TL.makeRange(TL.el('pn-ctl'),{label:'Comprimento de onda (log)',min:0,max:1000,step:1,val:250,
   fmt:v=>TL.fmtWave(Math.pow(10,Math.log10(400e-9)+v/1000*(Math.log10(12e-6)-Math.log10(400e-9)))),color:'var(--yellow)',
   oninput:v=>{PN.lam=Math.pow(10,Math.log10(400e-9)+v/1000*(Math.log10(12e-6)-Math.log10(400e-9)));pnRender()}});
  PN.lam=Math.pow(10,Math.log10(400e-9)+.25*(Math.log10(12e-6)-Math.log10(400e-9)));
  TL.statGrid(TL.el('pn-read'),[{id:'pn-l',label:'comprimento de onda',kind:'hot'},{id:'pn-a',label:'coef. absorção α'},{id:'pn-d',label:'penetração 1/α',kind:'ok'}]);
  PN.v=TL.Engine.add({el:TL.el('pn-cv'),tab:'transferencia',static:true,draw(){pnDraw(TL.el('pn-cv'))}});
  pnRender();}
 // mini-piscina
 if(!TL.el('mini-cv'))return;
 const ctl=TL.el('mini-ctl');
 MINI.onT=TL.makeToggle(ctl,{label:'Fonte de radiação IR',ico:'heater',val:true,onchange:v=>{MINI.on=v;MINI.sim.cfg.on=v;TL.Sound.play(v?'power':'off')}});
 MINI.hP=TL.makeRange(ctl,{label:'Potência do emissor',min:.5,max:6,step:.1,val:3,unit:'kW',color:'var(--orange)',oninput:v=>{MINI.P=v;MINI.sim.cfg.P=v}});
 MINI.hD=TL.makeRange(ctl,{label:'Distância fonte → água',min:.3,max:2.5,step:.05,val:.8,unit:'m',dec:2,color:'var(--yellow)',oninput:v=>{MINI.d=v;MINI.sim.cfg.dist=v}});
 MINI.hT=TL.makeRange(ctl,{label:'Temperatura inicial (reinicia)',min:10,max:30,step:.5,val:22,unit:'°C',color:'var(--cyan)',oninput:v=>{MINI.T0=v;miniReset()}});
 TL.makeSelect(ctl,{label:'Velocidade da simulação',options:[[5,'1 s = 5 min'],[20,'1 s = 20 min'],[60,'1 s = 60 min'],[180,'1 s = 3 h']],val:20,onchange:v=>MINI.speed=+v});
 MINI.chart=new TL.LineChart(TL.el('mini-chart'),{aria:'Temperatura da mini-piscina ao longo do tempo em minutos',fmtX:v=>TL.fmt(v,0)+' min',fmtY:v=>TL.fmt(v,1)+' °C',yMin:10,empty:'Inicie a simulação…'});
 TL.Charts.push({tab:'transferencia',chart:MINI.chart});
 TL.statGrid(TL.el('mini-stats'),[{id:'mini-t',label:'temperatura da água',kind:'hot'},{id:'mini-rate',label:'taxa de aquecimento'},{id:'mini-pabs',label:'potência absorvida',kind:'ok'},{id:'mini-loss',label:'perdas totais',kind:'vio'},{id:'mini-kwh',label:'energia entregue'}]);
 const lb=document.createElement('div');lb.id='mini-loss-bars';TL.el('mini-loss').appendChild(lb);
 TL.el('mini-play').addEventListener('click',()=>{MINI.running=!MINI.running;
  TL.el('mini-play').textContent=MINI.running?'⏸ Pausar':'▶ Retomar';TL.Sound.play(MINI.running?'on':'off')});
 TL.el('mini-reset').addEventListener('click',()=>{miniReset();MINI.running=true;TL.el('mini-play').textContent='⏸ Pausar';TL.Sound.play('power');TL.toast('Mini-piscina reiniciada','info',2000)});
 TL.Engine.add({el:TL.el('mini-cv'),tab:'transferencia',sim:true,ignoreVis:false,draw(dt,t,v){miniDraw(dt,t,TL.el('mini-cv'),v)}});
 miniReset();
 let liveT=0;TL.Bus.on('tab',id=>{if(id==='transferencia'&&Date.now()-liveT>8000){liveT=Date.now();
  const s=MINI.sim;if(s)TL.el('mini-live').textContent='Mini-piscina: '+TL.fmt(s.Tw,1)+' graus Celsius.';}});
});
})();