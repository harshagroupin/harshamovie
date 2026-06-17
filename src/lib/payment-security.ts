/**
 * Payment security utilities.
 * Idempotency, amount validation, replay protection, bot detection.
 */

import crypto from "crypto";

/**
 * Idempotency key = SHA256(phone + showtimeId + sorted seats).
 * Same user booking the same seats for the same showtime = same key.
 */
export function generateIdempotencyKey(
  phone: string,
  showtimeId: string,
  seats: string[]
): string {
  const sorted = [...seats].sort().join(",");
  return crypto
    .createHash("sha256")
    .update(`${phone}:${showtimeId}:${sorted}`)
    .digest("hex");
}

/**
 * Unique Paytm order ID.
 * Format: ORD + base36 timestamp + 6 hex random chars. Always unique, ≤25 chars.
 */
export function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD${ts}${rand}`;
}

/**
 * Server-side amount validation.
 * Rejects if client amount diverges from server-calculated amount beyond tolerance.
 */
export function validateAmount(
  clientAmount: number,
  serverAmount: number,
  tolerancePercent: number = 1
): boolean {
  if (clientAmount <= 0 || serverAmount <= 0) return false;
  const diff = Math.abs(clientAmount - serverAmount);
  const tolerance = (serverAmount * tolerancePercent) / 100;
  return diff <= Math.max(tolerance, 1); // ₹1 minimum tolerance for rounding
}

/**
 * Reject requests with timestamps outside the allowed window.
 */
export function isReplayAttack(
  timestampMs: number,
  windowMs: number = 15 * 60 * 1000
): boolean {
  return Math.abs(Date.now() - timestampMs) > windowMs;
}

/**
 * Basic bot detection via user-agent heuristics.
 */
export function isSuspiciousRequest(userAgent: string | null): boolean {
  if (!userAgent || userAgent.length < 10) return true;
  const bots = [
    /bot/i, /crawler/i, /spider/i, /curl/i, /wget/i,
    /python-requests/i, /scrapy/i, /httpclient/i,
  ];
  return bots.some((p) => p.test(userAgent));
}
