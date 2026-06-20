# Paytm Integration Audit Report

**Generated:** 2026-06-19  
**Project:** harsh-a-movie (harshamovies.com)  
**Scope:** All Paytm payment gateway integration code

---

## 1. Paytm URLs Found

| URL | File | Line(s) | Purpose |
|-----|------|---------|---------|
| `https://secure.paytmpayments.com` | `src/lib/paytm.ts` | 14 | Base URL constant for all Paytm API calls |
| `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid={mid}&orderId={orderId}` | `src/lib/paytm.ts` | 124 | Initiate Transaction API (constructed from BASE_URL) |
| `https://secure.paytmpayments.com/v3/order/status` | `src/lib/paytm.ts` | 168 | Transaction Status API (constructed from BASE_URL) |
| `https://secure.paytmpayments.com/merchantpgpui/checkoutjs/merchants/{mid}.js` | `src/app/booking/checkout/checkout-content.tsx` | 152 | Client-side Paytm Checkout JS SDK |
| `https://harshamovies.com/api/paytm/callback` | `src/app/api/paytm/create-order/route.ts` | 164, 286 | Callback URL passed to Paytm (constructed from `APP_URL` constant) |
| `/api/paytm/create-order` | `src/app/booking/checkout/checkout-content.tsx` | 112 | Internal API endpoint (client → server) |

---

## 2. Paytm Environment Variables Used

| Variable | File(s) | Usage |
|----------|---------|-------|
| `PAYTM_MERCHANT_KEY` | `src/lib/paytm.ts` (lines 10, 26, 43, 95, 160) | Used for checksum generation & verification. Also triggers dotenv fallback loading. |
| `PAYTM_MID` | `src/lib/paytm.ts` (lines 94, 159), `create-order/route.ts` (lines 205, 312) | Merchant ID passed to all Paytm API calls and returned to client for checkout JS. |
| `PAYTM_WEBSITE` | `src/lib/paytm.ts` (line 100) | Website name parameter for initiate transaction. Falls back to `"DEFAULT"` if not set. |

> **Note:** All three env vars have quote-stripping logic: `.replace(/^['"]|['"]$/g, "")`. This suggests they may have been stored with surrounding quotes at some point.

---

## 3. Paytm API Endpoints Used

### Server-Side API Calls (from `src/lib/paytm.ts`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST https://secure.paytmpayments.com/theia/api/v1/initiateTransaction` | POST | Initiate a new payment transaction; returns `txnToken` |
| `POST https://secure.paytmpayments.com/v3/order/status` | POST | Verify transaction status (server-side verification after callback) |

### Internal API Routes

| Route | Method | File | Purpose |
|-------|--------|------|---------|
| `/api/paytm/create-order` | POST | `src/app/api/paytm/create-order/route.ts` | Client calls this to create booking + initiate Paytm transaction |
| `/api/paytm/callback` | POST | `src/app/api/paytm/callback/route.ts` | Paytm posts form-encoded callback data here after payment |

### Client-Side SDK

| Resource | File | Purpose |
|----------|------|---------|
| `https://secure.paytmpayments.com/merchantpgpui/checkoutjs/merchants/{mid}.js` | `checkout-content.tsx` | Dynamically loaded Paytm Checkout JS SDK for payment overlay |

---

## 4. Checksum-Related Code Locations

| Function | File | Line(s) | Description |
|----------|------|---------|-------------|
| `generateSignature()` | `src/lib/paytm.ts` | 22–31 | Generates checksum via `PaytmChecksum.generateSignature()`. Accepts string or object input. |
| `verifySignature()` | `src/lib/paytm.ts` | 37–51 | Verifies checksum via `PaytmChecksum.verifySignature()`. Wraps in try/catch, returns `false` on error. |
| Direct `PaytmChecksum.generateSignature()` call | `src/lib/paytm.ts` | 119–122 | Used in `initiateTransaction()` — calls SDK directly instead of using the wrapper `generateSignature()` function. |
| Direct `PaytmChecksum.generateSignature()` call | `src/lib/paytm.ts` | 163–166 | Used in `getTransactionStatus()` — calls SDK directly instead of using the wrapper. |
| Checksum verification in callback | `src/app/api/paytm/callback/route.ts` | 36–47 | Extracts `CHECKSUMHASH` from form params, deletes it from verify params, calls `verifySignature()`. |
| `paytmchecksum` package | `package.json` | 37 | Version `^1.5.1` |

> **Inconsistency:** The codebase defines `generateSignature()` and `verifySignature()` wrappers, but `initiateTransaction()` and `getTransactionStatus()` bypass them by calling `PaytmChecksum.generateSignature()` directly.

---

## 5. Deprecated Paytm URLs

| Status | URL Pattern | Notes |
|--------|-------------|-------|
| ✅ **Current / Correct** | `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction` | This is the correct **production** Paytm endpoint. |
| ✅ **Current / Correct** | `https://secure.paytmpayments.com/v3/order/status` | This is the correct **production** order status endpoint. |
| ✅ **Current / Correct** | `https://secure.paytmpayments.com/merchantpgpui/checkoutjs/merchants/{mid}.js` | This is the correct **production** checkout JS URL. |

> **No deprecated URLs detected.** All URLs use the current `secure.paytmpayments.com` domain.
>
> The old/deprecated Paytm domain was `securegw.paytm.in` (production) and `securegw-stage.paytm.in` (staging). Neither is used in this codebase.
>
> ⚠️ However, there is **no staging/sandbox URL** configuration anywhere. The codebase always hits **production** Paytm servers regardless of environment.

