/*
  # Fix Activity Logs RLS Policies

  1. Changes
    - Drop existing RLS policies for activity_logs table
    - Create new, more specific policies for activity logs
    - Add trigger to automatically set user_id

  2. Security
    - Ensure proper user_id checks for all operations
    - Maintain data isolation between users
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can read their own activity logs" ON activity_logs;

-- Create new policies with proper user_id checks
CREATE POLICY "Users can read their own activity logs"
    ON activity_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create activity logs"
    ON activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );

-- Create a trigger to automatically set user_id
CREATE OR REPLACE FUNCTION set_activity_log_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_user_id_on_activity_log_insert ON activity_logs;

CREATE TRIGGER set_user_id_on_activity_log_insert
    BEFORE INSERT ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_activity_log_user_id();