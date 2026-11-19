import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config/env.js';

async function testSupabase() {
  console.log('Testing Supabase connectivity...');
  console.log('Supabase URL:', config.supabaseUrl);
  
  const clientService = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);
  const { data: f1, error: e1 } = await clientService.from('facilities').select('*');
  console.log('Service role test:', e1 ? e1.message : `Success (${f1?.length} rows)`);

  const clientAnon = createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data: f2, error: e2 } = await clientAnon.from('facilities').select('*');
  console.log('Anon key test:', e2 ? e2.message : `Success (${f2?.length} rows)`);
}

testSupabase();
