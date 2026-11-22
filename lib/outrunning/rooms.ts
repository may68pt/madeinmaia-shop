import { randomBytes } from 'node:crypto';

type Sample = { z: number; x: number; speed: number; status: 'racing' | 'finished' | 'out'; elapsed: number; coins: number; charges: number };
type Player = { token: string; name: string; ready: boolean; seen: number; sample: Sample | null; spent: number };
type Room = { code: string; chapter: number; created: number; touched: number; startAt: number | null; players: Player[]; capacity: number; round: number;
  rematch: { chapter: number; accepted: Player[]; declined: boolean } | null;
  attacks: { id: number; target: Player; z: number; x: number; at: number; lanes: number }[];
  attackId: number;
};
// Render's persistent-disk service has one instance. Rooms are deliberately ephemeral:
// restarting the server expires active races; no customer or shop data is involved.
const root = globalThis as typeof globalThis & { outrunningRooms?: Map<string, Room>; outrunningLimits?: Map<string, { n: number; at: number }> };
const rooms = root.outrunningRooms ??= new Map<string, Room>();
const limits = root.outrunningLimits ??= new Map<string, { n: number; at: number }>();
const TTL = 30 * 60_000;
export class RoomError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
function player(name: unknown, now: number): Player {
  return { token: randomBytes(24).toString('hex'), name: String(name || 'Racer').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 16) || 'Racer', ready: false, seen: now, sample: null, spent: 0 };
}
function route(value: unknown) {
  const chapter = Number(value);
  if (!Number.isInteger(chapter) || chapter < 0 || (chapter > 30 && chapter !== 90 && chapter !== 91)) throw new RoomError('Invalid route.');
  return chapter;
}
function snapshot(room: Room, me: Player, now: number) {
  return { ok: true, code: room.code, chapter: room.chapter, serverNow: now, startAt: room.startAt, round: room.round, capacity: room.capacity, ammo: Math.max(0, (me.sample?.charges ?? 0) - me.spent),
    rematch: room.rematch && { chapter: room.rematch.chapter, votes: room.rematch.accepted.length, accepted: room.rematch.accepted.includes(me), declined: room.rematch.declined },
    attacks: room.attacks.filter(a => a.target === me && now - a.at < 5000).map(({id,z,x,at,lanes}) => ({id,z,x,at,lanes})),
    players: room.players.map((p, slot) => ({ slot, name: p.name, me: p === me, ready: p.ready, online: now - p.seen < 5000, sample: p.sample, seen: p.seen })) };
}
export function roomAction(body: Record<string, unknown>, ip: string, now = Date.now()) {
  for (const [code, room] of rooms) if (now - room.touched > TTL) rooms.delete(code);
  for (const [key, entry] of limits) if (now - entry.at > 60_000) limits.delete(key);
  // Allows two phones on the same Wi-Fi to exchange 8 snapshots per second each.
  const rate = limits.get(ip) ?? { n: 0, at: now };
  rate.n++; limits.set(ip, rate);
  if (rate.n > 1500) throw new RoomError('Too many requests. Please wait a minute.', 429);
  if (body.action === 'create') {
    if (rooms.size >= 1000) throw new RoomError('Race rooms are busy. Try again shortly.', 503);
    const chapter = route(body.chapter);
    let code: string;
    do { code = randomBytes(4).toString('hex').slice(0, 6).toUpperCase(); } while (rooms.has(code));
    const me = player(body.name, now);
    me.ready = body.autoReady === true;
    const room: Room = { code, chapter, created: now, touched: now, startAt: null, players: [me], capacity: body.capacity === 3 && chapter < 90 ? 3 : 2, round: 1, rematch: null, attacks: [], attackId: 0 };
    rooms.set(code, room);
    return { ...snapshot(room, me, now), token: me.token };
  }
  const code = String(body.code || '').toUpperCase();
  const room = rooms.get(code);
  if (!room) throw new RoomError('Room expired or not found. Create a new race.', 404);
  if (body.action === 'join') {
    if (room.startAt || room.players.length >= room.capacity) throw new RoomError('This race is full or has already started.', 409);
    const me = player(body.name, now);
    me.ready = body.autoReady === true;
    room.players.push(me); room.touched = now;
    if (room.players.every(p => p.ready && now - p.seen < 5000) && room.players.length === room.capacity) room.startAt = now + 4000;
    return { ...snapshot(room, me, now), token: me.token };
  }
  const me = room.players.find(p => p.token === body.token);
  if (!me) throw new RoomError('Invalid player session.', 403);
  if (body.action === 'leave') {
    if (room.startAt && me.sample?.status !== 'finished') me.sample = { z: me.sample?.z ?? 0, x: 0, speed: 0, status: 'out', coins: me.sample?.coins ?? 0, charges: me.sample?.charges ?? 0, elapsed: Math.max(0, (now - room.startAt) / 1000) };
    else if (!room.startAt) room.players.splice(room.players.indexOf(me), 1);
    if (!room.players.length) rooms.delete(code);
    if (room.startAt) room.rematch = { chapter: room.chapter, accepted: [], declined: true };
    me.seen = 0;
    return { ok: true };
  }
  if (!['sync', 'ready', 'rematch', 'decline', 'attack'].includes(String(body.action))) throw new RoomError('Invalid action.');
  me.seen = now; room.touched = now;
  if (body.action === 'ready' && !room.startAt) {
    me.ready = true;
  }
  if (!room.startAt && room.players.length === room.capacity && room.players.every(p => p.ready && now - p.seen < 5000)) room.startAt = now + 4000;
  if (body.round !== undefined && body.round !== room.round) return snapshot(room, me, now);
  if (body.action === 'decline' && me.sample && me.sample.status !== 'racing') {
    room.rematch = { chapter: room.chapter, accepted: [], declined: true };
  }
  if (body.action === 'rematch') {
    const chapter = route(body.chapter);
    if (room.capacity === 3 && chapter >= 90) throw new RoomError('This route is for two racers.');
    if (!room.players.every(p => p.sample && p.sample.status !== 'racing' && now - p.seen < 5000) || room.rematch?.declined)
      throw new RoomError('All racers must finish and stay connected.', 409);
    const vote = room.rematch ??= { chapter, accepted: [], declined: false };
    if (vote.chapter !== chapter) return snapshot(room, me, now);
    if (!vote.accepted.includes(me)) vote.accepted.push(me);
    if (vote.accepted.length === room.capacity) {
      room.round++;
      room.chapter = chapter;
      room.startAt = now + 5000;
      room.rematch = null;
      room.attacks = [];
      for (const p of room.players) { p.sample = null; p.spent = 0; }
    }
  }
  if (body.action === 'attack' && me.sample?.status === 'racing' && me.spent < me.sample.charges) {
    const rival = room.players.filter(p => p !== me && p.sample?.status === 'racing' && now - p.seen < 2000)
      .sort((a, b) => Math.abs(a.sample!.z - me.sample!.z) - Math.abs(b.sample!.z - me.sample!.z))[0];
    if (rival?.sample && !room.attacks.some(a => a.target === rival && now - a.at < 3500)) {
      me.spent++;
      room.attacks = room.attacks.filter(a => now - a.at < 5000);
      room.attacks.push({ id: ++room.attackId, target: rival, z: rival.sample.z, x: rival.sample.x, at: now, lanes: Math.min(4, 1 + (me.spent - 1) % 4) });
    }
  }
  if (body.sample && room.startAt && now >= room.startAt && !me.sample?.status.match(/finished|out/)) {
    const s = body.sample as Record<string, unknown>;
    const { z, x, speed, elapsed, status } = s;
    if (![z, x, speed, elapsed].every(v => typeof v === 'number' && Number.isFinite(v)) ||
        (z as number) < 0 || (z as number) > 1e9 || Math.abs(x as number) > 5 ||
        (speed as number) < 0 || (speed as number) > 100_000 || (elapsed as number) < 0 ||
        (elapsed as number) > (now - room.startAt) / 1000 + 2 || !['racing', 'finished', 'out'].includes(String(status))) throw new RoomError('Invalid race position.');
    me.sample = { z: z as number, x: x as number, speed: speed as number, elapsed: elapsed as number, status: status as Sample['status'],
      coins: Math.max(me.sample?.coins ?? 0, Math.min(5000, Math.max(0, Number(s.coins) | 0))),
      charges: Math.max(me.sample?.charges ?? 0, Math.min(100, Math.max(0, Number(s.charges) | 0))) };
  }
  return snapshot(room, me, now);
}

// Next.js may use an internal URL behind Render's reverse proxy. The browser's
// Origin must match the public Host header, rather than that internal address.
export function validRoomOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = request.headers.get('x-forwarded-host')?.split(',')[0].trim() || request.headers.get('host') || new URL(request.url).host;
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.host === host;
  } catch { return false; }
}
