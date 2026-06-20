const PaytmChecksum = require("paytmchecksum");
require("dotenv").config({ path: ".env.local" });

const mid = process.env.PAYTM_MID?.replace(/^['"]|['"]$/g, "");
const key = process.env.PAYTM_MERCHANT_KEY?.replace(/^['"]|['"]$/g, "");

console.log("MID =", mid);
console.log("KEY EXISTS =", !!key);
console.log("KEY LENGTH =", key?.length);

async function testInitiate() {
  const orderId = "TEST_" + Date.now();
  const body = {
    requestType: "Payment",
    mid: mid,
    websiteName: process.env.PAYTM_WEBSITE || "DEFAULT",
    orderId: orderId,
    callbackUrl: "https://harshamovies.com/api/paytm/callback",
    txnAmount: {
      value: "1.00",
      currency: "INR",
    },
    userInfo: {
      custId: "CUST_TEST",
    },
  };

  try {
    const signature = await PaytmChecksum.generateSignature(JSON.stringify(body), key);
    console.log("Generated Signature =", signature);

    const url = `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, head: { signature } }),
    });

    const result = await res.json();
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error running test:", err);
  }
}

testInitiate();