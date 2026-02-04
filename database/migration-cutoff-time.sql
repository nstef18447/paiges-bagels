-- Add cutoff_time column to time_slots table
-- This stores the datetime after which orders can no longer be placed for this slot

ALTER TABLE time_slots
ADD COLUMN cutoff_time TIMESTAMP WITH TIME ZONE;

-- Example: To set a cutoff time of 8 PM the day before:
-- UPDATE time_slots SET cutoff_time = (date - interval '1 day') + time '20:00:00';
