/* Pure helpers for the shared rate limiter (no database), so they can be unit-tested. */

/** Sliding-window estimate: this minute's hits plus the share of last minute's hits still inside the window. */
export function overLimit(current: number, previous: number, elapsedFraction: number, perMinute: number) {
  const f = Math.min(1, Math.max(0, elapsedFraction));
  return current + previous * (1 - f) > perMinute;
}

/** Client IP as seen behind Render's proxy. */
export function clientIp(request: Request) {
  const h = request.headers;
  return (h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim() || "anon";
}
