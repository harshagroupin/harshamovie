/**
 * In-memory sliding window rate limiter.
 * Vercel-compatible — resets on cold start, acceptable for rate limiting.
 */

import { type NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private tokens: Map<string, RateLimitEntry> = new Map();
  private interval: number;
  private limit: number;

  constructor(options: { interval: number; limit: number }) {
    this.interval = options.interval;
    this.limit = options.limit;
  }

  check(identifier: string): { success: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.tokens.get(identifier);

    // Periodic cleanup to prevent memory leaks
    if (this.tokens.size > 1000) {
      this.cleanup(now);
    }

    if (!entry || now > entry.resetAt) {
      this.tokens.set(identifier, { count: 1, resetAt: now + this.interval });
      return { success: true, remaining: this.limit - 1 };
    }

    if (entry.count >= this.limit) {
      return { success: false, remaining: 0 };
    }

    entry.count++;
    return { success: true, remaining: this.limit - entry.count };
  }

  private cleanup(now: number): void {
    for (const [key, entry] of this.tokens) {
      if (now > entry.resetAt) {
        this.tokens.delete(key);
      }
    }
  }
}

/** 5 create-order requests per minute per IP */
export const paymentRateLimiter = new RateLimiter({
  interval: 60_000,
  limit: 5,
});

/** 15 verify requests per minute per IP */
export const verifyRateLimiter = new RateLimiter({
  interval: 60_000,
  limit: 15,
});

/** 30 callbacks per minute per IP (Paytm may retry) */
export const callbackRateLimiter = new RateLimiter({
  interval: 60_000,
  limit: 30,
});

/** Extract client IP from Vercel/proxy headers */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
