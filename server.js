// Made in Maia — AI Boardroom (MVP)
// ChatGPT, Grok and Claude take turns brainstorming growth ideas; the page lets you watch live.
// No dependencies: Node 20+ (built-in fetch).

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.BOARDROOM_PASSWORD || '';
const BUDGET_USD = parseFloat(process.env.BUDGET_USD || '1');
const PACE_MS = parseInt(process.env.PACE_MS || '2500', 10);
const MAX_WORDS = parseInt(process.env.MAX_WORDS || '110', 10);

const DEFAULT_BRIEF = process.env.BUSINESS_BRIEF ||
  `Made in Maia (madeinmaia.pt) is a small creative brand from Maia, Portugal. ` +
  `It sells printed t-shirts whose QR codes open playful web apps (a Magic 8-Ball decision app, a coin-flip app), ` +
  `makes browser games (e.g. "Outrunning Portugal 2000", an arcade racer through Portuguese scenery) and runs an online shop. ` +
  `Tiny team, small budget, strong local pride. Goal: grow sales, audience and brand recognition.`;

const DEFAULT_MISSION = 'Find the 3 best ways to grow Made in Maia in the next 6 months with a small budget.';

const num = (v, d) => (v !== undefined && v !== '' && !isNaN(+v) ? +v : d);

const AGENTS = {
  chatgpt: {
    name: 'ChatGPT', role: 'The Strategist', provider: 'openai',
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    key: () => process.env.OPENAI_API_KEY,
    price: [num(process.env.OPENAI_PRICE_IN, 0.2), num(process.env.OPENAI_PRICE_OUT, 1.2)],
    persona: 'You are structured and strategic: you think in markets, customer segments, channels and numbers. You like clear frameworks and measurable goals.',
  },
  grok: {
    name: 'Grok', role: 'The Provocateur', provider: 'xai',
    model: process.env.XAI_MODEL || 'grok-4.3',
    key: () => process.env.XAI_API_KEY,
    price: [num(process.env.XAI_PRICE_IN, 1.25), num(process.env.XAI_PRICE_OUT, 2.5)],
    persona: 'You are bold, witty and a little contrarian: you push for viral, social-media-first, attention-grabbing ideas and you challenge safe thinking (kindly).',
  },
  claude: {
    name: 'Claude', role: 'The Builder', provider: 'anthropic',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
    key: () => process.env.ANTHROPIC_API_KEY,
    price: [num(process.env.ANTHROPIC_PRICE_IN, 3), num(process.env.ANTHROPIC_PRICE_OUT, 15)],
    persona: 'You are practical and grounded: you turn ideas into concrete first steps, estimate effort and cost, and point out risks.',
  },
};
const ORDER = ['chatgpt', 'grok', 'claude'];

// ---------------- state ----------------
let S = freshState();
function freshState(over = {}) {
  return {
    id: crypto.randomUUID().slice(0, 8),
    status: 'idle', // idle | running | paused | done
    mission: DEFAULT_MISSION,
    brief: DEFAULT_BRIEF,
    language: 'English',
    rounds: 4,
    turn: 0,
    startedAt: null,
    budget: BUDGET_USD,
    spent: 0,
    messages: [],
    ideas: [],
    agents: Object.fromEntries(ORDER.map(id => [id, {
      id, name: AGENTS[id].name, role: AGENTS[id].role, model: AGENTS[id].model,
      live: !!AGENTS[id].key(), status: 'idle', msgs: 0, ideas: 0, votesGiven: 0,
      tokensIn: 0, tokensOut: 0, cost: 0,
    }])),
    ...over,
  };
}
let msgSeq = 0;
let gen = 0, loopGen = -1;

// ---------------- SSE ----------------
const clients = new Set();
function snapshot() {
  const a = {};
  for (const id of ORDER) a[id] = { ...S.agents[id], live: !!AGENTS[id].key(), model: AGENTS[id].model };
  return { ...S, agents: a, maxTurns: S.rounds * 3, viewers: clients.size, passwordRequired: !!PASSWORD };
}
function broadcast() {
  const data = `data: ${JSON.stringify(snapshot())}\n\n`;
  for (const res of clients) res.write(data);
}
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 20000);

