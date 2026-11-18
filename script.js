/* ============================================================
   THERMAL SCIENCE EXPERIENCE — script.js (núcleo)
   Componentes em /components/*.js registram-se em TL.modules.
   ============================================================ */
'use strict';
window.TL = window.TL || {};
(function(){
const TL = window.TL;

/* ---------- helpers ✔ ---------- */
TL.$ = s=>document.querySelector(s);
TL.$$ = s=>[...document.querySelectorAll(s)];
TL.el = id=>document.getElementById(id);
TL.clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
TL.lerp=(a,b,t)=>a+(b-a)*t;
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
TL.sup=n=>String(n).split('').map(c=>SUP[c]||c).join('');
TL.fmt=(n,d=1)=>Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
TL.fmtInt=n=>Number.isFinite(n)?Math.round(n).toLocaleString('pt-BR'):'—';
TL.fmtSci=(n,d=2)=>{if(!Number.isFinite(n)||n===0)return'0';const e=Math.floor(Math.log10(Math.abs(n)));return TL.fmt(n/Math.pow(10,e),d)+' × 10'+TL.sup(e);};
TL.money=n=>Number.isFinite(n)?'R$ '+TL.fmt(n,2):'—';
TL.fmtDur=s=>{if(!Number.isFinite(s))return'∞';if(s<=0)return'0 min';const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);if(d>0)return d+' d '+h+' h';if(h>0)return h+' h '+m+' min';return m+' min';};
TL.fmtLen=l=>l>=1?TL.fmt(l,2)+' m':l>=1e-2?TL.fmt(l*100,1)+' cm':l>=1e-3?TL.fmt(l*1e3,1)+' mm':l>=1e-6?TL.fmt(l*1e6,1)+' µm':TL.fmt(l*1e9,1)+' nm';
TL.fmtWave=l=>l>=1?TL.fmt(l,1)+' m':l>=1e-3?TL.fmt(l*1e3,1)+' mm':l>=1e-6?TL.fmt(l*1e6,2)+' µm':TL.fmt(l*1e9,0)+' nm';
TL.fmtFreq=f=>f>=1e18?TL.fmt(f/1e18,1)+' EHz':f>=1e15?TL.fmt(f/1e15,1)+' PHz':f>=1e12?TL.fmt(f/1e12,1)+' THz':f>=1e9?TL.fmt(f/1e9,1)+' GHz':f>=1e6?TL.fmt(f/1e6,1)+' MHz':f>=1e3?TL.fmt(f/1e3,1)+' kHz':TL.fmt(f,0)+' Hz';
TL.fmtEv=e=>e>=1?TL.fmt(e,2)+' eV':e>=1e-3?TL.fmt(e*1e3,2)+' meV':TL.fmt(e*1e6,1)+' µeV';
TL.esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
TL.C0=299792458; TL.H=6.62607015e-34; TL.KB=1.380649e-23;
TL.WIEN=2.897771955e-3; TL.SIGMA=5.670374419e-8;
TL.icon=(n,cls)=>'<svg class="ic '+(cls||'')+'" aria-hidden="true"><use href="assets/icons/icons.svg#i-'+n+'"></use></svg>';

/* ---------- persistência & bus ✔ ---------- */
TL.P={d:{},load(){try{TL.P.d=JSON.parse(localStorage.getItem('thermal-cep')||'{}')}catch(e){TL.P.d={}}},
 save(){try{localStorage.setItem('thermal-cep',JSON.stringify(TL.P.d))}catch(e){}}};
let saveT=null; TL.saveSoon=()=>{clearTimeout(saveT);saveT=setTimeout(()=>TL.P.save(),350)};
TL.Bus={m:{},on(e,f){(TL.Bus.m[e]=TL.Bus.m[e]||[]).push(f)},emit(e,d){(TL.Bus.m[e]||[]).forEach(f=>f(d))}};

/* ---------- toasts ✔ ---------- */
TL.toast=function(msg,kind,ms){kind=kind||'info';ms=ms||3600;
 const box=TL.el('toasts');if(!box)return;if(box.children.length>3)box.firstChild.remove();
 const t=document.createElement('div');t.className='toast '+(kind==='info'?'':kind);
 t.innerHTML='<span aria-hidden="true">'+(kind==='ok'?'✔':kind==='warn'?'⚠':kind==='err'?'✖':'ℹ')+'</span><span>'+msg+'</span>';
 box.appendChild(t);setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),350)},ms);};

/* ---------- som WebAudio ✔ ---------- */
TL.Sound={ctx:null,master:null,
 ensure(){if(this.ctx)return;try{const AC=window.AudioContext||window.webkitAudioContext;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.9;this.master.connect(this.ctx.destination)}catch(e){}},
 tone(f,d,type,g,f2,at){const c=this.ctx,t=c.currentTime+(at||0);const o=c.createOscillator(),ga=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);ga.gain.setValueAtTime(g||.05,t);ga.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(ga);ga.connect(this.master);o.start(t);o.stop(t+d+.03)},
 play(n){if(!TL.A11y.sound)return;this.ensure();if(!this.ctx)return;if(this.ctx.state==='suspended')this.ctx.resume();const T=this.tone.bind(this);
  if(n==='click')T(660,.06,'sine',.04);
  else if(n==='tab')T(440,.1,'sine',.045,660);
  else if(n==='on')T(500,.13,'sine',.055,860);
  else if(n==='off')T(640,.13,'sine',.045,320);
  else if(n==='power'){T(95,.4,'sine',.08,52);T(1100,.28,'sine',.02,260)}
  else if(n==='ok'){T(523,.12,'triangle',.055);T(659,.12,'triangle',.055,0,.08);T(784,.16,'triangle',.055,0,.16)}
  else if(n==='bad')T(185,.24,'sawtooth',.04,120);
  else if(n==='win'){[523,659,784,1046,1318].forEach((f,i)=>T(f,.14,'triangle',.055,0,i*.085))}
  else if(n==='pop')T(880,.05,'square',.025);}};

/* ---------- acessibilidade ✔ ---------- */
TL.A11y={font:100,contrast:false,easy:false,dyslex:false,motion:true,sound:true,
 load(){const a=TL.P.d.a11y||{};this.font=a.font||100;this.contrast=!!a.contrast;this.easy=!!a.easy;this.dyslex=!!a.dyslex;
  this.motion=a.motion!==undefined?!!a.motion:!window.matchMedia('(prefers-reduced-motion: reduce)').matches;this.sound=a.sound!==false;},
 persist(){TL.P.d.a11y={font:this.font,contrast:this.contrast,easy:this.easy,dyslex:this.dyslex,motion:this.motion,sound:this.sound};TL.saveSoon()},
 apply(){const r=document.documentElement;r.classList.toggle('hc',this.contrast);r.classList.toggle('easy',this.easy);r.classList.toggle('dys',this.dyslex);r.classList.toggle('nomo',!this.motion);
  r.style.fontSize=(16*this.font/100)+'px';
  if(!this.motion)TL.$$('.reveal').forEach(x=>x.classList.add('in'));
  TL.refreshPal();TL.Engine.list.forEach(v=>v.dirty=true);TL.Bus.emit('theme');TL.Bus.emit('a11y');this.persist();},
 act(k){let msg='';
  if(k==='font+'){this.font=TL.clamp(this.font+10,80,170);msg='Fonte: '+this.font+'%'}
  else if(k==='font-'){this.font=TL.clamp(this.font-10,80,170);msg='Fonte: '+this.font+'%'}
  else if(k==='axreset'){this.font=100;this.contrast=false;this.easy=false;this.dyslex=false;this.motion=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;this.sound=true;msg='Preferências restauradas'}
  else if(k in this&&typeof this[k]==='boolean'){this[k]=!this[k];const nm={contrast:'Alto contraste',easy:'Leitura simplificada',dyslex:'Fonte para dislexia',motion:'Animações',sound:'Sons'};msg=nm[k]+': '+(this[k]?'ativado':'desativado');}
  this.apply();TL.Sound.play(this[k]===false?'off':'on');if(msg)TL.toast(msg,'info',2200);}};
