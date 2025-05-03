/*
  # Fix Room Types Schema and Permissions

  1. Changes
    - Add missing bathroom_facilities column
    - Add proper RLS policies
    - Enable RLS on table
    - Add proper indexes

  2. Security
    - Enable RLS
    - Add policies for property owners and superadmins
*/

-- Add missing bathroom_facilities column
ALTER TABLE room_types 
ADD COLUMN IF NOT EXISTS bathroom_facilities text[] DEFAULT '{}';

-- Enable RLS
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Property managers can manage their own room types" ON room_types;
DROP POLICY IF EXISTS "Superadmins can manage all room types" ON room_types;

-- Create policies
CREATE POLICY "Property managers can manage their own room types"
ON room_types
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.id = room_types.property_id 
    AND properties.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.id = room_types.property_id 
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Superadmins can manage all room types"
ON room_types
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM backoffice_users
    WHERE backoffice_users.user_id = auth.uid()
    AND backoffice_users.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM backoffice_users
    WHERE backoffice_users.user_id = auth.uid()
    AND backoffice_users.role = 'superadmin'
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS room_types_property_id_idx ON room_types(property_id);
CREATE INDEX IF NOT EXISTS room_types_name_idx ON room_types(name);