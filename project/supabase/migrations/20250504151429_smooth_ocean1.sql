-- Allow public read access to published marketplace properties
CREATE POLICY "Allow public to view properties" 
ON properties FOR SELECT 
TO public 
USING (
  marketplace_enabled = true 
  AND marketplace_status = 'published'
);

-- Allow public read access to room types
CREATE POLICY "Allow public to view room types" 
ON room_types FOR SELECT 
TO public 
USING (
  property_id IN (
    SELECT id FROM properties 
    WHERE marketplace_enabled = true 
    AND marketplace_status = 'published'
  )
);
