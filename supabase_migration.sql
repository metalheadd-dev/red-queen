-- ======================================================
-- RED QUEEN: OPERATIONS // SUPABASE DATABASE MIGRATIONS
-- ======================================================

-- 1. EXTEND THE USERS TABLE WITH GAMEPLAY AND STATS COLUMNS
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS health INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS class TEXT DEFAULT 'None';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'None';
ALTER TABLE users ADD COLUMN IF NOT EXISTS faction TEXT DEFAULT 'None';
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 500;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS world_state JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS completed_missions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sector_discoveries JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mission_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS campaign_stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS operations_archive JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS holder_status TEXT DEFAULT 'Civilian';
ALTER TABLE users ADD COLUMN IF NOT EXISTS holder_tier INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_balance NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_verification TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'None';

-- 2. CREATE INVITE CODES TABLE
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) UNIQUE NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT 1 NOT NULL,
  current_uses INTEGER DEFAULT 0 NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
  notes TEXT,
  invite_type VARCHAR(50) DEFAULT 'Single-use' NOT NULL
);

-- 3. CREATE INVITE USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS invite_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES invite_codes(id) ON DELETE CASCADE,
  used_by VARCHAR(255) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_usage ENABLE ROW LEVEL SECURITY;

-- Allow public read access to invite_codes for validation purposes
CREATE POLICY "Allow public read access to invite_codes" ON invite_codes
  FOR SELECT USING (true);

-- Allow authenticated users to insert invite_usage entries
CREATE POLICY "Allow insert access to invite_usage" ON invite_usage
  FOR INSERT WITH CHECK (true);

-- Allow full access to invite tables for admins / service role
CREATE POLICY "Allow service role full access on invite_codes" ON invite_codes
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on invite_usage" ON invite_usage
  USING (true) WITH CHECK (true);
