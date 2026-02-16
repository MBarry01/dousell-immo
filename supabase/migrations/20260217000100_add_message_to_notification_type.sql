-- Add 'message' and 'maintenance' to notification_type enum
-- This is needed for chat notifications and maintenance requests

-- We use ALTER TYPE ... ADD VALUE which is safe and doesn't require recreating the type
-- Note: Each ADD VALUE must be in its own statement

ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'message';
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'maintenance';
