/**
 * Rate limiting minimale, in memoria, per le API pubbliche
 * (registrazione invitato, scansione check-in). È "best effort":
 * su Vercel ogni istanza serverless ha la propria memoria, quindi il
 * limite non è condiviso a livello globale. Per un evento con poche
 * decine/centinaia di invitati è comunque un freno efficace contro
 * tentativi automatizzati; per volumi maggiori o garanzie più forti,
 * sostituire con Upstash Redis (@upstash/ratelimit), pochi minuti di
 * lavoro con lo stesso pattern.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

export function clientKeyFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}
