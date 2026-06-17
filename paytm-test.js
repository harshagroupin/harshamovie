require("dotenv").config({ path: ".env.local" });

console.log("MID =", process.env.PAYTM_MID);
console.log("KEY =", process.env.PAYTM_MERCHANT_KEY);
console.log("KEY LENGTH =", process.env.PAYTM_MERCHANT_KEY?.length);