/*
  # Add renter gender column to room types

  1. Changes
    - Add `renter_gender` column to `room_types` table with validation
    - Set default value to 'any' for existing records
    - Add check constraint to ensure valid values

  2. Validation
    - Ensures renter_gender can only be 'male', 'female', or 'any'
*/

ALTER TABLE room_types 
ADD COLUMN renter_gender text NOT NULL DEFAULT 'any';

-- Add check constraint to validate gender values
ALTER TABLE room_types
ADD CONSTRAINT room_types_renter_gender_check 
CHECK (renter_gender IN ('male', 'female', 'any'));

-- Update RLS policies to include new column
CREATE POLICY "Property managers can manage their own room types with renter_gender"
ON room_types
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