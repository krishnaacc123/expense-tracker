/*
  # Fix Category Management Policies

  1. Changes
    - Drop existing policies
    - Create new policies for proper category management
    - Fix user_id handling in policies

  2. Security
    - Allow viewing all categories
    - Allow users to manage their own non-default categories
    - Prevent modification of default categories
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- Create new policies
CREATE POLICY "View all categories"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

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
    );

CREATE POLICY "Delete own categories"
    ON categories FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id AND 
        NOT is_default
    );