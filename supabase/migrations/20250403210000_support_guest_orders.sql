/*
  # Support Guest Orders

  1. Changes
    - Make user_id nullable in orders table
    - Add guest_email field to orders table
    - Update RLS policies to allow guest order creation
    - Add new policy for guest order creation
*/

-- Drop existing policies that restrict order creation to authenticated users
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Modify orders table
ALTER TABLE orders 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_email text;

-- Create new policies that support both authenticated and guest orders
CREATE POLICY "Allow order creation for authenticated users and guests"
  ON orders
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (auth.uid() = user_id AND user_id IS NOT NULL) OR
    (user_id IS NULL AND guest_email IS NOT NULL)
  );

CREATE POLICY "Allow order viewing for authenticated users and guests"
  ON orders
  FOR SELECT
  TO authenticated, anon
  USING (
    (auth.uid() = user_id AND user_id IS NOT NULL) OR
    (user_id IS NULL AND guest_email IS NOT NULL)
  );

-- Keep admin policies unchanged
CREATE POLICY IF NOT EXISTS "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin'); 