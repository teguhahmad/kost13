/*
  # Create chat messages table

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to auth.users)
      - `receiver_id` (uuid, foreign key to auth.users)
      - `content` (text)
      - `read` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for authenticated users to manage their messages
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can mark received messages as read" ON chat_messages;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark received messages as read"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS chat_messages_sender_id_idx;
DROP INDEX IF EXISTS chat_messages_receiver_id_idx;
DROP INDEX IF EXISTS chat_messages_created_at_idx;

-- Create indexes for faster lookups
CREATE INDEX chat_messages_sender_id_idx ON chat_messages(sender_id);
CREATE INDEX chat_messages_receiver_id_idx ON chat_messages(receiver_id);
CREATE INDEX chat_messages_created_at_idx ON chat_messages(created_at);