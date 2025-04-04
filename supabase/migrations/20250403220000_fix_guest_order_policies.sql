/*
  # Fix Guest Order Policies

  1. Changes
    - Drop existing order policies
    - Create new policies that properly handle both authenticated and anonymous users
    - Update order_items policies to match
*/

-- Drop existing order policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Allow order creation for authenticated users and guests" ON orders;
DROP POLICY IF EXISTS "Allow order viewing for authenticated users and guests" ON orders;

-- Create new order policies
CREATE POLICY "enable_guest_and_user_orders_insert"
ON orders
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NULL AND guest_email IS NOT NULL) OR -- Guest orders
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) -- Authenticated user orders
);

CREATE POLICY "enable_guest_and_user_orders_select"
ON orders
FOR SELECT
TO public
USING (
  (auth.uid() IS NULL AND guest_email IS NOT NULL) OR -- Guest orders
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) -- Authenticated user orders
);

-- Keep admin policies
CREATE POLICY "enable_admin_orders_all"
ON orders
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Drop existing order items policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
DROP POLICY IF EXISTS "view_order_items" ON order_items;
DROP POLICY IF EXISTS "insert_order_items" ON order_items;

-- Create new order items policies
CREATE POLICY "enable_guest_and_user_order_items_insert"
ON order_items
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (
      (auth.uid() IS NULL AND orders.guest_email IS NOT NULL) OR -- Guest orders
      (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()) -- Authenticated user orders
    )
  )
);

CREATE POLICY "enable_guest_and_user_order_items_select"
ON order_items
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (
      (auth.uid() IS NULL AND orders.guest_email IS NOT NULL) OR -- Guest orders
      (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()) -- Authenticated user orders
    )
  )
);

-- Keep admin policies for order items
CREATE POLICY "enable_admin_order_items_all"
ON order_items
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin'); 