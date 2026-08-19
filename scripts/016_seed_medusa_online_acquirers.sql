-- Colunas para as adquirentes da liquidante Medusa Online (api.medusapayments.online)
ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS max_ticket NUMERIC DEFAULT 0;
ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE acquirers ADD COLUMN IF NOT EXISTS is_selectable BOOLEAN DEFAULT false;

-- As 3 adquirentes disponiveis, selecionaveis pelo usuario.
-- code e UNIQUE, por isso cada nominal usa um code distinto (medusa_online_N).
-- O roteamento identifica a liquidante pela api_url (medusapayments.online).

INSERT INTO acquirers (
  id, name, code, api_url, api_key,
  is_active, priority, route_type,
  fee_percentage, fixed_fee, fee_is_percentage,
  withdrawal_fee, withdrawal_fee_is_percentage,
  min_deposit, min_withdrawal, max_withdrawal, daily_limit,
  company_id, max_ticket, badge, is_selectable,
  created_at, updated_at
) VALUES
(gen_random_uuid(),'SANTSBANK IP - MARKETPLACE LTDA','medusa_online_1','https://api.medusapayments.online/api/v1','mk_live_f61dbce9784f563fbf5d8ff8bce1de423416e233d2bb17b4',true,10,'black',6,1.5,true,7,false,1,10,100000,1000000,'03582a2b-ecc3-4283-b9e3-b35ef60bbf11',1000,'Nova',true,NOW(),NOW()),
(gen_random_uuid(),'OWEM IP - CRED CONFIANCE','medusa_online_2','https://api.medusapayments.online/api/v1','mk_live_80da97b35585de38c70e3c86267b15fcbf38d5d0aacaa74b',true,11,'black',6,1.5,true,7,false,1,10,100000,1000000,'d7b34259-30de-4a4b-ad85-0b3053d5c5d3',500,'Exclusiva',true,NOW(),NOW()),
(gen_random_uuid(),'OWEM IP - MASTER ALIANCE','medusa_online_3','https://api.medusapayments.online/api/v1','mk_live_08c8c60c9584835dcb9b44767f8ce1eaea638c3962d1ade1',true,12,'black',6,1.5,true,7,false,1,10,100000,1000000,'b8da7440-852d-4a7e-9413-c37595f852fd',500,'Exclusiva',true,NOW(),NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  api_url = EXCLUDED.api_url,
  api_key = EXCLUDED.api_key,
  company_id = EXCLUDED.company_id,
  max_ticket = EXCLUDED.max_ticket,
  badge = EXCLUDED.badge,
  is_selectable = true,
  is_active = true,
  updated_at = NOW();
