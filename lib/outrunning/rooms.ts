import { randomBytes } from 'node:crypto';

type Sample = { z: number; x: number; speed: number; status: 'racing' | 'finished' | 'out'; elapsed: number };
type Player = { token: string; name: string; ready: boolean; seen: number; sample: Sample | null };
type Room = { code: string; chapter: number; created: number; touched: number; startAt: number | null; players: Player[] };
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
  return { token: randomBytes(24).toString('hex'), name: String(name || 'Racer').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 16) || 'Racer', ready: false, seen: now, sample: null };
}
function snapshot(room: Room, me: Player, now: number) {
  return { ok: true, code: room.code, chapter: room.chapter, serverNow: now, startAt: room.startAt,
    players: room.players.map(p => ({ name: p.name, me: p === me, ready: p.ready, online: now - p.seen < 5000, sample: p.sample, seen: p.seen })) };
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
    const chapter = Number(body.chapter);
    if (!Number.isInteger(chapter) || chapter < 0 || chapter > 20) throw new RoomError('Invalid route.');
    let code: string;
    do { code = randomBytes(4).toString('hex').slice(0, 6).toUpperCase(); } while (rooms.has(code));
    const me = player(body.name, now);
    me.ready = body.autoReady === true;
    const room: Room = { code, chapter, created: now, touched: now, startAt: null, players: [me] };
    rooms.set(code, room);
    return { ...snapshot(room, me, now), token: me.token };
  }
  const code = String(body.code || '').toUpperCase();
  const room = rooms.get(code);
  if (!room) throw new RoomError('Room expired or not found. Create a new race.', 404);
  if (body.action === 'join') {
    if (room.startAt || room.players.length >= 2) throw new RoomError('This race is full or has already started.', 409);
    const me = player(body.name, now);
    me.ready = body.autoReady === true;
    room.players.push(me); room.touched = now;
    if (room.players.every(p => p.ready && now - p.seen < 5000) && room.players.length === 2) room.startAt = now + 4000;
    return { ...snapshot(room, me, now), token: me.token };
  }
  const me = room.players.find(p => p.token === body.token);
  if (!me) throw new RoomError('Invalid player session.', 403);
  if (body.action === 'leave') {
    if (room.startAt && me.sample?.status !== 'finished') me.sample = { z: me.sample?.z ?? 0, x: 0, speed: 0, status: 'out', elapsed: Math.max(0, (now - room.startAt) / 1000) };
    else if (!room.startAt) room.players.splice(room.players.indexOf(me), 1);
    if (!room.players.length) rooms.delete(code);
    me.seen = 0;
    return { ok: true };
  }
  if (body.action !== 'sync' && body.action !== 'ready') throw new RoomError('Invalid action.');
  me.seen = now; room.touched = now;
  if (body.action === 'ready' && !room.startAt) {
    me.ready = true;
  }
  if (!room.startAt && room.players.length === 2 && room.players.every(p => p.ready && now - p.seen < 5000)) room.startAt = now + 4000;
  if (body.sample && room.startAt && now >= room.startAt && !me.sample?.status.match(/finished|out/)) {
    const s = body.sample as Record<string, unknown>;
    const { z, x, speed, elapsed, status } = s;
    if (![z, x, speed, elapsed].every(v => typeof v === 'number' && Number.isFinite(v)) ||
        (z as number) < 0 || (z as number) > 1e9 || Math.abs(x as number) > 5 ||
        (speed as number) < 0 || (speed as number) > 100_000 || (elapsed as number) < 0 ||
        (elapsed as number) > (now - room.startAt) / 1000 + 2 || !['racing', 'finished', 'out'].includes(String(status))) throw new RoomError('Invalid race position.');
    me.sample = { z: z as number, x: x as number, speed: speed as number, elapsed: elapsed as number, status: status as Sample['status'] };
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
