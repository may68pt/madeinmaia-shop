(() => {
  const answers = [
    'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes, definitely.',
    'You may rely on it.', 'As I see it, yes.', 'Most likely.', 'Outlook good.',
    'Yes.', 'Signs point to yes.', 'Reply hazy, try again.', 'Ask again later.',
    'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
    'Don’t count on it.', 'My reply is no.', 'My sources say no.',
    'Outlook not so good.', 'Very doubtful.',
  ];
  const button = document.querySelector('#ask');
  const label = button.querySelector('span');
  const state = document.querySelector('#state');
  const answer = document.querySelector('#answer');
  const device = document.querySelector('.instrument');
  const callState = device.querySelector('.call-state');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let previous = -1;
  let pending = false;
  button.disabled = false;
  button.addEventListener('click', () => {
    if (pending) return;
    pending = true;
    button.setAttribute('aria-disabled', 'true');
    state.textContent = 'IN PROGRESS';
    answer.textContent = button.dataset.loading;
    device.dataset.phase = 'asking';
    if (callState) callState.textContent = 'CONNECTING…';
    setTimeout(() => {
      let next = Math.floor(Math.random() * (answers.length - Number(previous >= 0)));
      if (previous >= 0 && next >= previous) next += 1;
      previous = next;
      state.textContent = state.dataset.result;
      answer.textContent = answers[next];
      label.textContent = button.dataset.again;
      device.dataset.phase = 'revealed';
      if (callState) callState.textContent = 'LINE OPEN / ORACLE 08';
      pending = false;
      button.removeAttribute('aria-disabled');
    }, reduced.matches ? 0 : 720);
  });
})();
