-- Add a disabled flag column to fish_data table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'fish_data'
        AND column_name = 'disabled'
    ) THEN
        ALTER TABLE fish_data
        ADD COLUMN disabled BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;
