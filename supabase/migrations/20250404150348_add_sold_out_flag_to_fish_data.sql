-- Add a sold_out flag column to fish_data table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'fish_data'
        AND column_name = 'sold_out'
    ) THEN
        ALTER TABLE fish_data
        ADD COLUMN sold_out BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;

-- Update only non-category items with qtyoh = 0 to have sold_out = true
UPDATE fish_data
SET sold_out = TRUE
WHERE qtyoh = 0
  AND (isCategory IS NULL OR isCategory = FALSE);
