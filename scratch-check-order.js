const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const PaytmChecksum = require('paytmchecksum');

// Parse .env.local manually
let env = {};
try {
  const fileContent = fs.readFileSync('.env.local', 'utf8');
  fileContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      env[key] = val;
    }
  });
} catch (e) {
  console.error('Failed to read .env.local:', e.message);
}

async function getTransactionStatus(orderId) {
  const mid = env.PAYTM_MID;
  const key = env.PAYTM_MERCHANT_KEY;
  const BASE_URL = "https://secure.paytmpayments.com";

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

  return await res.json();
}

async function main() {
  const orderId = "ORDMQME1U1LED306C";
  console.log("Checking order:", orderId);

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: txn, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    if (error) {
      console.error("Supabase payment_transactions fetch error:", error.message);
    } else {
      console.log("Supabase Transaction Record:", txn);
      
      const { data: booking, error: bErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_id', txn.booking_id)
        .single();
      
      if (bErr) {
        console.error("Supabase booking fetch error:", bErr.message);
      } else {
        console.log("Supabase Booking Record:", booking);
      }
    }
  } else {
    console.error("Supabase credentials missing.");
  }

  try {
    const paytmResult = await getTransactionStatus(orderId);
    console.log("Paytm Status Response:", JSON.stringify(paytmResult, null, 2));
  } catch (err) {
    console.error("Paytm API call error:", err.message);
  }
}

main();
