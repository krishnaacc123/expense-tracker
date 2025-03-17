/*
  # Fix Category Budgets Policies

  1. Changes
    - Update RLS policies for category_budgets table to ensure proper access control
    - Add explicit policy for inserting budgets

  2. Security
    - Ensure users can only manage their own budgets
    - Add specific policy for budget deletion
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own budgets" ON category_budgets;
DROP POLICY IF EXISTS "Users can view their own budgets" ON category_budgets;

-- Create more specific policies
CREATE POLICY "Users can view their own budgets"
    ON category_budgets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own budgets"
    ON category_budgets FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own budgets"
    ON category_budgets FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own budgets"
    ON category_budgets FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());