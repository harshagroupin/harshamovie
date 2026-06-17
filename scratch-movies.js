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
    console.error('Supabase URL or Key not found');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('--- Fetching All Movies ---');
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*');

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  console.log(`Found ${movies.length} movies:`);
  movies.forEach(m => {
    console.log(`- Title: ${m.title}, Slug: ${m.slug}, Active: ${m.is_active}, Featured: ${m.is_featured}`);
  });
}

main();
