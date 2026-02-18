
console.log('Script started');
try {
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();
    console.log('Modules loaded');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Missing');
} catch (e) {
    console.error('Error:', e);
}
