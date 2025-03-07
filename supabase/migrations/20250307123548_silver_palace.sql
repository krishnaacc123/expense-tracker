/*
  # Initial Schema Setup for Expense Tracker

  1. New Tables
    - categories
      - id (uuid, primary key)
      - name (text)
      - icon (text)
      - created_at (timestamp)
      - is_default (boolean)
    
    - expenses
      - id (uuid, primary key)
      - amount (numeric)
      - description (text)
      - date (date)
      - category_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
*/

-- Create categories table
CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    icon text NOT NULL,
    created_at timestamptz DEFAULT now(),
    is_default boolean DEFAULT false
);

-- Create expenses table
CREATE TABLE expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    amount numeric NOT NULL,
    description text,
    date date NOT NULL,
    category_id uuid REFERENCES categories(id),
    user_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Categories are viewable by all authenticated users"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

-- Policies for expenses
CREATE POLICY "Users can manage their own expenses"
    ON expenses FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (name, icon, is_default) VALUES
    ('Grocery', 'shopping-cart', true),
    ('Online Food', 'utensils', true),
    ('Offline Food', 'coffee', true),
    ('Utilities', 'plug', true),
    ('Gave to Someone', 'hand-coins', true),
    ('Transportation', 'car', true),
    ('Entertainment', 'tv', true),
    ('Healthcare', 'heart-pulse', true),
    ('Shopping', 'shopping-bag', true),
    ('Others', 'more-horizontal', true);