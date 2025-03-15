/*
  # Add activity log table and soft delete to expenses

  1. New Tables
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `action` (text) - The type of action (create, delete)
      - `entity_type` (text) - The type of entity (expense)
      - `entity_id` (uuid) - Reference to the entity
      - `created_at` (timestamp)
      - `details` (jsonb) - Additional action details

  2. Changes
    - Add `is_deleted` column to expenses table
    - Add `deleted_at` column to expenses table

  3. Security
    - Enable RLS on activity_logs table
    - Add policies for authenticated users to read their own logs
*/

-- Add soft delete columns to expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read their own activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);