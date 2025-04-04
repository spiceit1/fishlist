/*
  # Disable RLS for Orders

  1. Changes
    - Disable RLS for orders table
    - Disable RLS for order_items table
    - Drop all existing policies since they won't be needed
*/

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Allow order creation for authenticated users and guests" ON orders;
DROP POLICY IF EXISTS "Allow order viewing for authenticated users and guests" ON orders;
DROP POLICY IF EXISTS "enable_guest_and_user_orders_insert" ON orders;
DROP POLICY IF EXISTS "enable_guest_and_user_orders_select" ON orders;
DROP POLICY IF EXISTS "enable_admin_orders_all" ON orders;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
DROP POLICY IF EXISTS "view_order_items" ON order_items;
DROP POLICY IF EXISTS "insert_order_items" ON order_items;
DROP POLICY IF EXISTS "enable_guest_and_user_order_items_insert" ON order_items;
DROP POLICY IF EXISTS "enable_guest_and_user_order_items_select" ON order_items;
DROP POLICY IF EXISTS "enable_admin_order_items_all" ON order_items;

-- Disable RLS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY; 