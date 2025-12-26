-- Enable Realtime for notifications table
-- This ensures Realtime subscriptions work properly for real-time badge updates

-- Ensure replica identity is set to full for the notifications table
-- This is required for Supabase Realtime to work with INSERT, UPDATE, DELETE events
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add a comment to document this
COMMENT ON TABLE public.notifications IS 'Notifications table with Realtime enabled for instant badge updates';
