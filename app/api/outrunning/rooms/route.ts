import { toDataURL } from 'qrcode';
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
    const result = roomAction(body, ip);
    const origin = request.headers.get('origin');
    if (body.action === 'create' && origin && 'code' in result) {
      const invite = new URL('/outrunning-portugal', origin);
      invite.searchParams.set('race', result.code);
      const qr = await toDataURL(invite.href, { width: 360, margin: 4 }).catch(() => undefined);
      return NextResponse.json({ ...result, qr }, { headers });
    }
    return NextResponse.json(result, { headers });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof RoomError ? error.message : 'Race connection unavailable.' }, { status: error instanceof RoomError ? error.status : 400, headers });
  }
}