function addMsg(from, text, extra = {}) {
  const m = { id: ++msgSeq, from, text, at: Date.now(), ...extra };
  S.messages.push(m);
  if (S.messages.length > 300) S.messages.shift();
  broadcast();
  return m;
}
function setAgent(id, status) { S.agents[id].status = status; broadcast(); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------- prompts ----------------
function systemPrompt(id, final) {
  const me = AGENTS[id];
  const others = ORDER.filter(x => x !== id).map(x => AGENTS[x].name).join(' and ');
  return [
    `You are ${me.name}, "${me.role}", in the Made in Maia AI Boardroom: a live brainstorm with two other AIs (${others}) while the Boss (the human owner) watches and sometimes speaks.`,
    me.persona,
    `MISSION: ${S.mission}`,
    `BUSINESS BRIEF: ${S.brief}`,
    `RULES:`,
    `- Reply in ${S.language}, at most ${MAX_WORDS} words, conversational. Address the others by name; build on, improve or challenge what they said. If the Boss spoke, respond to the Boss first.`,
    `- Be specific to Made in Maia and to Maia/Porto/Portugal where useful. No generic filler. Do not repeat ideas already on the board.`,
    `- To pin a NEW concrete idea, add a line exactly like: IDEA: <short title> | <one-sentence description>  (max one per turn)`,
    `- To support an idea already on the board, add a line exactly like: VOTE: #<number>  (max one per turn, never your own idea)`,
    final ? `- THIS IS THE FINAL ROUND: no new ideas. Name the single idea you would do first and its first 3 concrete steps (this week, this month, in 3 months), then VOTE for the best idea that is not yours.` : '',
  ].filter(Boolean).join('\n');
}
function userPrompt(id) {
  const recent = S.messages.filter(m => m.from !== 'system').slice(-18);
  const transcript = recent.length
    ? recent.map(m => `[${m.from === 'boss' ? 'Boss' : AGENTS[m.from]?.name || m.from}]: ${m.raw || m.text}`).join('\n')
    : '(nobody has spoken yet — you open the meeting)';
  const board = S.ideas.length
    ? S.ideas.map(i => `#${i.n} ${i.title} — ${i.desc} (by ${AGENTS[i.by].name}, ${i.votes.length} votes)`).join('\n')
    : '(empty)';
  return `IDEA BOARD:\n${board}\n\nCONVERSATION SO FAR:\n${transcript}\n\nIt is your turn, ${AGENTS[id].name}.`;
}

// ---------------- providers ----------------
async function callAgent(id, final) {
  const a = AGENTS[id];
  const key = a.key();
  if (!key) return demoReply(id, final);
  const sys = systemPrompt(id, final), user = userPrompt(id);
  const signal = AbortSignal.timeout(90000);
  let r, j;
  if (a.provider === 'anthropic') {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: a.model, max_tokens: 1024, system: sys, messages: [{ role: 'user', content: user }] }),
    });
    j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);
    return { text: (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim(),
      tin: j.usage?.input_tokens || 0, tout: j.usage?.output_tokens || 0 };
  }
  const url = a.provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
  const body = { model: a.model, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] };
  if (a.provider === 'openai') body.max_completion_tokens = 2000; else body.max_tokens = 2000;
  r = await fetch(url, { method: 'POST', signal, headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
  j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || j?.error || `HTTP ${r.status}`);
  return { text: (j.choices?.[0]?.message?.content || '').trim(),
    tin: j.usage?.prompt_tokens || 0, tout: j.usage?.completion_tokens || 0 };
}

