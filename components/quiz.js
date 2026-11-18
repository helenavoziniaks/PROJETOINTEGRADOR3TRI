/* Quiz 14→10 + placar + 3 desafios ligados ao laboratório + conclusão ✔ */
'use strict';
(function(){
const TL=window.TL;
const BANK=[
 {t:'Espectro',q:'A radiação infravermelha é…',o:[['uma onda eletromagnética com λ maior que o do vermelho visível',1],['um tipo de som de baixa frequência',0],['um gás quente liberado por aquecedores',0],['uma corrente elétrica que flui pelo ar',0]],w:'O IR ocupa 700 nm–1 mm: ondas eletromagnéticas mais longas que a luz vermelha, que transportam energia sem meio material.'},
 {t:'Espectro',q:'No espectro eletromagnético, o infravermelho fica entre…',o:[['micro-ondas e luz visível',1],['ultravioleta e raios X',0],['raios X e gama',0],['rádio e micro-ondas',0]],w:'Ordem por λ decrescente: rádio → micro-ondas → IR → visível → UV → X → gama.'},
 {t:'Radiação',q:'Sentimos calor perto de uma brasa sem tocá-la principalmente por…',o:[['radiação infravermelha',1],['condução pelo ar',0],['convecção apenas',0],['evaporação da pele',0]],w:'A brasa emite IR que atravessa o ar e é absorvido pela pele. Convecção leva o ar quente para cima, não até você lateralmente.'},
 {t:'Emissão',q:'Todo corpo com temperatura acima de 0 K…',o:[['emite radiação térmica',1],['emite apenas luz visível',0],['só emite se estiver sólido',0],['não emite nada até 100 °C',0]],w:'Qualquer corpo acima do zero absoluto emite. Em temperaturas cotidianas, o pico cai no infravermelho.'},
 {t:'Wien',q:'Pela lei de Wien, ao aquecer um corpo o pico de emissão…',o:[['desloca-se para λ menores',1],['desloca-se para λ maiores',0],['fica fixo em 10 µm',0],['desaparece acima de 100 °C',0]],w:'λmáx = b/T. Ferro muito quente brilha alaranjado; o Sol (5778 K) tem pico em 0,50 µm, na luz visível.'},
 {t:'Stefan-Boltzmann',q:'Dobrando a temperatura absoluta de um corpo, a potência irradiada…',o:[['multiplica-se por 16',1],['dobra',0],['quadruplica',0],['não muda',0]],w:'P = εσAT⁴ → 2⁴ = 16. Por isso emissores mais quentes entregam muito mais potência por área.'},
 {t:'Condução',q:'Condução é transferência de calor…',o:[['por contato, de partícula em partícula',1],['por ondas eletromagnéticas',0],['pelo movimento de fluidos',0],['apenas no vácuo',0]],w:'Na placa absorvedora encostada na água, a vibração molecular passa energia por contato direto.'},
 {t:'Convecção',q:'Convecção envolve…',o:[['movimento de fluidos carregando energia',1],['contato entre sólidos',0],['fótons viajando no vácuo',0],['apenas metais',0]],w:'Água quente é menos densa e sobe; a fria desce. Essas correntes distribuem o calor pela piscina.'},
 {t:'Calor específico',q:'c = 4 186 J/(kg·°C) significa que…',o:[['são 4 186 J para elevar 1 kg de água em 1 °C',1],['a água ferve a 4 186 °C',0],['1 J eleva 4 186 kg em 1 °C',0],['a água perde 4 186 J por segundo',0]],w:'É por isso que piscinas demoram a aquecer: 437 500 kg × 4 186 J × 5 °C ≈ 9,16 bilhões de joules.'},
 {t:'Energia',q:'Para a mesma massa de água, dobrar o ΔT desejado…',o:[['dobra a energia Q necessária',1],['mantém Q igual',0],['reduz Q à metade',0],['quadruplica Q',0]],w:'Q = m·c·ΔT é linear em ΔT. Aquecer 10 °C custa exatamente o dobro de 5 °C.'},
 {t:'Potência',q:'P = Q/t. Para o mesmo Q, dobrar a potência útil…',o:[['reduz o tempo à metade',1],['dobra o tempo',0],['não altera o tempo',0],['dobra a energia',0]],w:'t = Q/P. Mas atenção: com perdas ativas, potência a mais também compensa as perdas — o ganho real pode ser maior que 2×.'},
 {t:'Perdas',q:'A cobertura térmica reduz perdas principalmente porque corta…',o:[['a evaporação',1],['a condução pelo fundo',0],['a radiação do Sol',0],['a convecção interna da água',0]],w:'Evaporação responde por ~70–80% das perdas de uma piscina descoberta. A capa corta ~90% disso.'},
 {t:'Eficiência',q:'Uma bomba de calor com COP 4,5…',o:[['entrega 4,5 kWh térmicos por 1 kWh elétrico, movendo calor do ar',1],['cria energia, violando a conservação',0],['tem 450% de eficiência de conversão elétrica',0],['consome 4,5 kWh por kWh térmico',0]],w:'Ela não cria energia: bombeia calor do ambiente para a água. A conservação de energia segue intacta.'},
 {t:'Aplicação',q:'A água absorve o IR distante (>3 µm)…',o:[['nos primeiros décimos de milímetro',1],['uniformemente em toda a profundidade',0],['só abaixo de 2 m',0],['não absorve nada',0]],w:'Por isso o aquecimento IR direto concentra calor na superfície — onde a evaporação o rouba. Placas absorvedoras + circulação contornam o problema.'}];
const QZ={round:[],idx:0,score:0,answered:false,missed:[]};
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function ring(pct){const C=326.7;TL.el('qz-ring').style.strokeDashoffset=String(C*(1-pct));TL.el('qz-ringtxt').textContent=Math.round(pct*100)+'%';}
function start(){QZ.round=shuffle(BANK.slice()).slice(0,10).map(q=>({t:q.t,q:q.q,w:q.w,o:shuffle(q.o.slice())}));
 QZ.idx=0;QZ.score=0;QZ.missed=[];ring(0);TL.setTxt('qz-score','0');render();}
function render(){
 const box=TL.el('qz-box');QZ.answered=false;
 if(QZ.idx>=QZ.round.length){finish();return}
 const q=QZ.round[QZ.idx];
 box.innerHTML='<p class="kicker">Pergunta '+(QZ.idx+1)+' / '+QZ.round.length+' · '+q.t+'</p>'
  +'<div class="qz-prog"><i style="width:'+(QZ.idx/QZ.round.length*100)+'%"></i></div>'
  +'<h3 style="margin:.6rem 0">'+TL.esc(q.q)+'</h3>'
  +q.o.map((o,i)=>'<button type="button" class="qz-opt" data-i="'+i+'">'+TL.esc(o[0])+'</button>').join('')
  +'<div class="qz-why" hidden></div><div class="btnrow"><button type="button" class="btn heat sm" id="qz-next" hidden>Próxima →</button></div>';
 box.querySelectorAll('.qz-opt').forEach(b=>b.addEventListener('click',()=>answer(+b.dataset.i)));
 TL.el('qz-next').addEventListener('click',()=>{QZ.idx++;render();TL.Sound.play('click')});}
function answer(i){
 if(QZ.answered)return;QZ.answered=true;
 const q=QZ.round[QZ.idx],box=TL.el('qz-box'),opts=box.querySelectorAll('.qz-opt');
 opts.forEach((b,j)=>{b.disabled=true;if(q.o[j][1])b.classList.add('right');else if(j===i)b.classList.add('wrong');});
 const ok=!!q.o[i][1];
 if(ok){QZ.score++;TL.Sound.play('ok')}else{QZ.missed.push(q);TL.Sound.play('bad')}
 TL.setTxt('qz-score',String(QZ.score));ring(QZ.score/QZ.round.length);
 const why=box.querySelector('.qz-why');why.hidden=false;
 why.innerHTML='<b style="color:'+(ok?'var(--teal)':'var(--red)')+'">'+(ok?'✔ Correto!':'✖ Não foi dessa vez.')+'</b> '+q.w;
 TL.el('qz-next').hidden=false;TL.el('qz-next').focus();}
function finish(){
 const pct=QZ.score/QZ.round.length;
 const tier=pct>=.9?'🏆 Nível pesquisador(a)! Domínio total do tema.':pct>=.7?'🥇 Excelente! Você pensa como um(a) físico(a).':pct>=.5?'🥈 Bom caminho — revise os módulos 01 e 02 e tente de novo.':'📚 Continue explorando: o laboratório tem todas as respostas.';
 const best=Math.max(TL.P.d.quizBest||0,QZ.score);TL.P.d.quizBest=best;TL.saveSoon();
 TL.setTxt('qz-best',best+'/10');
 if(pct>=.7)TL.Sound.play('win');
 TL.el('qz-box').innerHTML='<p class="kicker">Resultado final</p><h3>'+QZ.score+' / '+QZ.round.length+' acertos</h3>'
  +'<p class="note" style="margin:.6rem 0">'+tier+'</p>'
  +(QZ.missed.length?'<details><summary>Revisar as '+QZ.missed.length+' que errei</summary><div class="din">'+QZ.missed.map(q=>'<p style="margin:.5rem 0"><b>'+TL.esc(q.q)+'</b><br>'+q.w+'</p>').join('')+'</div></details>':'')
  +'<div class="btnrow"><button type="button" class="btn heat sm" id="qz-again">↻ Jogar novamente</button><button type="button" class="btn ghost sm" data-go="laboratorio">Ir ao laboratório</button></div>';
 TL.el('qz-again').addEventListener('click',start);}
/* ---- desafios ✔ (valores verificados: 2543,6 kWh · 47,1 h · R$ 367,41) ---- */
const Q5=25*12.5*1.4*1000*4186*5;
const CHS=[
 {id:'ch1',t:'Desafio 1 · Energia',q:'Quanta energia (em kWh) é preciso entregar à água da piscina hipotética do CEP (25 × 12,5 × 1,4 m) para elevá-la em 5 °C?',unit:'kWh',exp:Q5/3.6e6,
  lab:{L:25,W:12.5,D:1.4,T0:18,T1:23},hint:'Módulo A: Q = m·c·ΔT, depois converta J → kWh (÷ 3,6×10⁶).',
  sol:'m = 437 500 kg → Q = 437 500 × 4 186 × 5 = 9,157×10⁹ J = 2 543,6 kWh.'},
 {id:'ch2',t:'Desafio 2 · Tempo',q:'Com um sistema de 60 kW e eficiência de 90%, quantas horas leva esse aquecimento de +5 °C (sem perdas)?',unit:'h',exp:Q5/(60000*.9)/3600,
  lab:{L:25,W:12.5,D:1.4,T0:18,T1:23,P:60,eta:90},hint:'Módulo B: t = Q/(P·η). Use o cenário ideal/real, não o com perdas.',
  sol:'P útil = 60 × 0,9 = 54 kW → t = 2 543,6 / 54 ≈ 47,1 h (1 d 23 h).'},
 {id:'ch3',t:'Desafio 3 · Custo',q:'Quanto custa essa energia com bomba de calor COP 4,5 e tarifa de R$ 0,65/kWh?',unit:'R$',exp:Q5/3.6e6/4.5*.65,
  lab:{L:25,W:12.5,D:1.4,T0:18,T1:23,cop:4.5,tariff:.65},hint:'Módulo D: kWh térmicos ÷ COP × tarifa.',
  sol:'2 543,6 / 4,5 = 565,2 kWh elétricos × 0,65 = R$ 367,41.'}];
function buildChallenges(){
 const wrap=TL.el('ch-list');if(!wrap)return;
 const solved=TL.P.d.chSolved||{};
 wrap.innerHTML=CHS.map(c=>'<div class="card ch-card" id="'+c.id+'"><h3>'+TL.icon('target')+c.t+(solved[c.id]?' <span class="chip ok">✔ resolvido</span>':'')+'</h3>'
  +'<p>'+c.q+'</p><div class="ans"><input type="text" inputmode="decimal" id="'+c.id+'-in" aria-label="Sua resposta em '+c.unit+'" placeholder="0,0"><span class="chip">'+c.unit+'</span>'
  +'<button type="button" class="btn sm heat" data-ch="'+c.id+'">Verificar</button></div>'
  +'<div class="btnrow"><button type="button" class="btn sm coolb" data-chlab="'+c.id+'">⚙ Configurar laboratório</button></div>'
  +'<p class="note" id="'+c.id+'-fb" hidden></p>'
  +'<details><summary>Ver solução passo a passo</summary><div class="din">'+c.sol+'</div></details></div>').join('');
 wrap.querySelectorAll('[data-ch]').forEach(b=>b.addEventListener('click',()=>{
  const c=CHS.find(x=>x.id===b.dataset.ch);
  const raw=TL.el(c.id+'-in').value.replace(/\./g,'').replace(',','.');
  const val=parseFloat(raw.includes('.')?TL.el(c.id+'-in').value.replace(',','.'):raw);
  const fb=TL.el(c.id+'-fb');fb.hidden=false;
  if(!Number.isFinite(val)){fb.className='note warn';fb.innerHTML='Digite um número (aceita vírgula decimal).';return}
  if(Math.abs(val-c.exp)<=.08*c.exp){fb.className='note';fb.style.borderColor='var(--teal)';
   fb.innerHTML='<b style="color:var(--teal)">✔ Correto!</b> Valor esperado ≈ '+TL.fmt(c.exp,1)+' '+c.unit+'. '+c.sol;
   TL.P.d.chSolved=TL.P.d.chSolved||{};TL.P.d.chSolved[c.id]=true;TL.saveSoon();TL.Sound.play('win');
   b.closest('.card').querySelector('h3').insertAdjacentHTML('beforeend',' <span class="chip ok">✔ resolvido</span>');}
  else{fb.className='note warn';fb.innerHTML='<b>Ainda não.</b> Dica: '+c.hint+' (tolerância ±8%).';TL.Sound.play('bad')}}));
 wrap.querySelectorAll('[data-chlab]').forEach(b=>b.addEventListener('click',()=>{
  const c=CHS.find(x=>x.id===b.dataset.chlab);
  if(TL.Lab){Object.assign(TL.Lab.s,c.lab);
   Object.entries(c.lab).forEach(([k,v])=>{if(TL.Lab.h[k])TL.Lab.h[k].set(v,true)});
   TL.Lab.render();}
  TL.App.go('laboratorio');TL.toast('Laboratório configurado com os dados do '+c.t.split('·')[0].trim()+' ✔','ok');}));}
/* ---- conclusão ---- */
function buildConclusion(){
 const IMP=[['flask','Ciência aplicada','Conceitos de livro virando decisão de engenharia na própria escola.'],
  ['bolt','Energia consciente','Cada kWh contado: eficiência, cobertura e horários inteligentes.'],
  ['school','Escola moderna','Sensores e controle aproximam a infraestrutura pública do estado da arte.'],
  ['target','Iniciação científica','Medir, modelar, simular e argumentar com dados — o método científico completo.'],
  ['heart','Esporte & saúde','Água na temperatura certa: mais aulas, mais treino, mais inclusão.']];
 const ig=TL.el('impact-grid');if(ig)ig.innerHTML=IMP.map(w=>'<div class="card"><h3>'+TL.icon(w[0])+w[1]+'</h3><p>'+w[2]+'</p></div>').join('');
 const STEPS=['Medir as dimensões reais da piscina do CEP','Levantar a tarifa Copel vigente e a demanda elétrica disponível','Estudar a carga elétrica e as proteções (NR-10 / NBR 5410)','Prototipar em escala reduzida e validar o modelo','Comparar propostas: IR × solar × bomba de calor × gás','Apresentar o estudo à direção e à comunidade escolar'];
 const cc=TL.el('cc-list');if(!cc)return;
 const done=TL.P.d.ccDone||[];
 cc.innerHTML=STEPS.map((s,i)=>'<label class="check"><input type="checkbox" data-cc="'+i+'"'+(done.includes(i)?' checked':'')+'><span>'+s+'</span></label>').join('');
 cc.querySelectorAll('[data-cc]').forEach(inp=>inp.addEventListener('change',()=>{
  const arr=[...cc.querySelectorAll('[data-cc]')].filter(x=>x.checked).map(x=>+x.dataset.cc);
  TL.P.d.ccDone=arr;TL.saveSoon();TL.Sound.play(inp.checked?'on':'off');
  if(arr.length===STEPS.length){TL.toast('Roteiro completo! Pronto para virar projeto real 🎓','ok');TL.Sound.play('win')}}));}
TL.modules.push(function(){
 if(!TL.el('qz-box'))return;
 TL.setTxt('qz-best',TL.P.d.quizBest!==undefined?TL.P.d.quizBest+'/10':'—');
 TL.el('qz-restart').addEventListener('click',()=>{start();TL.Sound.play('click')});
 start();buildChallenges();buildConclusion();TL.updateJourney();});
})();