TL.Bus.on('a11y',()=>{
 TL.$$('[data-ax]').forEach(b=>{const k=b.dataset.ax;
  if(['contrast','easy','dyslex','motion','sound'].includes(k))b.setAttribute(b.classList.contains('sw')?'aria-checked':'aria-pressed',String(!!TL.A11y[k]));
  if(k==='font+')b.disabled=TL.A11y.font>=170;if(k==='font-')b.disabled=TL.A11y.font<=80;});
 TL.$$('[data-fontval]').forEach(s=>s.textContent=TL.A11y.font+'%');
 TL.$$('[data-ax="sound"] .ic use').forEach(u=>u.setAttribute('href','assets/icons/icons.svg#i-'+(TL.A11y.sound?'sound':'soundoff')));});
TL.buildA11yUI=function(mount){
 const rows=[['contrast','Alto contraste','contrast'],['easy','Leitura simplificada','book'],['dyslex','Fonte amigável para dislexia','eye'],['motion','Animações','motion'],['sound','Sons de feedback','sound']];
 let h='<div class="switchrow"><span class="lb">'+TL.icon('keyboard')+' Tamanho da fonte · <b data-fontval style="color:var(--cyan)">100%</b></span><span style="display:flex;gap:.35rem"><button type="button" class="qbtn" data-ax="font-" aria-label="Diminuir fonte">A−</button><button type="button" class="qbtn" data-ax="font+" aria-label="Aumentar fonte">A+</button></span></div>';
 rows.forEach(r=>{h+='<div class="switchrow"><span class="lb">'+TL.icon(r[2])+' '+r[1]+'</span><button type="button" class="sw coolsw" role="switch" data-ax="'+r[0]+'" aria-checked="false" aria-label="'+r[1]+'"></button></div>';});
 h+='<div class="btnrow"><button type="button" class="btn sm ghost" data-ax="axreset">↺ Restaurar padrões</button></div>';
 mount.innerHTML=h;};
document.addEventListener('click',e=>{const b=e.target.closest('[data-ax]');if(b)TL.A11y.act(b.dataset.ax)});

/* ---------- paleta & motor único rAF ✔ ---------- */
TL.Pal={};
TL.refreshPal=function(){const cs=getComputedStyle(document.documentElement);
 ['ink','dim','faint','line','blue','cyan','teal','orange','yellow','red','violet','magenta','navy','deep','white','focus'].forEach(k=>TL.Pal[k]=cs.getPropertyValue('--'+k).trim());
 TL.Pal.hc=document.documentElement.classList.contains('hc');};
TL.fitCanvas=function(c){const r=c.getBoundingClientRect();if(r.width<10||r.height<10)return false;
 const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);
 if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
 c._w=r.width;c._h=r.height;c._ctx=c.getContext('2d');c._ctx.setTransform(dpr,0,0,dpr,0,0);return true;};
TL.RO=new ResizeObserver(es=>{es.forEach(en=>{const v=en.target._v;if(v){TL.fitCanvas(v.el);v.dirty=true;if(v.chart)v.chart.fit();}})});
TL.visIO=new IntersectionObserver(es=>es.forEach(en=>{const v=en.target._v;if(v)v.vis=en.isIntersecting}),{threshold:.05});
TL.Engine={list:[],last:0,started:false,
 add(v){v.vis=!!v.ignoreVis;v.dirty=true;v.el._v=v;TL.RO.observe(v.el);if(!v.ignoreVis)TL.visIO.observe(v.el);this.list.push(v);return v},
 start(){if(this.started)return;this.started=true;requestAnimationFrame(this.tick.bind(this))},
 tick(t){requestAnimationFrame(this.tick.bind(this));const dt=Math.min(.05,(t-this.last)/1000||0);this.last=t;
  if(document.hidden)return;const ts=t/1000;
  for(const v of this.list){
   if(v.tab&&v.tab!==TL.App.tab)continue;
   if(v.sim){v.draw(dt,ts,v);v.dirty=false;continue}
   if(!v.vis)continue;
   if(v.static&&!v.dirty)continue;
   if(!TL.A11y.motion&&!v.dirty)continue;
   v.draw(TL.A11y.motion?dt:0,ts,v);v.dirty=false;
  }}};
window.addEventListener('resize',()=>{TL.Engine.list.forEach(v=>{TL.fitCanvas(v.el);v.dirty=true});TL.measureNav();});

/* ---------- controles reutilizáveis ✔ ---------- */
let ctlSeq=0;
TL.makeRange=function(mount,o){
 const id=o.id||('ctl'+(++ctlSeq));const d=document.createElement('div');d.className='ctl';
 d.innerHTML='<div class="ctl-top"><label for="'+id+'">'+o.label+'</label><span style="display:flex;gap:.45rem;align-items:baseline">'+(o.num?'<input class="num" type="number" inputmode="decimal" id="'+id+'-n" min="'+o.min+'" max="'+o.max+'" step="'+(o.step||1)+'" aria-label="'+o.label+' (valor numérico)">':'')+'<output id="'+id+'-o" for="'+id+'"></output></span></div><input type="range" id="'+id+'" min="'+o.min+'" max="'+o.max+'" step="'+(o.step||1)+'" value="'+o.val+'" aria-label="'+o.label+'">';
 mount.appendChild(d);
 const r=d.querySelector('input[type=range]'),out=d.querySelector('output'),num=d.querySelector('.num');
 const show=v=>{out.textContent=(o.fmt?o.fmt(v):TL.fmt(v,o.dec!==undefined?o.dec:1))+(o.unit?' '+o.unit:'');
  const p=(v-o.min)/(o.max-o.min)*100;r.style.background='linear-gradient(90deg,'+(o.color||'var(--acc,var(--orange))')+' '+p+'%,var(--deep) '+p+'%)';};
 let val=o.val;
 const set=(v,silent)=>{v=TL.clamp(v,o.min,o.max);val=v;r.value=v;if(num&&document.activeElement!==num)num.value=v;show(v);if(!silent&&o.oninput)o.oninput(v)};
 r.addEventListener('input',()=>{val=parseFloat(r.value);if(num)num.value=val;show(val);TL.Sound.play('pop');if(o.oninput)o.oninput(val)});
 if(num){num.value=val;
  num.addEventListener('input',()=>{const v=parseFloat(num.value);if(Number.isFinite(v)&&v>=o.min&&v<=o.max){val=v;r.value=v;show(v);if(o.oninput)o.oninput(v)}});
  num.addEventListener('change',()=>{let v=parseFloat(num.value);if(!Number.isFinite(v))v=val;set(v)});}
 set(val,true);
 return {set,get:()=>val,row:d,input:r};};
TL.makeToggle=function(mount,o){
 const d=document.createElement('div');d.className='switchrow';
 d.innerHTML='<span class="lb">'+(o.ico?TL.icon(o.ico):'')+' '+o.label+'</span><button type="button" class="sw'+(o.cool?' coolsw':'')+'" role="switch" aria-checked="'+!!o.val+'" aria-label="'+o.label+'"></button>';
 mount.appendChild(d);const b=d.querySelector('.sw');let val=!!o.val;
 const set=(v,silent)=>{val=!!v;b.setAttribute('aria-checked',String(val));if(!silent&&o.onchange)o.onchange(val)};
 b.addEventListener('click',()=>{set(!val);TL.Sound.play(val?'on':'off')});
 return {set,get:()=>val,row:d};};
TL.makeSelect=function(mount,o){
 const id='sel'+(++ctlSeq);const d=document.createElement('div');d.className='ctl';
 d.innerHTML='<div class="ctl-top"><label for="'+id+'">'+o.label+'</label></div><select id="'+id+'">'+o.options.map(op=>'<option value="'+op[0]+'"'+(op[0]===o.val?' selected':'')+'>'+op[1]+'</option>').join('')+'</select>';
 mount.appendChild(d);const s=d.querySelector('select');
 s.addEventListener('change',()=>{TL.Sound.play('click');if(o.onchange)o.onchange(s.value)});
 return {set:v=>{s.value=v},get:()=>s.value,row:d};};