// Demo mode: scripted lines so the room works before API keys are added.
const DEMO = {
  chatgpt: [
    `Let's open with structure. Made in Maia has three assets: the shirts, the QR web apps and the games. The QR is the hook — every shirt is a walking ad. Grok, Claude: how do we turn wearers into repeat buyers?\nIDEA: Collect-the-set QR drops | Release numbered monthly shirts whose apps unlock a badge; collect 4 badges for a discount.`,
    `Grok's stunt is fun, but let's measure it: track scans per shirt in the QR apps. If a design gets 30+ scans a month, reprint it; if not, retire it. Data makes the shop smarter.\nIDEA: Scan analytics dashboard | Count QR scans per design and use them to decide reprints and new drops.\nVOTE: #2`,
    `Tourists are a segment we're ignoring. Porto gets millions of visitors; a "Maia & Porto" design sold in 3–4 local cafés and hostels on consignment is low-risk distribution.\nIDEA: Consignment in local spots | Place a small rack of designs in Maia/Porto cafés and hostels, split margin 70/30.`,
    `Final pick: the collect-the-set drops, because they create repeat purchases. This week: design drop #1 and its badge. This month: launch with an email/Instagram countdown. In 3 months: review scan data and set the yearly drop calendar.\nVOTE: #4`,
  ],
  grok: [
    `Repeat buyers? Boring but fine. Let's make people *talk*. Put a giant QR mural on a wall in Maia — scan it and you get a game, Outrunning Portugal 2000 style, with a leaderboard. Top scorer each month wins a shirt.\nIDEA: Street QR game mural | A big QR mural in Maia that launches a mini-game with a monthly prize shirt.\nVOTE: #1`,
    `ChatGPT, dashboards don't go viral. Short videos do. Film people in Porto asking the Magic 8-Ball shirt life questions — "should I quit my job?" — and post the reactions. 30-second Reels, zero budget.\nIDEA: 8-Ball street-interview Reels | Weekly short videos of strangers asking the 8-Ball shirt big questions.`,
    `Claude's right about cost, so steal attention cheaply: partner with one Maia football or futsal club for a limited "Made in Maia × club" shirt. Local pride sells itself.\nIDEA: Local club collab | A limited co-branded shirt with a Maia sports club, sold at their games.\nVOTE: #3`,
    `Final pick: the 8-Ball Reels. This week: film 5 interviews on a phone. This month: post 2 a week and reply to every comment. In 3 months: turn the best questions into new shirt designs. Bonus — the collect-the-set idea is smart.\nVOTE: #1`,
  ],
  claude: [
    `Both work; let's keep them cheap. The mural needs council permission and could take months — start with a QR poster in 5 shops first to test scans. ChatGPT's set idea is easy: the apps already exist, we just add a badge screen.\nIDEA: QR poster test | Put game-QR posters in 5 Maia shops for one month and count scans before investing in a mural.\nVOTE: #1`,
    `Reels plus scan data fit together. One practical gap: the shop checkout. If a scan lands on a fun app but there's no "buy this shirt" button, we lose the sale. Add a buy button in every app, two hours of work.\nIDEA: Buy button in every app | Each QR app shows a "get this shirt" link straight to the shop product.\nVOTE: #5`,
    `Consignment is good; keep the first deal to two venues and a simple stock sheet so it stays manageable. I'd pair it with the club collab — same supplier order, better unit price.\nVOTE: #6`,
    `Final pick: the buy button in every app — it makes every other idea pay off. This week: add the link to the 8-Ball and coin-flip apps. This month: track clicks to sales. In 3 months: A/B test the button text. Best idea not mine: the 8-Ball Reels.\nVOTE: #5`,
  ],
};
async function demoReply(id) {
  await sleep(1200 + Math.random() * 1800);
  const turnOfAgent = Math.floor(S.turn / 3);
  const lines = DEMO[id];
  const isLast = S.turn >= S.rounds * 3 - 3;
  const text = isLast ? lines[lines.length - 1] : lines[Math.min(turnOfAgent, lines.length - 2)];
  return { text, tin: 0, tout: 0, demo: true };
}

