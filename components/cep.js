/* Clima INMET + gauge de conforto + diagrama técnico de 8 elementos */
'use strict';
(function(){
const TL=window.TL;
const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MED=[21.3,21.4,20.8,18.5,15.5,14.3,13.8,14.9,16.0,17.7,18.9,20.7];
const MIN=[16.5,17.0,15.8,14.8,11.8,10.3,9.3,10.1,11.9,13.9,15.0,16.1];
const PARTS={
 fonte:{n:'1 · Fonte de energia',f:'Quadro elétrico dedicado + painéis fotovoltaicos no telhado alimentam o sistema.',p:'Potência elétrica P = V·I; energia E = P·t. O dimensionamento precisa caber na demanda contratada da escola.',d:'Desafio: 150 kW de emissores exigem infraestrutura trifásica robusta e proteção (DR, disjuntores, NR-10).'},
 emissores:{n:'2 · Emissores IR',f:'Barras radiantes suspensas convertem eletricidade em radiação infravermelha (~95%).',p:'Stefan-Boltzmann: P = εσAT⁴. A temperatura do emissor define o espectro (Wien).',d:'Desafio: altura e espaçamento definem a fração da radiação que realmente atinge a água.'},
 superficie:{n:'3 · Superfície da água',f:'A lâmina d\u2019água recebe os feixes. É a fronteira onde a energia entra no sistema.',p:'α + ρ + τ = 1. Para IR distante, a água tem α ≈ 0,96 — absorção quase total, porém superficial.',d:'Desafio: superfície aquecida evapora mais; parte da energia recém-chegada pode escapar.'},
 absorcao:{n:'4 · Absorção de energia',f:'Fótons viram agitação molecular. Placa absorvedora escura na borda reforça a captura e conduz calor à água.',p:'Q = m·c·ΔT. A condução da placa para a água evita concentrar tudo na superfície.',d:'Desafio: material, área e contato térmico da placa determinam a eficiência real.'},
 circulacao:{n:'5 · Circulação térmica',f:'Bomba e retornos distribuem o calor por convecção forçada, uniformizando a temperatura.',p:'Convecção: o fluxo mássico ṁ transporta Q̇ = ṁ·c·ΔT entre regiões.',d:'Desafio: vazão subdimensionada deixa camadas quentes na superfície e fundo frio.'},
 isolamento:{n:'6 · Isolamento + cobertura',f:'Paredes/fundo isolados e cobertura térmica noturna seguram o calor conquistado.',p:'Condução Q = U·A·ΔT: menor U, menor perda. A cobertura corta ~90% da evaporação.',d:'Desafio: a cobertura é o item de melhor custo-benefício — e o mais esquecido.'},
 sensores:{n:'7 · Sensores de temperatura',f:'Sondas na água e no ar medem o estado real do sistema em tempo contínuo.',p:'Medição é a base do controle: sem T medida, não há termostato nem eficiência.',d:'Desafio: posição das sondas (profundidade, distância dos retornos) evita leituras enviesadas.'},
 controlador:{n:'8 · Controlador / termostato',f:'Compara a temperatura medida com o setpoint (ex.: 27 °C) e liga/desliga os emissores com histerese.',p:'Controle liga/desliga com banda morta evita ciclos curtos e desperdício.',d:'Desafio: programar horários (aulas, madrugada com tarifa menor) maximiza o retorno.'}};
function selectPart(id){
 const svg=TL.el('dg-svg');svg.classList.add('dimmed');
 svg.querySelectorAll('g.part').forEach(g=>g.classList.toggle('sel',g.dataset.part===id));
 svg.querySelectorAll('.hotspot').forEach(h=>h.classList.toggle('sel',h.dataset.part===id));
 TL.$$('#dg-legend button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.part===id)));
 const p=PARTS[id];
 TL.el('dg-detail').innerHTML='<h3 style="color:var(--yellow)">'+p.n+'</h3>'
  +'<p style="margin:.4rem 0"><b style="color:var(--ink)">Função:</b> '+p.f+'</p>'
  +'<p style="margin:.4rem 0"><b style="color:var(--cyan)">Física:</b> '+p.p+'</p>'
  +'<p class="note warn" style="margin:.5rem 0 0">'+p.d+'</p>';
 TL.Sound.play('click');}
TL.modules.push(function(){
 // clima
 if(TL.el('clim-chart')){
  const chart=new TL.LineChart(TL.el('clim-chart'),{aria:'Temperatura mensal de Curitiba e estimativa da piscina sem aquecimento, com faixa de conforto 26 a 28 graus',
   fmtX:v=>MESES[TL.clamp(Math.round(v)-1,0,11)],fmtY:v=>TL.fmt(v,0)+'°',yMin:5,yMax:32,height:230,
   bands:[{y0:26,y1:28,color:'rgba(37,214,164,.14)',label:'conforto 26–28 °C'}]});
  chart.setSeries('med','Média mensal','#208DFF',MED.map((v,i)=>[i+1,v]));
  chart.setSeries('min','Mínima média','#39DDF2',MIN.map((v,i)=>[i+1,v]),[5,4]);
  chart.setSeries('pool','Piscina s/ aquecimento (est.)','#FF762E',MED.map((v,i)=>[i+1,v+1.5]));
  TL.Charts.push({tab:'cep',chart});
  TL.makeToggle(TL.el('clim-toggle'),{label:'Mostrar piscina aquecida a 27 °C',ico:'thermo',cool:true,val:false,onchange:v=>{
   if(v)chart.setSeries('aq','Com aquecimento','#25D6A4',MED.map((_,i)=>[i+1,27]),[2,3]);
   else{chart.o.series=chart.o.series.filter(s=>s.id!=='aq');chart.buildLegend();chart.schedule()}}});}
 // gauge
 if(TL.el('cg-ctl')){
  const out=TL.el('cg-out');
  const verdict=T=>T<20?['❄ Muito fria','Risco de choque térmico e hipotermia leve em exposição prolongada; desempenho despenca.','danger']:
   T<24?['🥶 Fria','Desconforto e tensão muscular; aulas curtas e pouco produtivas.','warn']:
   T<26?['🙂 Aceitável','Treino possível, mas abaixo do ideal para ensino e permanência.','info']:
   T<=28?['🏊 Ideal','Faixa de competição e aprendizado (World Aquatics: 25–28 °C). Conforto + desempenho.','']:
   T<=30?['😌 Quente','Boa para iniciação e atividades leves; atletas de rendimento sentem calor.','info']:
   ['🥵 Quente demais','Fadiga e sobrecarga térmica em esforço intenso; evitar treino pesado.','warn'];
  const upd=T=>{const [tt,dd,kind]=verdict(T);
   out.className='note'+(kind?' '+kind:'');out.innerHTML='<b>'+TL.fmt(T,1)+' °C — '+tt+'.</b> '+dd;
   TL.el('cg-marker').style.left=TL.clamp((T-16)/18*100,0,100)+'%';};
  TL.makeRange(TL.el('cg-ctl'),{label:'Temperatura da água',min:16,max:34,step:.5,val:22,unit:'°C',color:'var(--blue)',oninput:upd});
  upd(22);}
 // cards "por que"
 const WHY=[['school','Educação Física o ano todo','Aulas aquáticas deixam de ser sazonais: currículo contínuo, sem meses perdidos pelo frio.'],
  ['heart','Saúde e segurança','Água gelada causa choque térmico, cãibras e risco de hipotermia leve; 26–28 °C protege o aluno.'],
  ['timer','Mais horas de uso','Cobertura + aquecimento ampliam a janela diária e anual — o investimento trabalha mais.'],
  ['target','Treinamento esportivo','Equipes de natação treinam em faixa regulamentar, com rendimento e técnica preservados.'],
  ['access','Inclusão','Atividades adaptadas e hidroterapia exigem água morna; para muitos alunos, é a única piscina acessível.'],
  ['bolt','Infraestrutura moderna','Sensores, controle e energia bem dimensionada aproximam a escola pública do estado da arte.']];
 if(TL.el('why-grid'))TL.el('why-grid').innerHTML=WHY.map(w=>'<div class="card"><h3>'+TL.icon(w[0])+w[1]+'</h3><p>'+w[2]+'</p></div>').join('');
 const CH=[['bolt','Desafio elétrico','150 kW de emissores ≈ demanda de dezenas de chuveiros simultâneos. Exige estudo de carga e possivelmente reforço de entrada.'],
  ['coin','Desafio financeiro','Capex (equipamentos, obra, proteções) + opex (energia mensal). A cobertura térmica é o item que mais reduz a conta.'],
  ['shield','Segurança','Eletricidade junto à água: DR, aterramento, distâncias de segurança (NBR 5410 / NR-10) e manutenção certificada.'],
  ['leaf','Sustentabilidade','Solar térmico ou fotovoltaico + bomba de calor reduzem emissões e custo por kWh térmico.'],
  ['layers','Operação','Cobrir à noite, programar horários de aula, monitorar sensores: gestão vale tanto quanto equipamento.'],
  ['chart','Decisão baseada em dados','Comparar tecnologias com o mesmo ΔT, mesmas perdas e mesma tarifa — exatamente o que este laboratório faz.']];
 if(TL.el('chall-grid'))TL.el('chall-grid').innerHTML=CH.map(w=>'<div class="card"><h3>'+TL.icon(w[0])+w[1]+'</h3><p>'+w[2]+'</p></div>').join('');
 // parâmetros destacados
 if(TL.el('cep-params')){TL.statGrid(TL.el('cep-params'),[
  {id:'cp-v',label:'volume (hipotético)',kind:'hot'},{id:'cp-t0',label:'T inicial típica inverno'},{id:'cp-t1',label:'T desejada',kind:'ok'},
  {id:'cp-q',label:'energia p/ +5 °C'},{id:'cp-t',label:'tempo estimado 60 kW'}]);
  const upd=()=>{const L=TL.Lab?TL.Lab.s:{L:25,W:12.5,D:1.4};const V=L.L*L.W*L.D,Q=V*1000*4186*5;
   TL.setTxt('cp-v',TL.fmt(V,1)+' m³');TL.setTxt('cp-t0','≈ 15 °C');TL.setTxt('cp-t1','27 °C');
   TL.setTxt('cp-q',TL.fmt(Q/3.6e6,0)+' kWh');TL.setTxt('cp-t',TL.fmtDur(Q/(60000*.9)));};
  upd();TL.Bus.on('lab',upd);}
 // diagrama
 const svg=TL.el('dg-svg');if(!svg)return;
 const leg=TL.el('dg-legend');
 Object.entries(PARTS).forEach(([id,p])=>{const b=document.createElement('button');b.type='button';b.dataset.part=id;
  b.setAttribute('aria-pressed','false');b.textContent=p.n;
  b.addEventListener('click',()=>selectPart(id));leg.appendChild(b);});
 svg.querySelectorAll('.hotspot').forEach(h=>{
  h.addEventListener('click',()=>selectPart(h.dataset.part));
  h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPart(h.dataset.part)}});});
 selectPart('emissores');
});
})();