TL.statGrid=function(mount,items){const map={};mount.innerHTML='';items.forEach(it=>{const d=document.createElement('div');d.className='stat';d.innerHTML='<div class="v '+(it.kind||'')+'" id="'+it.id+'">—</div><div class="l">'+it.label+'</div>';mount.appendChild(d);map[it.id]=d.querySelector('.v')});return map;};
TL.setTxt=(id,t)=>{const e=TL.el(id);if(e)e.textContent=t};
TL.barRow=(label,color,val,max,txt)=>{const p=max>0?TL.clamp(Math.abs(val)/max*100,0,100):0;
 return '<div class="brow"><span class="bl"><i style="background:'+color+'"></i>'+label+'</span><span class="track"><span class="fill" style="width:'+p+'%;background:'+color+'"></span></span><span class="bv">'+txt+'</span></div>';};

/* ---------- LineChart interativo ✔ (validado) ---------- */
TL.CHART_COLORS=['#39DDF2','#FF762E','#25D6A4','#8F7BFF','#FFC857','#FF4FA3','#208DFF','#FF5D6C'];
TL.LineChart=class{
 constructor(host,o){this.host=host;host.classList.add('chart');
  this.o=Object.assign({series:[],bands:[],fmtX:v=>TL.fmt(v,0),fmtY:v=>TL.fmt(v,1),height:null,empty:'Aguardando dados…',aria:'Gráfico de linhas interativo'},o);
  this.cv=document.createElement('canvas');this.cv.setAttribute('role','img');this.cv.setAttribute('aria-label',this.o.aria);
  this.tip=document.createElement('div');this.tip.className='chart-tip';
  this.leg=document.createElement('div');this.leg.className='chart-legend';
  host.append(this.cv,this.tip,this.leg);this.ctx=this.cv.getContext('2d');
  this.hidden=new Set();this.hover=null;this._raf=false;
  this.cv._v={el:this.cv,chart:this,dirty:true};TL.RO.observe(this.cv);
  const mv=e=>{const r=this.cv.getBoundingClientRect();this.hover={x:e.clientX-r.left,y:e.clientY-r.top};this.draw()};
  this.cv.addEventListener('pointermove',mv);this.cv.addEventListener('pointerdown',mv);
  this.cv.addEventListener('pointerleave',()=>{this.hover=null;this.tip.style.display='none';this.draw()});
  TL.Bus.on('theme',()=>this.draw());this.buildLegend();this.fit();}
 series(id){let s=this.o.series.find(x=>x.id===id);
  if(!s){s={id,name:id,color:TL.CHART_COLORS[this.o.series.length%8],points:[]};this.o.series.push(s);this.buildLegend()}return s}
 setSeries(id,name,color,pts,dash){const s=this.series(id);s.name=name;s.color=color;s.points=pts;if(dash!==undefined)s.dash=dash;this.buildLegend();this.schedule()}
 clearAll(keepLive){this.o.series=this.o.series.filter(s=>keepLive&&s.id==='live');this.buildLegend();this.schedule()}
 buildLegend(){this.leg.innerHTML='';this.o.series.forEach(s=>{const b=document.createElement('button');
  b.type='button';b.className='lg';b.setAttribute('aria-pressed',String(!this.hidden.has(s.id)));
  b.innerHTML='<i style="background:'+s.color+'"></i>'+TL.esc(s.name);
  b.setAttribute('aria-label','Alternar série '+TL.esc(s.name));
  b.addEventListener('click',()=>{this.hidden.has(s.id)?this.hidden.delete(s.id):this.hidden.add(s.id);
   b.setAttribute('aria-pressed',String(!this.hidden.has(s.id)));TL.Sound.play('click');this.draw()});
  this.leg.appendChild(b)})}
 fit(){const r=this.host.getBoundingClientRect();if(r.width<40)return;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  this.w=r.width;this.h=this.o.height||TL.clamp(r.width*.42,190,300);
  this.cv.width=Math.round(this.w*dpr);this.cv.height=Math.round(this.h*dpr);this.cv.style.height=this.h+'px';
  this.ctx.setTransform(dpr,0,0,dpr,0,0);this.draw()}
 schedule(){if(this._raf)return;this._raf=true;requestAnimationFrame(()=>{this._raf=false;this.draw()})}
 draw(){if(!this.w||this.w<40)return;const c=this.ctx,w=this.w,h=this.h,pad={l:48,r:14,t:14,b:28};
  c.clearRect(0,0,w,h);
  const vis=this.o.series.filter(s=>!this.hidden.has(s.id)&&s.points.length);
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  vis.forEach(s=>s.points.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}));
  this.o.bands.forEach(b=>{y0=Math.min(y0,b.y0);y1=Math.max(y1,b.y1)});
  if(this.o.yMin!==undefined)y0=Math.min(y0,this.o.yMin);
  if(this.o.yMax!==undefined)y1=Math.max(y1,this.o.yMax);
  if(!Number.isFinite(x0)){c.fillStyle=TL.Pal.faint;c.font='12px JetBrains Mono,monospace';c.textAlign='center';c.fillText(this.o.empty,w/2,h/2);this.tip.style.display='none';return}
  if(x1-x0<1e-9)x1=x0+1;if(y1-y0<1e-9){y0-=1;y1+=1}
  const yp=(y1-y0)*.1;y0-=yp;y1+=yp;
  const X=v=>pad.l+(v-x0)/(x1-x0)*(w-pad.l-pad.r),Y=v=>h-pad.b-(v-y0)/(y1-y0)*(h-pad.t-pad.b);
  const grid=TL.Pal.hc?'rgba(255,255,255,.3)':'rgba(96,170,255,.12)';
  const nice=(a,b,n)=>{const raw=(b-a)/n,mag=Math.pow(10,Math.floor(Math.log10(raw))),nm=raw/mag;return (nm<1.5?1:nm<3.5?2:nm<7.5?5:10)*mag};
  c.font='10px JetBrains Mono,monospace';c.textAlign='right';c.textBaseline='middle';
  const ys=nice(y0,y1,5);
  for(let v=Math.ceil(y0/ys)*ys;v<=y1;v+=ys){c.strokeStyle=grid;c.lineWidth=1;c.beginPath();c.moveTo(pad.l,Y(v));c.lineTo(w-pad.r,Y(v));c.stroke();c.fillStyle=TL.Pal.dim;c.fillText(this.o.fmtY(v),pad.l-6,Y(v))}
  const xs=nice(x0,x1,6);c.textAlign='center';c.textBaseline='top';
  for(let v=Math.ceil(x0/xs)*xs;v<=x1;v+=xs){c.strokeStyle=grid;c.beginPath();c.moveTo(X(v),pad.t);c.lineTo(X(v),h-pad.b);c.stroke();c.fillStyle=TL.Pal.dim;c.fillText(this.o.fmtX(v),X(v),h-pad.b+6)}
  this.o.bands.forEach(b=>{c.fillStyle=b.color;c.fillRect(pad.l,Y(b.y1),w-pad.l-pad.r,Y(b.y0)-Y(b.y1));
   if(b.label){c.fillStyle=TL.Pal.dim;c.textAlign='left';c.textBaseline='bottom';c.fillText(b.label,pad.l+6,Y(b.y1)-3)}});
  vis.forEach(s=>{c.save();c.strokeStyle=s.color;c.lineWidth=2.4;if(s.dash)c.setLineDash(s.dash);
   c.shadowColor=s.color;c.shadowBlur=TL.Pal.hc?0:6;c.beginPath();
   s.points.forEach((p,i)=>{const x=X(p[0]),y=Y(p[1]);i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke();
   if(s.area&&s.points.length>1){c.shadowBlur=0;c.lineTo(X(s.points[s.points.length-1][0]),h-pad.b);c.lineTo(X(s.points[0][0]),h-pad.b);c.closePath();
    const g=c.createLinearGradient(0,pad.t,0,h-pad.b);g.addColorStop(0,s.color+'44');g.addColorStop(1,s.color+'00');c.fillStyle=g;c.fill()}
   c.restore()});
  if(this.hover&&this.hover.x>=pad.l&&this.hover.x<=w-pad.r){
   const xv=x0+(this.hover.x-pad.l)/(w-pad.l-pad.r)*(x1-x0);
   c.strokeStyle=TL.Pal.hc?'#fff':'rgba(255,200,87,.6)';c.setLineDash([4,4]);c.lineWidth=1;
   c.beginPath();c.moveTo(this.hover.x,pad.t);c.lineTo(this.hover.x,h-pad.b);c.stroke();c.setLineDash([]);
   let html='<div class="tx">'+this.o.fmtX(xv)+'</div>';let any=false;
   vis.forEach(s=>{let best=null,bd=Infinity;
    s.points.forEach(p=>{const d=Math.abs(p[0]-xv);if(d<bd){bd=d;best=p}});
    if(best){any=true;html+='<div class="tr"><i style="background:'+s.color+'"></i>'+TL.esc(s.name)+': <b>'+this.o.fmtY(best[1])+'</b></div>';
     c.fillStyle=s.color;c.beginPath();c.arc(X(best[0]),Y(best[1]),4,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=1.4;c.stroke()}});
   if(any){this.tip.innerHTML=html;this.tip.style.display='block';
    const tw=this.tip.offsetWidth;this.tip.style.left=TL.clamp(this.hover.x+14,4,w-tw-4)+'px';this.tip.style.top='10px';}
  } else this.tip.style.display='none';}
};
TL.Charts=[];

/* ---------- física compartilhada ✔ (17/17 testes) ---------- */
TL.Phys={CW:4186,RHO:1000,PATM:91000,
 pSat:T=>610.94*Math.exp(17.625*T/(T+243.04)),
 losses(o){const F=o.cover||0;
  const dp=Math.max(0,(TL.Phys.pSat(o.Tw)-TL.clamp(o.rh,1,100)/100*TL.Phys.pSat(o.Tair))/1000);
  const evapKgH=o.area*(0.065+0.052*o.wind)*dp*(1-.92*F);
  const evap=evapKgH/3600*2.45e6;
  const conv=(5.7+3.8*o.wind)*o.area*(o.Tw-o.Tair)*(1-.75*F);
  const Tsky=o.Tair+273.15-(o.night?16:10);
  const rad=.96*TL.SIGMA*o.area*(Math.pow(o.Tw+273.15,4)-Math.pow(Tsky,4))*(1-.75*F);
  const cond=(o.insulated?.6:2.2)*(o.wallArea||o.area*.35)*(o.Tw-18);
  return {evap,conv,rad,cond,total:evap+conv+rad+cond,evapKgH};}};
TL.PoolSim=class{
 constructor(cfg){this.cfg=cfg;this.reset()}
 reset(){const c=this.cfg;this.Tw=c.T0;this.t=0;this.kWhel=0;this.kWhth=0;this.heaterActive=true;this.coverF=c.cover?1:0;
  this.hist=[[0,c.T0]];this.lastRec=0;this.lastL=TL.Phys.losses(this.env());this.lastIn={th:0,el:0};this.done=false;}
 clock(){return (8+this.t/3600)%24}
 isNight(){const c=this.cfg;if(c.period==='cycle'){const k=this.clock();return k>=18||k<6}return c.period==='night'}
 env(){const c=this.cfg;return {Tw:this.Tw,Tair:c.Tair,wind:c.wind,rh:c.rh,area:c.area,wallArea:c.wallArea,cover:this.coverF,insulated:c.insulated,night:this.isNight()};}
 geomF(d){return 1/(1+Math.pow(d/1.1,2))}
 power(){const c=this.cfg;if(!c.on||!this.heaterActive||c.source==='none')return{th:0,el:0};
  if(c.source==='ir')return{th:c.P*1000*.95*this.geomF(c.dist)*.95*(1-.9*this.coverF),el:c.P*1000};
  if(c.source==='hp'){const cop=Math.max(2.1,4.9-.085*(27-c.Tair));return{th:c.P*1000*cop,el:c.P*1000,cop}}
  if(c.source==='solar'){const k=this.clock();const G=this.isNight()?0:700*Math.max(0,Math.sin(Math.PI*(k-6)/12));
   return{th:G*c.areaCol*.55*(1-.85*this.coverF),el:400,G}}
  return{th:0,el:0};}
 step(dt){const c=this.cfg;
  if(this.Tw>=c.target)this.heaterActive=false;else if(this.Tw<=c.target-.5)this.heaterActive=true;
  const inp=this.power(),L=TL.Phys.losses(this.env());
  this.Tw=TL.clamp(this.Tw+(inp.th-L.total)*dt/(c.m*TL.Phys.CW),-2,45);
  this.t+=dt;this.kWhel+=inp.el*dt/3.6e6;this.kWhth+=inp.th*dt/3.6e6;
  this.lastL=L;this.lastIn=inp;
  if(this.t-this.lastRec>=900){this.hist.push([this.t/3600,this.Tw]);this.lastRec=this.t;if(this.hist.length>1200)this.hist.splice(0,200)}
  if(this.t>=96*3600)this.done=true;}
 run(hours,stepSec){const n=Math.round(hours*3600/stepSec);for(let i=0;i<n;i++)this.step(stepSec);return this.hist}
};

/* ---------- tabs / navegação ✔ ---------- */
TL.TABS=[['inicio','Início','wave','var(--cyan)'],['radiacao','Radiação','ir','var(--orange)'],
 ['transferencia','Transferência','flame','var(--yellow)'],['cep','No CEP','school','var(--blue)'],
 ['laboratorio','Laboratório','flask','var(--teal)'],['simulador','Simulador','pool','var(--cyan)'],
 ['desafio','Desafio','quiz','var(--magenta)']];
TL.App={tab:null,visited:new Set(),
 go(id,scroll){if(scroll===undefined)scroll=true;
  if(id!=='inicio'&&!TL.TABS.some(t=>t[0]===id))id='inicio';
  TL.App.tab=id;TL.App.visited.add(id);TL.P.d.visited=[...TL.App.visited];TL.saveSoon();
  TL.TABS.forEach(t=>{const p=TL.el('panel-'+t[0]),b=TL.el('tab-'+t[0]);
   if(p)p.hidden=t[0]!==id;if(b){b.setAttribute('aria-selected',String(t[0]===id));b.tabIndex=t[0]===id?0:-1}});
  history.replaceState(null,'','#'+id);
  TL.Engine.list.forEach(v=>{if(v.tab===id){TL.fitCanvas(v.el);v.dirty=true}});
  TL.Charts.forEach(ch=>{if(ch.tab===id)ch.chart.fit()});
  const panel=TL.el('panel-'+id);
  if(panel){if(TL.A11y.motion){panel.querySelectorAll('.reveal').forEach(x=>{TL.revealIO.unobserve(x);x.classList.remove('in');TL.revealIO.observe(x)})}
   else panel.querySelectorAll('.reveal').forEach(x=>x.classList.add('in'));}
  TL.Bus.emit('tab',id);TL.updateJourney&&TL.updateJourney();
  if(scroll){const navH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||112;
   const target=id==='inicio'?0:TL.el('paineis').getBoundingClientRect().top+window.scrollY-navH+2;
   window.scrollTo({top:Math.max(0,target),behavior:TL.A11y.motion?'smooth':'auto'});}
  TL.Sound.play('tab');}};
TL.revealIO=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting)en.target.classList.add('in')}),{threshold:.1});
TL.measureNav=()=>{document.documentElement.style.setProperty('--nav-h',TL.el('topbar').offsetHeight+'px')};

