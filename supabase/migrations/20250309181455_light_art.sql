/*
  # Add activity log table

  1. New Tables
    - `activity_log`
      - `id` (uuid, primary key)
      - `expense_id` (uuid, references expenses)
      - `action` (text, either 'add' or 'delete')
      - `timestamp` (timestamptz)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `activity_log` table
    - Add policies for authenticated users to:
      - Insert their own activity logs
      - View their own activity logs
*/

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id),
  action text NOT NULL CHECK (action IN ('add', 'delete')),
  timestamp timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to insert their own activity logs
CREATE POLICY "Users can insert their own activity logs"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to view their own activity logs
CREATE POLICY "Users can view their own activity logs"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_activity_log_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_id_on_activity_log_insert
  BEFORE INSERT ON activity_log
  FOR EACH ROW
  EXECUTE FUNCTION set_activity_log_user_id();

-- Trigger to automatically create activity log entry when expense is created
CREATE OR REPLACE FUNCTION log_expense_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (expense_id, action, user_id)
  VALUES (NEW.id, 'add', auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_expense_creation_trigger
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION log_expense_creation();