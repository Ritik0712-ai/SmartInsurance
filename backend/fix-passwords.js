const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPasswords() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const newHash = await bcrypt.hash('password123', 12);
  console.log('Updating passwords with hash:', newHash);

  // Update all users with password123
  const { data, error } = await supabase
    .from('User')
    .update({ password: newHash })
    .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Updated', data?.length || 'all', 'users successfully!');
  }
}

fixPasswords().catch(console.error);
