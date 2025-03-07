/*
  # Add RLS policies for expenses table

  1. Security Changes
    - Add RLS policy for authenticated users to insert their own expenses
    - Ensure user_id is automatically set to the authenticated user's ID
*/

-- Enable RLS if not already enabled
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting expenses
CREATE POLICY "Users can insert their own expenses"
ON expenses
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Add a trigger to automatically set user_id to the authenticated user's ID
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_user_id_on_insert
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();