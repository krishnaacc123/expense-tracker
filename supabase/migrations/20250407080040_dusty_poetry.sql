/*
  # Update Categories and Clean Data

  1. Changes
    - Remove all existing data in correct order
    - Add new set of categories

  2. Security
    - Maintain existing RLS policies
    - Handle all foreign key constraints properly
*/

-- Remove data in correct order to handle foreign key constraints
DELETE FROM activity_logs;
DELETE FROM activity_log;
DELETE FROM budgets;
DELETE FROM expenses;
DELETE FROM categories;

-- Insert new categories with Lucide icon names
INSERT INTO categories (name, icon, is_default) VALUES
    ('Rent/Mortgage', 'home', true),
    ('Groceries', 'shopping-cart', true),
    ('Utilities', 'plug', true),
    ('Transportation', 'car', true),
    ('Insurance', 'shield', true),
    ('Dining Out', 'utensils', true),
    ('Entertainment', 'tv', true),
    ('Shopping', 'shopping-bag', true),
    ('Subscriptions', 'repeat', true),
    ('Health', 'heart-pulse', true),
    ('Education', 'book-open', true),
    ('Travel', 'plane', true),
    ('Gifts', 'gift', true),
    ('Pets', 'paw-print', true),
    ('Personal Care', 'scissors', true),
    ('Kids', 'baby', true),
    ('Taxes', 'calculator', true),
    ('Miscellaneous', 'more-horizontal', true),
    ('Savings', 'piggy-bank', true),
    ('Investment', 'trending-up', true);