/* ---------- hero canvas: água + feixes IR ✔ ---------- */
TL.initHero=function(){
 const cv=TL.el('hero-cv');if(!cv)return;
 const parts=[],phot=[];
 for(let i=0;i<70;i++)parts.push({x:Math.random(),y:Math.random(),s:.4+Math.random()*1.2,v:.02+Math.random()*.05});
 for(let i=0;i<26;i++)phot.push({p:Math.random(),b:i%3});
 TL.Engine.add({el:cv,tab:null,draw(dt,t){if(!TL.fitCanvas(cv)&&!cv._w)return;const c=cv._ctx,W=cv._w,Hh=cv._h;
  c.clearRect(0,0,W,Hh);const horizon=Hh*.52;
  c.fillStyle=TL.Pal.hc?'rgba(255,255,255,.5)':'rgba(96,170,255,.35)';
  parts.forEach(p=>{p.y-=p.v*dt;if(p.y<0)p.y=1;c.globalAlpha=.25+.35*Math.sin(t*p.s*2+p.x*9);c.beginPath();c.arc(p.x*W,p.y*horizon,p.s,0,7);c.fill()});
  c.globalAlpha=1;
  for(let r=0;r<13;r++){const f=r/12,y=horizon+Math.pow(f,1.7)*(Hh-horizon),amp=2+f*9,al=.06+f*.3;
   c.strokeStyle=TL.Pal.hc?'rgba(126,240,255,'+(al+.2)+')':'rgba(57,180,255,'+al+')';c.lineWidth=1+f*1.4;c.beginPath();
   for(let x=0;x<=W;x+=14){const yy=y+Math.sin(x*.014+t*(.7+f)+r*1.7)*amp;x?c.lineTo(x,yy):c.moveTo(x,yy)}c.stroke();}
  const src={x:W*.86,y:-30};
  for(let b=0;b<3;b++){const tx=W*(.42+b*.16),ty=horizon+Hh*.14;
   const g=c.createLinearGradient(src.x,src.y,tx,ty);g.addColorStop(0,'rgba(255,118,46,0)');g.addColorStop(.5,'rgba(255,140,46,'+(TL.Pal.hc?.3:.16)+')');g.addColorStop(1,'rgba(255,200,87,0)');
   c.fillStyle=g;c.beginPath();c.moveTo(src.x+b*14,src.y);c.lineTo(src.x+b*14+26,src.y);c.lineTo(tx+52,ty);c.lineTo(tx-52,ty);c.closePath();c.fill();
   const gg=c.createRadialGradient(tx,ty,0,tx,ty,60);gg.addColorStop(0,'rgba(255,150,50,'+(.22+.1*Math.sin(t*2+b))+')');gg.addColorStop(1,'rgba(255,150,50,0)');
   c.fillStyle=gg;c.beginPath();c.arc(tx,ty,60,0,7);c.fill();}
  phot.forEach(p=>{p.p+=dt*.35;if(p.p>1)p.p=0;const tx=W*(.42+p.b*.16),ty=horizon+Hh*.14;
   c.fillStyle='rgba(255,200,87,'+(1-p.p)*.8+')';c.beginPath();c.arc(TL.lerp(src.x+p.b*14+13,tx,p.p),TL.lerp(src.y,ty,p.p),2.2,0,7);c.fill();});
  c.save();c.shadowColor='#FF762E';c.shadowBlur=24;c.fillStyle='#FF762E';c.fillRect(src.x-10,6,110,10);c.restore();}});
};

