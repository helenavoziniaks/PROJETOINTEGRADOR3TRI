/* Espectro EM interativo + subfaixas IR + régua log λ/f/E */
'use strict';
(function(){
const TL=window.TL;
const BANDS=[
 {id:'radio',n:'Ondas de rádio',lo:1e3,hi:1,g:['#0e2f5e','#1d5fa8'],ico:'sensor',d:'As ondas mais longas: contornam montanhas e prédios. Carregam informação por modulação.',apps:['Rádio AM/FM','TV aberta','Radioastronomia'],fact:'Uma onda de FM (~3 m) é 3 milhões de vezes mais longa que o IR de um controle remoto.'},
 {id:'micro',n:'Micro-ondas',lo:1,hi:1e-3,g:['#1d5fa8','#4f6fd4'],ico:'sensor',d:'De 1 m a 1 mm. Fazem moléculas de água rotacionar — o princípio do forno de micro-ondas.',apps:['Forno (12 cm)','Wi-Fi (12 cm)','Radar','Satélites'],fact:'Wi-Fi e forno usam quase a mesma frequência (2,4 GHz) — com potências muito diferentes!'},
 {id:'ir',n:'Infravermelho',lo:1e-3,hi:7.5e-7,g:['#b3231f','#ff8a3d'],ico:'ir',d:'A faixa do calor radiante. Todo corpo em temperatura ambiente tem seu pico de emissão aqui.',apps:['Controle (940 nm)','Câmera térmica (8–14 µm)','Aquecedores','Fibra óptica (1,55 µm)'],fact:'Você emite ≈100 W de infravermelho — como uma lâmpada antiga, só que invisível.'},
 {id:'vis',n:'Luz visível',lo:7.5e-7,hi:3.8e-7,g:['#ff4b2e','#25D6A4','#8F7BFF'],ico:'eye',d:'A estreita janela que a evolução escolheu para nossos olhos — coincidindo com o pico do Sol.',apps:['Visão','Fotografia','Iluminação','Lasers'],fact:'Menos de 0,001% da extensão mostrada aqui: uma fresta entre IR e UV.'},
 {id:'uv',n:'Ultravioleta',lo:3.8e-7,hi:1e-8,g:['#8F7BFF','#5b3fd4'],ico:'sun',d:'Fótons energéticos: bronzeiam, esterilizam e, em excesso, lesionam o DNA.',apps:['Esterilização UV-C','Vitamina D','Luz negra','Fotolitografia'],fact:'Abelhas enxergam UV e veem “pistas de pouso” invisíveis nas flores.'},
 {id:'x',n:'Raios X',lo:1e-8,hi:1e-11,g:['#38b0d8','#7ef0ff'],ico:'shield',d:'Atravessam tecidos moles, barrados por ossos e metais — a base da radiografia.',apps:['Radiografia','Tomografia','Aeroportos','Cristalografia'],fact:'A cristalografia de raios X revelou a estrutura do DNA em 1953.'},
 {id:'gama',n:'Raios gama',lo:1e-11,hi:1e-13,g:['#d43fb0','#FF4FA3'],ico:'bolt',d:'Os fótons mais energéticos, de núcleos atômicos e explosões cósmicas.',apps:['Radioterapia','Esterilização','Astrofísica','PET scan'],fact:'Um fóton gama pode ter mais energia que um trilhão de fótons de rádio.'}];
const SUBS=[
 {id:'nir',n:'IR próximo (NIR)',lo:1.4e-6,hi:7.5e-7,g:['#ff8a5c','#ff9a3d'],ico:'remote',d:'Vizinho imediato do vermelho. Penetra dezenas de centímetros na água.',apps:['Controle remoto','Fibra óptica','Visão noturna','Oximetria'],fact:'A câmera do celular enxerga o LED do controle — teste apontando e apertando um botão!'},
 {id:'mir',n:'IR médio (MWIR)',lo:3e-6,hi:1.4e-6,g:['#FF762E','#f0552e'],ico:'heater',d:'Faixa dos aquecedores de quartzo e sensores de chama.',apps:['Aquecedores de quartzo','Sensores de chama','Espectroscopia'],fact:'Um aquecedor a ~800 °C tem pico em ≈2,7 µm.'},
 {id:'tir',n:'IR termal (LWIR)',lo:15e-6,hi:3e-6,g:['#e8452e','#c9301f'],ico:'camera',d:'Janela das câmeras térmicas (8–14 µm): corpos em temperatura ambiente emitem o pico aqui.',apps:['Câmeras térmicas','Sensor PIR','Termômetros sem contato'],fact:'O corpo humano (310 K) tem pico em 9,35 µm — centro desta faixa.'},
 {id:'fir',n:'IR distante (FIR)',lo:1e-3,hi:15e-6,g:['#b3231f','#8a1a16'],ico:'wave',d:'Quase micro-ondas. A água absorve tudo em frações de milímetro.',apps:['Aquecedores cerâmicos','Painéis radiantes','Astronomia fria'],fact:'A faixa mais absorvida pela água: aquecimento direto vira aquecimento de superfície.'}];
const SP={lam:9.35e-6};
const spX=l=>(3-Math.log10(l))/16*100;
function update(moveSlider){
 const l=SP.lam,f=TL.C0/l,E=4.135667696e-15*f;
 const band=BANDS.find(b=>l<=b.lo&&l>=b.hi)||BANDS[0];
 const sub=SUBS.find(b=>l<=b.lo&&l>=b.hi);const show=sub||band;
 TL.setTxt('sp-l',TL.fmtWave(l));TL.setTxt('sp-f',TL.fmtFreq(f));TL.setTxt('sp-e',TL.fmtEv(E));TL.setTxt('sp-b',show.n);
 TL.el('sp-mk').style.left=TL.clamp(spX(l),0,100)+'%';
 const mk2=TL.el('sp-mk2');
 if(l>=7.5e-7&&l<=1e-3){mk2.style.display='block';mk2.style.left=TL.clamp((Math.log10(1e-3)-Math.log10(l))/3.125*100,0,100)+'%'}else mk2.style.display='none';
 TL.$$('#sp-main .sp-band,#sp-zoom .sp-band').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.band===show.id)));
 if(moveSlider&&SP.slider)SP.slider.set(Math.round((3-Math.log10(l))/16*1000),true);
 TL.el('sp-detail').innerHTML='<div class="sp-ico">'+TL.icon(show.ico)+'</div><div><h3 style="margin-bottom:.2rem">'+show.n+'</h3>'
  +'<p style="font-family:var(--mono);font-size:.74rem;color:var(--cyan)">λ '+TL.fmtWave(show.hi)+' – '+TL.fmtWave(show.lo)+' · f '+TL.fmtFreq(TL.C0/show.lo)+' – '+TL.fmtFreq(TL.C0/show.hi)+'</p>'
  +'<p style="margin-top:.4rem">'+show.d+'</p><div class="sp-apps">'+show.apps.map(a=>'<span class="chip cool">'+a+'</span>').join('')+'</div>'
  +'<p style="margin-top:.5rem;font-size:.82rem;color:var(--yellow)">💡 '+show.fact+'</p></div>';
}
TL.modules.push(function(){
 const main=TL.el('sp-main'),zoom=TL.el('sp-zoom');if(!main)return;
 BANDS.forEach(b=>{const btn=document.createElement('button');btn.type='button';
  btn.className='sp-band'+(b.id==='ir'?' irband':'');btn.style.width=(Math.log10(b.lo/b.hi)/16*100)+'%';
  btn.style.background='linear-gradient(90deg,'+b.g.join(',')+')';btn.dataset.band=b.id;
  btn.setAttribute('aria-pressed','false');btn.setAttribute('aria-label',b.n+': '+TL.fmtWave(b.hi)+' a '+TL.fmtWave(b.lo));
  btn.innerHTML='<span>'+({vis:'👁',x:'X',gama:'γ'}[b.id]||b.n.split(' ')[0])+'</span>';
  btn.addEventListener('click',()=>{SP.lam=Math.sqrt(b.lo*b.hi);TL.Sound.play('click');update(true)});main.appendChild(btn);});
 [[1e3,'1 km'],[1,'1 m'],[1e-3,'1 mm'],[7.5e-7,'700 nm'],[3.8e-7,'400 nm'],[1e-8,'10 nm'],[1e-11,'10 pm']].forEach(([l,lb])=>{
  const s=document.createElement('span');s.style.left=TL.clamp(spX(l),2,98)+'%';s.textContent=lb;TL.el('sp-scale').appendChild(s)});
 const mk=document.createElement('div');mk.className='sp-marker';mk.id='sp-mk';main.appendChild(mk);
 SUBS.forEach(b=>{const btn=document.createElement('button');btn.type='button';btn.className='sp-band';
  btn.style.width=(Math.log10(b.lo/b.hi)/3.125*100)+'%';btn.style.background='linear-gradient(90deg,'+b.g.join(',')+')';btn.dataset.band=b.id;
  btn.setAttribute('aria-pressed','false');btn.setAttribute('aria-label',b.n+': '+TL.fmtWave(b.hi)+' a '+TL.fmtWave(b.lo));
  btn.innerHTML='<span>'+b.n.split(' (')[0]+'</span>';
  btn.addEventListener('click',()=>{SP.lam=Math.sqrt(b.lo*b.hi);TL.Sound.play('click');update(true)});zoom.appendChild(btn);});
 const mk2=document.createElement('div');mk2.className='sp-marker';mk2.id='sp-mk2';zoom.appendChild(mk2);
 SP.slider=TL.makeRange(TL.el('sp-slider'),{label:'Régua de comprimento de onda (log)',min:0,max:1000,step:1,
  val:Math.round((3-Math.log10(9.35e-6))/16*1000),fmt:v=>TL.fmtWave(Math.pow(10,3-16*v/1000)),color:'var(--orange)',
  oninput:v=>{SP.lam=Math.pow(10,3-16*v/1000);update(false)}});
 TL.statGrid(TL.el('sp-read'),[{id:'sp-l',label:'λ · comprimento de onda',kind:'hot'},{id:'sp-f',label:'f = c/λ'},{id:'sp-e',label:'E = h·f (fóton)',kind:'vio'},{id:'sp-b',label:'faixa',kind:'ok'}]);
 update(true);
 // aplicações cotidianas
 const APPS=[['remote','Controle remoto','940 nm','LED pulsando códigos invisíveis para a TV.'],['camera','Câmera térmica','8–14 µm','Enxerga calor: pessoas, vazamentos, painéis solares.'],['sensor','Sensor PIR','~10 µm','Detecta movimento pelo IR do corpo — luzes automáticas.'],['heater','Aquecedores','1–3 µm','Quartzo e cerâmica irradiam calor direto sobre a pele.'],['eye','Visão noturna','NIR','Iluminação IR invisível a olho nu, visível a sensores.'],['wave','Fibra óptica','1,3–1,55 µm','A internet viaja em pulsos IR de baixíssima perda.'],['heart','Fisioterapia','IR próximo','Aquecimento localizado de tecidos e músculos.'],['sun','Astronomia IR','0,6–28 µm','O telescópio James Webb vê galáxias através da poeira.']];
 TL.el('apps-grid').innerHTML=APPS.map(a=>'<div class="card"><h3>'+TL.icon(a[0])+a[1]+'</h3><p><span class="chip hot">'+a[2]+'</span></p><p style="margin-top:.4rem">'+a[3]+'</p></div>').join('');
 // câmera térmica toggle
 TL.makeToggle(TL.el('tc-toggle'),{label:'Câmera térmica (8–14 µm)',ico:'camera',cool:true,val:false,onchange:v=>{
  TL.el('tc-normal').style.display=v?'none':'';TL.el('tc-thermal').style.display=v?'':'none';}});
});
})();