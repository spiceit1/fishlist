// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Fix trigger function initialized");

Deno.serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, drop the existing trigger and function if they exist
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS handle_new_user();
      `
    });

    if (dropError) {
      console.error("Error dropping trigger:", dropError);
      return new Response(JSON.stringify({ error: dropError }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Create an improved version of the function that handles NULLs
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Check if raw_user_meta_data exists and is not null
          IF NEW.raw_user_meta_data IS NULL THEN
            -- If metadata is null, just insert the id with empty strings for names
            INSERT INTO public.user_profiles (id, first_name, last_name)
            VALUES (NEW.id, '', '')
            ON CONFLICT (id) DO NOTHING;
          ELSE
            -- Insert with metadata if available
            INSERT INTO public.user_profiles (id, first_name, last_name)
            VALUES (
              NEW.id, 
              COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
              COALESCE(NEW.raw_user_meta_data->>'last_name', '')
            )
            ON CONFLICT (id) DO NOTHING;
          END IF;
          
          RETURN NEW;
        EXCEPTION
          WHEN OTHERS THEN
            -- Log error but don't fail the user creation
            RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (createError) {
      console.error("Error creating function:", createError);
      return new Response(JSON.stringify({ error: createError }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Create the trigger on auth.users
    const { error: triggerError } = await supabase.rpc('execute_sql', {
      sql_statement: `
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION handle_new_user();
      `
    });

    if (triggerError) {
      console.error("Error creating trigger:", triggerError);
      return new Response(JSON.stringify({ error: triggerError }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Success response
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fix-trigger' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
