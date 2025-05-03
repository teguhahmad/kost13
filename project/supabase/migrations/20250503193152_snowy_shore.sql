/*
  # Add amenity photos to properties table

  1. Changes
    - Add columns for common and parking amenity photos
    - Set default empty array values
*/

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS common_amenities_photos text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS parking_amenities_photos text[] DEFAULT '{}';