-- Create a table to track order sequence numbers
CREATE TABLE IF NOT EXISTS order_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  current_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the initial order sequence starting at 1000 (will be incremented to 1001 on first use)
INSERT INTO order_sequences (name, current_value)
VALUES ('order_number', 1000);

-- Create a function to get the next order sequence number
CREATE OR REPLACE FUNCTION get_next_order_sequence(sequence_name VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  next_value INTEGER;
BEGIN
  -- Update the sequence and return the new value
  UPDATE order_sequences 
  SET 
    current_value = current_value + 1,
    updated_at = NOW()
  WHERE name = sequence_name
  RETURNING current_value INTO next_value;
  
  RETURN next_value;
END;
$$ LANGUAGE plpgsql;
