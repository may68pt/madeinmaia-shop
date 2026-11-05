const fs = require('node:fs');
process.chdir(require('node:path').join(__dirname, '../public/oracle'));
const editions = require('./oracle-editions.json');
const ball = '<div class="ball"><span>8</span></div>';
const stages = {
  '03': `<div class="arcade-scene"><img src="/oracle/art/maia-after-hours.webp" width="768" height="768" alt="Pixel-art television repair shop overlooking Maia at night"><div class="arcade-glass" aria-hidden="true">${ball}<span class="screen-answer"></span><i class="sweep"></i><div class="crt-noise"></div><div class="crt-channel">CH <b>08</b></div><div class="crt-bars"><i></i><i></i><i></i><i></i></div></div><span class="arcade-lamp" aria-hidden="true"></span><button class="arcade-knob" type="submit" aria-label="Turn the tuning dial"><span aria-hidden="true">╱</span></button></div>`,
};
const illustrations = {
  '05': ['fortune-lab', 'An amber fortune-testing machine surrounded by questionable specimens', 'Press the test switch', 'TEST', '72%','87%', '▰'],
  '07': ['oracle-records', 'A lime-lit record shop and an eight-ball vinyl on the deck', 'Cue the record', 'CUE', '74%','73%', '♪'],
  '08': ['cafe-hotline', 'A pink flip phone on a tiled late-night café counter', 'Pick up the phone', 'PICK UP', '34%','66%', '☎'],
  '09': ['restricted-archive', 'A sci-fi archive desk with files and a wireframe eight-ball terminal', 'Break the seal', 'OPEN', '87%','65%', '▤'],
  '10': ['bone-shop', 'A candlelit curiosity shop with a velvet tray of carved bones', 'Throw the bones into the tray', 'CAST', '50%','67%', '✦'],
  '11': ['goose-lodge', 'A hunting lodge, a pewter platter of cartoon entrails, and a suspicious goose', 'Consult the platter', 'READ', '50%','67%', '✦'],
};
const sprite = (name, frames) => `<div class="hazard-sprite sprite-${name}"><svg viewBox="0 0 32 24" shape-rendering="crispEdges">${frames.map(frame => `<g>${frame}</g>`).join('')}</svg></div>`;
const octopus = '<i class="painted-sprite oct-left"></i><i class="painted-sprite oct-right"></i><i class="painted-sprite oct-head-painted"></i>';
const fish = '<i class="painted-sprite fish-tail-painted"></i><i class="painted-sprite fish-body-painted"></i>';
const worm = sprite('worm', [
  'M2 15h7v-2h7v2h7v-3h7v6H2z', 'M3 16h7v-4h4V9h6v3h4v4h6v4H3z',
  'M3 17h7v-5h3V8h8v4h3v5h6v4H3z', 'M2 16h8v-2h6v1h8v-3h6v7H2z',
].map(body => `<path d="${body}" fill="#a9d75e"/><path fill="#62954c" d="M3 18h26v2H3z"/><path fill="#292e36" d="M26 14h2v2h-2z"/>`));
const keyboardRows = [
  ['Esc','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'],
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','Backspace'],
  ['Tab',...'QWERTYUIOP','[',']','\\'],
  ['CapsLock',...'ASDFGHJKL',';',"'","Enter"],
  ['Shift',...'ZXCVBNM',',','.','/','Shift'],
  ['Control','Alt','Meta',' ','Alt','Control','ArrowLeft','ArrowUp','ArrowDown','ArrowRight'],
];
const keyLabels = {Backspace:'⌫',CapsLock:'CAPS',Enter:'↵',Shift:'⇧',Control:'CTRL',Meta:'MiM',' ':'SPACE',ArrowLeft:'←',ArrowUp:'↑',ArrowDown:'↓',ArrowRight:'→'};
const workshopKeyboard = `<div class="hazard-keyboard" aria-hidden="true">
  <div class="keyboard-brand"><strong>MiM / INPUT SYSTEMS</strong><span>MK–08 <i></i></span></div>
  ${keyboardRows.map(row => `<div class="keyboard-row">${row.map(key => `<span class="keyboard-key" data-key="${key === '"' ? '&quot;' : key}">${keyLabels[key] || key}</span>`).join('')}</div>`).join('')}
</div>`;
const metalInk = (id) => `<defs>
  <linearGradient id="${id}-plate" x2=".78" y2="1">
    <stop stop-color="#b3754b"/><stop offset=".22" stop-color="#875343"/><stop offset=".54" stop-color="#69424a"/><stop offset=".76" stop-color="#995c47"/><stop offset="1" stop-color="#4b3244"/>
  </linearGradient>
  <linearGradient id="${id}-rim" x2=".92" y2="1">
    <stop stop-color="#ffce84"/><stop offset=".28" stop-color="#b97b50"/><stop offset=".63" stop-color="#774c48"/><stop offset=".82" stop-color="#d19a60"/><stop offset="1" stop-color="#63404a"/>
  </linearGradient>
  <pattern id="${id}-grain" width="37" height="23" patternUnits="userSpaceOnUse">
    <path d="M2 4h3v1H2zm9 2h1v2h-1zm13-4h3v1h-3zm7 7h4v1h-4zM5 16h4v1H5zm14-3h2v2h-2zm13 5h2v1h-2zm-19 3h4v1h-4z" fill="#edb77b" opacity=".28"/>
    <path d="M7 2h2v1H7zm9 7h3v1h-3zm9 3h4v1h-4zm8 2h2v1h-2zM2 21h4v1H2zm20-2h2v2h-2z" fill="#302331" opacity=".48"/>
  </pattern>
</defs>`;
const draw = (theme) => {
  if (theme === '03') return `<div class="stage art-stage">${stages[theme]}</div>`;
  const [file, alt, label, tag, x, y, icon] = illustrations[theme];
  const effects = {
    '07': '<div class="oracle-groove"></div><div class="oracle-track">SIDE A <span>●</span></div>',
    '08': '<div class="oracle-call"><small>ORACLE 08</small><span>INCOMING</span><i></i></div>',
    '09': '<div class="oracle-scan"></div><div class="oracle-stamp">DECLASSIFIED</div>',
    '10': '<i></i><i></i><i></i>',
    '11': '<div class="oracle-honk">HONK!</div>',
  };
  const effect = effects[theme] || icon;
  const hazard = theme === '05' ? `<div class="hazard-motion" aria-hidden="true">
    <div class="hazard-bench"></div><div class="hazard-machine"></div>
    <div class="hazard-bell"><i></i><b></b></div>
    <div class="hazard-vine"><i></i><i></i><i></i></div><div class="hazard-worm">${worm}<i class="worm-nibble"></i></div><svg class="hazard-wiring" viewBox="0 0 100 32" shape-rendering="crispEdges"><path d="M0 4h10v13h14m52 1h12v10h12" fill="none" stroke="#291a2c" stroke-width="6"/><path d="M0 4h10v13h14m52 1h12v10h12" fill="none" stroke="#c18351" stroke-width="2"/></svg><div class="hazard-display" aria-hidden="true"><small><i></i> FATE WIRE <span>CH. 08</span></small><div class="hazard-display-window"><span class="hazard-display-message">STAND BY FOR QUESTION</span></div></div>
    <div class="hazard-intake">
      <svg viewBox="0 0 180 87" preserveAspectRatio="none">${metalInk('feed')}
        <path d="M4 61Q7 56 7 43L8 28Q8 23 15 22L20 21L24 10Q26 7 33 7L102 5Q109 5 114 11L124 19L152 20Q158 20 161 25L169 28Q173 29 173 34L177 63Q178 69 170 71L160 73L156 80L25 82L20 75L10 73Q3 71 4 61Z" fill="url(#feed-plate)" stroke="#32232c" stroke-width="1.7"/>
        <path d="M6 61Q9 55 9 43L10 28Q10 25 16 24L22 23L26 11Q28 9 34 9L102 7Q108 7 113 13L124 21L152 22Q157 22 160 27L169 30Q171 31 171 35L175 63Q176 67 169 69L159 71L155 78L26 80L21 73L11 71Q6 70 6 61Z" fill="url(#feed-grain)"/>
        <path d="M9 42L10 28Q10 25 16 24L22 23L26 11Q28 9 34 9L102 7Q108 7 113 13L124 21L151 22Q157 22 160 27L167 30" fill="none" stroke="url(#feed-rim)" stroke-width="2.4"/>
        <path d="M11 63L21 66L28 74L154 73L161 67L173 65" fill="none" stroke="#b47753" stroke-width="2"/>
        <path d="M12 62L21 64L29 72L152 71L160 65L171 63" fill="none" stroke="#4d333b" stroke-width="1"/>
        <path d="M17 30l5-2m8-14 12-1m42-2 8-1m30 15 10 1m-112 42 5 4m90 3 16-1m24-39 5 2" fill="none" stroke="#edbb7c" stroke-width="1"/>
        <path fill="#392b36" d="M25 24h16v-7h61l13 13h45v29h-12v7H25z"/>
        <path fill="#b37752" d="M26 47h132v19H26z"/><path fill="#1f1723" d="M30 50h128v10H30z"/>
        <path fill="#deb681" d="M30 49h125v2H30z"/><path fill="#684049" d="M31 63h125v3H31z"/>
        <path fill="#cb915d" d="M153 31h14v30h-14z"/><path fill="#502d38" d="M156 36h8v21h-8z"/>
        <path fill="#e1a86a" d="M31 24h62v2H31zM30 69h34v2H30zm91 1h20v2h-20z"/>
        <path fill="#2e2432" d="M109 30h35v15h-35z"/><path fill="#78554c" d="M111 31h31v2h-31z"/>
        <path fill="#b2e0a1" d="M115 36h4v4h-4zm7 0h4v4h-4z"/><path fill="#dc8755" d="M130 36h8v4h-8z"/>
        <g fill="#edbc82" stroke="#4a303a"><circle cx="21" cy="43" r="3"/><circle cx="26" cy="73" r="3"/><circle cx="151" cy="73" r="3"/><circle cx="166" cy="44" r="3"/></g>
        <path d="M19 43h4m1 30h4m121 0h4m11-29h4" stroke="#684545"/>
      </svg>
      <div class="hazard-intake-press"><b>MiM · QUERY FEED</b><span class="type-carriage"></span><span class="type-keys"></span><span class="type-lever"></span></div>
      <div class="hazard-intake-rollers"><i></i><i></i><i></i><i></i><i></i></div>
      <span class="hazard-label"></span><span class="hazard-intake-lip"></span><i class="hazard-intake-lamp"></i><i class="hazard-intake-lamp lamp-extra"></i>
    </div><div class="hazard-chamber"><div class="hazard-ball"></div></div><div class="hazard-ball-mist-bank"></div><div class="hazard-ball-mist"></div><div class="hazard-ball-mist-tilt"></div>
    <div class="hazard-gauge">
      <svg viewBox="0 0 80 80">
        <defs><linearGradient id="bronze-rim" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#f9cd82"/><stop offset=".32" stop-color="#a56134"/><stop offset=".58" stop-color="#59332d"/><stop offset=".82" stop-color="#d99253"/><stop offset="1" stop-color="#673c2a"/></linearGradient><radialGradient id="gauge-face"><stop stop-color="#fae7b5"/><stop offset="1" stop-color="#bc8e5e"/></radialGradient></defs>
        <circle cx="40" cy="40" r="38" fill="#25151d"/><circle cx="40" cy="40" r="36" fill="url(#bronze-rim)" stroke="#f0be76" stroke-width="1.2"/>
        <circle cx="40" cy="40" r="29" fill="url(#gauge-face)" stroke="#472a29" stroke-width="2"/>
        <path d="M23 56A23 23 0 1 1 59 53" fill="none" stroke="#785239" stroke-width="1.2" stroke-dasharray="1 3"/>
        <path d="M52 21A23 23 0 0 1 62 34" fill="none" stroke="#ad3f32" stroke-width="4"/>
        <path d="M24 53l4-4m-9-15 6 1m0-13 4 5m11-11v6m12 0-3 5m11 7-6 2" stroke="#472b2a" stroke-width="1.6"/>
        <path d="M19 27A25 25 0 0 1 49 17" fill="none" stroke="#fff1c6" stroke-opacity=".65" stroke-width="2"/>
        <g fill="#432726" stroke="#f1b66c" stroke-width=".7"><circle cx="40" cy="7" r="2"/><circle cx="40" cy="73" r="2"/><circle cx="7" cy="40" r="2"/><circle cx="73" cy="40" r="2"/></g>
      </svg><i></i><span>PSI</span>
    </div><div class="hazard-blackout"></div><div class="hazard-window-silhouette"></div><div class="hazard-window-pipe"></div><div class="hazard-green-glare"></div><div class="hazard-crystal-glow"></div><div class="hazard-lightning"><i></i><i></i><i></i></div><div class="hazard-beacon"></div>
    <div class="hazard-octopus">${octopus}<i class="painted-oct-lid"></i></div><div class="hazard-fish">${fish}<i class="painted-fish-lid"></i></div><div class="hazard-fish-eye"></div><div class="hazard-negative"></div><div class="hazard-element-pulses"><i></i><i></i><i></i><i></i></div>
    <svg class="hazard-anime-burst" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path fill="#fff" d="M53 49L38 0l10 40L17 3l29 41L0 27l45 20L0 55l46-3L7 84l41-28-14 44 17-41 5 41 1-43 25 43-20-45 38 21-37-26 37-11-39 6L97 5 58 41 67 0 54 39Z"/>
      <circle cx="53" cy="49" r="10" fill="white"/>
    </svg><svg class="hazard-circuit-bolts" viewBox="0 0 100 100" preserveAspectRatio="none">
      <g class="circuit-out" fill="none" stroke="#f4dfff" stroke-width=".7">
        <path d="M53 49L43 42 38 44 32 34 28 36 20 25 15 28 7 20"/><path d="M53 49L61 39 66 43 76 31 81 33 89 28"/><path d="M53 49L64 53 70 47 79 53 90 53"/><path d="M53 49L59 61 68 58 75 70 81 69 90 79"/>
      </g><g class="circuit-return" fill="none" stroke-width=".85">
        <path stroke="#d3fb6d" d="M7 20L15 28 20 25 28 36 32 34 38 44 43 42 53 49"/>
        <path stroke="#ff79bd" d="M89 28L81 33 76 31 66 43 61 39 53 49"/>
        <path stroke="#58ffc2" d="M90 53L79 53 70 47 64 53 53 49"/>
        <path stroke="#ffd474" d="M90 79L81 69 75 70 68 58 59 61 53 49"/>
      </g>
      <g class="circuit-nodes">
        <circle class="node-worm" cx="7" cy="20" r="2.4"/>
        <circle class="node-octopus" cx="89" cy="28" r="3.1"/>
        <circle class="node-crystal" cx="90" cy="53" r="3.5"/>
        <circle class="node-fish" cx="90" cy="79" r="3"/>
        <circle class="node-core" cx="53" cy="49" r="4.2"/>
      </g>
    </svg><div class="hazard-core-charge"></div><div class="hazard-zap-worm">${worm}</div>
    <svg class="hazard-fish-xray" viewBox="0 0 48 34" shape-rendering="crispEdges">
      <path d="M8 16h27m-20 0-4-7m7 7-4 9m8-9-2-11m6 11-3 12m7-12 3-9m-3 9 2 9m3-9 10-7v14z" fill="none" stroke="#ebfff3" stroke-width="2"/>
      <path d="M5 12h6v9H5l-4-4z" fill="#ebfff3"/><path d="M5 15h2v2H5z" fill="#182335"/>
    </svg><svg class="hazard-octopus-flash" viewBox="0 0 40 40" shape-rendering="crispEdges">
      <path fill="#fff9ee" d="M12 4h14v3h5v4h3v9h-5v4h5v5h-4v-3h-5v6h4v4h-8v-9h-4v9h-7v-4h3v-8h-3v4H4v-4h4v-6H5v-7h4V7h3z"/>
    </svg>

    <div class="hazard-faceplate">
      <svg class="hazard-faceplate-art" viewBox="0 0 208 56" preserveAspectRatio="none" shape-rendering="crispEdges">${metalInk('face')}
        <path fill="#39252d" d="M0 7h5V2h198v5h5v49H0z"/><path fill="url(#face-plate)" d="M5 7h5V4h188v4h5v41H5z"/><path fill="url(#face-grain)" d="M5 7h5V4h188v4h5v41H5z"/>
        <path fill="url(#face-rim)" d="M10 5h189v3H10zM6 8h3v38H6z"/><path fill="#583842" d="M10 46h189v5H10zM104 9h3v37h-3z"/>
        <path fill="#75473a" d="M11 19h8v2h-8zm79 16h10v2H90zm-52 9h9v2h-9zm143-34h12v2h-12z"/>
        <g fill="#e0a873" stroke="#4e3035"><circle cx="12" cy="12" r="3"/><circle cx="196" cy="12" r="3"/><circle cx="12" cy="44" r="3"/><circle cx="196" cy="44" r="3"/></g>
        <path d="M10 12h4m180 0h4M10 44h4m180 0h4" stroke="#674347"/>
      </svg>
      <div class="hazard-faceplate-printer"><small>TICKET OUT</small><div class="hazard-slot"></div><div class="hazard-panel-instruments"><b>M8B3000</b><i></i><i></i><span></span><span></span></div></div>
      <div class="hazard-prize-tray"><div class="hazard-prize-chute"><span class="hazard-prize" aria-hidden="true"></span></div><div class="hazard-hatch-door"><small>ODDMENTS RETURN</small><i class="hazard-hatch-handle"></i></div><span class="hazard-prize-caption" role="status"></span></div>
    </div>
    <div class="hazard-puff"></div><div class="hazard-vent"></div>
    <div class="hazard-sparks"><i></i><i></i><i></i><i></i></div>
    <svg class="hazard-tape" viewBox="0 0 44 104" preserveAspectRatio="none">
      <defs><pattern id="hazard-ink" width="44" height="9" patternUnits="userSpaceOnUse">
        <rect width="44" height="9" fill="#ffe4ab"/><path d="M13 4h6m3 0h11M13 7h12m3 0h4" stroke="#8d653e" stroke-width="1"/>
      </pattern></defs>
      <path class="hazard-ribbon" fill="url(#hazard-ink)" stroke="#cb955e"
        d="M12 0 L34 0 C34 24 35 52 32 71 Q31 90 27 102 L6 102 Q11 85 12 69 C15 46 12 22 12 0 Z"/>
    </svg>

    <div class="hazard-coffee-repair"></div><div class="hazard-coffee-front"></div><div class="hazard-steam"><i class="hazard-steam-sprite"></i></div>
    <div class="hazard-cat">
      <span class="cat-walk cat-sprite"></span>
      <span class="cat-settle cat-sprite"></span>
      <span class="cat-sit cat-sprite"></span>
    </div><div class="hazard-window-cat"><span></span></div>
  </div>` : '';
  return `<div class="stage art-stage"><div class="arcade-scene themed-scene" style="--spot-x:${x};--spot-y:${y}">
  <img src="/oracle/art/${file}.webp" width="512" height="512" alt="${alt}">
  ${hazard || `<span class="scene-spark" aria-hidden="true"></span><span class="scene-effect" aria-hidden="true">${effect}</span>`}
${theme === '05' ? `<button class="hazard-pull" type="submit" aria-label="Pull the lever to ask the oracle">
  <svg viewBox="0 0 88 104" aria-hidden="true">${metalInk('drive')}
    <path d="M21 49h10V37h11V28h34v10h11v50H75v10H35v-8H20V73H11V58h10z" fill="#261925"/>
    <path d="M24 51h10V39h12v-8h27v10h11v44H72v9H36v-8H23V70h-9V60h10z" fill="url(#drive-plate)"/><path d="M24 51h10V39h12v-8h27v10h11v44H72v9H36v-8H23V70h-9V60h10z" fill="url(#drive-grain)"/>
    <path d="M24 51h10V39h12v-8h27v5H49v9H39v11H25v8H14v-4h10z" fill="url(#drive-rim)"/>
    <path d="M23 73h13v12h37v-7h11v7H72v9H36v-8H23z" fill="#4d3442"/>
    <path d="M60 45h25v30H60z" fill="#44303b"/><path d="M66 48h18v4H66zm0 8h18v4H66zm0 8h18v4H66z" fill="#bd8557"/>
    <path d="M74 37h9v7h-9z" fill="#2e2730"/><path class="transmission-led" d="M76 39h5v3h-5z" fill="#f6a963"/>
    <path d="M64 79h14v8H64z" fill="#302432"/><path class="transmission-led secondary" d="M66 81h4v4h-4zm6 0h4v4h-4z" fill="#a9e994"/>
    <path d="M25 56h9v4h-9zm14 30h11v2H39zm31-53h2v5h-2z" fill="#e2ad77"/>
    <g transform="translate(11 -2)">
    <path d="M13 57h18l7 9v23l-7 8H12l-7-8V66z" fill="#382630" stroke="#221824" stroke-width="2"/>
    <path d="M15 59h14l6 8v20l-6 6H14l-6-6V67z" fill="#a67553"/>
    <path d="M13 66h6v20h-6z" fill="#d8a66a"/><path d="M29 68h3v19h-3z" fill="#64414a"/>
    <circle cx="22" cy="77" r="11" fill="#4a343e" stroke="#deb27b" stroke-width="2"/>
    <g class="hazard-pull-arm">
      <g class="hazard-pull-shaft">
        <path d="M22 77V22" stroke="#2d2130" stroke-width="12" stroke-linecap="round"/>
        <path d="M22 77V22" stroke="#aeb2b7" stroke-width="8" stroke-linecap="round"/>
        <path d="M20 73V24" stroke="#fff1d0" stroke-width="2" stroke-linecap="round"/>
      </g>
      <g class="hazard-pull-grip">
        <path d="M6 11h32q5 0 5 5v10q0 5-5 5H6q-5 0-5-5V16q0-5 5-5z" fill="#a64253" stroke="#321c2b" stroke-width="2"/>
        <path d="M7 14h29v4H7z" fill="#f78e75"/><path d="M5 25h34v4H5z" fill="#693147"/>
        <path d="M9 17v9m6-9v9m14-9v9m6-9v9" stroke="#743244" stroke-width="1.5"/>
      </g>
    </g>
    <circle cx="22" cy="77" r="3" fill="#e0b27b" stroke="#643c43"/></g>
  </svg>
</button>` : `<button class="scene-control" type="submit" aria-label="${label}">${tag}</button>`}</div>${theme === '05' ? workshopKeyboard + `<div class="hazard-verdict-overlay" hidden>
  <section class="hazard-verdict-paper" aria-label="Printed oracle ticket">
    <div class="ticket-masthead"><span aria-hidden="true">✦</span> MADE IN MAIA <span aria-hidden="true">✦</span></div>
    <div class="ticket-series">ORACLE SERIES / M8B3000</div>
    <div class="ticket-ball" aria-hidden="true"><span>8</span></div>
    <p class="ticket-greeting">Hello, curious human.</p>
    <p class="ticket-question"></p><p class="ticket-verdict"></p>
    <div class="ticket-foot">PRINTED BY FATE · HANDLE WITH CURIOSITY</div>
    <button class="ticket-dismiss" type="button" aria-label="Close printed ticket">KEEP THE OMEN <span aria-hidden="true">×</span></button>
  </section>
</div>` : ''}</div>`;
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
  `<a class="edition" data-tile="${number}" href="/oracle/${number === '05' ? 'magic-8-ball-machine' : slug}"${current === number ? ' aria-current="page"' : ''}><small>${number} / ${label}</small><strong>${title}</strong><span aria-hidden="true">↗</span></a>`
).join('');
fs.writeFileSync('index.html',page('Oracle Series','index','/oracle',`<section class="intro"><div class="kicker"><i></i> LINK LABEL / COLLECTION 01</div><h1>Oracle<br>Series<span>.</span></h1><p>Seven ways to ask fate.<br>Choose how you want to hear from fate.</p></section><nav class="editions" aria-label="Oracle editions">${list()}</nav>`));
for (const [number, slug, title, label, description, action, loading, again, result] of editions) {
  fs.mkdirSync(slug,{recursive:true});
  fs.writeFileSync(slug+'/index.html',page(title,number,'/oracle',`<article class="experience">
<div class="copy"><div class="kicker"><i></i> ORACLE ${number} / ${label}</div><h1>${title}<span>.</span></h1><p>${description}</p>
</div>
<form class="instrument" data-phase="idle">
<div class="question-box">${number === '05' ? '<button class="hazard-sound" type="button" aria-pressed="true">Sound</button>' : ''}<label for="question">Your yes-or-no question</label><div class="question-entry"><input id="question" type="text" maxlength="90" placeholder="Will tonight go to plan?" enterkeyhint="go" required>${number === '05' ? `<button id="ask" type="submit" data-loading="${loading}" data-again="${again}" aria-label="${action}" disabled><span>↵</span></button>` : ''}</div></div>
${draw(number)}
<div class="${number === '05' ? 'hazard-payoff' : 'controls'}">
<div class="readout"><small id="state" data-result="${result}">AWAITING QUESTION</small><div role="status" aria-atomic="true"><p id="asked" hidden></p><p id="answer">The 8 is ready.</p></div></div>
${number === '05' ? '' : `<button id="ask" type="submit" data-loading="${loading}" data-again="${again}" disabled><span>${action}</span><b aria-hidden="true">↗</b></button>`}
<noscript><p>Enable JavaScript to ask the Magic 8 Ball.</p></noscript></div></form>
</article><nav class="editions" aria-label="Oracle editions">${list(number)}</nav>
<script src="/oracle/oracle.js" defer></script>`));
}
