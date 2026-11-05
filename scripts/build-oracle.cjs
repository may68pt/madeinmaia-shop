const fs = require('node:fs');
process.chdir(require('node:path').join(__dirname, '../public/oracle'));
const editions = require('./oracle-editions.json');
const ball = '<div class="ball"><span>8</span></div>';
const stages = {
  '03': `<div class="arcade-scene"><img src="/oracle/art/maia-after-hours.webp" width="768" height="768" alt="Pixel-art television repair shop overlooking Maia at night"><div class="arcade-glass" aria-hidden="true">${ball}<span class="screen-answer"></span><i class="sweep"></i></div><span class="arcade-lamp" aria-hidden="true"></span><button class="arcade-knob" type="submit" aria-label="Turn the tuning dial"><span aria-hidden="true">╱</span></button></div>`,
};
const illustrations = {
  '05': ['fortune-lab', 'An amber fortune-testing machine surrounded by questionable specimens', 'Press the test switch', 'TEST', '63%','77%', '▰'],
  '07': ['oracle-records', 'A lime-lit record shop and an eight-ball vinyl on the deck', 'Cue the record', 'CUE', '74%','73%', '♪'],
  '08': ['cafe-hotline', 'A pink flip phone on a tiled late-night café counter', 'Pick up the phone', 'PICK UP', '34%','66%', '☎'],
  '09': ['restricted-archive', 'A sci-fi archive desk with files and a wireframe eight-ball terminal', 'Break the seal', 'OPEN', '87%','65%', '▤'],
  '10': ['bone-shop', 'A candlelit curiosity shop with a velvet tray of carved bones', 'Throw the bones into the tray', 'CAST', '50%','67%', '✦'],
  '11': ['goose-lodge', 'A hunting lodge, a pewter platter of cartoon entrails, and a suspicious goose', 'Consult the platter', 'READ', '50%','67%', '✦'],
};
const draw = (theme) => {
  if (theme === '03') return `<div class="stage art-stage">${stages[theme]}</div>`;
  const [file, alt, label, tag, x, y, icon] = illustrations[theme];
  const effect = theme === '10' ? '<i></i><i></i><i></i>' : icon;
  const hazard = theme === '05' ? `<div class="hazard-motion" aria-hidden="true">
    <div class="hazard-machine"></div><div class="hazard-chamber"><div class="hazard-ball"></div></div>
    <div class="hazard-gauge"><i></i></div><div class="hazard-beacon"></div>
    <div class="hazard-octopus"></div><div class="hazard-fish"></div>
    <div class="hazard-steam"><i></i><i></i><i></i></div>
    <div class="hazard-puff"></div><div class="hazard-vent"></div>
    <div class="hazard-sparks"><i></i><i></i><i></i><i></i></div>
    <div class="hazard-tape"></div>
  </div>` : '';
  return `<div class="stage art-stage"><div class="arcade-scene themed-scene" style="--spot-x:${x};--spot-y:${y}">
  <img src="/oracle/art/${file}.webp" width="512" height="512" alt="${alt}">
  ${hazard || `<span class="scene-spark" aria-hidden="true"></span><span class="scene-effect" aria-hidden="true">${effect}</span>`}
  <button class="scene-control" type="submit" aria-label="${label}">${tag}</button>
  </div></div>`;
};
const page = (title, theme, root, content) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Made in Maia</title><meta name="description" content="The Made in Maia Oracle Series. Seven ways to ask fate.">
<link rel="stylesheet" href="/oracle/oracle.css"></head>
<body data-edition="${theme}"><div class="site">
<header><a class="brand" href="${root}">MADE IN MAIA</a><a class="series" href="${root}">ORACLE SERIES <span>↗</span></a></header>
<main>${content}</main>
<footer><span>MADE IN MAIA / LINK LABEL</span><a href="/magic-8-ball">Classic Magic 8 Ball ↗</a><a href="https://madeinmaia.pt/loja">Explore the shop ↗</a></footer>
</div></body></html>`;
const list = (current) => editions.map(([number, slug, title, label]) =>
  `<a class="edition" data-tile="${number}" href="/oracle/${slug}"${current === number ? ' aria-current="page"' : ''}><small>${number} / ${label}</small><strong>${title}</strong><span aria-hidden="true">↗</span></a>`
).join('');
fs.writeFileSync('index.html',page('Oracle Series','index','/oracle',`<section class="intro"><div class="kicker"><i></i> LINK LABEL / COLLECTION 01</div><h1>Oracle<br>Series<span>.</span></h1><p>Seven ways to ask fate.<br>Choose how you want to hear from fate.</p></section><nav class="editions" aria-label="Oracle editions">${list()}</nav>`));
for (const [number, slug, title, label, description, action, loading, again, result] of editions) {
  fs.mkdirSync(slug,{recursive:true});
  fs.writeFileSync(slug+'/index.html',page(title,number,'/oracle',`<article class="experience">
<div class="copy"><div class="kicker"><i></i> ORACLE ${number} / ${label}</div><h1>${title}<span>.</span></h1><p>${description}</p>
</div>
<form class="instrument" data-phase="idle">
<div class="question-box">${number === '05' ? '<button class="hazard-sound" type="button" aria-pressed="true">Sound</button>' : ''}<label for="question">Your yes-or-no question</label><input id="question" type="text" maxlength="90" placeholder="Will tonight go to plan?" enterkeyhint="go" required></div>
${draw(number)}<div class="controls">
<div class="readout"><small id="state" data-result="${result}">AWAITING QUESTION</small><div role="status" aria-atomic="true"><p id="asked" hidden></p><p id="answer">The 8 is ready.</p></div></div>
<button id="ask" type="submit" data-loading="${loading}" data-again="${again}" disabled><span>${action}</span><b aria-hidden="true">↗</b></button>
<noscript><p>Enable JavaScript to ask the Magic 8 Ball.</p></noscript></div></form>
</article><nav class="editions" aria-label="Oracle editions">${list(number)}</nav>
<script src="/oracle/oracle.js" defer></script>`));
}
