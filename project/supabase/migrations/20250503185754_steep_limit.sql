/*
  # Add marketplace settings to properties table

  1. Changes
    - Add marketplace-related columns to properties table
    - Add marketplace status enum type
    - Add marketplace settings validation

  2. Security
    - Maintain existing RLS policies
*/

-- Add marketplace settings columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'marketplace_enabled') THEN
    ALTER TABLE properties ADD COLUMN marketplace_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'marketplace_status') THEN
    ALTER TABLE properties ADD COLUMN marketplace_status text DEFAULT 'draft' CHECK (marketplace_status IN ('draft', 'published'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'marketplace_price') THEN
    ALTER TABLE properties ADD COLUMN marketplace_price numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'description') THEN
    ALTER TABLE properties ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'photos') THEN
    ALTER TABLE properties ADD COLUMN photos text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'rules') THEN
    ALTER TABLE properties ADD COLUMN rules text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'amenities') THEN
    ALTER TABLE properties ADD COLUMN amenities text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'common_amenities') THEN
    ALTER TABLE properties ADD COLUMN common_amenities text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'parking_amenities') THEN
    ALTER TABLE properties ADD COLUMN parking_amenities text[] DEFAULT '{}';
  END IF;
END $$;