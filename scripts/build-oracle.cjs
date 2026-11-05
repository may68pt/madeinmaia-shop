const fs = require('node:fs');
process.chdir(require('node:path').join(__dirname, '../public/oracle'));
const editions = require('./oracle-editions.json');
const draw = (theme) => {
  const overlays = {
    '03': '<div class="scanlines"></div>',
    '05': '<i class="stripe top"></i><i class="stripe bottom"></i>',
    '07': '<div class="record"></div><div class="needle"></div>',
    '08': '<div class="speaker"></div><div class="keys"></div>',
    '09': '<div class="radar"></div><div class="crosshair"></div><div class="file-label">MIM / FILE 08</div>',
  };
  return `<div class="stage" aria-hidden="true"><div class="device">${overlays[theme]}<div class="ball"><span>8</span></div></div></div>`;
};
const page = (title, theme, root, content) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Made in Maia</title><meta name="description" content="The Made in Maia Oracle Series. Five ways to ask the Magic 8 Ball.">
<link rel="stylesheet" href="/oracle/oracle.css"></head>
<body data-edition="${theme}"><div class="site">
<header><a class="brand" href="${root}">MADE IN MAIA</a><a class="series" href="${root}">ORACLE SERIES <span>↗</span></a></header>
<main>${content}</main>
<footer><span>MADE IN MAIA / LINK LABEL</span><a href="/magic-8-ball">Classic Magic 8 Ball ↗</a><a href="https://madeinmaia.pt/loja">Explore the shop ↗</a></footer>
</div></body></html>`;
const list = (root, current) => editions.map(([number, slug, title, label]) =>
  `<a class="edition" data-tile="${number}" href="/oracle/${slug}"${current === number ? ' aria-current="page"' : ''}><small>${number} / ${label}</small><strong>${title}</strong><span aria-hidden="true">↗</span></a>`
).join('');
fs.writeFileSync('index.html',page('Oracle Series','index','/oracle',`<section class="intro"><div class="kicker"><i></i> LINK LABEL / COLLECTION 01</div><h1>Oracle<br>Series<span>.</span></h1><p>Five ways to ask the Magic 8 Ball.<br>Choose how you want to hear from fate.</p></section><nav class="editions" aria-label="Oracle editions">${list('./')}</nav>`));
for (const [number, slug, title, label, description, action, loading, again, result] of editions) {
  fs.mkdirSync(slug,{recursive:true});
  fs.writeFileSync(slug+'/index.html',page(title,number,'/oracle',`<article class="experience">
<div class="copy"><div class="kicker"><i></i> ORACLE ${number} / ${label}</div><h1>${title}<span>.</span></h1><p>${description}</p>
<button id="ask" type="button" data-loading="${loading}" data-again="${again}" disabled><span>${action}</span><b aria-hidden="true">↗</b></button>
<noscript><p>Enable JavaScript to ask the Magic 8 Ball.</p></noscript></div>
<div class="instrument">${draw(number)}<div class="readout"><small id="state" data-result="${result}">AWAITING QUESTION</small><p id="answer" role="status" aria-atomic="true">The 8 is ready.</p></div></div>
</article><nav class="editions" aria-label="Oracle editions">${list('../',number)}</nav>
<script src="/oracle/oracle.js" defer></script>`));
}
