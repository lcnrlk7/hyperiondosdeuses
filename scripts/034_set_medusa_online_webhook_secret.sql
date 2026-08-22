-- Salva o secret do webhook da liquidante Medusa Online nas 3 nominais.
-- O secret e o mesmo cadastrado em Configuracoes -> API e Integracoes -> Webhook
-- no painel da Medusa, e e usado para validar a assinatura HMAC SHA-256
-- dos eventos recebidos em /api/webhooks/medusa-online.

UPDATE acquirers
SET webhook_secret = 'rikpAj-1hypce-goxsak',
    updated_at = NOW()
WHERE code IN ('medusa_online_1', 'medusa_online_2', 'medusa_online_3');
