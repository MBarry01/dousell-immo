CREATE INDEX IF NOT EXISTS idx_transactions_reminders 
ON "rental_transactions" ("status", "period_start", "reminder_sent");
