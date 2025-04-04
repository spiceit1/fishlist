/*
  # Add JWT Claims Function

  1. Changes
    - Create function to add role to JWT claims
    - Enable JWT hook in config
    - Ensure role is properly propagated from metadata

  2. Security
    - Properly handle null cases
    - Use SECURITY DEFINER for elevated privileges
*/

-- Create the JWT claims function
CREATE OR REPLACE FUNCTION auth.jwt_claims(jwt json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role text;
  result json;
BEGIN
  -- First try to get role from user metadata
  SELECT 
    COALESCE(
      u.raw_user_metadata->>'role',  -- Try user_metadata first
      u.raw_app_metadata->>'role',   -- Then try app_metadata
      'authenticated'                 -- Default to authenticated
    ) INTO role
  FROM auth.users u
  WHERE u.id = (jwt->>'sub')::uuid;

  -- Start with the input claims
  result := jwt;

  -- Add the role to the claims
  result := result || json_build_object('role', role);

  RETURN result;
END;
$$; 