/* Wien + Stefan-Boltzmann: curva de Planck, orbe incandescente, exemplos ao vivo */
'use strict';
(function(){
const TL=window.TL;
const BB={T:310};
function kelvinRGB(k){k/=100;let r,g,b;
 r=k<=66?255:TL.clamp(329.7*Math.pow(k-60,-.1332),0,255);
 g=k<=66?TL.clamp(99.47*Math.log(k)-161.1,0,255):TL.clamp(288.1*Math.pow(k-60,-.0755),0,255);
 b=k>=66?255:(k<=19?0:TL.clamp(138.5*Math.log(k-10)-305,0,255));
 return [Math.round(r),Math.round(g),Math.round(b)];}
function planck(l,T){return (2*TL.H*TL.C0*TL.C0/Math.pow(l,5))/(Math.exp(TL.H*TL.C0/(l*TL.KB*T))-1);}
function render(){
 const T=BB.T,lm=TL.WIEN/T,P=TL.SIGMA*Math.pow(T,4);
 TL.setTxt('bb-lam',TL.fmtWave(lm));TL.setTxt('bb-pow',TL.fmtInt(P)+' W/m²');TL.setTxt('bb-vs','× '+TL.fmt(P/(TL.SIGMA*Math.pow(310,4)),1));
 TL.setTxt('bb-temp-tag',TL.fmtInt(T)+' K · '+TL.fmt(T-273.15,0)+' °C');
 TL.el('bb-wien').innerHTML='<span class="fx">λ<sub>máx</sub></span><span class="op">=</span><span class="frac"><span class="fx">b</span><span class="fx">T</span></span><span class="op">=</span><span class="frac"><span class="fm">2,898×10⁻³ m·K</span><span class="fm">'+TL.fmtInt(T)+' K</span></span><span class="op">=</span><span class="res">'+TL.fmtWave(lm)+'</span>';
 TL.el('bb-stefan').innerHTML='<span class="fx">P/A</span><span class="op">=</span><span class="fx">σT</span><sup>4</sup><span class="op">=</span><span class="fm">5,67×10⁻⁸ × '+TL.fmtInt(T)+'⁴</span><span class="op">=</span><span class="res">'+TL.fmtInt(P)+' W/m²</span>';
 const [r,g,b]=kelvinRGB(T),I=TL.clamp((Math.log10(P)-1.5)/6,0,1);
 const orb=TL.el('bb-orb');
 orb.style.background='radial-gradient(circle at 35% 35%, rgb('+r+','+g+','+b+'), rgb('+Math.round(r*.35)+','+Math.round(g*.35)+','+Math.round(b*.35)+'))';
 orb.style.boxShadow='0 0 '+Math.round(14+70*I)+'px rgba('+r+','+g+','+b+','+(.25+.55*I)+')';
 if(BB.v)BB.v.dirty=true;}
function draw(cv){
 if(!TL.fitCanvas(cv)&&!cv._w)return;const c=cv._ctx,W=cv._w,H=cv._h;
 c.clearRect(0,0,W,H);
 const T=BB.T,lm=TL.WIEN/T,span=Math.min(40e-6,Math.max(2e-6,4*lm));
 const pad={l:40,r:12,t:16,b:26};
 const N=140,pts=[];let mx=0;
 for(let i=1;i<=N;i++){const l=span*i/N,v=planck(l,T);pts.push([l,v]);if(v>mx)mx=v;}
 const X=l=>pad.l+l/span*(W-pad.l-pad.r),Y=v=>H-pad.b-(v/mx)*(H-pad.t-pad.b);
 // banda visível
 if(span>3.8e-7){const x0=X(Math.max(3.8e-7,0)),x1=X(Math.min(7.5e-7,span));
  const g=c.createLinearGradient(x0,0,x1,0);['#8F7BFF','#208DFF','#25D6A4','#FFC857','#FF762E'].forEach((cl,i)=>g.addColorStop(i/4,cl+'33'));
  c.fillStyle=g;c.fillRect(x0,pad.t,x1-x0,H-pad.t-pad.b);
  c.fillStyle=TL.Pal.dim;c.font='9px JetBrains Mono,monospace';c.textAlign='center';c.fillText('visível',(x0+x1)/2,pad.t+10);}
 // eixos
 c.strokeStyle=TL.Pal.hc?'rgba(255,255,255,.35)':'rgba(96,170,255,.15)';c.lineWidth=1;
 c.font='9px JetBrains Mono,monospace';c.fillStyle=TL.Pal.dim;c.textAlign='center';c.textBaseline='top';
 for(let i=0;i<=4;i++){const l=span*i/4,x=X(l);c.beginPath();c.moveTo(x,pad.t);c.lineTo(x,H-pad.b);c.stroke();
  c.fillText(TL.fmt(l*1e6,1)+' µm',x,H-pad.b+5);}
 c.textAlign='right';c.textBaseline='middle';c.fillText('1,0',pad.l-5,Y(mx));c.fillText('0',pad.l-5,H-pad.b);
 // curva
 c.save();c.strokeStyle=TL.Pal.orange;c.lineWidth=2.5;c.shadowColor=TL.Pal.orange;c.shadowBlur=TL.Pal.hc?0:8;
 c.beginPath();pts.forEach((p,i)=>{const x=X(p[0]),y=Y(p[1]);i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke();
 c.lineTo(X(span),H-pad.b);c.lineTo(X(pts[0][0]),H-pad.b);c.closePath();
 const g2=c.createLinearGradient(0,pad.t,0,H-pad.b);g2.addColorStop(0,'rgba(255,118,46,.3)');g2.addColorStop(1,'rgba(255,118,46,0)');
 c.shadowBlur=0;c.fillStyle=g2;c.fill();c.restore();
 // pico Wien
 const xp=X(lm);c.strokeStyle=TL.Pal.yellow;c.setLineDash([5,4]);c.lineWidth=1.5;
 c.beginPath();c.moveTo(xp,pad.t);c.lineTo(xp,H-pad.b);c.stroke();c.setLineDash([]);
 c.fillStyle=TL.Pal.yellow;c.textAlign=xp>W*.7?'right':'left';c.textBaseline='top';
 c.fillText('λmáx = '+TL.fmtWave(lm),xp+(xp>W*.7?-6:6),pad.t+2);}
TL.modules.push(function(){
 const cv=TL.el('bb-cv');if(!cv)return;
 BB.slider=TL.makeRange(TL.el('bb-ctl'),{label:'Temperatura do corpo',min:250,max:6500,step:10,val:310,unit:'K',dec:0,color:'var(--orange)',
  oninput:v=>{BB.T=v;render()}});
 const pre=document.createElement('div');pre.className='btnrow';pre.setAttribute('role','group');pre.setAttribute('aria-label','Temperaturas de exemplo');
 [['Corpo humano',310],['Água morna',313],['Emissor IR',700],['Sol',5778]].forEach(([n,T])=>{
  const b=document.createElement('button');b.type='button';b.className='btn sm ghost';b.textContent=n+' · '+T+' K';
  b.addEventListener('click',()=>{BB.T=T;BB.slider.set(T,true);render();TL.Sound.play('click')});pre.appendChild(b);});
 TL.el('bb-ctl').appendChild(pre);
 TL.statGrid(TL.el('bb-stats'),[{id:'bb-lam',label:'pico de Wien λmáx',kind:'hot'},{id:'bb-pow',label:'σT⁴ emitido'},{id:'bb-vs',label:'vs corpo humano',kind:'ok'}]);
 BB.v=TL.Engine.add({el:cv,tab:'radiacao',static:true,draw(){draw(cv)}});
 render();});
})();