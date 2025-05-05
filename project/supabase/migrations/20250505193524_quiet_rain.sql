/*
  # Add saved properties table

  1. New Tables
    - `saved_properties`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `property_id` (uuid, references properties)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `saved_properties` table
    - Add policies for authenticated users to manage their saved properties
*/

-- Create saved properties table
CREATE TABLE IF NOT EXISTS saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  property_id uuid REFERENCES properties ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS saved_properties_user_id_idx ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS saved_properties_property_id_idx ON saved_properties(property_id);

-- Create unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX IF NOT EXISTS saved_properties_user_id_property_id_key ON saved_properties(user_id, property_id);

-- Enable RLS
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can save properties"
  ON saved_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave properties"
  ON saved_properties
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own saved properties"
  ON saved_properties
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());