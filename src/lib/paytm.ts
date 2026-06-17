/**
 * Paytm Payment Gateway — Server-side Utilities
 * Production only. Merchant Key NEVER exposed to client.
 */

import PaytmChecksum from "paytmchecksum";

const BASE_URL = "https://securegw.paytm.in";

// ─── Checksum (official paytmchecksum package) ──────────

/**
 * Generate Paytm checksum signature using the official SDK.
 * Accepts either a JSON string (for API calls) or params object (for callbacks).
 */
export async function generateSignature(
  input: string | Record<string, string>,
  key: string
): Promise<string> {
  if (typeof input === "string") {
    return PaytmChecksum.generateSignature(input, key);
  }
  return PaytmChecksum.generateSignature(JSON.stringify(input), key);
}

/**
 * Verify Paytm checksum signature using the official SDK.
 * Returns false on any mismatch.
 */
export async function verifySignature(
  input: string | Record<string, string>,
  key: string,
  checksum: string
): Promise<boolean> {
  try {
    if (typeof input === "string") {
      return PaytmChecksum.verifySignature(input, key, checksum);
    }
    return PaytmChecksum.verifySignature(JSON.stringify(input), key, checksum);
  } catch {
    return false;
  }
}

// ─── API Types ──────────────────────────────────────────

export interface PaytmInitiateResponse {
  head: { signature: string };
  body: {
    resultInfo: {
      resultStatus: string;
      resultCode: string;
      resultMsg: string;
    };
    txnToken?: string;
  };
}

export interface PaytmStatusResponse {
  head: { signature: string };
  body: {
    resultInfo: {
      resultStatus: string; // TXN_SUCCESS | TXN_FAILURE | PENDING
      resultCode: string;
      resultMsg: string;
    };
    txnId?: string;
    orderId?: string;
    txnAmount?: string;
    bankTxnId?: string;
    gatewayName?: string;
    bankName?: string;
    paymentMode?: string;
    txnDate?: string;
  };
}

// ─── Initiate Transaction ───────────────────────────────

export async function initiateTransaction(params: {
  orderId: string;
  amount: string;
  custId: string;
  callbackUrl: string;
}): Promise<{ txnToken: string }> {
  const mid = process.env.PAYTM_MID!;
  const key = process.env.PAYTM_MERCHANT_KEY!;
console.log("MID =", mid);
console.log("KEY EXISTS =", !!key);
console.log("KEY LENGTH =", key?.length);
console.log("WEBSITE =", process.env.PAYTM_WEBSITE);

  const body = {
    requestType: "Payment",
    mid,
    websiteName: process.env.PAYTM_WEBSITE || "DEFAULT",
    orderId: params.orderId,
    callbackUrl: params.callbackUrl,
    txnAmount: {
      value: params.amount,
      currency: "INR",
    },
    userInfo: {
      custId: params.custId,
    },
  };

  const signature = await PaytmChecksum.generateSignature(
    JSON.stringify(body),
    key
  );

  const res = await fetch(
    `${BASE_URL}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${params.orderId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, head: { signature } }),
    }
  );

  const result: PaytmInitiateResponse = await res.json();

console.log(
  "[PAYTM RESPONSE]",
  JSON.stringify(result, null, 2)
);


  if (result.body?.resultInfo?.resultStatus !== "S") {
    console.error("[Paytm] Initiate failed:", result.body?.resultInfo);
    throw new Error(
      result.body?.resultInfo?.resultMsg || "Failed to initiate transaction"
    );
  }

  if (!result.body.txnToken) {
    throw new Error("No transaction token received from Paytm");
  }

  return { txnToken: result.body.txnToken };
}

// ─── Transaction Status Verification ────────────────────

export async function getTransactionStatus(
  orderId: string
): Promise<PaytmStatusResponse> {
  const mid = process.env.PAYTM_MID!;
  const key = process.env.PAYTM_MERCHANT_KEY!;

  const body = { mid, orderId };
  const signature = await PaytmChecksum.generateSignature(
    JSON.stringify(body),
    key
  );

  const res = await fetch(`${BASE_URL}/v3/order/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, head: { signature } }),
  });

  const result: PaytmStatusResponse = await res.json();

  console.log(
    "[PAYTM RESPONSE]",
    JSON.stringify(result, null, 2)
  );

  return result;
}
