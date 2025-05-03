/*
  # Add room settings and facilities

  1. Changes
    - Add pricing fields to rooms table
    - Add facilities fields to rooms table
    - Add room type settings
    - Add bathroom settings

  2. New Fields
    - daily_price: For daily rental pricing
    - weekly_price: For weekly rental pricing
    - monthly_price: For monthly rental pricing (default)
    - yearly_price: For yearly rental pricing
    - enable_daily_price: Toggle for daily pricing
    - enable_weekly_price: Toggle for weekly pricing
    - enable_yearly_price: Toggle for yearly pricing
    - room_facilities: Array of room facilities
    - bathroom_facilities: Array of bathroom facilities
    - photos: Array of photo URLs
    - max_occupancy: Maximum number of occupants
*/

-- Add new pricing columns
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS daily_price numeric DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS weekly_price numeric DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS yearly_price numeric DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS enable_daily_price boolean DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS enable_weekly_price boolean DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS enable_yearly_price boolean DEFAULT false;

-- Add facilities columns
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_facilities text[] DEFAULT '{}';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS bathroom_facilities text[] DEFAULT '{}';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_occupancy integer DEFAULT 1;

-- Add check constraints
ALTER TABLE rooms ADD CONSTRAINT rooms_max_occupancy_check 
  CHECK (max_occupancy BETWEEN 1 AND 5);

-- Add check constraint for photo URLs
ALTER TABLE rooms ADD CONSTRAINT rooms_photos_check 
  CHECK (array_length(photos, 1) <= 10);

-- Create type for room facilities
DO $$ BEGIN
  CREATE TYPE room_facility AS ENUM (
    'ac', 'pillow', 'mirror', 'cleaning_service', 'private_kitchen', 'dispenser',
    'bolster', 'window', 'bed', 'toilet_mat', 'fan', 'weekly_hygiene',
    'refrigerator', 'chair', 'wardrobe', 'table', 'dressing_table',
    'dining_table', 'sofa', 'tv', 'cable_tv', 'no_bed', 'ventilation',
    'sink', 'water_heater', 'microwave'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create type for bathroom facilities
DO $$ BEGIN
  CREATE TYPE bathroom_facility AS ENUM (
    'hot_water', 'bathtub', 'bucket', 'inside_bathroom', 'outside_bathroom',
    'sitting_toilet', 'squat_toilet', 'shower', 'sink'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add validation functions
CREATE OR REPLACE FUNCTION validate_room_facilities(facilities text[])
RETURNS boolean AS $$
BEGIN
  RETURN facilities IS NULL OR array_length(facilities, 1) IS NULL OR
    NOT EXISTS (
      SELECT unnest(facilities) AS facility
      WHERE facility NOT IN (
        'ac', 'pillow', 'mirror', 'cleaning_service', 'private_kitchen', 'dispenser',
        'bolster', 'window', 'bed', 'toilet_mat', 'fan', 'weekly_hygiene',
        'refrigerator', 'chair', 'wardrobe', 'table', 'dressing_table',
        'dining_table', 'sofa', 'tv', 'cable_tv', 'no_bed', 'ventilation',
        'sink', 'water_heater', 'microwave'
      )
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_bathroom_facilities(facilities text[])
RETURNS boolean AS $$
BEGIN
  RETURN facilities IS NULL OR array_length(facilities, 1) IS NULL OR
    NOT EXISTS (
      SELECT unnest(facilities) AS facility
      WHERE facility NOT IN (
        'hot_water', 'bathtub', 'bucket', 'inside_bathroom', 'outside_bathroom',
        'sitting_toilet', 'squat_toilet', 'shower', 'sink'
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Add check constraints for facilities
ALTER TABLE rooms ADD CONSTRAINT rooms_room_facilities_check
  CHECK (validate_room_facilities(room_facilities));

ALTER TABLE rooms ADD CONSTRAINT rooms_bathroom_facilities_check
  CHECK (validate_bathroom_facilities(bathroom_facilities));