// ---------------- parsing ----------------
function processReply(id, text, demo) {
  const lines = String(text || '').split('\n');
  const keep = [];
  let idea = null, vote = null;
  for (const line of lines) {
    const l = line.replace(/^[\s*_>-]+/, '').replace(/\*\*/g, '');
    let m;
    if (!idea && (m = l.match(/^IDEA:\s*(.+?)\s*\|\s*(.+)$/i))) {
      idea = { title: m[1].slice(0, 80), desc: m[2].slice(0, 240) };
      continue;
    }
    if (!vote && (m = l.match(/^VOTE:\s*#?(\d+)/i))) { vote = +m[1]; continue; }
    if (/^(IDEA|VOTE):/i.test(l)) continue;
    keep.push(line);
  }
  const extra = { raw: text, demo: !!demo };
  if (idea && !S.ideas.some(i => i.title.toLowerCase() === idea.title.toLowerCase())) {
    const n = S.ideas.length + 1;
    S.ideas.push({ n, ...idea, by: id, votes: [], at: Date.now() });
    S.agents[id].ideas++;
    extra.idea = n;
  }
  if (vote) {
    const target = S.ideas.find(i => i.n === vote);
    if (target && target.by !== id && !target.votes.includes(id)) {
      target.votes.push(id);
      S.agents[id].votesGiven++;
      extra.vote = vote;
      extra.voteFor = target.by;
    }
  }
  S.agents[id].msgs++;
  addMsg(id, keep.join('\n').trim() || '…', extra);
}

// ---------------- loop ----------------
async function runLoop() {
  if (loopGen === gen) return; // a loop is already driving this session
  const my = gen; loopGen = my;
  try {
    while (S.status === 'running' && gen === my) {
      const maxTurns = S.rounds * 3;
      if (S.turn >= maxTurns) {
        S.status = 'done';
        const top = [...S.ideas].sort((a, b) => b.votes.length - a.votes.length)[0];
        addMsg('system', top ? `Meeting closed. Top idea: #${top.n} "${top.title}" with ${top.votes.length} votes.` : 'Meeting closed.');
        break;
      }
      const id = ORDER[S.turn % 3];
      const final = S.turn >= maxTurns - 3;
      setAgent(id, 'thinking');
      let res = null;
      try { res = await callAgent(id, final); }
      catch (e) { addMsg('system', `${AGENTS[id].name} tripped over a cable: ${e.message}`); }
      if (gen !== my) return; // session was reset meanwhile
      if (res) {
        const ag = S.agents[id];
        const cost = (res.tin * AGENTS[id].price[0] + res.tout * AGENTS[id].price[1]) / 1e6;
        ag.tokensIn += res.tin; ag.tokensOut += res.tout; ag.cost += cost; S.spent += cost;
        S.agents[id].status = 'speaking';
        processReply(id, res.text, res.demo);
        await sleep(Math.max(1500, Math.min(6000, (res.text || '').length * 18)));
      }
      if (gen !== my) return;
      setAgent(id, 'idle');
      S.turn++;
      broadcast();
      if (S.spent >= S.budget) {
        S.status = 'done';
        addMsg('system', `Budget cap of $${S.budget.toFixed(2)} reached — meeting stopped.`);
        break;
      }
      await sleep(PACE_MS);
    }
  } finally { if (loopGen === my) loopGen = -1; }
}

// ---------------- http ----------------
function authed(req) {
  if (!PASSWORD) return true;
  const got = String(req.headers['x-boardroom-password'] || '');
  const a = crypto.createHash('sha256').update(got).digest();
  const b = crypto.createHash('sha256').update(PASSWORD).digest();
  return crypto.timingSafeEqual(a, b);
}
function readBody(req) {
  return new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 50000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}
function json(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); }

function transcriptMd() {
  const name = f => f === 'boss' ? 'Boss' : f === 'system' ? 'System' : AGENTS[f].name;
  let out = `# Made in Maia AI Boardroom — session ${S.id}\n\n**Mission:** ${S.mission}\n\n## Idea board\n`;
  for (const i of [...S.ideas].sort((a, b) => b.votes.length - a.votes.length))
    out += `- #${i.n} **${i.title}** (${AGENTS[i.by].name}, ${i.votes.length} votes) — ${i.desc}\n`;
  out += `\n## Transcript\n`;
  for (const m of S.messages) out += `\n**${name(m.from)}:** ${m.text}\n`;
  return out;
}

const INDEX = path.join(__dirname, 'public', 'index.html');
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return fs.createReadStream(INDEX).pipe(res);
  }
  if (p === '/healthz') return json(res, 200, { ok: true });
  if (p === '/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    clients.add(res);
    res.write(`data: ${JSON.stringify(snapshot())}\n\n`);
    broadcast();
    req.on('close', () => { clients.delete(res); broadcast(); });
    return;
  }
  if (p === '/api/state') return json(res, 200, snapshot());
  if (p === '/api/transcript') { res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8' }); return res.end(transcriptMd()); }

  if (req.method === 'POST' && p.startsWith('/api/')) {
    if (!authed(req)) return json(res, 401, { error: 'Wrong password' });
    const b = await readBody(req);
    switch (p) {
      case '/api/check': return json(res, 200, { ok: true });
      case '/api/start': {
        gen++;
        S = freshState({
          mission: String(b.mission || DEFAULT_MISSION).slice(0, 600),
          brief: String(b.brief || DEFAULT_BRIEF).slice(0, 3000),
          language: ['English', 'Portuguese (Portugal)'].includes(b.language) ? b.language : 'English',
          rounds: Math.max(1, Math.min(10, parseInt(b.rounds, 10) || 4)),
          budget: Math.max(0.05, Math.min(BUDGET_USD, parseFloat(b.budget) || BUDGET_USD)),
          status: 'running', startedAt: Date.now(),
        });
        addMsg('system', `Meeting started. Mission: ${S.mission}`);
        runLoop();
        return json(res, 200, { ok: true });
      }
      case '/api/pause': if (S.status === 'running') { S.status = 'paused'; addMsg('system', 'The Boss paused the meeting.'); } return json(res, 200, { ok: true });
      case '/api/resume':
        if (S.status === 'paused' || (S.status === 'done' && S.turn < S.rounds * 3 && S.spent < S.budget)) { S.status = 'running'; addMsg('system', 'Meeting resumed.'); runLoop(); }
        return json(res, 200, { ok: true });
      case '/api/extend':
        S.rounds = Math.min(20, S.rounds + 1);
        if (S.status === 'done' && S.spent < S.budget) { S.status = 'running'; addMsg('system', 'The Boss asked for one more round.'); runLoop(); }
        broadcast(); return json(res, 200, { ok: true });
      case '/api/stop': if (S.status !== 'idle') { S.status = 'done'; addMsg('system', 'The Boss ended the meeting.'); } return json(res, 200, { ok: true });
      case '/api/say': {
        const text = String(b.text || '').trim().slice(0, 1000);
        if (text) addMsg('boss', text);
        return json(res, 200, { ok: true });
      }
    }
  }
  res.writeHead(404); res.end('Not found');
});
server.listen(PORT, () => console.log(`AI Boardroom on :${PORT} — live agents: ${ORDER.filter(id => AGENTS[id].key()).join(', ') || 'none (demo mode)'}`));
