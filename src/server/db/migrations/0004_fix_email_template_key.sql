-- Safety net: add CHECK constraint to prevent empty email template keys
-- Only needed if 0003 was applied without the CHECK constraint

-- Add CHECK constraint (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'email_templates_key_not_empty'
    AND conrelid = 'email_templates'::regclass
  ) THEN
    ALTER TABLE email_templates ADD CONSTRAINT email_templates_key_not_empty CHECK (key <> '');
  END IF;
END $$;
