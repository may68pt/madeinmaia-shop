'use strict';

const ids = ['raiz','sacral','umbigo','coracao','garganta','ajna','coroa'];
const locations = ['Períneo','Região genital','Zona do umbigo','Centro do peito','Garganta','Entre as sobrancelhas','Topo da cabeça'];
const mantras = ['Laṃ','Vaṃ','Raṃ','Yaṃ','Haṃ','Oṃ'];
const modernTones = ['#b95250','#c36d40','#ac8335','#4d8167','#407d9a','#6166a3','#805f9e'];
const stateNames = ['Em falta','Em equilíbrio','Em excesso','Por observar'];
const questionsAtlas = [
  'Como procuraste apoio e adaptaste as tuas rotinas?',
  'Que espaço deste às emoções, ao prazer e à experimentação?',
  'Como decidiste e agiste perante o que dependia de ti?',
  'Como deste ou recebeste cuidado sem perder de vista os teus limites?',
  'Como comunicaste o que precisavas e escutaste a resposta?',
  'Como separaste o que observaste das interpretações que fizeste?',
  'Que ligação encontraste entre os teus valores e as tuas ações?'
];
const choicesAtlas = [
  ['Faltou-me apoio ou uma rotina útil','Encontrei apoio com flexibilidade','Agarrei-me à rotina mesmo quando deixou de ajudar'],
  ['Dei pouco espaço à criatividade ou ao prazer','Experimentei e percebi como me sentia','Procurei mais estímulo sem parar para sentir'],
  ['Adiei decisões que podia tomar','Escolhi um passo e ajustei-o quando foi preciso','Tentei controlar mais do que a situação pedia'],
  ['Afastei-me quando me teria feito bem pedir apoio','Dei ou aceitei cuidado com limites claros','Dei mais do que conseguia sustentar'],
  ['Calei um pedido ou opinião importante','Falei com clareza e dei espaço à resposta','Insisti sem abrir espaço à outra pessoa'],
  ['Fiquei pela primeira explicação que me ocorreu','Distingui factos de hipóteses e aceitei rever a leitura','Fiquei preso a interpretações pouco sustentadas'],
  ['Custou-me ligar as escolhas a um valor meu','Transformei um valor num gesto concreto','Fiquei pela reflexão e adiei um passo concreto']
];
const firstSteps = [
  ['Faz o exercício de apoio físico e identifica uma pessoa ou rotina a que possas recorrer.','Mantém uma rotina pequena que já te serve e observa quando a adaptas.','Muda um pormenor de uma rotina com baixo risco e observa como te ajustas.'],
  ['Reserva três minutos para experimentar um movimento ou atividade criativa.','Regista o que te deu prazer e em que contexto surgiu.','Antes de procurar o estímulo seguinte, escreve uma frase sobre o que estás a sentir.'],
  ['Aplica o passo mínimo de cinco minutos a uma decisão pendente.','Repete uma decisão pequena e conserva o critério que usaste para a rever.','Define só o primeiro passo e deixa uma decisão secundária aberta até teres mais informação.'],
  ['Escreve um pedido específico de apoio que possas enviar, se fizer sentido.','Observa uma situação em que recebeste cuidado e mantiveste o teu limite.','Escolhe um gesto de cuidado com um limite claro de tempo ou disponibilidade.'],
  ['Experimenta formular o pedido em três frases antes da conversa.','Continua a usar pedidos concretos. Confirma o que ouviste antes de responder.','Espera pela resposta completa e resume o que ouviste antes de voltar ao teu ponto.'],
  ['Aplica as duas colunas e escreve uma hipótese alternativa.','Anota que observação te levou a mudar de ideia.','Define um facto que faria diferença e dá-te tempo até o conhecer.'],
  ['Escolhe um valor e um gesto de cinco minutos que o ponha em prática.','Identifica um gesto que valha a pena repetir na próxima semana.','Escolhe a decisão que tens adiado e escreve a primeira ação concreta.']
];
const connections = [
  ['sacral','A sensação de apoio pode facilitar a exploração. Repara se uma rotina simples abre espaço para experimentar.'],
  ['umbigo','Reconhecer uma emoção pode ajudar a escolher o que fazer com ela. O umbigo é a metáfora para esse passo de ação.'],
  ['coracao','Uma decisão ganha contexto quando perguntas de quem precisas e quem será afetado. O coração introduz o cuidado e o vínculo.'],
  ['garganta','Um limite afetivo torna-se mais fácil de negociar quando ganha palavras. A garganta liga o cuidado à expressão.'],
  ['ajna','Depois de falar e ouvir, podes rever o que supunhas sobre a intenção da outra pessoa. Ājñā enquadra essa revisão.'],
  ['coroa','Depois de distinguir factos de hipóteses, pergunta que valor queres usar para orientar a decisão.'],
  ['raiz','Um valor ganha forma numa rotina ou ação pequena. A coroa liga-se assim à raiz num ciclo prático de reflexão.']
];
const el = (id) => document.getElementById(id);
const linkTo = (id) => '#centro-' + id;
const centerLinks = () => [...document.querySelectorAll('[data-center]')];
el('corpo').innerHTML = chakraDiagram.render(ids,modernTones,linkTo,'atlas')+chakraDiagram.motionButton('atlas');
el('centros').innerHTML = ids.map((id,i)=>`<li><a href="${linkTo(id)}" data-center="${id}" style="--tone:${modernTones[i]}"><span class="energy-number">${i+1}</span><span>${chakraDiagram.names[i]}<small>${data[i][0]}</small></span></a></li>`).join('');

