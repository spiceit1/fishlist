/*
  # Standardize Admin Role Handling

  1. Changes
    - Update auth.users to use 'admin' role for admin users
    - Ensure consistent metadata for admin users
    - Create function to check admin role consistently
    - Update all policies to use the new admin check function
*/

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE
      WHEN auth.jwt() IS NULL THEN false
      WHEN auth.role() = 'admin' THEN true
      WHEN (auth.jwt() ->> 'role')::text = 'admin' THEN true
      WHEN (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin' THEN true
      ELSE false
    END;
$$;

-- Update admin users to have consistent role and metadata
DO $$ 
DECLARE
  admin_users CURSOR FOR 
    SELECT id 
    FROM auth.users 
    WHERE 
      raw_user_meta_data->>'role' = 'admin' OR 
      raw_app_meta_data->>'role' = 'admin' OR 
      is_super_admin = true;
BEGIN
  FOR admin_user IN admin_users LOOP
    -- Update user role
    UPDATE auth.users
    SET 
      role = 'admin',
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"admin"'
      ),
      raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"admin"'
      ),
      is_super_admin = true
    WHERE id = admin_user.id;

    -- Update identity data
    UPDATE auth.identities
    SET identity_data = jsonb_set(
      COALESCE(identity_data, '{}'::jsonb),
      '{role}',
      '"admin"'
    )
    WHERE user_id = admin_user.id;
  END LOOP;
END $$;

-- Update all policies to use the new auth.is_admin() function
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Enable admin access" ON fish_data;
  DROP POLICY IF EXISTS "Enable admin access" ON fish_images;
  DROP POLICY IF EXISTS "Enable admin access" ON price_markups;
  DROP POLICY IF EXISTS "Admins can manage price markups" ON price_markups;
  DROP POLICY IF EXISTS "Admins can manage shipping options" ON shipping_options;
  DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
  DROP POLICY IF EXISTS "Admins can update orders" ON orders;
  DROP POLICY IF EXISTS "Admin view all orders" ON orders;
  DROP POLICY IF EXISTS "Admin update orders" ON orders;
  DROP POLICY IF EXISTS "Admin view all order items" ON order_items;
  DROP POLICY IF EXISTS "Enable admin access to manual_prices" ON manual_prices;
  DROP POLICY IF EXISTS "admin_manage_ebay_credentials" ON ebay_credentials;

  -- Recreate policies using auth.is_admin()
  CREATE POLICY "Enable admin access"
    ON fish_data
    FOR ALL
    TO authenticated
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

  CREATE POLICY "Enable admin access"
    ON fish_images
    FOR ALL
    TO authenticated
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

  CREATE POLICY "Admins can manage price markups"
    ON price_markups
    FOR ALL
    TO authenticated
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

  CREATE POLICY "Admins can manage shipping options"
    ON shipping_options
    FOR ALL
    TO authenticated
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

  CREATE POLICY "Admins can manage orders"
    ON orders
    FOR ALL
    TO authenticated
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

  CREATE POLICY "Admins can manage order items"
    ON order_items
    FOR ALL
    TO authenticated
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

  CREATE POLICY "Enable admin access to manual_prices"
    ON manual_prices
    FOR ALL
    TO authenticated
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());

  CREATE POLICY "Enable admin access to ebay_credentials"
    ON ebay_credentials
    FOR ALL
    TO authenticated
    USING (auth.is_admin())
    WITH CHECK (auth.is_admin());
END $$; 