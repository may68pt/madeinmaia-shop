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
  const sound = device.querySelector('.hazard-sound');
  const callState = device.querySelector('.call-state');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
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
        beep(0, .13, 178, 48, 'triangle', .33);
        beep(.34, .26, 105, 260, 'sawtooth', .13);
        beep(.73, .19, 154, 42, 'triangle', .38);
        beep(1.14, .31, 330, 73, 'square', .11);
        beep(1.63, .38, 640, 1130, 'sawtooth', .095);
        beep(2.12, .31, 117, 40, 'triangle', .27);
        const hiss = context.createBuffer(1, Math.floor(context.sampleRate * .57), context.sampleRate);
        const samples = hiss.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2;
        const steam = context.createBufferSource();
        const filter = context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 970;
        steam.buffer = hiss;
        steam.connect(filter).connect(master);
        steam.start(start + 2.23);
        for (const at of [2.79, 2.88, 3.03, 3.31, 3.38, 3.58]) beep(at, .06, 640, 190, 'square', .1);
      }
      const notes = {yes:[294,392,370,494,587],no:[494,440,330,349,147],maybe:[330,370,294,415,277]}[tone];
      notes.forEach((pitch, i) => beep((fast ? 0 : 3.89) + [0,.085,.23,.34,.51][i], i === 4 ? .28 : .13, pitch, i === 4 ? pitch * .82 : pitch, i % 2 ? 'triangle' : 'square', .13));
    } catch {
      // The oracle still works when audio is unavailable.
    }
  }
  let previous = -1;
  let pending = false;
  button.disabled = false;
  question.addEventListener('input', () => question.setCustomValidity(''));
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
    asked.hidden = true;
    if (screen) screen.textContent = '';
    label.textContent = button.dataset.loading;
    button.setAttribute('aria-disabled', 'true');
    button.removeAttribute('aria-label');
    state.textContent = 'IN PROGRESS';
    answer.textContent = button.dataset.loading;
    device.dataset.phase = 'asking';
    if (callState) callState.textContent = 'CONNECTING…';
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
      label.textContent = ticker ? answers[next] : button.dataset.again;
      if (ticker) button.setAttribute('aria-label', answers[next] + ' ' + button.dataset.again);
      device.dataset.phase = 'revealed';
      if (callState) callState.textContent = 'LINE OPEN / ORACLE 08';
      pending = false;
      button.removeAttribute('aria-disabled');
    }, reduced.matches ? 0 : ticker ? 3890 : 720);
  });
})();
