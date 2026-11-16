'use strict';

const slides = document.querySelector('#slides');
const ids = ['raiz','sacral','umbigo','coracao','garganta','ajna','coroa'];
const tones = ['#f4968c','#fab583','#f0cf7b','#92d0aa','#8cc9e3','#a8b6f7','#d3abec'];
const locations = ['Períneo','Região genital','Zona do umbigo','Centro do peito','Garganta','Entre as sobrancelhas','Topo da cabeça'];
const link = (id, label) => `<a href="#/${id}">${label}</a>`;
const nav = (...links) => `<nav class="controls-nav" aria-label="Avançar na apresentação">${links.join('')}</nav>`;
const frame = (id, content, tone = 'var(--gold)') => `<section id="${id}" style="--chakra-tone:${tone}">${content}</section>`;
const title = (label, headline) => `<p class="kicker">${label}</p><h2>${headline}</h2>`;
const mapLinks = data.map(([name],i) => `<li><a href="#/${ids[i]}" style="--tone:${tones[i]}"><span class="energy-number">${i+1}</span><span>${chakraDiagram.names[i]}</span><small>${name} · ${locations[i]}</small></a></li>`).join('');
const story = [
  'A Inês confirma quem a pode ajudar a ir buscar a filha.',
  'Antes de responder, dá nome ao que sente: irritação e preocupação.',
  'Escolhe o que consegue fazer agora: propor uma troca.',
  'Pergunta à colega que horários também funcionam para ela.',
  'Faz um pedido concreto e ouve a proposta da colega.',
  'Confirma se a chefia viu a mensagem antes de interpretar o silêncio.',
  'Propõe um prazo de aviso para proteger os compromissos da equipa.'
];
const bites = [
  [['Falta de apoio','Rotina flexível','Rigidez'], 'Sente os pés no chão. Identifica um apoio que podes usar hoje.'],
  [['Pouco espaço para sentir','Curiosidade','Procura constante de estímulo'], 'Põe uma música e experimenta um movimento durante três minutos.'],
  [['Adiamento','Iniciativa flexível','Controlo excessivo'], 'Escolhe uma decisão adiada. Faz o primeiro passo em cinco minutos.'],
  [['Distância','Cuidado com limites','Dar em demasia'], 'Escolhe um gesto de cuidado e define o teu limite de tempo.'],
  [['Silêncio','Clareza e escuta','Monopolizar a conversa'], 'Diz o que aconteceu, explica o que precisas e faz um pedido concreto.'],
  [['Conclusão apressada','Atenção e discernimento','Ruminação'], 'Escreve duas colunas: o que observaste e o que interpretaste.'],
  [['Falta de direção','Valores em ação','Reflexão sem ação'], 'Escolhe um valor e uma ação pequena que o ponha em prática hoje.'],
];
const brief = (kicker,heading,body,links='') => `${title(kicker,heading)}<p class="lead">${body}</p>${links}`;
const states = (words) => `<ol class="state-scale">${words.map((word,i)=>`<li><span>${['Em falta','Em equilíbrio','Em excesso'][i]}</span><strong>${word}</strong></li>`).join('')}</ol>`;
const atlas = (id,label='Abrir a ficha completa') => `<a href="/chakras#centro-${id}">${label}</a>`;
slides.innerHTML = [
  frame('mapa',`${title('Da raiz à coroa','Os sete centros')}<div class="map"><figure class="energy-figure">${chakraDiagram.render(ids,tones,id=>'#/'+id,'slides')}${chakraDiagram.motionButton('slides')}</figure><ol class="map-links">${mapLinks}</ol></div>`),
  frame('inicio',brief('Sete centros','Da raiz à coroa','Começa na raiz e percorre os sete centros até à coroa.',nav(link('raiz','Começar pelo 1'),link('mapa','Ver o mapa')))),
  frame('contexto',brief('Tradição','O que é um chakra?','«Chakra» significa roda. As tradições tântricas usam estes centros como pontos de contemplação.',nav(link('canais','Ver como se ligam')))),
  frame('canais',brief('Corpo subtil','Da base à coroa','No texto de Pūrṇānanda, a kuṇḍalinī ascende pelo canal central, a suṣumṇā.',nav('<a href="/chakras#energia">Ver o diagrama dos canais</a>'))),
  frame('estados',`${title('Leitura contemporânea','Três tendências')}${states(['Pouco espaço','Margem para ajustar','Ocupa espaço a mais'])}<p class="note">Um exercício de auto-observação.</p>`),
  frame('historia',brief('Um exemplo','O turno da Inês mudou','Faltam duas horas para ir buscar a filha à escola. O que pode fazer?',nav(link('raiz','Acompanhar a Inês')))),
  ...data.map(([name,meaning,location,,element,,,,theme],i)=>{
    const id=ids[i], tone=tones[i], step=percurso[i], [words,practice]=bites[i];
    const chapter=`${i+1} / 7 · ${name}`;
    const stage=(number,label)=>`${chapter} · ${number}/4 ${label}`;
    const following=i===6?link('desfecho','Concluir o percurso'):link(ids[i+1],'Próximo chakra');
    return `<section>
      ${frame(id,`<div class="chapter-open"><div>${title(stage(1,'História'),step.acao)}<p class="lead">${story[i]}</p>${nav(link(id+'-simbolos','Ver o símbolo'))}</div><figure>${glyph(step)}</figure></div>`,tone)}
      ${frame(id+'-simbolos',`<div class="chapter-open"><div>${title(stage(2,'Símbolo'),meaning)}<p class="lead">${location}.</p><p class="note">${step.petalas===1000?'Mil pétalas':step.petalas+' pétalas'} · ${i===6?'Lótus da coroa':element}</p>${ambiente.markup(i)}${nav(atlas(id))}</div><figure>${glyph(step)}</figure></div>`,tone)}
      ${frame(id+'-estados',`${title(stage(3,'Estados'),theme.split(',')[0])}${states(words)}${nav(link(id+'-praticas','Experimentar uma ação'))}`,tone)}
      ${frame(id+'-praticas',brief(stage(4,'Prática'),'Experimenta',practice,nav(following,atlas(id,'Mais exercícios'))),tone)}
    </section>`;
  }),
  frame('desfecho',brief('A história completa','Do apoio ao acordo','A Inês resolve a troca de turno. Depois propõe à equipa um prazo de aviso para futuras mudanças.',nav(link('ciclo','Passar à prática')))),
  frame('ciclo',`${title('Aplicação pessoal','Uma semana de observação')}<ol class="cycle-steps"><li>Situar</li><li>Observar</li><li>Experimentar</li><li>Rever</li></ol>${nav('<a href="/chakras#leitura">Fazer a leitura pessoal</a>')}`),
  frame('comparar',brief('Revisão','Que centro te ficou na memória?','Reabre o mapa ou testa o que aprendeste.',nav(link('mapa','Rever o mapa'),link('quiz','Fazer o quiz')))),
  frame('quiz',`<div class="quiz" id="jogo" aria-label="Quiz dos chakras"></div>`),
  frame('fontes',brief('Leitura complementar','Fontes do percurso','Consulta os textos tântricos e as referências modernas no atlas.',nav('<a href="/chakras#fontes">Abrir as fontes</a>',link('inicio','Voltar ao início')))),
].join('');

const game = document.querySelector('#jogo');
let question = 0;
let score = 0;
function renderQuestion({focus = false} = {}) {
  if (question === questions.length) {
    game.innerHTML = `<h3 tabindex="-1">Acertaste ${score} em ${questions.length}.</h3><button class="next" type="button">Recomeçar</button>${nav(link('mapa','Rever o mapa'),link('fontes','Consultar as fontes'))}`;
    if (focus) game.querySelector('h3').focus();
    game.querySelector('button').addEventListener('click', () => {
      question = 0;
      score = 0;
      renderQuestion({focus:true});
    });
    return;
  }
  const [prompt,options,answer,explanation] = questions[question];
  game.innerHTML = `<p class="kicker">Pergunta ${question+1} de ${questions.length}</p><p class="question" tabindex="-1">${prompt}</p><ol>${options.map((option,i)=>`<li><button type="button" data-option="${i}">${option}</button></li>`).join('')}</ol><p class="feedback" role="status"></p><button class="next" type="button" disabled>${question+1 === questions.length ? 'Ver resultado' : 'Próxima pergunta'}</button>`;
  if (focus) game.querySelector('.question').focus();
  const buttons = [...game.querySelectorAll('[data-option]')];
  const advance = game.querySelector('.next');
  buttons.forEach((button,i) => button.addEventListener('click', () => {
    if (i === answer) score += 1;
    else button.dataset.mark = 'errada';
    buttons[answer].dataset.mark = 'certa';
    buttons.forEach(option => {option.disabled = true;});
    game.querySelector('.feedback').textContent = (i === answer ? 'Certo. ' : 'Resposta certa: '+options[answer]+'. ') + explanation;
    advance.disabled = false;
    advance.focus();
  }));
  advance.addEventListener('click', () => {
    question += 1;
    renderQuestion({focus:true});
  });
}
renderQuestion();

const quiet = matchMedia('(prefers-reduced-motion:reduce)').matches;
const previous=document.querySelector('#slide-prev');
const next=document.querySelector('#slide-next');
const page=document.querySelector('#slide-page');
function updatePager(){
  const all=Reveal.getSlides();
  const current=Reveal.getCurrentSlide();
  const index=all.indexOf(current);
  previous.disabled=index<=0;
  next.disabled=index>=all.length-1;
  page.textContent=`${index+1} / ${all.length}`;
  current?.scrollTo?.(0,0);
}
previous.addEventListener('click',()=>Reveal.prev());
next.addEventListener('click',()=>Reveal.next());
Reveal.on('slidechanged',()=>{ambiente.stop();updatePager();});
Reveal.initialize({width:'100%',height:'100%',hash:true,controls:false,progress:false,center:true,margin:0,
  navigationMode:'linear',transition:quiet?'none':'fade',history:false,scrollActivationWidth:0}).then(updatePager);