/* ---------- marquees ✔ ---------- */
TL.initMarquees=function(){
 const mk=(id,words)=>{const m=TL.el(id);if(!m)return;
  let seq='';words.forEach(w=>{seq+='<span class="'+w[1]+'">'+w[0]+'</span><span class="sep">•</span>';});
  m.innerHTML=seq+seq;}; // duplicado => loop perfeito em translateX(-50%)
 mk('marquee-a',[['INFRARED','fill-w'],['INFRARED','out-c'],['INFRARED','fill-o'],['INFRARED','out-w']]);
 mk('marquee-b',[['THERMAL ENERGY','fill-o'],['THERMAL ENERGY','out-o'],['HEAT TRANSFER','fill-b'],['HEAT TRANSFER','out-c']]);
 mk('marquee-c',[['SCIENCE','out-w'],['ENERGY','fill-y'],['WATER','fill-b'],['SCIENCE','fill-w'],['ENERGY','out-o'],['WATER','out-c']]);
};

/* ---------- jornada / relatório ✔ ---------- */
TL.updateJourney=function(){
 const ring=TL.el('jr-ring'),txt=TL.el('jr-txt'),list=TL.el('jr-list');if(!ring)return;
 const n=TL.App.visited.size,C=326.7;
 ring.style.strokeDashoffset=String(C*(1-n/7));if(txt)txt.textContent=n+'/7';
 if(list)list.innerHTML=TL.TABS.map(t=>'<span class="pl'+(TL.App.visited.has(t[0])?' done':'')+'">'+TL.icon(TL.App.visited.has(t[0])?'check':'target')+t[1]+'</span>').join('');};
TL.report=function(){
 const L=TL.Lab&&TL.Lab.s,r=TL.Lab&&TL.Lab.calc?TL.Lab.calc():null;
 let txt='THERMAL SCIENCE EXPERIENCE — RELATÓRIO\nRadiação infravermelha · Piscina do CEP (modelo hipotético)\nGerado em '+new Date().toLocaleString('pt-BR')+'\n\n';
 if(L&&r){txt+='PARÂMETROS (hipotéticos, editáveis)\n'+L.L+' × '+L.W+' × '+L.D+' m | T0 '+L.T0+' → T1 '+L.T1+' °C\nPotência '+L.P+' kW | η '+L.eta+'% | tarifa R$ '+TL.fmt(L.tariff,2)+'/kWh\n\nRESULTADOS\nVolume '+TL.fmt(r.V,1)+' m³ | massa '+TL.fmtInt(r.m)+' kg\nQ = '+TL.fmtSci(r.Q)+' J = '+TL.fmt(r.Qk,1)+' kWh\nt ideal '+TL.fmtDur(r.tIdeal)+' | t real '+TL.fmtDur(r.tReal)+' | t c/ perdas '+TL.fmtDur(r.tLoss)+'\nPerdas a '+L.Tw+' °C: '+TL.fmt(r.lc.total/1000,1)+' kW (evap '+TL.fmt(r.lc.evap/1000,1)+')\n\n';}
 txt+='Quiz: melhor '+(TL.P.d.quizBest!==undefined?TL.P.d.quizBest+'/10':'—')+'\n\nAVISO: simulação didática com correlações simplificadas.\nNenhum valor é medição real da piscina do CEP.\n';
 const blob=new Blob([txt],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='relatorio-thermal-cep.txt';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),2000);TL.toast('Relatório baixado ✔','ok');};

