'use strict';

const chakraFigures = (() => {
  const animals = {
    elephant: '<path d="M17 42q0-14 19-16l17 1q9-8 20-3 10 3 13 14l4 17q2 5 7 1-2 12-10 9-7-3-8-13l-2-7-8 4-1 16h-8l-1-16-22 2-2 14h-8l-1-17q-8-3-9-6Z"/><path d="M18 37q-7 4-7 11m56-18q-12 0-13 8t11 8m13-4q8 5 11 1"/><circle cx="76" cy="35" r="1" fill="currentColor"/>',
    makara: '<path d="M17 43 7 38l13-4 12 2 7-7q12-4 26 6 7 4 12 4 7-1 8-7 2-6-6-9 15-2 19 7 3 9-12 18-14 9-30 6l-9 10-3-12-8-6-13 3Z"/><path d="m42 36 10-12 4 11m7 5q-3 5 1 9m8-7q-2 4 1 7M21 43l8-2m59-8 8 8"/><circle cx="33" cy="39" r="1.2" fill="currentColor"/>',
    ram: '<path d="M19 42q3-13 21-14h17l11 4 5 9 10 5 1 6-12 3-10-8-7 3-4 15h-6l1-17H32l-5 17h-6l1-16-8-6 5-7"/><path d="M61 34q-4-11 6-16 11-6 19 4 6 8 0 15-7 8-14 2-6-5-2-10 4-4 8 0 2 3 0 5"/><circle cx="76" cy="46" r="1.2" fill="currentColor"/>',
    antelope: '<path d="M18 44q8-8 22-7l13 2 8-10 7-10 9-1 10 5-2 6-11 2-6 16-9 8-3 12h-5l-1-15-12-1-7 8-8 8h-6l10-16-9-3-5-7"/><path d="M70 20q-6-9-1-16m6 14q-4-9 2-15m-5 16-9 1-5-4"/><circle cx="79" cy="23" r="1" fill="currentColor"/>',
  };
  const face = (x,y,r=8) => `<circle cx="${x}" cy="${y}" r="${r}"/><path d="M${x-3} ${y}h.2m5.8 0h.2"/>`;
  const seated = (x, heads, emblem) => {
    const arrangements={
      1:[[0,24]],
      3:[[-10,25],[10,25],[0,18]],
      4:[[-11,26],[11,26],[0,12],[0,29]],
      5:[[-16,25],[-8,14],[0,25],[8,14],[16,25]],
      6:[[-14,28],[0,28],[14,28],[-14,16],[0,16],[14,16]]
    };
    const positions=arrangements[heads];
    return `<path d="M${x-7} 33q-12 4-13 18l-7 6m34-24q12 4 13 18l7 6M${x-15} 46l9 11h12l9-11M${x-6} 51q-17-2-22 9 9 6 28 5 19 1 28-5-5-11-22-9"/>${positions.map(([offset,b])=>face(x+offset,b,heads>1?5:8)).join('')}${emblem}`;
  };
  const pairs = [
    ['Brahmā e Ḍākinī', seated(29,4,'<path d="M6 38v13m-3-10 3-4 3 4"/>')+seated(80,1,'<path d="M100 31v15m-4-11 4-4 4 4"/>'), 'Airāvata · elefante','elephant'],
    ['Viṣṇu e Rākiṇī', seated(29,1,'<circle cx="8" cy="38" r="5"/><circle cx="8" cy="38" r="2"/>')+seated(80,1,'<path d="M99 32v14m-4-10 4-5 4 5"/>'), 'Makara · criatura aquática','makara'],
    ['Rudra e Lākinī', seated(29,1,'<path d="M8 32v17m-4-17v4l4 4 4-4v-4"/>')+seated(80,3,'<path d="m99 32-4 7h8l-4 7"/>'), 'Carneiro · região do fogo','ram'],
    ['Īśa e Kākinī', seated(29,1,'<path d="M21 13q5-6 10-2-7-1-8 4"/>')+seated(80,1,'<path d="M99 33q-6 0-6 5t6 5q6 0 6-5t-6-5Z"/>'), 'Antílope · região do ar','antelope'],
    ['Sadāśiva e Śākinī', seated(29,5,'<path d="M7 32v17m-4-17v4l4 4 4-4v-4"/>')+seated(80,5,'<path d="m98 31 5 6-5 6-5-6Z"/>'), 'Elefante branco · região do espaço','elephant'],
    ['Hākinī', seated(54,6,'<path d="M25 30l6 6-6 6-6-6Zm58 0 6 6-6 6-6-6Z"/>'), 'Itara · liṅga', 'linga'],
    ['União de Śiva e Śakti','<circle cx="45" cy="37" r="19"/><circle cx="63" cy="37" r="19"/><path d="M54 14v46M30 37h48M45 37l9-12 9 12-9 12Z"/>','Lótus da coroa','lotus'],
  ];
  const symbols = {
    linga:'<path d="M42 53V29q0-13 12-13t12 13v24M29 53h50v6H29Zm7 6-4 8h44l-4-8"/><path d="M49 32h10m-10 4h10m-10 4h10"/>',
    lotus:'<path d="M54 60C25 56 18 45 12 36q18-2 31 11Q23 32 24 18q17 3 26 19-4-19 4-29 8 10 4 29 9-16 26-19 1 14-19 29 13-13 31-11c-6 9-13 20-42 24Z"/><path d="M32 66h44m-35 5h26M54 60V48"/>',
  };
  const art = (path) => `<svg viewBox="-6 0 120 74" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  const figure = (label,drawing,pale=false) => `<figure${pale?' class="pale-figure"':''}>${art(drawing)}<figcaption>${label}</figcaption></figure>`;
  function gallery(index){
    const [pair,drawing,caption,key]=pairs[index];
    return `<section class="figure-section" aria-label="Figuras do chakra"><h4>Figuras</h4><div class="chakra-figures">${figure(pair,drawing)}${figure(caption,animals[key]||symbols[key],index===4||index===6)}</div><p class="figure-credit">Ilustrações esquemáticas da iconografia ritual.</p></section>`;
  }
  function state(index){
    const drawings=[
      '<path d="M4 16h16"/><path d="m8 7 4 4 4-4"/>',
      '<path d="M12 5v14m-5 0h10M4 11h16M5 11l-2 4h4Zm14 0-2 4h4Z"/>',
      '<path d="M4 19h16M7 12l5-5 5 5m-10-5 5-5 5 5"/>'
    ];
    return `<svg class="state-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${drawings[index]}</svg>`;
  }
  const clock='<svg class="clock-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/></svg>';
  return {gallery,state,clock};
})();
