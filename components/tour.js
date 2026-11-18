/* ============================================================
   VISITA GUIADA INTERATIVA — Professor Virtual do Projeto
   Arquivo independente: tour.js
   ============================================================ */
'use strict';

(function(){
// Aguarda o TL estar disponível
function waitForTL(callback){
 if(window.TL && window.TL.App){
  callback();
 } else {
  setTimeout(()=>waitForTL(callback), 100);
 }
}

waitForTL(function(){
 const TL=window.TL;

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
  introModal:null,
  completionModal:null,
  metrics:{tabsVisited:new Set(),experiments:0,challengesCompleted:0}
 };

 Tour.steps=[
  {
   id:'intro',
   tab:'inicio',
   element:'main',
   title:'Bem-vindo(a)!',
   text:'Ei! Que tal conhecer o projeto? Vou te mostrar como tudo funciona: radiação, calor, simuladores e muito mais!',
   action:null,
   waitForAction:false,
   position:'center'
  },
  {
   id:'conhecendo',
   tab:'inicio',
   element:'#hero-title',
   title:'O Projeto',
   text:'Esse projeto mostra como a Física pode ser aplicada em uma situação real: o aquecimento da piscina do Colégio Estadual do Paraná.',
   action:null,
   waitForAction:false,
   position:'bottom'
  },
  {
   id:'radiacao',
   tab:'radiacao',
   element:'#sp-main',
   title:'Radiação Infravermelha',
   text:'A radiação infravermelha é energia eletromagnética relacionada ao calor.<br><br>Experimente clicar nas faixas do espectro!',
   action:'spectrum-interaction',
   waitForAction:true,
   position:'right'
  },
  {
   id:'transferencia',
   tab:'transferencia',
   element:'#me-rad',
   title:'Transferência de Calor',
   text:'Existem três formas: radiação, condução e convecção.<br><br>Clique nas animações para ver como funcionam.',
   action:'mechanism-click',
   waitForAction:true,
   position:'bottom'
  },
  {
   id:'cep',
   tab:'cep',
   element:'#dg-svg',
   title:'Aplicação no CEP',
   text:'Vamos trazer a física para a realidade do colégio. Clique nos números do diagrama para saber mais.',
   action:'diagram-interaction',
   waitForAction:true,
   position:'top'
  },
  {
   id:'laboratorio-a',
   tab:'laboratorio',
   element:'#lab-a',
   title:'Laboratório',
   text:'Aqui calculamos a energia necessária para aquecer a água.<br><br>Fórmula: <b>Q = m × c × ΔT</b>',
   action:null,
   waitForAction:false,
   position:'bottom'
  },
  {
   id:'laboratorio-calc',
   tab:'laboratorio',
   element:'#lab-a-in',
   title:'Experimente',
   text:'Altere as temperaturas e veja o resultado mudar automaticamente!',
   action:'calculator-input',
   waitForAction:true,
   position:'right'
  },
  {
   id:'simulador',
   tab:'simulador',
   element:'#pool-ctl',
   title:'Simulador',
   text:'Teste como diferentes condições afetam o aquecimento. Controle potência, temperatura e cobertura.',
   action:null,
   waitForAction:false,
   position:'left'
  },
  {
   id:'desafio-sim',
   tab:'simulador',
   element:'#pool-play',
   title:'Desafio',
   text:'1. Escolha temperaturas<br>2. Ligue o aquecimento<br>3. Observe o termômetro<br><br>Clique para ligar!',
   action:'heater-on',
   waitForAction:true,
   position:'top'
  },
  {
   id:'tecnologias',
   tab:'simulador',
   element:'#sc-chips',
   title:'Tecnologias',
   text:'Compare diferentes sistemas de aquecimento. Selecione opções e veja os resultados no gráfico.',
   action:'scenario-compare',
   waitForAction:true,
   position:'bottom'
  },
  {
   id:'acessibilidade',
   tab:'inicio',
   element:'#ax-btn',
   title:'Acessibilidade',
   text:'Este projeto é acessível! Aqui estão os controles de fonte, contraste e VLibras.',
   action:null,
   waitForAction:false,
   position:'left'
  },
  {
   id:'quiz',
   tab:'desafio',
   element:'#qz-box',
   title:'Quiz',
   text:'Teste o que aprendeu! Responda as perguntas. Não tem problema errar.',
   action:'quiz-answer',
   waitForAction:true,
   position:'right'
  },
  {
   id:'final',
   tab:'desafio',
   element:'#conclusao-blk',
   title:'Parabéns!',
   text:'Você completou a visita! Agora sabe usar todas as ferramentas. Continue experimentando!',
   action:null,
   waitForAction:false,
   position:'center'
  }
 ];

 function createOverlay(){
  if(Tour.overlay)return;
  
  Tour.overlay=document.createElement('div');
  Tour.overlay.id='tour-overlay';
  document.body.appendChild(Tour.overlay);
  
  Tour.tooltip=document.createElement('div');
  Tour.tooltip.id='tour-tooltip';
  Tour.tooltip.setAttribute('role','dialog');
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
     <h2>👋 Visita Guiada</h2>
     <p>Ei! Que tal conhecer o projeto?</p>
     <p>Vou te mostrar como tudo funciona!</p>
     <div class="tour-intro-buttons">
       <button type="button" class="btn heat" id="tour-start">▶ Começar</button>
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
  TL.toast('Visita iniciada!','info',2000);
 }

 function renderStep(){
  if(!Tour.active||Tour.step>=Tour.steps.length){
   showCompletion();
   return;
  }
  
  const step=Tour.steps[Tour.step];
  
  if(step.tab&&step.tab!==TL.App.tab){
   TL.App.go(step.tab,false);
  }
  
  setTimeout(()=>{
   const el=document.querySelector(step.element);
   if(el){
    highlightElement(el);
    positionTooltip(el,step);
    updateTooltipContent(step);
    updateProgressBar();
    scrollToElement(el);
    if(step.tab)Tour.metrics.tabsVisited.add(step.tab);
   } else {
    nextStep();
   }
  },400);
 }

 function highlightElement(el){
  if(!Tour.highlight)return;
  const rect=el.getBoundingClientRect();
  const scrollY=window.scrollY||window.pageYOffset;
  const scrollX=window.scrollX||window.pageXOffset;
  
  Tour.highlight.style.display='block';
  Tour.highlight.style.top=(rect.top+scrollY-6)+'px';
  Tour.highlight.style.left=(rect.left+scrollX-6)+'px';
  Tour.highlight.style.width=(rect.width+12)+'px';
  Tour.highlight.style.height=(rect.height+12)+'px';
  
  el.classList.add('tour-highlighted');
  setTimeout(()=>el.classList.remove('tour-highlighted'),3000);
 }

 function positionTooltip(el,step){
  if(!Tour.tooltip)return;
  const rect=el.getBoundingClientRect();
  const scrollY=window.scrollY||window.pageYOffset;
  
  let top,left;
  const tooltipWidth=340;
  const tooltipHeight=220;
  const margin=20;
  
  switch(step.position){
   case 'top':
    top=rect.top+scrollY-tooltipHeight-margin;
    left=rect.left+(rect.width/2)-(tooltipWidth/2);
    break;
   case 'bottom':
    top=rect.bottom+scrollY+margin;
    left=rect.left+(rect.width/2)-(tooltipWidth/2);
    break;
   case 'left':
    top=rect.top+scrollY+(rect.height/2)-(tooltipHeight/2);
    left=rect.left-tooltipWidth-margin;
    break;
   case 'right':
    top=rect.top+scrollY+(rect.height/2)-(tooltipHeight/2);
    left=rect.right+margin;
    break;
   default:
    top=window.innerHeight/2-(tooltipHeight/2)+scrollY;
    left=window.innerWidth/2-(tooltipWidth/2);
    break;
  }
  
  left=Math.max(margin,Math.min(left,window.innerWidth-tooltipWidth-margin));
  top=Math.max(80,Math.min(top,window.innerHeight-tooltipHeight-margin));
  
  Tour.tooltip.style.top=top+'px';
  Tour.tooltip.style.left=left+'px';
  Tour.tooltip.style.display='block';
 }

 function updateTooltipContent(step){
  if(!Tour.tooltip)return;
  
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
     <button type="button" class="btn sm ghost" id="tour-skip">Pular</button>
     <button type="button" class="btn sm heat" id="tour-next">${step.waitForAction?'Complete a ação':'Próximo →'}</button>
     <button type="button" class="btn sm ghost" id="tour-exit">✕ Sair</button>
   </div>
  `;
  
  Tour.tooltip.querySelector('#tour-prev').addEventListener('click',prevStep);
  Tour.tooltip.querySelector('#tour-skip').addEventListener('click',nextStep);
  Tour.tooltip.querySelector('#tour-next').addEventListener('click',()=>{
   if(!step.waitForAction||Tour.actions[step.id]){
    nextStep();
   } else {
    TL.toast('Complete a ação primeiro!','warn',2000);
   }
  });
  Tour.tooltip.querySelector('#tour-exit').addEventListener('click',exitTour);
  
  if(step.waitForAction&&!Tour.actions[step.id]){
   const nextBtn=Tour.tooltip.querySelector('#tour-next');
   nextBtn.disabled=true;
   nextBtn.style.opacity='0.5';
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
  const target=rect.top+window.scrollY-navH-40;
  window.scrollTo({top:Math.max(0,target),behavior:'smooth'});
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
  TL.toast('Visita encerrada','info',2000);
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
  
  Tour.completionModal.innerHTML=`
   <div class="tour-completion-content">
     <h2>🎉 Parabéns!</h2>
     <p>Você completou a visita!</p>
     
     <div class="tour-metrics">
       <div class="metric">
         <div class="metric-value">${tabsCount}/7</div>
         <div class="metric-label">Abas</div>
       </div>
       <div class="metric">
         <div class="metric-value">${experiments}</div>
         <div class="metric-label">Experimentos</div>
       </div>
     </div>
     
     <div class="tour-completion-buttons">
       <button type="button" class="btn heat" id="tour-restart">↻ Refazer</button>
       <button type="button" class="btn ghost" id="tour-home">Início</button>
       <button type="button" class="btn coolb" id="tour-continue">Continuar</button>
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

 function trackAction(actionId){
  if(!Tour.active)return;
  const currentStep=Tour.steps[Tour.step];
  if(currentStep&&currentStep.action===actionId){
   Tour.actions[currentStep.id]=true;
   Tour.metrics.experiments++;
   
   if(Tour.tooltip){
    const nextBtn=Tour.tooltip.querySelector('#tour-next');
    if(nextBtn){
     nextBtn.disabled=false;
     nextBtn.style.opacity='1';
     nextBtn.textContent='Próximo →';
    }
   }
   
   TL.toast('Ótimo! Clique em "Próximo"','ok',2000);
  }
 }

 function setupListeners(){
  document.addEventListener('click',e=>{
   if(!Tour.active)return;
   
   if(e.target.closest('.sp-band')||e.target.closest('[data-band]')){
    trackAction('spectrum-interaction');
   }
   
   if(e.target.closest('#me-rad')||e.target.closest('#me-con')||e.target.closest('#me-cnv')){
    trackAction('mechanism-click');
   }
   
   if(e.target.closest('.hotspot')||e.target.closest('[data-part]')){
    trackAction('diagram-interaction');
   }
   
   if(e.target.closest('#lab-a-in input')){
    trackAction('calculator-input');
   }
   
   if(e.target.closest('#pool-play')){
    trackAction('heater-on');
   }
   
   if(e.target.closest('#sc-chips button')||e.target.closest('#pool-compare')){
    trackAction('scenario-compare');
   }
   
   if(e.target.closest('.qz-opt')){
    trackAction('quiz-answer');
   }
  });
  
  const labInputs=document.querySelectorAll('#lab-a-in input');
  labInputs.forEach(input=>{
   input.addEventListener('change',()=>trackAction('calculator-input'));
   input.addEventListener('input',()=>{
    setTimeout(()=>trackAction('calculator-input'),500);
   });
  });
 }

 function initTourButton(){
  // Botão na tela inicial
  const heroSection=document.querySelector('#panel-inicio');
  if(heroSection){
   const btn=document.createElement('button');
   btn.type='button';
   btn.className='btn heat tour-start-btn';
   btn.id='tour-start-btn';
   btn.innerHTML='▶ INICIAR VISITA GUIADA';
   
   const title=heroSection.querySelector('h1,h2');
   if(title){
    title.insertAdjacentElement('afterend',btn);
   } else {
    heroSection.insertBefore(btn,heroSection.firstChild);
   }
   
   btn.addEventListener('click',()=>{
    if(TL.Sound)TL.Sound.play('click');
    showIntro();
   });
  }
  
  // Botão flutuante
  const helpBtn=document.createElement('button');
  helpBtn.type='button';
  helpBtn.className='tour-help-btn';
  helpBtn.id='tour-help-btn';
  helpBtn.setAttribute('aria-label','Iniciar visita guiada');
  helpBtn.textContent='?';
  document.body.appendChild(helpBtn);
  
  helpBtn.addEventListener('click',()=>{
   if(TL.Sound)TL.Sound.play('click');
   if(Tour.active){
    exitTour();
   } else {
    showIntro();
   }
  });
 }

 function init(){
  setupListeners();
  initTourButton();
  
  if(!TL.P.d.tourCompleted){
   setTimeout(()=>{
    showIntro();
   },2000);
  }
 }

 // Exportar
 window.Tour=Tour;
 window.startTour=startTour;
 window.exitTour=exitTour;

 // Inicializar
 if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
 } else {
  init();
 }

});
})();