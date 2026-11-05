(() => {
  const classicAnswers = [
    'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes, definitely.',
    'You may rely on it.', 'As I see it, yes.', 'Most likely.', 'Outlook good.',
    'Yes.', 'Signs point to yes.', 'Reply hazy, try again.', 'Ask again later.',
    'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
    'Don’t count on it.', 'My reply is no.', 'My sources say no.',
    'Outlook not so good.', 'Very doubtful.',
  ];
  const editions = {
    '10': ['Yes. The cat has signed off.', 'No. Even the small bone says no.', 'Ask again after the candle stops judging you.', 'The bones agree. The cat has abstained.', 'Unclear. One bone landed under the cabinet.', 'Go for it. That was a very confident clatter.'],
    '11': ['Yes. The goose objects on principle.', 'No. The entrails have tied themselves in a knot.', 'Possibly. The cook requests a second opinion.', 'Yes. The royal gravy points due north.', 'Ask again after supper.', 'No. The goose has stamped the platter.'],
  };
  const answers = editions[document.body.dataset.edition] ?? classicAnswers;
  const button = document.querySelector('#ask');
  const label = button.querySelector('span');
  const state = document.querySelector('#state');
  const answer = document.querySelector('#answer');
  const device = document.querySelector('.instrument');
  const question = document.querySelector('#question');
  const asked = document.querySelector('#asked');
  const screen = device.querySelector('.screen-answer');
  const ticker = device.querySelector('.hazard-tape');
  const call = device.querySelector('.oracle-call span');
  const track = device.querySelector('.oracle-track');
  const artDelay = {'03': 1840, '07': 1540, '08': 1460, '09': 1680, '11': 1320}[document.body.dataset.edition];
  const prize = device.querySelector('.hazard-prize');
  const prizeCaption = device.querySelector('.hazard-prize-caption');
  const prizes = [
    ['key', 'A key to absolutely nothing'],
    ['coin', 'One suspiciously lucky coin'],
    ['fish', 'A tiny wooden fish'],
    ['star', 'A spare star'],
    ['mushroom', 'A pocket mushroom'],
  ];
  let lastPrize = -1;
  const verdictOverlay = device.querySelector('.hazard-verdict-overlay');
  const verdictClose = verdictOverlay?.querySelector('.ticket-dismiss');
  verdictClose?.addEventListener('click', () => {
    verdictOverlay.hidden = true;
    question.focus({preventScroll: true});
  });
  device.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && verdictOverlay && !verdictOverlay.hidden) verdictClose.click();
  });
  const paper = device.querySelector('.hazard-label');
  const lever = device.querySelector('.hazard-pull');
  const sound = device.querySelector('.hazard-sound');
  const callState = device.querySelector('.call-state');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const display = device.querySelector('.hazard-display-message');
  const cat = device.querySelector('.hazard-cat');
  if (cat) {
    const routes = ['bench', 'window'];
    let route = 0;
    cat.addEventListener('animationiteration', (event) => {
      if (event.target !== cat) return;
      route = (route + 1) % routes.length;
      cat.dataset.route = routes[route];
    });
  }
  const announcer = device.querySelector('.hazard-announce-message');
  function announce(message) {
    if (!announcer) return;
    const line = document.createElement('span');
    line.textContent = message;
    announcer.replaceChildren(line);
  }
  const wireMessages = [
    'A SMALL SPOON WILL CHANGE EVERYTHING',
    'THE FISH DECLINES TO COMMENT',
    'GOOD LUCK INCOMING. MIND THE CABLE',
    'YOUR FUTURE CONTAINS A SECOND COFFEE',
    'THE CAT HAS VOIDED THE WARRANTY',
    'ODDS OF A DRAMATIC PAUSE: EXCELLENT',
    'BEWARE THE PERSON WHO SAYS QUICK QUESTION',
    'TODAY IS A GOOD DAY TO BE SLIGHTLY WEIRD',
    'THE STARS ARE OUT TO LUNCH',
    'YOUR LUCKY NUMBER HAS REQUESTED PRIVACY',
    'AN OCTOPUS WOULD HAVE PRESSED ALL THE BUTTONS',
    'FATE HAS RECEIVED YOUR COMPLAINT',
    'MERCURY IN RETROGRADE. PRINTER IN REVERSE',
    'A STRANGER WILL OFFER YOU A VERY SMALL CHAIR',
    'THE CRYSTALS SAY YES. ACCOUNTING SAYS MAYBE',
    'YOUR DESTINY IS IN THE OTHER TROUSERS',
    'COFFEE LEVELS WITHIN LEGAL LIMITS',
    'THE NEXT OMEN MAY CONTAIN TRACES OF NONSENSE',
  ];
  let wireTimer;
  let wireIndex = -1;
  function writeWire(message) {
    if (!display) return;
    const text = document.createElement('span');
    text.textContent = message;
    display.replaceChildren(text);
  }
  function scheduleWire() {
    if (!display) return;
    clearTimeout(wireTimer);
    wireTimer = setTimeout(() => {
      if (pending) return;
      let index = Math.floor(Math.random() * (wireMessages.length - Number(wireIndex >= 0)));
      if (wireIndex >= 0 && index >= wireIndex) index++;
      wireIndex = index;
      writeWire(wireMessages[index]);
      scheduleWire();
    }, 7600);
  }
  let audio;
  sound?.addEventListener('click', () => {
    const enabled = sound.getAttribute('aria-pressed') === 'true';
    sound.setAttribute('aria-pressed', String(!enabled));
    if (audio) audio.master.gain.value = enabled ? 0 : .48;
  });
  function playHazard(tone, fast) {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine || sound.getAttribute('aria-pressed') !== 'true') return;
    try {
      if (!audio) {
        const context = new AudioEngine();
        const master = context.createGain();
        master.gain.value = .48;
        master.connect(context.destination);
        audio = {context, master};
      }
      const {context, master} = audio;
      if (context.state === 'suspended') context.resume().catch(() => {});
      const start = context.currentTime + .025;
      const beep = (at, length, pitch, end, type, volume) => {
        const voice = context.createOscillator();
        const envelope = context.createGain();
        voice.type = type;
        voice.frequency.setValueAtTime(pitch, start + at);
        voice.frequency.exponentialRampToValueAtTime(end, start + at + length);
        envelope.gain.setValueAtTime(volume, start + at);
        envelope.gain.exponentialRampToValueAtTime(.001, start + at + length);
        voice.connect(envelope).connect(master);
        voice.start(start + at);
        voice.stop(start + at + length);
      };
      if (!fast) {
        beep(0, .085, 187, 57, 'triangle', .21);
        beep(.22, .11, 290, 72, 'square', .11);
        for (const at of [.08,.18,.28,.46,.57,.65,.82,.94,1.04]) {
          beep(at, .045, 790, 105, 'square', .055);
          beep(at + .012, .06, 210, 54, 'triangle', .18);
        }
        beep(1.14, .19, 1660, 1080, 'triangle', .12);
        for (const at of [1.4,1.57,1.73]) beep(at, .08, 320, 145, 'triangle', .14);
        const transport = 2.05;
        const machine = (at, ...parts) => beep(at + transport + (at >= .34 ? 3.5 : 0), ...parts);
        machine(.13, .16, 2300, 70, 'sawtooth', .26);
        machine(.17, .12, 980, 75, 'square', .15);
        for (const [at, pitch] of [[2.47, 475], [2.65, 615], [2.84, 810], [3.02, 1050]]) beep(at, .16, pitch, pitch * 1.35, 'triangle', .14);
        machine(0, .13, 178, 48, 'triangle', .33);
        machine(.34, .26, 105, 260, 'sawtooth', .13);
        machine(.73, .19, 154, 42, 'triangle', .38);
        machine(.99, .19, 240, 410, 'triangle', .13);
        machine(1.10, .27, 390, 125, 'sawtooth', .11);
        machine(1.14, .31, 330, 73, 'square', .11);
        machine(1.63, .38, 640, 1130, 'sawtooth', .095);
        machine(2.12, .31, 117, 40, 'triangle', .27);
        machine(2.34, .24, 510, 103, 'triangle', .15);
        machine(2.57, .16, 160, 315, 'square', .055);
        const hiss = context.createBuffer(1, Math.floor(context.sampleRate * .57), context.sampleRate);
        const samples = hiss.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2;
        const steam = context.createBufferSource();
        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 970;
        steam.buffer = hiss;
        steam.connect(filter).connect(master);
        steam.start(start + transport + 5.73);
        const rip = context.createBufferSource();
        const ripFilter = context.createBiquadFilter();
        ripFilter.type = 'bandpass';
        ripFilter.frequency.value = 2450;
        rip.buffer = hiss;
        rip.connect(ripFilter).connect(master);
        for (const [at, hz] of [[3.2,320],[3.74,450],[4.19,580],[4.88,740],[5.48,990]]) beep(at,.21,hz,hz*1.6,'triangle',.16);
        rip.start(start + 9.45, .08, .16);
        beep(9.48, .09, 360, 90, 'triangle', .15);
        machine(3.64, .16, 910, 1480, 'triangle', .13);
        for (const at of [2.79, 2.88, 3.03, 3.31, 3.38, 3.58]) machine(at, .06, 640, 190, 'square', .1);
      }
      for (const at of [0, .17, .39]) {
        const bell = (fast ? 0 : 9.44) + at;
        beep(bell, .24, 1320, 1315, 'sine', .16);
        beep(bell, .13, 2280, 2230, 'triangle', .065);
      }
      const notes = {yes:[294,392,370,494,587],no:[494,440,330,349,147],maybe:[330,370,294,415,277]}[tone];
      if (tone === 'no') beep((fast ? 0 : 9.44) + .78, .27, 133, 49, 'sawtooth', .11);
      if (tone === 'yes') beep((fast ? 0 : 9.44) + .73, .16, 1040, 760, 'triangle', .09);
      notes.forEach((pitch, i) => beep((fast ? 0 : 9.44) + [0,.085,.23,.34,.51][i], i === 4 ? .28 : .13, pitch, i === 4 ? pitch * .82 : pitch, i % 2 ? 'triangle' : 'square', .13));
    } catch {
      // The oracle still works when audio is unavailable.
    }
  }
  let previous = -1;
  let pending = false;
  button.disabled = false;
  writeWire('STAND BY FOR QUESTION');
  scheduleWire();
  const workshopKeys = [...device.querySelectorAll('.keyboard-key')];
  const shifted = {")": "0", "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", "_": "-", "+": "=", "{": "[", "}": "]", "|": "\\", ":": ";", "\"": "'", "<": ",", ">": ".", "?": "/", "~": "`"};
  function pressWorkshopKey(key) {
    if (!key || reduced.matches) return;
    const normalized = shifted[key] ?? (key.length === 1 ? key.toUpperCase() : key);
    workshopKeys.find(cap => cap.dataset.key === normalized)?.animate(
      [{transform:'translateY(3px)',boxShadow:'0 0 #513241',filter:'brightness(1.35)'},{transform:'none'}],
      {duration:180}
    );
  }
  question.addEventListener('keydown', (event) => {
    if (event.key.length > 1 && event.key !== 'Enter' && event.key !== 'Backspace') pressWorkshopKey(event.key);
  });
  question.addEventListener('input', (event) => {
    question.setCustomValidity('');
    if (event.inputType === 'deleteContentBackward') pressWorkshopKey('Backspace');
    else pressWorkshopKey(event.data?.slice(-1));
  });
  device.addEventListener('submit', (event) => {
    event.preventDefault();
    if (pending) return;
    const prompt = question.value.trim();
    if (!prompt) {
      question.setCustomValidity('Type your question first.');
      question.reportValidity();
      return;
    }
    pending = true;
    if (verdictOverlay) verdictOverlay.hidden = true;
    pressWorkshopKey('Enter');
    asked.hidden = true;
    if (paper) paper.textContent = prompt;
    if (display) {
      clearTimeout(wireTimer);
      writeWire('QUESTION RECEIVED // TYPESET');
      announce('TYPESETTING');
      if (!reduced.matches) {
        const stages = [
          [1290, 'FEEDING QUESTION', 'FEED'],
          [1970, 'HOLD ON TO YOUR COFFEE', 'CHARGING'],
          [5930, 'TUMBLING FATE', 'TUMBLING'],
          [7710, 'VENTING SUSPICION', 'VENTING'],
          [8290, 'PRINTING THE OMEN', 'PRINTING'],
        ];
        for (const [delay, message, status] of stages) setTimeout(() => {
          writeWire(message);
          announce(status);
        }, delay);
      }
    }
    if (screen) screen.textContent = '';
    if (prize) {
      delete prize.dataset.item;
      prizeCaption.textContent = '';
    }
    if (!ticker) label.textContent = button.dataset.loading;
    button.setAttribute('aria-disabled', 'true');
    lever?.setAttribute('aria-disabled', 'true');
    if (!ticker) button.removeAttribute('aria-label');
    state.textContent = 'IN PROGRESS';
    answer.textContent = button.dataset.loading;
    device.dataset.phase = 'asking';
    if (callState) callState.textContent = 'CONNECTING…';
    if (call) call.textContent = 'CONNECTING';
    if (track) track.firstChild.nodeValue = previous < 0 ? 'SIDE A ' : 'SIDE B ';
    let next = Math.floor(Math.random() * (answers.length - Number(previous >= 0)));
    if (previous >= 0 && next >= previous) next += 1;
    previous = next;
    if (ticker) playHazard(next < 10 ? 'yes' : next < 15 ? 'maybe' : 'no', reduced.matches);
    setTimeout(() => {
      state.textContent = state.dataset.result;
      asked.textContent = '“' + prompt + '”';
      asked.hidden = false;
      answer.textContent = answers[next];
      if (screen) screen.textContent = answers[next];
      if (ticker) {
        button.setAttribute('aria-label', button.dataset.again);
        let pick = Math.floor(Math.random() * (prizes.length - Number(lastPrize >= 0)));
        if (lastPrize >= 0 && pick >= lastPrize) pick++;
        lastPrize = pick;
        const [item, caption] = prizes[pick];
        prize.dataset.item = item;
        prizeCaption.textContent = caption;
        verdictOverlay.querySelector('.ticket-question').textContent = '“' + prompt + '”';
        const ink = verdictOverlay.querySelector('.ticket-verdict');
        ink.setAttribute('aria-label', answers[next]);
        let letterIndex = 0;
        ink.replaceChildren(...answers[next].split(' ').flatMap((word, wordIndex) => {
          const group = document.createElement('span');
          group.className = 'ticket-ink-word';
          group.setAttribute('aria-hidden', 'true');
          group.append(...Array.from(word, glyph => {
            const letter = document.createElement('span');
            letter.textContent = glyph;
            letter.style.setProperty('--ink-delay', (460 + letterIndex++ * 36) + 'ms');
            return letter;
          }));
          return wordIndex ? [' ', group] : [group];
        }));
        verdictOverlay.hidden = false;
      } else {
        label.textContent = button.dataset.again;
      }
      device.dataset.phase = 'revealed';
      if (callState) callState.textContent = 'LINE OPEN / ORACLE 08';
      if (call) call.textContent = 'LINE OPEN';
      pending = false;
      writeWire(answers[next].toUpperCase());
      announce('OMEN READY');
      if (!ticker) scheduleWire();
      button.removeAttribute('aria-disabled');
      lever?.removeAttribute('aria-disabled');
    }, reduced.matches ? 0 : ticker ? 9440 : (artDelay ?? 720));
  });
})();
