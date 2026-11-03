import { NextResponse } from 'next/server';
import { roomAction, RoomError, validRoomOrigin } from '@/lib/outrunning/rooms';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!validRoomOrigin(request)) return NextResponse.json({ ok: false, error: 'Invalid origin.' }, { status: 403, headers });
  const text = await request.text();
  if (text.length > 2048) return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413, headers });
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RoomError('Invalid request.');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    return NextResponse.json(roomAction(body, ip), { headers });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof RoomError ? error.message : 'Race connection unavailable.' }, { status: error instanceof RoomError ? error.status : 400, headers });
  }
}
