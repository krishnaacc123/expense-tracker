/*
  # Fix Category Budgets RLS Policies

  1. Changes
    - Drop existing policies
    - Create new, more specific policies for each operation
    - Ensure proper user_id checks

  2. Security
    - Enforce user_id checks for all operations
    - Maintain data isolation between users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own budgets" ON category_budgets;
DROP POLICY IF EXISTS "Users can view their own budgets" ON category_budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON category_budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON category_budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON category_budgets;

-- Create new policies with proper user_id checks
CREATE POLICY "Users can view their own budgets"
    ON category_budgets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own budgets"
    ON category_budgets FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        amount >= 0
    );

CREATE POLICY "Users can update their own budgets"
    ON category_budgets FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        amount >= 0
    );

CREATE POLICY "Users can delete their own budgets"
    ON category_budgets FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());