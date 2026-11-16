'use strict';

const chakraDiagram = (() => {
  const levels=[353,317,279,229,173,130,86];
  const names=['Raiz','Sacral','Umbigo','Coração','Garganta','Terceiro olho','Coroa'];
  const circuit='M260 354 C213 334 210 305 260 279 S309 246 260 229 S206 197 260 173 S297 138 260 130 Q238 112 260 86';
  const body='M245 153 Q249 166 236 177 Q223 187 205 190 Q194 192 183 205 L146 250 L109 275 L84 283 Q76 287 82 292 L105 291 L91 303 Q93 309 101 304 L123 290 L166 268 L212 228 Q215 257 224 280 Q229 304 215 326 Q210 343 220 369 L232 405 L230 462 L225 503 L203 520 Q201 525 212 526 L240 525 Q246 522 248 508 L252 461 L260 381 L268 461 L272 508 Q274 522 280 525 L308 526 Q319 525 317 520 L295 503 L290 462 L288 405 L300 369 Q310 343 305 326 Q291 304 296 280 Q305 257 308 228 L354 268 L397 290 L419 304 Q427 309 429 303 L415 291 L438 292 Q444 287 436 283 L411 275 L374 250 L337 205 Q326 192 315 190 Q297 187 284 177 Q271 166 275 153';
  const outstretched='M214 194 Q177 159 143 130 L113 105 L79 71 L63 60 Q56 55 55 63 L64 80 L79 89 L95 121 L124 148 Q158 185 204 222 M222 363 Q200 390 180 431 L156 480 L132 495 Q130 501 145 501 L172 500 L195 463 L234 405';
  function render(ids,tones,href,prefix){
    const marks=levels.map((y,i)=>`<a class="energy-point" data-center="${ids[i]}" href="${href(ids[i])}" aria-label="${i+1}. ${names[i]}, ${data[i][0]}" style="--point:${tones[i]};--delay:${i*.36}s"><circle class="energy-aura" cx="260" cy="${y}" r="16"/><circle class="energy-hit" cx="260" cy="${y}" r="17"/><circle class="energy-core" cx="260" cy="${y}" r="12.5"/><text x="260" y="${y+.5}">${i+1}</text></a>`).join('');
    const ticks=Array.from({length:48},(_,i)=>`<path d="M260 43 v${i%4===0?12:5}" transform="rotate(${i*7.5} 260 293)"/>`).join('');
    return `<svg class="energy-diagram" id="${prefix}-figura" viewBox="0 0 520 570" aria-label="Figura humana. Sete chakras numerados da raiz à coroa.">
      <defs>
        <radialGradient id="${prefix}-halo"><stop stop-color="#594439" stop-opacity=".55"/><stop offset=".79" stop-color="#231f20" stop-opacity=".22"/><stop offset="1" stop-color="#141416" stop-opacity="0"/></radialGradient>
        <linearGradient id="${prefix}-ink" x1="0" x2="1" y1="0" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#d8a96d"/><stop offset=".47" stop-color="#fff0bc"/><stop offset="1" stop-color="#a16f53"/></linearGradient>
      </defs>
      <g aria-hidden="true">
        <circle cx="260" cy="293" r="260" fill="url(#${prefix}-halo)"/>
        <g fill="none" stroke="#a9805d">
          <rect x="41" y="74" width="438" height="438" opacity=".32"/>
          <circle cx="260" cy="293" r="246" opacity=".54"/>
          <circle cx="260" cy="293" r="224" opacity=".3" stroke-dasharray="1 8"/>
          <path d="M18 293H502M260 27V545M67 100L453 486M453 100L67 486" opacity=".19"/>
          <g opacity=".52">${ticks}</g>
          <circle class="energy-orbit" cx="260" cy="293" r="235" stroke="#f2cb87" stroke-dasharray="4 487" opacity=".8"/>
        </g>
        <g fill="none" stroke="url(#${prefix}-ink)" stroke-linecap="round" stroke-linejoin="round">
          <g opacity=".4" stroke-width="1.15"><path d="${outstretched}"/><path d="${outstretched}" transform="translate(520 0) scale(-1 1)"/></g>
          <path d="${body}" stroke-width="1.45"/>
          <path d="M260 86 Q235 87 233 109 Q231 138 245 153 Q260 166 275 153 Q289 138 287 109 Q285 87 260 86 Z" stroke-width="1.5"/>
          <path d="M240 122l12-2m16 0 12 2M255 145q5 3 10 0M244 196q-15 15-15 28m47-28q15 15 15 28M234 249q26 17 52 0M230 268q30 15 60 0M230 300q30 9 60 0M222 332q38 18 76 0M235 405l9-19m41 19-9-19" opacity=".49"/>
        </g>
        <g fill="none" stroke-linecap="round">
          <path d="${circuit}" stroke="#a36658" stroke-width="1" opacity=".58"/>
          <path d="${circuit}" transform="translate(520 0) scale(-1 1)" stroke="#799585" stroke-width="1" opacity=".68"/>
          <path d="M260 353V86" stroke="#d1a763" stroke-width="2" opacity=".64"/>
          <path class="energy-flow" d="${circuit}" pathLength="100" stroke="#e0a36d" stroke-width="2.4"/>
          <path class="energy-flow energy-flow-alt" d="${circuit}" pathLength="100" transform="translate(520 0) scale(-1 1)" stroke="#b7cdb3" stroke-width="2.4"/>
          <path class="energy-flow energy-flow-center" d="M260 353V86" pathLength="100" stroke="#ffdf9b" stroke-width="3"/>
        </g>
      </g>
      ${marks}
    </svg>`;
  }
  function motionButton(prefix){
    return `<button type="button" class="energy-toggle" data-motion="${prefix}-figura" aria-pressed="false">Pausar animação</button>`;
  }
  document.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-motion]');
    if(!button)return;
    const paused=document.getElementById(button.dataset.motion).classList.toggle('energy-paused');
    button.setAttribute('aria-pressed',String(paused));
    button.textContent=paused?'Retomar animação':'Pausar animação';
  });
  return {render,motionButton,names};
})();