/* ---------- boot ✔ ---------- */
TL.modules=TL.modules||[];
TL.boot=function(){
 TL.P.load();TL.A11y.load();TL.refreshPal();
 (TL.P.d.visited||[]).forEach(v=>TL.App.visited.add(v));
 // tabs
 const tl=TL.el('tablist');
 TL.TABS.forEach(([id,label,ico,acc])=>{const b=document.createElement('button');
  b.type='button';b.className='tab';b.id='tab-'+id;b.setAttribute('role','tab');
  b.setAttribute('aria-selected','false');b.setAttribute('aria-controls','panel-'+id);
  b.style.setProperty('--acc',acc);b.innerHTML=TL.icon(ico)+label;
  b.addEventListener('click',()=>TL.App.go(id));tl.appendChild(b);});
 tl.addEventListener('keydown',e=>{
  const ids=TL.TABS.map(t=>t[0]);let i=ids.indexOf(TL.App.tab);
  if(e.key==='ArrowRight'){i=(i+1)%ids.length}else if(e.key==='ArrowLeft'){i=(i-1+ids.length)%ids.length}
  else if(e.key==='Home'){i=0}else if(e.key==='End'){i=ids.length-1}else return;
  e.preventDefault();TL.App.go(ids[i]);TL.el('tab-'+ids[i]).focus();});
 // navegação por data-go e âncoras
 document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){e.preventDefault();TL.App.go(g.dataset.go)}});
 window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h&&TL.TABS.some(t=>t[0]===h))TL.App.go(h)});
 // reveals
 TL.$$('.reveal').forEach((x,i)=>{x.style.setProperty('--d',(i%5)*70+'ms');TL.revealIO.observe(x)});
 // progresso de leitura
 let pr=false;window.addEventListener('scroll',()=>{if(pr)return;pr=true;requestAnimationFrame(()=>{pr=false;
  const max=document.documentElement.scrollHeight-innerHeight;
  TL.el('progress').style.transform='scaleX('+(max>0?scrollY/max:0)+')';});},{passive:true});
 // a11y mounts + popover + help
 TL.buildA11yUI(TL.el('ax-pop-mount'));
 const pop=TL.el('axpop'),axOpen=TL.el('ax-open');
 axOpen.addEventListener('click',()=>{const open=pop.classList.toggle('open');axOpen.setAttribute('aria-expanded',String(open));if(open)pop.querySelector('button,input')?.focus()});
 TL.el('ax-close').addEventListener('click',()=>{pop.classList.remove('open');axOpen.setAttribute('aria-expanded','false');axOpen.focus()});
 const help=TL.el('help');
 TL.el('help-open').addEventListener('click',()=>{help.classList.add('open');TL.el('help-close').focus()});
 TL.el('help-close').addEventListener('click',()=>{help.classList.remove('open');TL.el('help-open').focus()});
 help.addEventListener('click',e=>{if(e.target===help)help.classList.remove('open')});
 // atalhos globais
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){pop.classList.remove('open');help.classList.remove('open');axOpen.setAttribute('aria-expanded','false');return}
  const tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea'||tag==='select'||e.target.isContentEditable||e.ctrlKey||e.altKey||e.metaKey)return;
  if(e.key==='?'){help.classList.add('open');TL.el('help-close').focus()}
  else if(e.key==='m'||e.key==='M')TL.A11y.act('sound');
  else if(e.key==='c'||e.key==='C')TL.A11y.act('contrast');
  else if(e.key==='+'||e.key==='=')TL.A11y.act('font+');
  else if(e.key==='-')TL.A11y.act('font-');
  else if(/^[1-7]$/.test(e.key))TL.App.go(TL.TABS[+e.key-1][0]);});
 // módulos
 TL.initHero();TL.initMarquees();
 TL.modules.forEach(fn=>{try{fn()}catch(err){console.error('Módulo falhou:',err)}});
 const rb=TL.el('rep-btn');if(rb)rb.addEventListener('click',TL.report);
 TL.A11y.apply();TL.measureNav();
 const h=location.hash.slice(1);
 TL.App.go(h&&TL.TABS.some(t=>t[0]===h)?h:'inicio',!!h);
 TL.Engine.start();
 requestAnimationFrame(()=>{TL.measureNav();TL.Engine.list.forEach(v=>{TL.fitCanvas(v.el);v.dirty=true});TL.Charts.forEach(c=>c.chart.fit())});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',TL.boot);else TL.boot();
})();
/* ============================================================
   VISITA GUIADA INTERATIVA — Professor Virtual do Projeto
   Sistema de onboarding integrado aos componentes reais
   ============================================================ */
