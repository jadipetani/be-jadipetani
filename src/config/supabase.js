const { createClient } = require('@supabase/supabase-js');
const { env } = require('./env');

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = { supabase };
