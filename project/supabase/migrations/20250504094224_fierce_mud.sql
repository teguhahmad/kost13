/*
  # Update rooms table type constraint

  1. Changes
    - Remove existing type check constraint to allow any room type name
    - Add foreign key reference to room_types table for type validation
    - Update existing rooms to use default type if needed

  2. Security
    - Maintain existing RLS policies
*/

-- First remove the existing check constraint
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_type_check;

-- Add type column to reference room_types name
ALTER TABLE rooms 
  ALTER COLUMN type TYPE text;

-- Add foreign key constraint to room_types
ALTER TABLE rooms
  ADD CONSTRAINT rooms_type_fkey 
  FOREIGN KEY (type, property_id) 
  REFERENCES room_types(name, property_id)
  ON DELETE RESTRICT;

-- Update any existing rooms to use a default type if needed
UPDATE rooms 
SET type = 'Standard'
WHERE type NOT IN (
  SELECT name FROM room_types WHERE property_id = rooms.property_id
);