const textTones=['#ffa29f','#ffc08a','#ffe08a','#a8dfbd','#a3dff5','#b8bcff','#dfbaf5'];

function renderCenter(i,{move=false}={}) {
  const [name,meaning,location,icon,element,,detail,color,theme,,verses] = data[i];
  const id=ids[i], entry=deep[i], [adjacent, connection]=connections[i];
  const swatch = `<i class="dot" aria-hidden="true" style="--tone:${modernTones[i]}"></i>`;
  centerLinks().forEach(a=>a.setAttribute('aria-current',String(a.dataset.center===id)));
  ambiente.stop();
  const sound = `<div class="audio"><h4>${mantras[i] ? 'Sílaba ritual · '+mantras[i] : 'Coroa · pausa contemplativa'}</h4><p>${mantras[i] ? 'A peça explora uma frequência de referência moderna.' : 'A ficha da coroa não fixa uma sílaba. Podes ficar em silêncio ou ouvir o ambiente instrumental.'}</p>${ambiente.markup(i)}</div>`;
  el('ficha').style.setProperty('--chakra-accent',textTones[i]);
  el('ficha').innerHTML = `
  <p class="eyebrow">CENTRO ${i+1} DE 7 · ${locations[i].toUpperCase()}</p>
  <h3 id="nome-chakra" class="name" tabindex="-1">${name}</h3><p class="meaning">${meaning} · ${theme}</p>
  <dl class="facts"><div><dt>Localização simbólica</dt><dd>${location}</dd></div>
  <div><dt>Cor moderna</dt><dd>${swatch}${color}</dd></div>
  <div><dt>Elemento e som no texto</dt><dd>${i===6?'Além dos cinco elementos':element}</dd></div>
  </dl>
  ${chakraFigures.gallery(i)}
  ${sound}
  <details open><summary>Propósito, estados e ações</summary><div><p>${entry.purpose}</p><ul class="state-list">
  ${entry.states.map((state,j)=>`<li><h4 class="state-label">${chakraFigures.state(j)}${stateNames[j]}</h4><p>${state}</p><p><strong>Experimenta.</strong> ${firstSteps[i][j]}</p></li>`).join('')}
  </ul></div></details>
  <details><summary>Ferramentas para praticar</summary><div>${entry.tools.map(([label,desc])=>{
    const [toolName,duration]=label.split(' · ');
    return `<div class="tool"><div class="tool-head"><h4>${toolName}</h4><span class="tool-time">${chakraFigures.clock}${duration}</span></div><p>${desc}</p></div>`;
  }).join('')}<p><strong>Para refletir.</strong> ${entry.prompts}</p></div></details>
  <details><summary>Iconografia e função ritual</summary><div><p>${icon}.</p><p>${detail}</p><p class="muted">Pūrṇānanda, vv. ${verses}. As cores das figuras e regiões do lótus têm significados próprios no texto.</p></div></details>
  <details><summary>Como se liga a outro centro</summary><div><p>${connection}</p><a href="${linkTo(adjacent)}">Explorar ${data[ids.indexOf(adjacent)][0]}</a></div></details>
  <nav class="actions" aria-label="Percurso do chakra">
    <a class="primary" href="/chakras/slides.html#/${id}">Ver capítulo ${i+1}</a>
    ${i<ids.length-1?`<a class="secondary" href="${linkTo(ids[i+1])}">Seguinte · ${i+2}. ${chakraDiagram.names[i+1]}</a>`:'<a class="secondary" href="/chakras/slides.html#/quiz">Fazer o quiz</a>'}
  </nav>`;
  if (move) el('nome-chakra').focus();
}
function openFromHash() {
  if (!location.hash.startsWith('#centro-')) return;
  const index=ids.indexOf(location.hash.slice(8));
  if(index>=0)renderCenter(index,{move:true});
}
window.addEventListener('hashchange',openFromHash);
el('mapa').addEventListener('click',(event)=>{
  const a=event.target.closest('a[href^="#centro-"]');
  if(a && a.getAttribute('href')===location.hash)openFromHash();
});
renderCenter(0);
openFromHash();

