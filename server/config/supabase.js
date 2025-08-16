const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ✅ Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ✅ Optional debug logs
console.log('✅ Supabase client initialized.');
console.log('supabase.auth:', typeof supabase.auth); // should be "object"

// ✅ Test connection (optional, async)
(async () => {
  try {
    const { data, error } = await supabase
      .from('directors') // Replace with any table in your DB
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful.');
    }
  } catch (err) {
    console.error('❌ Supabase connection test error:', err.message);
  }
})();

// ✅ Export all configs together
module.exports = {
  supabase,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret',
  PORT: process.env.PORT || 8000,
};
