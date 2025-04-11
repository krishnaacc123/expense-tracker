/*
  # Fix Category Visibility

  1. Changes
    - Update RLS policies for categories table
    - Ensure users can only see their own custom categories and default categories

  2. Security
    - Users can only view their own custom categories and default categories
    - Users can only manage their own custom categories
    - Default categories remain visible to all users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "View all categories" ON categories;
DROP POLICY IF EXISTS "Create custom categories" ON categories;
DROP POLICY IF EXISTS "Update own categories" ON categories;
DROP POLICY IF EXISTS "Delete own categories" ON categories;

-- Create new policies with proper visibility rules
CREATE POLICY "View own and default categories"
    ON categories FOR SELECT
    TO authenticated
    USING (
        is_default = true OR 
        user_id = auth.uid()
    );

CREATE POLICY "Create custom categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND 
        NOT is_default
    );

CREATE POLICY "Update own categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id AND 
        NOT is_default
    )
    WITH CHECK (
        auth.uid() = user_id AND 
        NOT is_default
    );

CREATE POLICY "Delete own categories"
    ON categories FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id AND 
        NOT is_default
    );