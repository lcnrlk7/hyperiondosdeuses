-- SECURITY: webhook secrets must never be committed to source control.
-- Set or rotate webhook_secret through the authenticated admin acquirer flow.
-- This migration only disables records that were never provisioned.
UPDATE acquirers
SET is_active = false,
    is_selectable = false,
    updated_at = NOW()
WHERE code LIKE 'medusa_online_%'
  AND (webhook_secret IS NULL OR webhook_secret = '');
