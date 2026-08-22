-- Updates non-secret metadata for Medusa Online acquirers.
-- SECURITY: API keys are intentionally omitted. Rotate them through the
-- authenticated admin flow and never commit them to this repository.
UPDATE acquirers SET
  name = 'SANTS SCD - LTDA (Nova | Ticket R$ 600)',
  api_url = 'https://api.medusapayments.online/api/v1',
  company_id = '03582a2b-ecc3-4283-b9e3-b35ef60bbf11',
  max_ticket = 600,
  badge = 'Nova',
  updated_at = NOW()
WHERE code = 'medusa_online_1';

UPDATE acquirers SET
  name = 'A55 IP - OMEGA SERVICOS (Ticket R$ 500)',
  api_url = 'https://api.medusapayments.online/api/v1',
  company_id = 'd7b34259-30de-4a4b-ad85-0b3053d5c5d3',
  max_ticket = 500,
  badge = NULL,
  updated_at = NOW()
WHERE code = 'medusa_online_2';

UPDATE acquirers SET
  name = 'OWEM IP - MASTER ALIANCE (Exclusiva | Ticket R$ 500)',
  api_url = 'https://api.medusapayments.online/api/v1',
  company_id = 'b8da7440-852d-4a7e-9413-c37595f852fd',
  max_ticket = 500,
  badge = 'Exclusiva',
  updated_at = NOW()
WHERE code = 'medusa_online_3';