'use strict';
(function(){
const TL=window.TL;

/* ---------- estado da visita ---------- */
const Tour={
 active:false,
 step:0,
 completed:new Set(),
 actions:{},
 steps:[],
 overlay:null,
 tooltip:null,
 progressBar:null,
 highlight:null,
 paused:false,
 introModal:null,
 completionModal:null,
 metrics:{tabsVisited:new Set(),experiments:0,challengesCompleted:0}
};

/* ---------- dados das etapas ---------- */
Tour.steps=[
 {
  id:'intro',
  tab:'inicio',
  element:'#hero-title',
  title:'Bem-vindo(a) ao projeto!',
  text:'Ei! Que tal conhecer o projeto? Vou te mostrar como tudo funciona. Vamos explorar a radiação infravermelha, entender como o calor chega até a água e testar algumas simulações. É só clicar em próximo e acompanhar!',
  action:null,
  waitForAction:false,
  position:'center'
 },
 {
  id:'conhecendo',
  tab:'inicio',
  element:'#hero-title',
  title:'Conhecendo o projeto',
  text:'Começamos por aqui! Esse projeto foi desenvolvido para mostrar como a Física pode ser aplicada em uma situação real: o possível aquecimento da piscina do Colégio Estadual do Paraná.',
  action:null,
  waitForAction:false,
  position:'bottom'
 },
 {
  id:'radiacao',
  tab:'radiacao',
  element:'#sp-main',
  title:'Radiação infravermelha',
  text:'Aqui vamos entender o que é a radiação infravermelha. Ela é uma forma de energia eletromagnética, que também está relacionada à emissão de calor pelos corpos.<br><br>Experimente clicar nas diferentes faixas do espectro. Assim você consegue comparar o infravermelho com a luz visível e outras formas de radiação.',
  action:'spectrum-interaction',
  waitForAction:true,
  position:'right'
 },
 {
  id:'transferencia',
  tab:'transferencia',
  element:'#me-rad',
  title:'Transferência de calor',
  text:'Agora vamos entender como o calor se movimenta! Existem três formas principais: radiação, condução e convecção.<br><br>Clique em cada um deles para descobrir como funcionam. Pense em como esses três processos podem aparecer no aquecimento de uma piscina.',
  action:'mechanism-click',
  waitForAction:true,
  position:'bottom'
 },
 {
  id:'cep',
  tab:'cep',
  element:'#dg-svg',
  title:'Aplicação na piscina do CEP',
  text:'Agora vem a parte mais interessante: vamos trazer tudo isso para a realidade do nosso colégio. Imagine como seria utilizar um sistema de aquecimento para tornar a piscina mais confortável e ampliar suas possibilidades de utilização.<br><br>Clique nos elementos numerados do diagrama para saber mais sobre cada componente.',
  action:'diagram-interaction',
  waitForAction:true,
  position:'top'
 },
 {
  id:'laboratorio-a',
  tab:'laboratorio',
  element:'#lab-a',
  title:'Laboratório de cálculos — Energia',
  text:'Chegou a hora de colocar a matemática em prática! Aqui conseguimos calcular quanta energia seria necessária para aumentar a temperatura da água.<br><br>Esse cálculo considera três coisas: a quantidade de água, o calor específico dela e o quanto queremos aumentar a temperatura.<br><br>Fórmula: <b>Q = m × c × ΔT</b>',
  action:null,
  waitForAction:false,
  position:'bottom'
 },
 {
  id:'laboratorio-calc',
  tab:'laboratorio',
  element:'#lab-a-in',
  title:'Experimente os valores',
  text:'Altere a temperatura inicial e a temperatura desejada. Repare como o resultado muda automaticamente!<br><br>Depois, veja os resultados em kWh, potência, tempo e custo estimado.',
  action:'calculator-input',
  waitForAction:true,
  position:'right'
 },
 {
  id:'simulador',
  tab:'simulador',
  element:'#pool-ctl',
  title:'Simulador de aquecimento',
  text:'Agora vamos fazer um experimento! Aqui você consegue testar como diferentes condições interferem no aquecimento da piscina.<br><br>Você pode controlar a potência, temperatura, ambiente, cobertura térmica e fonte de aquecimento.',
  action:null,
  waitForAction:false,
  position:'left'
 },
 {
  id:'desafio-sim',
  tab:'simulador',
  element:'#pool-play',
  title:'Desafio: Vamos aquecer a piscina!',
  text:'1. Escolha uma temperatura inicial<br>2. Defina uma temperatura desejada<br>3. Ligue o sistema de aquecimento<br>4. Observe o termômetro<br>5. Acompanhe o gráfico de temperatura<br><br>Agora clique no botão para ligar o aquecimento!',
  action:'heater-on',
  waitForAction:true,
  position:'top'
 },
 {
  id:'tecnologias',
  tab:'simulador',
  element:'#sc-chips',
  title:'Comparação de tecnologias',
  text:'Nem todo sistema aquece a água da mesma maneira. Aqui podemos comparar diferentes tecnologias e entender qual delas pode apresentar melhor desempenho em determinadas condições.<br><br>Selecione duas tecnologias diferentes e observe os resultados no gráfico.',
  action:'scenario-compare',
  waitForAction:true,
  position:'bottom'
 },
 {
  id:'acessibilidade',
  tab:'inicio',
  element:'#ax-btn',
  title:'Acessibilidade e VLibras',
  text:'E esse projeto também foi pensado para ser acessível! Aqui você encontra recursos que ajudam diferentes pessoas a navegar pelo conteúdo, incluindo a tradução de textos para Libras por meio do VLibras.<br><br>Veja onde ficam os controles de tamanho de fonte, contraste e demais recursos.',
  action:null,
  waitForAction:false,
  position:'left'
 },
 {
  id:'quiz',
  tab:'desafio',
  element:'#qz-box',
  title:'Desafio científico',
  text:'Agora que você já explorou o projeto, chegou a hora de testar o que aprendeu!<br><br>Responda as perguntas e veja sua pontuação. Não tem problema errar — o importante é aprender!',
  action:'quiz-answer',
  waitForAction:true,
  position:'right'
 },
 {
  id:'final',
  tab:'desafio',
  element:'#conclusao-blk',
  title:'Você explorou a energia!',
  text:'Pronto! Agora você já conhece os principais conceitos, sabe utilizar nossas ferramentas e viu como a Física pode ser aplicada em situações reais.<br><br>Mas lembre-se: a melhor maneira de aprender ciência é continuar experimentando!',
  action:null,
  waitForAction:false,
  position:'center'
 }
];

/* ---------- helpers ---------- */
function createOverlay(){
 if(Tour.overlay)return;
 Tour.overlay=document.createElement('div');
 Tour.overlay.id='tour-overlay';
 Tour.overlay.setAttribute('aria-hidden','true');
 document.body.appendChild(Tour.overlay);
 
 Tour.tooltip=document.createElement('div');
 Tour.tooltip.id='tour-tooltip';
 Tour.tooltip.setAttribute('role','dialog');
 Tour.tooltip.setAttribute('aria-label','Tutorial interativo');
 document.body.appendChild(Tour.tooltip);
 
 Tour.highlight=document.createElement('div');
 Tour.highlight.id='tour-highlight';
 document.body.appendChild(Tour.highlight);
 
 Tour.progressBar=document.createElement('div');
 Tour.progressBar.id='tour-progress';
 document.body.appendChild(Tour.progressBar);
}

function showIntro(){
 if(Tour.introModal)return;
 Tour.introModal=document.createElement('div');
 Tour.introModal.id='tour-intro-modal';
 Tour.introModal.innerHTML=`
  <div class="tour-intro-content">
    <h2>👋 Bem-vindo(a) à Visita Guiada!</h2>
    <p>Ei! Que tal conhecer o projeto? Vou te mostrar como tudo funciona.</p>
    <p>Vamos explorar a radiação infravermelha, entender como o calor chega até a água e testar algumas simulações.</p>
    <p>É só clicar em <b>próximo</b> e acompanhar!</p>
    <div class="tour-intro-buttons">
      <button type="button" class="btn heat" id="tour-start">▶ Começar visita</button>
      <button type="button" class="btn ghost" id="tour-explore">Explorar sozinho</button>
    </div>
  </div>
 `;
 document.body.appendChild(Tour.introModal);
 
 Tour.introModal.querySelector('#tour-start').addEventListener('click',()=>{
  Tour.introModal.remove();
  Tour.introModal=null;
  startTour();
 });
 
 Tour.introModal.querySelector('#tour-explore').addEventListener('click',()=>{
  Tour.introModal.remove();
  Tour.introModal=null;
  Tour.active=false;
  hideTourUI();
 });
}

function startTour(){
 Tour.active=true;
 Tour.step=0;
 Tour.completed.clear();
 Tour.actions={};
 Tour.metrics={tabsVisited:new Set(),experiments:0,challengesCompleted:0};
 createOverlay();
 renderStep();
 TL.toast('Visita guiada iniciada! Clique em "Próximo" para continuar.','info',3000);
}

function renderStep(){
 if(!Tour.active||Tour.step>=Tour.steps.length){
  showCompletion();
  return;
 }
 
 const step=Tour.steps[Tour.step];
 
 // Navegar para a aba correta
 if(step.tab&&step.tab!==TL.App.tab){
  TL.App.go(step.tab,false);
 }
 
 // Aguardar renderização
 setTimeout(()=>{
  const el=document.querySelector(step.element);
  if(el){
   // Destacar elemento
   highlightElement(el);
   
   // Posicionar tooltip
   positionTooltip(el,step);
   
   // Atualizar conteúdo
   updateTooltipContent(step);
   
   // Atualizar barra de progresso
   updateProgressBar();
   
   // Scroll automático
   scrollToElement(el);
   
   // Registrar métricas
   if(step.tab)Tour.metrics.tabsVisited.add(step.tab);
  } else {
   // Se elemento não encontrado, avançar
   console.warn('Elemento não encontrado:',step.element);
   nextStep();
  }
 },300);
}

function highlightElement(el){
 if(!Tour.highlight)return;
 const rect=el.getBoundingClientRect();
 const scrollY=window.scrollY||window.pageYOffset;
 const scrollX=window.scrollX||window.pageXOffset;
 
 Tour.highlight.style.display='block';
 Tour.highlight.style.top=(rect.top+scrollY-8)+'px';
 Tour.highlight.style.left=(rect.left+scrollX-8)+'px';
 Tour.highlight.style.width=(rect.width+16)+'px';
 Tour.highlight.style.height=(rect.height+16)+'px';
 
 // Adicionar classe ao elemento destacado
 el.classList.add('tour-highlighted');
 setTimeout(()=>el.classList.remove('tour-highlighted'),3000);
}

function positionTooltip(el,step){
 if(!Tour.tooltip)return;
 const rect=el.getBoundingClientRect();
 const scrollY=window.scrollY||window.pageYOffset;
 const scrollX=window.scrollX||window.pageXOffset;
 
 let top,left;
 const tooltipWidth=320;
 const tooltipHeight=200;
 const margin=16;
 
 switch(step.position){
  case 'top':
   top=rect.top+scrollY-tooltipHeight-margin;
   left=rect.left+scrollX+(rect.width/2)-(tooltipWidth/2);
   break;
  case 'bottom':
   top=rect.bottom+scrollY+margin;
   left=rect.left+scrollX+(rect.width/2)-(tooltipWidth/2);
   break;
  case 'left':
   top=rect.top+scrollY+(rect.height/2)-(tooltipHeight/2);
   left=rect.left+scrollX-tooltipWidth-margin;
   break;
  case 'right':
   top=rect.top+scrollY+(rect.height/2)-(tooltipHeight/2);
   left=rect.right+scrollX+margin;
   break;
  case 'center':
  default:
   top=window.innerHeight/2-(tooltipHeight/2)+scrollY;
   left=window.innerWidth/2-(tooltipWidth/2)+scrollX;
   break;
 }
 
 // Garantir que fique dentro da viewport
 left=Math.max(margin,Math.min(left,window.innerWidth-tooltipWidth-margin+scrollX));
 top=Math.max(margin,Math.min(top,window.innerHeight-tooltipHeight-margin+scrollY));
 
 Tour.tooltip.style.top=top+'px';
 Tour.tooltip.style.left=left+'px';
 Tour.tooltip.style.display='block';
}

function updateTooltipContent(step){
 if(!Tour.tooltip)return;
 
 const progress=((Tour.step+1)/Tour.steps.length*100).toFixed(0);
 
 Tour.tooltip.innerHTML=`
  <div class="tour-tooltip-header">
    <span class="tour-step-number">${Tour.step+1}/${Tour.steps.length}</span>
    <h3>${step.title}</h3>
  </div>
  <div class="tour-tooltip-body">
    <p>${step.text}</p>
  </div>
  <div class="tour-tooltip-actions">
    <button type="button" class="btn sm ghost" id="tour-prev" ${Tour.step===0?'disabled':''}>← Anterior</button>
    <button type="button" class="btn sm ghost" id="tour-skip">Pular etapa</button>
    <button type="button" class="btn sm heat" id="tour-next">${step.waitForAction?'Aguardando...':'Próximo →'}</button>
    <button type="button" class="btn sm ghost" id="tour-exit">✕ Sair</button>
  </div>
 `;
 
 // Event listeners
 Tour.tooltip.querySelector('#tour-prev').addEventListener('click',prevStep);
 Tour.tooltip.querySelector('#tour-skip').addEventListener('click',nextStep);
 Tour.tooltip.querySelector('#tour-next').addEventListener('click',()=>{
  if(!step.waitForAction||Tour.actions[step.id]){
   nextStep();
  } else {
   TL.toast('Complete a ação solicitada antes de avançar!','warn',2000);
  }
 });
 Tour.tooltip.querySelector('#tour-exit').addEventListener('click',exitTour);
 
 // Se aguarda ação, desabilitar próximo
 if(step.waitForAction&&!Tour.actions[step.id]){
  const nextBtn=Tour.tooltip.querySelector('#tour-next');
  nextBtn.disabled=true;
  nextBtn.textContent='Complete a ação primeiro';
 }
}

function updateProgressBar(){
 if(!Tour.progressBar)return;
 const progress=(Tour.step/Tour.steps.length*100).toFixed(0);
 Tour.progressBar.style.display='block';
 Tour.progressBar.innerHTML=`<div class="tour-progress-bar" style="width:${progress}%"></div>`;
}

function scrollToElement(el){
 if(!el)return;
 const navH=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))||112;
 const rect=el.getBoundingClientRect();
 const target=rect.top+window.scrollY-navH-20;
 window.scrollTo({top:Math.max(0,target),behavior:TL.A11y.motion?'smooth':'auto'});
}

