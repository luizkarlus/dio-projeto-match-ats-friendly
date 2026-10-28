import type { NextFunction, Request, Response } from "express";

/** Limite simples em memória: suficiente para uso local, não para produção distribuída. */
export function createRateLimiter(limitPerMinute: number) {
  const hits = new Map<string, number[]>();
  const windowMs = 60_000;

  return function rateLimit(req: Request, res: Response, next: NextFunction): void {
    const key = req.ip ?? "local";
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= limitPerMinute) {
      const retryAfter = Math.ceil((windowMs - (now - (recent[0] ?? now))) / 1_000);
      res.setHeader("Retry-After", String(Math.max(1, retryAfter)));
      res.status(429).json({
        error: "rate_limited",
        message: `Muitas análises em sequência. Tente novamente em ${Math.max(1, retryAfter)}s.`,
      });
      return;
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
