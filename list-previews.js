// list-previews.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmifwnqpgmlitqtcogrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaWZ3bnFwZ21saXRxdGNvZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzA0NDksImV4cCI6MjA4MzM0NjQ0OX0._Fho6oh-fr6RkvLJ3aPXK7jdpesTd9XZORZdJ-Bmqms';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listPreviews() {
  console.log('📋 Listing all previews in database...\n');

  const { data, error } = await supabase
    .from('previews')
    .select('id, title, generation_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No previews found');
    return;
  }

  console.log(`Found ${data.length} preview(s):\n`);
  data.forEach((p, i) => {
    console.log(`${i + 1}. ID: ${p.id}`);
    console.log(`   Title: ${p.title}`);
    console.log(`   Type: ${p.generation_type || 'N/A'}`);
    console.log(`   Created: ${new Date(p.created_at).toLocaleString()}`);
    console.log('');
  });
}

listPreviews().catch(console.error);
