-- Payment Module Database Schema
-- Migration: 001_payment_tables.sql
-- Created: 2024-12-13

-- =============================================================================
-- USERS TABLE (device-based identification, no auth required)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  email TEXT,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'single', 'pack10', 'pro_monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  revenuecat_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_device_id ON users(device_id);
CREATE INDEX IF NOT EXISTS idx_users_revenuecat_customer_id ON users(revenuecat_customer_id);

-- =============================================================================
-- CREDIT WALLETS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  credits_reserved INTEGER NOT NULL DEFAULT 0 CHECK (credits_reserved >= 0),
  lifetime_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_credit_wallets_user_id ON credit_wallets(user_id);

-- =============================================================================
-- CREDIT TRANSACTIONS TABLE (Audit Log)
-- =============================================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'subscription_renewal', 'trial')),
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference_id ON credit_transactions(reference_id);

-- =============================================================================
-- USAGE LOGS TABLE (API Call Tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL UNIQUE,
  credits_used INTEGER NOT NULL DEFAULT 1,
  estimated_cost_usd DECIMAL(10, 4),
  model_used TEXT NOT NULL DEFAULT 'gemini-3-pro-preview',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'rolled_back')),
  project_type TEXT,
  country_code TEXT,
  response_tokens INTEGER,
  latency_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_request_id ON usage_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_status ON usage_logs(status);

-- =============================================================================
-- SYSTEM CONFIG TABLE (Kill switches and global settings)
-- =============================================================================
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default configuration
INSERT INTO system_config (key, value) VALUES
  ('ai_enabled', '{"enabled": true}'::jsonb),
  ('daily_limit_per_user', '{"limit": 50}'::jsonb),
  ('daily_global_budget_usd', '{"limit": 100}'::jsonb),
  ('maintenance_mode', '{"enabled": false, "message": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- DATABASE FUNCTIONS
-- =============================================================================

-- Function: Reserve credit atomically
CREATE OR REPLACE FUNCTION reserve_credit(
  p_user_id UUID,
  p_request_id UUID,
  p_project_type TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Check balance and reserve atomically
  UPDATE credit_wallets
  SET
    credits_balance = credits_balance - 1,
    credits_reserved = credits_reserved + 1,
    updated_at = now()
  WHERE user_id = p_user_id AND credits_balance > 0
  RETURNING credits_balance INTO v_balance;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Create usage log entry
  INSERT INTO usage_logs (user_id, request_id, project_type, country_code, status)
  VALUES (p_user_id, p_request_id, p_project_type, p_country_code, 'pending');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Finalize credit usage (after successful AI call)
CREATE OR REPLACE FUNCTION finalize_credit_usage(
  p_request_id UUID,
  p_latency_ms INTEGER DEFAULT NULL,
  p_response_tokens INTEGER DEFAULT NULL,
  p_estimated_cost_usd DECIMAL DEFAULT 0.10
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id and update usage log
  UPDATE usage_logs
  SET
    status = 'completed',
    latency_ms = p_latency_ms,
    response_tokens = p_response_tokens,
    estimated_cost_usd = p_estimated_cost_usd,
    completed_at = now()
  WHERE request_id = p_request_id AND status = 'pending'
  RETURNING user_id INTO v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already processed request_id: %', p_request_id;
  END IF;

  -- Remove from reserved
  UPDATE credit_wallets
  SET
    credits_reserved = credits_reserved - 1,
    updated_at = now()
  WHERE user_id = v_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (v_user_id, -1, 'usage', p_request_id::TEXT, 'AI estimate generation');
END;
$$ LANGUAGE plpgsql;

-- Function: Rollback credit reservation (after failed AI call)
CREATE OR REPLACE FUNCTION rollback_credit_reservation(
  p_request_id UUID,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Update usage log
  UPDATE usage_logs
  SET
    status = 'rolled_back',
    error_message = p_error_message,
    completed_at = now()
  WHERE request_id = p_request_id AND status = 'pending'
  RETURNING user_id INTO v_user_id;

  IF NOT FOUND THEN
    -- Already processed or invalid, just return
    RETURN;
  END IF;

  -- Return credit to balance
  UPDATE credit_wallets
  SET
    credits_balance = credits_balance + 1,
    credits_reserved = credits_reserved - 1,
    updated_at = now()
  WHERE user_id = v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Add credits to user wallet
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update wallet
  UPDATE credit_wallets
  SET
    credits_balance = credits_balance + p_amount,
    lifetime_credits = lifetime_credits + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits_balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, transaction_type, reference_id, description)
  VALUES (p_user_id, p_amount, p_transaction_type, p_reference_id, p_description);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user daily usage count
CREATE OR REPLACE FUNCTION get_user_daily_usage(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM usage_logs
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND created_at >= CURRENT_DATE;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- system_config is read-only for anonymous users
CREATE POLICY "system_config_read_policy" ON system_config
  FOR SELECT USING (true);

-- Note: Other tables are accessed only via Edge Functions with service_role key
-- which bypasses RLS. This is intentional for security.

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_wallets_updated_at
  BEFORE UPDATE ON credit_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
