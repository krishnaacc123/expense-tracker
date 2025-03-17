/*
  # Simplify Category Budgets

  1. Changes
    - Drop existing category_budgets table
    - Create new simplified budgets table without monthly tracking
    - Update RLS policies for the new table

  2. Security
    - Enable RLS on budgets table
    - Add policies for authenticated users to manage their budgets
*/

-- Drop the existing table
DROP TABLE IF EXISTS category_budgets;

-- Create new simplified budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES categories(id) NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    amount numeric NOT NULL CHECK (amount >= 0),
    created_at timestamptz DEFAULT now(),
    UNIQUE(category_id, user_id)
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own budgets"
    ON budgets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own budgets"
    ON budgets FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        amount >= 0
    );

CREATE POLICY "Users can update their own budgets"
    ON budgets FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        amount >= 0
    );

CREATE POLICY "Users can delete their own budgets"
    ON budgets FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());