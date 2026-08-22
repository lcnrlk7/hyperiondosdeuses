-- Atualiza as 3 nominais da liquidante Medusa Online com as chaves/empresas vigentes.
-- Validado em 22/08/2026: as 3 chaves respondem 200 em GET /api/v1/api/saldo.

UPDATE acquirers SET
  name = 'SANTS SCD - LTDA (Nova | Ticket R$ 600)',
  api_url = 'https://api.medusapayments.online/api/v1',
  api_key = 'mk_live_10d32edf6352afcee4809ea860bf1fc35f258b4731437e23',
  company_id = '03582a2b-ecc3-4283-b9e3-b35ef60bbf11',
  max_ticket = 600,
  badge = 'Nova',
  is_selectable = true,
  is_active = true,
  updated_at = NOW()
WHERE code = 'medusa_online_1';

UPDATE acquirers SET
  name = 'A55 IP - OMEGA SERVICOS (Ticket R$ 500)',
  api_url = 'https://api.medusapayments.online/api/v1',
  api_key = 'mk_live_dc3f9865215c63c80d1b6bc7d8d85c577bf9ff34cf542a35',
  company_id = 'd7b34259-30de-4a4b-ad85-0b3053d5c5d3',
  max_ticket = 500,
  badge = NULL,
  is_selectable = true,
  is_active = true,
  updated_at = NOW()
WHERE code = 'medusa_online_2';

UPDATE acquirers SET
  name = 'OWEM IP - MASTER ALIANCE (Exclusiva | Ticket R$ 500)',
  api_url = 'https://api.medusapayments.online/api/v1',
  api_key = 'mk_live_46817a479443a2af2c65125eb6580970aaf16d7f7104b1b2',
  company_id = 'b8da7440-852d-4a7e-9413-c37595f852fd',
  max_ticket = 500,
  badge = 'Exclusiva',
  is_selectable = true,
  is_active = true,
  updated_at = NOW()
WHERE code = 'medusa_online_3';
