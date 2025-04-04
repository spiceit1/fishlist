-- Fix any category items that might have been incorrectly marked as sold_out
UPDATE fish_data
SET sold_out = FALSE
WHERE is_category = TRUE AND sold_out = TRUE;
