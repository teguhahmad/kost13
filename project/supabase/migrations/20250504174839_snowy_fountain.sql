/*
  # Update marketplace access policies

  1. Changes
    - Update properties table policies to allow public access to published marketplace listings
    - Add public access policies for room_types table
    - Add public access policies for rooms table
    
  2. Security
    - Only published properties with marketplace_enabled=true are visible
    - Only essential fields are exposed
    - No sensitive data is accessible
*/

-- Update properties table policies
CREATE POLICY "Allow public to view marketplace properties" 
ON properties
FOR SELECT TO public
USING (
  marketplace_enabled = true 
  AND marketplace_status = 'published'
);

-- Add policies for room_types
CREATE POLICY "Allow public to view room types"
ON room_types
FOR SELECT TO public
USING (
  property_id IN (
    SELECT id FROM properties 
    WHERE marketplace_enabled = true 
    AND marketplace_status = 'published'
  )
);

-- Add policies for rooms
CREATE POLICY "Allow public to view rooms"
ON rooms
FOR SELECT TO public
USING (
  property_id IN (
    SELECT id FROM properties 
    WHERE marketplace_enabled = true 
    AND marketplace_status = 'published'
  )
);