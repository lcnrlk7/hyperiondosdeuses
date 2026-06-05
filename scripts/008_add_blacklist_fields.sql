-- Migration: 008_add_blacklist_fields.sql
-- Adiciona campos necessarios para sistema de blacklist

-- Adicionar campos na tabela profiles para rastreamento e bloqueio
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Criar indices para busca rapida
CREATE INDEX IF NOT EXISTS idx_profiles_last_ip ON profiles(last_ip);
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);

-- Atualizar tabela blacklist para ter campos de hits
ALTER TABLE blacklist ADD COLUMN IF NOT EXISTS hits INTEGER DEFAULT 0;
ALTER TABLE blacklist ADD COLUMN IF NOT EXISTS last_hit_at TIMESTAMPTZ;

-- Criar indice para busca por hits
CREATE INDEX IF NOT EXISTS idx_blacklist_hits ON blacklist(hits);
