-- -- ============================================
-- -- 1. EXTENSIONS
-- -- ============================================
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -- ============================================
-- -- 2. PROJECTS TABLE
-- -- ============================================
-- CREATE TABLE projects (
--     id UUID PRIMARY KEY, -- Generated on client for offline support
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     name VARCHAR(255) NOT NULL,
--     location VARCHAR(255),
--     client_name VARCHAR(255),
--     contract_sum DECIMAL(15,2) DEFAULT 0,
--     status VARCHAR(50) DEFAULT 'active', -- active, completed, archived
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage own projects" ON projects 
--     FOR ALL USING (auth.uid() = user_id);

-- -- ============================================
-- -- 3. BILL ITEMS (BOQ)
-- -- ============================================
-- CREATE TABLE bill_items (
--     id UUID PRIMARY KEY,
--     project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
--     item_code VARCHAR(50), -- e.g., "A1"
--     description TEXT NOT NULL,
--     unit VARCHAR(10) NOT NULL, -- m3, m2, m, nr
--     rate DECIMAL(15,2) DEFAULT 0,
--     quantity DECIMAL(15,4) DEFAULT 0,
--     amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * rate) STORED,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     synced_at TIMESTAMP WITH TIME ZONE
-- );

-- ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage own bill items" ON bill_items 
--     FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- -- ============================================
-- -- 4. MEASUREMENTS (Digital Takeoff)
-- -- ============================================
-- CREATE TABLE measurements (
--     id UUID PRIMARY KEY,
--     bill_item_id UUID REFERENCES bill_items(id) ON DELETE CASCADE,
--     project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
--     label VARCHAR(255),
--     value DECIMAL(15,4) NOT NULL,
--     unit VARCHAR(10) NOT NULL,
--     points JSONB, -- Coordinates for the PDF drawing overlay
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     synced_at TIMESTAMP WITH TIME ZONE
-- );

-- ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage own measurements" ON measurements 
--     FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- -- ============================================
-- -- 5. SYNC QUEUE (Backend Side)
-- -- ============================================
-- -- This acts as a log to ensure data integrity during reconciliation
-- CREATE TABLE sync_history (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     user_id UUID NOT NULL REFERENCES auth.users(id),
--     table_name VARCHAR(100),
--     record_id UUID,
--     status VARCHAR(20) DEFAULT 'success',
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own sync history" ON sync_history 
--     FOR SELECT USING (auth.uid() = user_id);

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'bill_items', 'measurements', 'sync_history');

-- Check if RLS is actually enabled (Should be 'true' for all)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'bill_items', 'measurements');

-- Check column types for 'projects'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects';