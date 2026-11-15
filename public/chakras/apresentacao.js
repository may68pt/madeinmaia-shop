'use strict';

const slides = document.querySelector('#slides');
const ids = ['raiz','sacral','umbigo','coracao','garganta','ajna','coroa'];
const tones = ['#f4968c','#fab583','#f0cf7b','#92d0aa','#8cc9e3','#a8b6f7','#d3abec'];
const locations = ['Períneo','Região genital','Zona do umbigo','Centro do peito','Garganta','Entre as sobrancelhas','Topo da cabeça'];
const link = (id, label) => `<a href="#/${id}">${label}</a>`;
const nav = (...links) => `<nav class="controls-nav" aria-label="Avançar na apresentação">${links.join('')}</nav>`;
const frame = (id, content, tone = '#efba80') => `<section id="${id}" style="--accent:${tone}">${content}</section>`;
const title = (label, headline) => `<p class="kicker">${label}</p><h2>${headline}</h2>`;
const bodyMap = () => {
  const points = [351,306,266,203,151,88,39];
  const markers = points.map((y,i) => `<a href="#/${ids[i]}" aria-label="${data[i][0]}, ${locations[i]}"><circle cx="150" cy="${y}" r="19" fill="transparent"/><circle cx="150" cy="${y}" r="8" fill="${tones[i]}" stroke="#171b18" stroke-width="2"/></a>`).join('');
  return `<svg viewBox="0 0 300 420" aria-label="Silhueta de frente com sete posições simbólicas">
    <path d="M134 127 L134 137 Q122 149 89 158 Q69 164 61 195 L26 312 Q23 324 33 327 Q43 330 50 313 L86 234 Q92 253 85 278 Q75 315 100 345 Q121 362 132 395 L168 395 Q179 362 200 345 Q225 315 215 278 Q208 253 214 234 L250 313 Q257 330 267 327 Q277 324 274 312 L239 195 Q231 164 211 158 Q178 149 166 137 L166 127 Z" fill="#292f27" stroke="#777969" stroke-width="2"/>
    <ellipse cx="150" cy="90" rx="40" ry="51" fill="#292f27" stroke="#777969" stroke-width="2"/>
    <line x1="150" y1="39" x2="150" y2="351" stroke="#b8ac95" stroke-dasharray="4 6"/>
    ${markers}
  </svg>`;
};
const mapLinks = data.map(([name],i) => `<li><a href="#/${ids[i]}" style="--tone:${tones[i]}"><i class="dot" aria-hidden="true"></i>${name}<small>${locations[i]}</small></a></li>`).reverse().join('');
const rings = tones.map((tone,i)=>`<i style="--tone:${tone};--ring:${93-i*12}%"></i>`).join('');

slides.innerHTML = [
  frame('inicio',`<div class="hero"><div><p class="kicker">Uma apresentação interativa</p><h1>Os chakras<br>da raiz à coroa</h1><p class="dek">Um mapa do corpo subtil, sete capítulos sobre a tradição e práticas de reflexão para explorar cada centro.</p>${nav(link('mapa','Explorar o mapa'),link('contexto','Conhecer a tradição'))}</div><div class="wheel" aria-hidden="true">${rings}</div></div>`),
  frame('mapa',`${title('Mapa corporal','Onde se situam?')}<div class="map">${bodyMap()}<ol class="map-links">${mapLinks}</ol></div><p class="note">Vista de frente. As posições são simbólicas. As cores seguem a convenção moderna.</p>`),
  frame('contexto',`${title('Contexto histórico','Como se lê este mapa?')}
    <div class="split"><div><h3>Rodas e lótus</h3><p>Cakra significa «roda» em sânscrito. Em tradições tântricas hindus e budistas, os centros integram mapas contemplativos e rituais com contagens e disposições diversas.</p><h3>O texto de Pūrṇānanda</h3><p>No século XVI, o <i>Ṣaṭcakranirūpaṇa</i> descreveu seis centros e um lótus na coroa. A tradução inglesa de Arthur Avalon saiu em 1919.</p></div>
    <div><h3>Um percurso ritual</h3><p>A kuṇḍalinī ascende pela suṣumṇā, o canal central do corpo subtil. Os textos usam pétalas inscritas, sílabas-semente (bīja) e figuras como objetos de contemplação.</p><h3>As cores modernas</h3><p>A sequência de arco-íris difundiu-se no Ocidente no século XX. As cores das pétalas, dos elementos e das figuras no texto variam dentro de cada lótus.</p></div></div>
    ${nav(link('estados','Como ler os estados'),link('fontes','Fontes'))}`),
  frame('estados',`${title('Leitura contemporânea','Em falta, em equilíbrio, em excesso')}
    <p class="dek">Usamos o enquadramento de Anodea Judith como ponto de partida para observar padrões de comportamento.</p>
    <div class="state"><h3>Em falta</h3><p>O tema recebe pouco espaço. Na comunicação, um exemplo é evitar fazer um pedido importante.</p></div>
    <div class="state"><h3>Em equilíbrio</h3><p>Há margem para ajustar a resposta. Podes dizer o que precisas e ouvir o que a outra pessoa consegue oferecer.</p></div>
    <div class="state"><h3>Em excesso</h3><p>O tema ocupa demasiado espaço. Podes insistir tanto em explicar o teu ponto de vista que a outra pessoa perde a oportunidade de responder.</p></div>
    <p class="note">As categorias variam com o contexto e destinam-se à auto-observação. Ficam fora do âmbito do diagnóstico de saúde.</p>${nav(link('raiz','Começar na raiz'),link('mapa','Voltar ao mapa'))}`),
  ...data.map((d,i) => {
    const [name,meaning,location,icon,element,figures,,color,theme,,verse] = d;
    const id = ids[i], tone = tones[i], e = deep[i], x = contextos[i];
    const chapter = `Capítulo ${i+1} de 7 · ${name}`;
    const fields = [['Localização',location],['Iconografia',icon],['Elemento e som',element],['Figuras',figures]];
    const next = i === data.length-1 ? link('comparar','Comparar os sete') : link(ids[i+1],'Próximo chakra');
    return `<section>
      ${frame(id,`${title(chapter,meaning)}
        <dl class="fields">${fields.map(([key,value])=>`<div class="field"><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl>
        <p>${x.simbolo}</p><p class="note">Pūrṇānanda, vv. ${verse}. Na convenção moderna: ${color.toLowerCase()} · ${theme.toLowerCase()}.</p>
        ${nav(link(id+'-estados','Propósito e estados'),link(id+'-praticas','Ferramentas'),link('mapa','Mapa'))}`,tone)}
      ${frame(id+'-estados',`${title(chapter,'Propósito e estados')}
        <p class="dek">${e.purpose}</p>
        ${e.states.map((v,j)=>`<div class="state"><h3>${['Em falta','Em equilíbrio','Em excesso'][j]}</h3><p>${v}</p></div>`).join('')}
        <div class="callout"><h3>Na prática</h3><p>${x.cenario}</p></div>
        ${nav(link(id+'-praticas','Experimentar uma ferramenta'),link(id,'Tradição e símbolos'))}`,tone)}
      ${frame(id+'-praticas',`${title(chapter,'Ferramentas e reflexão')}
        <div class="split">${e.tools.map(([k,v])=>`<div class="tool"><h3>${k}</h3><p>${v}</p></div>`).join('')}</div>
        <div class="block"><h3>Quando aplicar</h3><p>${x.metodo}</p></div>
        <div class="block"><h3>O que observar depois</h3><p>${x.observar}</p></div>
        <p class="callout">${e.prompts}</p>
        ${nav(next,link(id+'-estados','Rever os estados'),link('mapa','Mapa'))}`,tone)}
    </section>`;
  }),
  frame('comparar',`${title('Síntese','Como distinguir os sete?')}
    <div class="split"><div><h3>Os cinco elementos</h3><ol><li>Raiz · terra e quadrado</li><li>Sacral · água e crescente</li><li>Umbigo · fogo e triângulo</li><li>Coração · ar e dois triângulos</li><li>Garganta · espaço e círculo</li></ol></div>
    <div><h3>Os dois pontos superiores</h3><p>Ājñā liga-se à mente e tem duas pétalas. Sahasrāra coroa o percurso com o lótus de mil pétalas.</p><h3>O mesmo centro em duas leituras</h3><p>O coração é avermelhado na descrição de Pūrṇānanda. O verde pertence ao arco-íris moderno.</p></div></div>
    ${nav(link('quiz','Jogar o quiz'),link('mapa','Rever o mapa'))}`),
  frame('quiz',`${title('Oito perguntas de escolha múltipla','Da raiz à coroa')}<div class="quiz" id="jogo"></div>`),
  frame('fontes',`${title('Referências','Para continuar a ler')}<ul class="sources">
    <li><a href="https://www.wisdomlib.org/hinduism/book/shat-cakra-nirupana-english">Pūrṇānanda · Ṣaṭcakranirūpaṇa</a>. Texto com tradução de Arthur Avalon e comentário de Kālīcaraṇa.</li>
    <li><a href="https://rw-ktf.univie.ac.at/fileadmin/user_upload/i_religionswiss/Theosophical_Orientalism_and_the_Structures_of_Intercultural_Transfer_-_Annotations_on_the_Appropriation_of_the_Cakras_in_Early_Theosophy__Karl_Baier_2016_.pdf">Karl Baier · Theosophical Orientalism</a>. A receção dos chakras na teosofia.</li>
    <li><a href="https://www.theosophical.org/publications/quest-magazine/the-rainbow-body-how-the-western-chakra-system-came-to-be-2">Kurt Leland · The Rainbow Body</a>. História das cores e interpretações modernas.</li>
    <li><a href="https://books.google.ie/books?id=T_VOWcbig0wC">Anodea Judith · Eastern Body, Western Mind</a>. Enquadramento contemporâneo dos padrões de comportamento.</li>
    </ul>${nav(link('inicio','Voltar ao início'),link('quiz','Jogar novamente'))}`),
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

const portrait = matchMedia('(max-width:680px) and (orientation:portrait)');
const dimensions = () => portrait.matches ? {width:580,height:790} : {width:1040,height:645};
const quiet = matchMedia('(prefers-reduced-motion:reduce)').matches;
Reveal.initialize({...dimensions(),hash:true,controls:true,progress:true,center:true,margin:.10,
  navigationMode:'linear',transition:quiet?'none':'fade',history:false});
portrait.addEventListener('change', () => Reveal.configure(dimensions()));
