import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Initialize dotenv
dotenv.config();

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the .env file (two directories up)
const envPath = resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function runFixTrigger() {
  // Create a Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Make sure .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Calling fix-trigger function...');
    const { data, error } = await supabase.functions.invoke('fix-trigger');
    
    if (error) {
      console.error('Error calling fix-trigger function:', error);
      return;
    }
    
    console.log('Result:', data);
    console.log('Trigger fixed successfully!');
  } catch (err) {
    console.error('Exception:', err);
  }
}

runFixTrigger(); 