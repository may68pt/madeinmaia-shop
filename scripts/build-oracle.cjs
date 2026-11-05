const fs = require('node:fs');
process.chdir(require('node:path').join(__dirname, '../public/oracle'));
const editions = require('./oracle-editions.json');
const ball = '<div class="ball"><span>8</span></div>';
const stages = {
  '03': `<div class="device crt"><div class="device-bar"><span>MAIA TUNER / 08</span><span class="pilot"></span></div><div class="tube">${ball}<i class="sweep"></i><span class="screen-code">CH 08</span></div><div class="device-bar"><span>FATE FREQUENCY</span><div class="signal"><i></i><i></i><i></i><i></i><i></i></div></div></div>`,
  '05': `<div class="device lab"><div class="device-bar"><span>MIM TEST FACILITY</span><span class="pilot"></span></div><div class="test-window"><div class="warning-sign">${ball}</div></div><div class="progress"><i></i></div><div class="device-bar"><span>FORTUNE SAMPLE</span><span>#008</span></div></div>`,
  '07': `<div class="device deck"><div class="device-bar"><span>ORACLE RECORDS</span><span>33⅓ RPM</span></div><div class="platter"><div class="record"></div>${ball}<div class="tonearm"></div></div><div class="device-bar"><span>SIDE A / FATE MIX</span><span class="pilot"></span></div></div>`,
  '08': `<div class="device phone"><div class="phone-top"><div class="speaker"></div><div class="phone-screen"><div class="call-waves"></div>${ball}<span class="call-state">INCOMING / ORACLE 08</span></div></div><div class="hinge"></div><div class="phone-base"><div class="dial"></div><div class="keys"></div></div></div>`,
  '09': `<div class="device archive"><div class="device-bar"><span>ACCESS TERMINAL</span><span class="pilot"></span></div><div class="radar-screen"><div class="radar"></div>${ball}<span class="file-code">FILE / 008</span></div><div class="redactions"><i></i><i></i><i></i></div></div>`,
};
const draw = (theme) => `<div class="stage" aria-hidden="true">${stages[theme]}</div>`;
const page = (title, theme, root, content) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Made in Maia</title><meta name="description" content="The Made in Maia Oracle Series. Five ways to ask the Magic 8 Ball.">
<link rel="stylesheet" href="/oracle/oracle.css"></head>
<body data-edition="${theme}"><div class="site">
<header><a class="brand" href="${root}">MADE IN MAIA</a><a class="series" href="${root}">ORACLE SERIES <span>↗</span></a></header>
<main>${content}</main>
<footer><span>MADE IN MAIA / LINK LABEL</span><a href="/magic-8-ball">Classic Magic 8 Ball ↗</a><a href="https://madeinmaia.pt/loja">Explore the shop ↗</a></footer>
</div></body></html>`;
const list = (current) => editions.map(([number, slug, title, label]) =>
  `<a class="edition" data-tile="${number}" href="/oracle/${slug}"${current === number ? ' aria-current="page"' : ''}><small>${number} / ${label}</small><strong>${title}</strong><span aria-hidden="true">↗</span></a>`
).join('');
fs.writeFileSync('index.html',page('Oracle Series','index','/oracle',`<section class="intro"><div class="kicker"><i></i> LINK LABEL / COLLECTION 01</div><h1>Oracle<br>Series<span>.</span></h1><p>Five ways to ask the Magic 8 Ball.<br>Choose how you want to hear from fate.</p></section><nav class="editions" aria-label="Oracle editions">${list()}</nav>`));
for (const [number, slug, title, label, description, action, loading, again, result] of editions) {
  fs.mkdirSync(slug,{recursive:true});
  fs.writeFileSync(slug+'/index.html',page(title,number,'/oracle',`<article class="experience">
<div class="copy"><div class="kicker"><i></i> ORACLE ${number} / ${label}</div><h1>${title}<span>.</span></h1><p>${description}</p>
</div>
<div class="instrument" data-phase="idle">${draw(number)}<div class="controls">
<div class="readout"><small id="state" data-result="${result}">AWAITING QUESTION</small><p id="answer" role="status" aria-atomic="true">The 8 is ready.</p></div>
<button id="ask" type="button" data-loading="${loading}" data-again="${again}" disabled><span>${action}</span><b aria-hidden="true">↗</b></button>
<noscript><p>Enable JavaScript to ask the Magic 8 Ball.</p></noscript></div></div>
</article><nav class="editions" aria-label="Oracle editions">${list(number)}</nav>
<script src="/oracle/oracle.js" defer></script>`));
}