---

## 6. Suspicious Implementation Issues

### 🔴 Critical

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 1 | **No staging/sandbox environment support** | `src/lib/paytm.ts:14` | `BASE_URL` is hardcoded to `https://secure.paytmpayments.com` (production). There is no conditional logic for development or staging environments. All testing hits production Paytm servers. |
| 2 | **Verbose debug logging in production** | `src/lib/paytm.ts:112-136` | Extensive `console.log` statements dump the full MID, key length, request body, request URL, response status, and **raw response body** to stdout. This is a **security risk** in production — it may log sensitive transaction data to server logs/monitoring systems. |
| 3 | **Merchant Key exposed via key length logging** | `src/lib/paytm.ts:114` | `console.log("[PAYTM DEBUG] KEY LENGTH:", key?.length)` reveals the key length. While not the key itself, this is unnecessary information leakage. |
| 4 | **`PAYTM_MID` returned to client** | `create-order/route.ts:205, 312` | The Merchant ID is sent to the client in the API response. While needed for the Checkout JS SDK, it should be validated that this is expected Paytm behavior (it is — MID is semi-public). |

### 🟡 Warning

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 5 | **Inconsistent checksum function usage** | `src/lib/paytm.ts:119, 163` | `initiateTransaction()` and `getTransactionStatus()` call `PaytmChecksum.generateSignature()` directly instead of using the local `generateSignature()` wrapper. The wrapper includes key-cleaning logic (`cleanKey`) that the direct calls skip. If keys contain quotes, the direct calls would fail silently or produce invalid checksums. |
| 6 | **Non-null assertions on env vars** | `src/lib/paytm.ts:94-95, 159-160` | `process.env.PAYTM_MID!` and `process.env.PAYTM_MERCHANT_KEY!` use TypeScript non-null assertions. If these env vars are missing, the code will proceed with `undefined` values, leading to cryptic Paytm API errors rather than a clear "missing configuration" error. |
| 7 | **Quote-stripping regex on all env vars** | Multiple locations | `.replace(/^['"]|['"]$/g, "")` is applied everywhere. This suggests the env vars were once stored with surrounding quotes. This is a code smell — env files should not include quotes around values in `.env` files parsed by `dotenv`. |
| 8 | **No timeout on Paytm API calls** | `src/lib/paytm.ts:127, 168` | `fetch()` calls to Paytm APIs have no timeout. If Paytm is slow or unresponsive, the server will hang indefinitely, blocking the request and potentially exhausting connection pools. |
| 9 | **Callback does not verify transaction amount** | `src/app/api/paytm/callback/route.ts` | The callback verifies checksum and checks transaction status, but does **not** verify that the `txnAmount` in the Paytm response matches the expected amount in the `payment_transactions` table. An attacker could potentially manipulate the amount. |
| 10 | **`res.clone().text()` for debug logging** | `src/lib/paytm.ts:133-135` | The response body is cloned and read as text purely for debug logging, then parsed again as JSON. This doubles memory usage for every API response and adds unnecessary latency. |

### 🟢 Informational

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| 11 | **`dotenv` loaded conditionally** | `src/lib/paytm.ts:9-12` | `dotenv.config()` is called only if `PAYTM_MERCHANT_KEY` is not set. This is a reasonable fallback for local development but adds a runtime dependency (`dotenv` v17.4.2) that Next.js does not normally need (Next.js loads `.env.local` automatically). |
| 12 | **Unused import in checkout** | `checkout-content.tsx:14` | `createBooking` is imported from `@/actions/bookings` but never used — the checkout flow uses the `/api/paytm/create-order` fetch endpoint instead. |
| 13 | **`paymentMode` destructured but unused** | `checkout-content.tsx:28` | `paymentMode` and `setPaymentMode` are destructured from the booking store but never used in the component. The payment mode is hardcoded to Paytm. |
| 14 | **Dynamic script injection without cleanup** | `checkout-content.tsx:147-200` | The Paytm Checkout JS script is injected into the DOM but only the previous script is removed. If the component unmounts mid-payment, the script and its global `window.Paytm` object persist. |
| 15 | **No CSP headers for Paytm script domain** | N/A | The checkout dynamically loads scripts from `secure.paytmpayments.com`. If Content Security Policy headers are configured, they must whitelist this domain — but no CSP configuration was found in the audited files. |

---

## Summary

| Category | Count |
|----------|-------|
| Paytm URLs | 6 (3 external, 3 internal) |
| Environment Variables | 3 (`PAYTM_MID`, `PAYTM_MERCHANT_KEY`, `PAYTM_WEBSITE`) |
| API Endpoints | 4 (2 Paytm external, 2 internal routes) |
| Checksum Locations | 6 |
| Deprecated URLs | 0 |
| Critical Issues | 4 |
| Warning Issues | 6 |
| Informational Issues | 5 |

### Top Priority Fixes
1. **Remove or gate debug logging** behind a `NODE_ENV === "development"` check
2. **Add staging URL support** via an environment variable (e.g., `PAYTM_ENV=staging`)
3. **Use the `generateSignature()` wrapper consistently** instead of direct SDK calls
4. **Add fetch timeouts** (e.g., `AbortController` with 30s timeout)
5. **Verify transaction amount** in the callback handler against stored expected amount
