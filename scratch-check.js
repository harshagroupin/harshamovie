const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

async function main() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key not found in .env.local or process.env');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('--- Fetching Latest Booking ---');
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (bErr) {
    console.error('Error fetching latest booking:', bErr);
    return;
  }

  console.log('Latest Booking Record:', {
    booking_id: booking.booking_id,
    customer_name: booking.customer_name,
    phone: booking.phone,
    selected_seats: booking.selected_seats,
    final_amount: booking.final_amount,
    payment_mode: booking.payment_mode,
    booking_status: booking.booking_status,
    payment_status: booking.payment_status,
    paytm_order_id: booking.paytm_order_id,
    created_at: booking.created_at
  });

  if (booking.paytm_order_id) {
    console.log('\n--- Checking Transactions for Paytm Order ---');
    const { data: txns, error: tErr } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', booking.paytm_order_id);

    if (tErr) {
      console.error('Error fetching transactions:', tErr);
    } else {
      console.log('Transactions:', txns);
    }
  }

  console.log('\n--- Checking Movies Table ---');
  const { data: movies, error: mErr } = await supabase
    .from('movies')
    .select('id, title, slug, is_active, is_featured');
  
  if (mErr) {
    console.error('Error fetching movies:', mErr);
  } else {
    console.log(`Found ${movies.length} movies:`);
    movies.forEach(m => {
      console.log(`- ID: ${m.id}, Title: ${m.title}, Slug: ${m.slug}, Active: ${m.is_active}, Featured: ${m.is_featured}`);
    });
  }
}

main();