el('perguntas-leitura').innerHTML=ids.map((id,i)=>`<fieldset><legend>${i+1}. ${data[i][0]}</legend><p>${questionsAtlas[i]}</p><div class="choices">
${[...choicesAtlas[i],'Ainda não consigo avaliar'].map((label,j)=>`<label><input type="radio" name="${id}" value="${j}" required> ${label}</label>`).join('')}</div></fieldset>`).join('');
const historyKey='mim-chakras-readings-v1';
function getHistory(){
  try {
    const entries=JSON.parse(localStorage.getItem(historyKey) || '[]');
    if (!Array.isArray(entries)) return [];
    return entries.filter(e=>typeof e?.context==='string' && typeof e?.date==='string' && !Number.isNaN(Date.parse(e.date)) &&
      Array.isArray(e.answers) && e.answers.length===7 && e.answers.every(a=>Number.isInteger(a)&&a>=0&&a<=3));
  } catch {return [];}
}
function resultList(answers,previous){
  const list=document.createElement('ul');
  list.className='result-list';
  answers.forEach((state,i)=>{
    const row=document.createElement('li');
    const name=document.createElement('strong');
    const anchor=document.createElement('a');
    anchor.href=linkTo(ids[i]);
    anchor.textContent=data[i][0];
    name.append(anchor,document.createTextNode(' · '+stateNames[state]));
    const summary=document.createElement('span');
    summary.textContent=state===3?'Escolhe uma situação comparável e observa como reagiste.':firstSteps[i][state];
    row.append(name,summary);
    if(previous && previous.answers[i]!==state){
      const comparison=document.createElement('p');
      comparison.className='muted';
      comparison.textContent='Leitura anterior no mesmo contexto: '+stateNames[previous.answers[i]]+'.';
      row.append(comparison);
    }
    list.append(row);
  });
  return list;
}
function renderHistory(){
  const entries=getHistory();
  const list=el('historico');
  list.replaceChildren();
  el('limpar-historico').hidden=!entries.length;
  if(!entries.length){list.textContent='Ainda não há leituras guardadas.';return;}
  entries.forEach(({date,context,answers})=>{
    const details=document.createElement('details');
    const summary=document.createElement('summary');
    summary.textContent=new Intl.DateTimeFormat('pt-PT',{dateStyle:'medium',timeStyle:'short'}).format(new Date(date))+(context?' · '+context:'');
    details.append(summary,resultList(answers));
    list.append(details);
  });
}
el('checkin').addEventListener('submit',(event)=>{
  event.preventDefault();
  const values=new FormData(event.currentTarget);
  if(ids.some(id=>!values.has(id)))return;
  const answers=ids.map(id=>Number(values.get(id)));
  const context=el('contexto-pessoal').value.trim();
  const prev=context?getHistory().find(e=>e.context.toLocaleLowerCase('pt-PT')===context.toLocaleLowerCase('pt-PT')):null;
  const result=el('resultado');
  result.innerHTML='<h3 id="titulo-resultado" tabindex="-1">A tua leitura</h3><p>Este retrato descreve as tuas respostas neste contexto. Escolhe uma ação para experimentar e revê o que aconteceu daqui a uma semana.</p><button type="button" class="secondary" id="guardar-leitura">Guardar neste dispositivo</button><p class="muted" role="status" id="estado-guardar"></p>';
  result.querySelector('p').after(resultList(answers,prev));
  result.hidden=false;
  el('titulo-resultado').focus();
  el('guardar-leitura').addEventListener('click',()=>{
    try{
      localStorage.setItem(historyKey,JSON.stringify([{date:new Date().toISOString(),context,answers},...getHistory()].slice(0,12)));
      el('guardar-leitura').disabled=true;
      el('estado-guardar').textContent='Leitura guardada.';
      renderHistory();
    }catch{el('estado-guardar').textContent='Este navegador não permitiu guardar a leitura.';}
  });
});
el('checkin').addEventListener('reset',()=>{
  el('resultado').hidden=true;
  el('resultado').replaceChildren();
});
el('limpar-historico').addEventListener('click',()=>{
  try{localStorage.removeItem(historyKey);renderHistory();}
  catch{el('historico').textContent='Este navegador não permitiu apagar o histórico.';}
});
renderHistory();
