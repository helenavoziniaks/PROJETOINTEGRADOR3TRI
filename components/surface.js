/* Absorção / reflexão / transmissão — fótons + sliders conservativos ✔ */
'use strict';
(function(){
const TL=window.TL;
const SF={a:96,r:4,t:0,mat:'agua',heat:0,phot:[],burst:[]};
const MATS={
 agua:{n:'Água · IR distante',v:[96,4,0],note:'A água absorve quase todo o IR distante (>3 µm) em menos de 1 mm. O aquecimento direto concentra-se na superfície — de onde a evaporação rouba energia.'},
 metal:{n:'Metal polido',v:[5,95,0],note:'Metais polidos refletem ~95% do IR. Por isso mantas térmicas e garrafas espelhadas funcionam: devolvem a radiação ao corpo quente.'},
 preto:{n:'Preto fosco',v:[95,5,0],note:'Superfícies escuras e foscas são excelentes absorvedoras — e também boas emissoras. É o princípio dos coletores solares e das placas absorvedoras.'},
 vidro:{n:'Vidro · luz visível',v:[8,8,84],note:'O vidro transmite a luz visível, mas bloqueia o IR distante: a luz entra, aquece o interior, e o IR não sai — o efeito estufa das estufas e dos carros ao sol.'}};
function linked(key,val){
 SF[key]=val;const others=['a','r','t'].filter(k=>k!==key);
 const rem=100-val,s=SF[others[0]]+SF[others[1]];
 const n1=s>0?Math.round(rem*SF[others[0]]/s):Math.round(rem/2);
 SF[others[0]]=n1;SF[others[1]]=rem-n1;
 others.forEach(k=>SF.h[k].set(SF[k],true));sync();}
function sync(){
 TL.el('sf-sum').innerHTML='<span class="fx">α</span><span class="res">'+SF.a+'%</span><span class="op">+</span><span class="fx">ρ</span><span class="res" style="color:var(--cyan)">'+SF.r+'%</span><span class="op">+</span><span class="fx">τ</span><span class="res" style="color:var(--violet)">'+SF.t+'%</span><span class="op">=</span><span class="fm">100% ✔ energia conservada</span>';
 if(SF.v)SF.v.dirty=true;}
function draw(dt,t,cv){
 if(!TL.fitCanvas(cv)&&!cv._w)return;const c=cv._ctx,W=cv._w,H=cv._h;
 c.clearRect(0,0,W,H);
 const sx=W*.26,sw=W*.48,sy=H*.44,sh=H*.2;
 // spawn de fótons
 if(TL.A11y.motion&&dt>0){SF._acc=(SF._acc||0)+dt;
  while(SF._acc>.07){SF._acc-=.07;if(SF.phot.length<110){
   const roll=Math.random()*100,fate=roll<SF.a?'a':roll<SF.a+SF.r?'r':'t';
   SF.phot.push({x:W*.06,y:H*.05,tx:sx+Math.random()*sw,fate,ph:0});}}}
 // slab por material
 let fill,stroke='rgba(126,240,255,.5)';
 if(SF.mat==='agua'){fill='rgba(32,141,255,.55)'}
 else if(SF.mat==='metal'){const g=c.createLinearGradient(sx,sy,sx+sw,sy);g.addColorStop(0,'#9fb4c8');g.addColorStop(.5,'#e8f2fa');g.addColorStop(1,'#7d94aa');fill=g;}
 else if(SF.mat==='preto'){fill='#141414';stroke='rgba(255,255,255,.3)'}
 else{fill='rgba(126,240,255,.14)'}
 c.fillStyle=fill;c.fillRect(sx,sy,sw,sh);c.strokeStyle=stroke;c.lineWidth=1.5;c.strokeRect(sx,sy,sw,sh);
 // calor acumulado
 SF.heat=TL.lerp(SF.heat,SF.a/100,dt>0?dt*1.5:1);
 if(SF.heat>.03){const g=c.createRadialGradient(sx+sw/2,sy+sh/2,4,sx+sw/2,sy+sh/2,sw*.55);
  g.addColorStop(0,'rgba(255,118,46,'+(.55*SF.heat)+')');g.addColorStop(1,'rgba(255,118,46,0)');
  c.fillStyle=g;c.fillRect(sx-30,sy-30,sw+60,sh+60);}
 // setas estáticas (informativas mesmo sem animação)
 const arrow=(x0,y0,x1,y1,col,wd,label)=>{c.strokeStyle=col;c.lineWidth=wd;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();
  const a=Math.atan2(y1-y0,x1-x0);c.beginPath();c.moveTo(x1,y1);c.lineTo(x1-10*Math.cos(a-.4),y1-10*Math.sin(a-.4));c.moveTo(x1,y1);c.lineTo(x1-10*Math.cos(a+.4),y1-10*Math.sin(a+.4));c.stroke();
  c.fillStyle=col;c.font='11px JetBrains Mono,monospace';c.textAlign='center';c.fillText(label,(x0+x1)/2,(y0+y1)/2-8);};
 arrow(W*.1,H*.1,sx+sw*.3,sy,'rgba(255,200,87,.8)',2+SF.a*.06,'α '+SF.a+'%');
 arrow(sx+sw*.55,sy,sx+sw*.9,H*.08,'rgba(57,221,242,.8)',2+SF.r*.06,'ρ '+SF.r+'%');
 arrow(sx+sw*.45,sy+sh,sx+sw*.6,H*.94,'rgba(143,123,255,.8)',2+SF.t*.06,'τ '+SF.t+'%');
 // fótons
 const spd=260;
 SF.phot=SF.phot.filter(p=>{
  const dx=p.tx-p.x,dy=sy-p.y,d=Math.hypot(dx,dy);
  if(p.ph===0){if(d<6||dt===0){if(dt===0)return true;p.ph=1;
    if(p.fate==='a'){for(let i=0;i<5;i++)SF.burst.push({x:p.tx,y:sy,vx:(Math.random()-.5)*90,vy:-Math.random()*70,l:.5});return false}
    if(p.fate==='r'){p.vx=spd*.6;p.vy=-spd*.5}else{p.vx=dx/d*spd*.55;p.vy=dy/d*spd*.55}
   }else{p.x+=dx/d*spd*dt;p.y+=dy/d*spd*dt;}}
  else{p.x+=p.vx*dt;p.y+=p.vy*dt;}
  const col=p.fate==='a'?'255,200,87':p.fate==='r'?'57,221,242':'143,123,255';
  c.fillStyle='rgba('+col+',.9)';c.beginPath();c.arc(p.x,p.y,2.4,0,7);c.fill();
  return p.x>-20&&p.x<W+20&&p.y>-20&&p.y<H+20;});
 SF.burst=SF.burst.filter(b=>{b.l-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=160*dt;
  c.fillStyle='rgba(255,118,46,'+Math.max(0,b.l*2)+')';c.beginPath();c.arc(b.x,b.y,2,0,7);c.fill();return b.l>0;});
 c.fillStyle=TL.Pal.dim;c.font='10px JetBrains Mono,monospace';c.textAlign='left';
 c.fillText(MATS[SF.mat].n,sx,sy+sh+16);}
TL.modules.push(function(){
 const cv=TL.el('sf-cv');if(!cv)return;
 SF.h={};
 [['a','Absorção α (vira calor)','var(--orange)'],['r','Reflexão ρ (devolve)','var(--cyan)'],['t','Transmissão τ (atravessa)','var(--violet)']].forEach(([k,lb,col])=>{
  SF.h[k]=TL.makeRange(TL.el('sf-ctl'),{label:lb,min:0,max:100,step:1,val:SF[k],unit:'%',dec:0,color:col,oninput:v=>linked(k,Math.round(v))});});
 Object.entries(MATS).forEach(([id,m])=>{const b=document.createElement('button');b.type='button';b.className='btn sm ghost';b.textContent=m.n;
  b.addEventListener('click',()=>{SF.mat=id;[SF.a,SF.r,SF.t]=m.v;['a','r','t'].forEach(k=>SF.h[k].set(SF[k],true));
   TL.el('sf-mat-tag').textContent=m.n.toLowerCase();TL.el('sf-note').innerHTML='<b>'+m.n+':</b> '+m.note;sync();TL.Sound.play('click')});
  TL.el('sf-presets').appendChild(b);});
 TL.el('sf-note').innerHTML='<b>Água · IR distante:</b> '+MATS.agua.note;
 SF.v=TL.Engine.add({el:cv,tab:'radiacao',draw(dt,t){draw(dt,t,cv)}});
 sync();});
})();