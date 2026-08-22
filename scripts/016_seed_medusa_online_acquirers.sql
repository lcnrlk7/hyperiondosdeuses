-- Schema support for Medusa Online acquirers.
-- SECURITY: API keys are intentionally not stored in source control.
-- Provision or rotate api_key through the authenticated admin flow.
ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS max_ticket NUMERIC DEFAULT 0;
ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS is_selectable BOOLEAN DEFAULT false;

-- Existing records may be enabled only after a credential was provisioned securely.
UPDATE acquirers
SET is_active = false,
    is_selectable = false,
    updated_at = NOW()
WHERE code LIKE 'medusa_online_%'
  AND (api_key IS NULL OR api_key = '');
