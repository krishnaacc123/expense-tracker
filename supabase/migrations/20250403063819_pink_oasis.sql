/*
  # Fix Category RLS Policies

  1. Changes
    - Drop existing RLS policies for categories table
    - Create new, more specific policies for categories
    - Allow users to manage their own custom categories

  2. Security
    - Ensure users can view all categories (both default and custom)
    - Allow users to create and update their own categories
    - Maintain data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Categories are viewable by all authenticated users" ON categories;
DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;

-- Create new policies
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.uid() = user_id AND NOT is_default) OR
        (is_default = true AND user_id IS NULL)
    );

CREATE POLICY "Users can update their own categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (
        (auth.uid() = user_id AND NOT is_default) OR
        (is_default = true AND user_id IS NULL)
    )
    WITH CHECK (
        (auth.uid() = user_id AND NOT is_default) OR
        (is_default = true AND user_id IS NULL)
    );

CREATE POLICY "Users can delete their own categories"
    ON categories FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id AND NOT is_default);