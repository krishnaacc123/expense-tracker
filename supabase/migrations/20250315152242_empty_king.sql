/*
  # Add Category Budgets and Category Management

  1. New Tables
    - `category_budgets`
      - `id` (uuid, primary key)
      - `category_id` (uuid, references categories)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric)
      - `month` (date)
      - `created_at` (timestamp)

  2. Changes to Categories Table
    - Add `user_id` column to categories
    - Update RLS policies to allow users to manage their categories

  3. Security
    - Enable RLS on category_budgets table
    - Add policies for authenticated users to manage their budgets
*/

-- Add user_id to categories for custom categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create category budgets table
CREATE TABLE IF NOT EXISTS category_budgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES categories(id) NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    amount numeric NOT NULL CHECK (amount >= 0),
    month date NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(category_id, user_id, month)
);

-- Enable RLS
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

-- Update categories RLS policies
CREATE POLICY "Users can create their own categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR is_default = true
    );

CREATE POLICY "Users can update their own categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policies for category budgets
CREATE POLICY "Users can manage their own budgets"
    ON category_budgets FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own budgets"
    ON category_budgets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());