function nextStep(){
 Tour.completed.add(Tour.steps[Tour.step].id);
 Tour.step++;
 if(Tour.step>=Tour.steps.length){
  showCompletion();
 } else {
  renderStep();
 }
}

function prevStep(){
 if(Tour.step>0){
  Tour.step--;
  renderStep();
 }
}

function exitTour(){
 Tour.active=false;
 hideTourUI();
 TL.toast('Visita guiada encerrada. Você pode reiniciá-la clicando no botão de ajuda.','info',3000);
}

function hideTourUI(){
 if(Tour.overlay)Tour.overlay.style.display='none';
 if(Tour.tooltip)Tour.tooltip.style.display='none';
 if(Tour.highlight)Tour.highlight.style.display='none';
 if(Tour.progressBar)Tour.progressBar.style.display='none';
}

function showCompletion(){
 hideTourUI();
 
 if(Tour.completionModal)return;
 Tour.completionModal=document.createElement('div');
 Tour.completionModal.id='tour-completion-modal';
 
 const tabsCount=Tour.metrics.tabsVisited.size;
 const experiments=Tour.metrics.experiments;
 const challenges=Tour.metrics.challengesCompleted;
 
 Tour.completionModal.innerHTML=`
  <div class="tour-completion-content">
    <h2>🎉 Você explorou a energia!</h2>
    <p>Pronto! Agora você já conhece os principais conceitos, sabe utilizar nossas ferramentas e viu como a Física pode ser aplicada em situações reais.</p>
    <p>Mas lembre-se: a melhor maneira de aprender ciência é continuar experimentando!</p>
    
    <div class="tour-metrics">
      <div class="metric">
        <div class="metric-value">${tabsCount}/7</div>
        <div class="metric-label">Abas exploradas</div>
      </div>
      <div class="metric">
        <div class="metric-value">${experiments}</div>
        <div class="metric-label">Experimentos realizados</div>
      </div>
      <div class="metric">
        <div class="metric-value">${challenges}</div>
        <div class="metric-label">Desafios concluídos</div>
      </div>
    </div>
    
    <div class="tour-completion-buttons">
      <button type="button" class="btn heat" id="tour-restart">↻ Explorar novamente</button>
      <button type="button" class="btn ghost" id="tour-home">Voltar ao início</button>
      <button type="button" class="btn coolb" id="tour-continue">Continuar explorando</button>
    </div>
  </div>
 `;
 document.body.appendChild(Tour.completionModal);
 
 Tour.completionModal.querySelector('#tour-restart').addEventListener('click',()=>{
  Tour.completionModal.remove();
  Tour.completionModal=null;
  startTour();
 });
 
 Tour.completionModal.querySelector('#tour-home').addEventListener('click',()=>{
  Tour.completionModal.remove();
  Tour.completionModal=null;
  TL.App.go('inicio');
 });
 
 Tour.completionModal.querySelector('#tour-continue').addEventListener('click',()=>{
  Tour.completionModal.remove();
  Tour.completionModal=null;
  Tour.active=false;
 });
}

/* ---------- monitoramento de ações ---------- */
function trackAction(actionId){
 if(!Tour.active)return;
 const currentStep=Tour.steps[Tour.step];
 if(currentStep&&currentStep.action===actionId){
  Tour.actions[currentStep.id]=true;
  Tour.metrics.experiments++;
  
  // Habilitar botão próximo
  if(Tour.tooltip){
   const nextBtn=Tour.tooltip.querySelector('#tour-next');
   if(nextBtn){
    nextBtn.disabled=false;
    nextBtn.textContent='Próximo →';
   }
  }
  
  TL.toast('Ação completada! Clique em "Próximo" para continuar.','ok',2000);
 }
}

/* ---------- setup de listeners ---------- */
function setupListeners(){
 // Monitorar interação com espectro
 document.addEventListener('click',e=>{
  if(!Tour.active)return;
  
  // Espectro
  if(e.target.closest('.sp-band')||e.target.closest('[data-band]')){
   trackAction('spectrum-interaction');
  }
  
  // Mecanismos de transferência
  if(e.target.closest('#me-rad')||e.target.closest('#me-con')||e.target.closest('#me-cnv')){
   trackAction('mechanism-click');
  }
  
  // Diagrama CEP
  if(e.target.closest('.hotspot')||e.target.closest('[data-part]')){
   trackAction('diagram-interaction');
  }
  
  // Calculadora
  if(e.target.closest('#lab-a-in input')){
   trackAction('calculator-input');
  }
  
  // Simulador - ligar aquecimento
  if(e.target.closest('#pool-play')||e.target.closest('[data-action="heater"]')){
   trackAction('heater-on');
  }
  
  // Comparação de cenários
  if(e.target.closest('#sc-chips button')||e.target.closest('#pool-compare')){
   trackAction('scenario-compare');
  }
  
  // Quiz
  if(e.target.closest('.qz-opt')){
   trackAction('quiz-answer');
  }
 });
 
 // Monitorar mudanças nos inputs da calculadora
 const labInputs=document.querySelectorAll('#lab-a-in input');
 labInputs.forEach(input=>{
  input.addEventListener('change',()=>trackAction('calculator-input'));
  input.addEventListener('input',()=>{
   setTimeout(()=>trackAction('calculator-input'),500);
  });
 });
}

/* ---------- botão de iniciar visita ---------- */
function initTourButton(){
 // Criar botão na tela inicial
 const heroSection=document.querySelector('#panel-inicio');
 if(heroSection){
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='btn heat tour-start-btn';
  btn.id='tour-start-btn';
  btn.innerHTML='<svg class="ic"><use href="assets/icons/icons.svg#i-play"></use></svg> INICIAR VISITA GUIADA';
  
  // Inserir após o título principal
  const title=heroSection.querySelector('h1,h2');
  if(title){
   title.insertAdjacentElement('afterend',btn);
  } else {
   heroSection.insertBefore(btn,heroSection.firstChild);
  }
  
  btn.addEventListener('click',()=>{
   TL.Sound.play('click');
   showIntro();
  });
 }
 
 // Criar ícone de ajuda flutuante
 const helpBtn=document.createElement('button');
 helpBtn.type='button';
 helpBtn.className='tour-help-btn';
 helpBtn.id='tour-help-btn';
 helpBtn.setAttribute('aria-label','Iniciar visita guiada');
 helpBtn.innerHTML='<svg class="ic"><use href="assets/icons/icons.svg#i-help"></use></svg>';
 document.body.appendChild(helpBtn);
 
 helpBtn.addEventListener('click',()=>{
  TL.Sound.play('click');
  if(Tour.active){
   exitTour();
  } else {
   showIntro();
  }
 });
}

/* ---------- inicialização ---------- */
function init(){
 setupListeners();
 initTourButton();
 
 // Verificar se é primeira visita
 if(!TL.P.d.tourCompleted){
  setTimeout(()=>{
   showIntro();
  },2000);
 }
}

// Exportar funções públicas
window.Tour=Tour;
window.startTour=startTour;
window.exitTour=exitTour;

// Inicializar quando DOM estiver pronto
if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',init);
} else {
 init();
}

})();