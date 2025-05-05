/*
  # Create saved properties table

  1. New Tables
    - `saved_properties`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `property_id` (uuid, foreign key to properties)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `saved_properties` table
    - Add policies for authenticated users to manage their saved properties
*/

CREATE TABLE IF NOT EXISTS saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own saved properties
CREATE POLICY "Users can view their own saved properties"
  ON saved_properties
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to save properties
CREATE POLICY "Users can save properties"
  ON saved_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to unsave properties
CREATE POLICY "Users can unsave properties"
  ON saved_properties
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX saved_properties_user_id_idx ON saved_properties(user_id);
CREATE INDEX saved_properties_property_id_idx ON saved_properties(property_id);