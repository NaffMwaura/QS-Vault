-- -- ======================================================
-- -- QS VAULT: TOTAL INFRASTRUCTURE ALIGNMENT (v5.1)
-- -- Purges old schema and aligns exactly with database.ts
-- -- ======================================================

-- -- 0. CLEAN SLATE
-- DROP TABLE IF EXISTS public.variations CASCADE;
-- DROP TABLE IF EXISTS public.permits CASCADE;
-- DROP TABLE IF EXISTS public.compliance_checks CASCADE;
-- DROP TABLE IF EXISTS public.chat_messages CASCADE;
-- DROP TABLE IF EXISTS public.rfis CASCADE;
-- DROP TABLE IF EXISTS public.material_logistics CASCADE;
-- DROP TABLE IF EXISTS public.timeclock CASCADE;
-- DROP TABLE IF EXISTS public.gantt_tasks CASCADE;
-- DROP TABLE IF EXISTS public.issues CASCADE;
-- DROP TABLE IF EXISTS public.site_logs CASCADE;
-- DROP TABLE IF EXISTS public.site_diary CASCADE;
-- DROP TABLE IF EXISTS public.measurements CASCADE;
-- DROP TABLE IF EXISTS public.bill_items CASCADE;
-- DROP TABLE IF EXISTS public.projects CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- -- 1. PROFILES (Identity Node)
-- CREATE TABLE public.profiles (
--     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--     username TEXT UNIQUE NOT NULL,
--     full_name TEXT,
--     avatar_url TEXT,
--     role TEXT DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin', 'super-admin')),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 2. PROJECTS (Vault Registry)
-- CREATE TABLE public.projects (
--     id UUID PRIMARY KEY, 
--     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--     name TEXT NOT NULL,
--     location TEXT,
--     client_name TEXT,
--     contract_sum DECIMAL(15,2) DEFAULT 0,
--     status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
--     lat DECIMAL(9,6),
--     lng DECIMAL(9,6),
--     geofence_radius INTEGER DEFAULT 100,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 3. BILL ITEMS (BoQ)
-- CREATE TABLE public.bill_items (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     item_code TEXT,
--     description TEXT NOT NULL,
--     unit TEXT,
--     rate DECIMAL(15,2) DEFAULT 0,
--     quantity DECIMAL(15,4) DEFAULT 0,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 4. MEASUREMENTS (Takeoff Engine)
-- -- NOTE: We use double quotes for "sectionCode" to match the CamelCase in database.ts
-- -- Added CHECK constraint to mirror the TypeScript Union Type for presentation-grade integrity.
-- CREATE TABLE public.measurements (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     bill_item_id UUID REFERENCES public.bill_items(id) ON DELETE SET NULL,
--     label TEXT,
--     type TEXT CHECK (type IN ('length', 'area', 'count', 'markup')),
--     value DECIMAL(15,4) NOT NULL,
--     unit TEXT,
--     "sectionCode" TEXT, 
--     points JSONB,
--     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 5. SITE DIARY (Daily Record)
-- -- Added CHECK constraint for weather to match the TypeScript interface.
-- CREATE TABLE public.site_diary (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     date DATE NOT NULL,
--     weather TEXT CHECK (weather IN ('sunny', 'rainy', 'overcast', 'stormy')),
--     headcount INTEGER DEFAULT 0,
--     progress_summary TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 6. SITE LOGS (Individual Events)
-- CREATE TABLE public.site_logs (
--     id UUID PRIMARY KEY,
--     diary_id UUID REFERENCES public.site_diary(id) ON DELETE CASCADE,
--     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     event TEXT NOT NULL,
--     category TEXT CHECK (category IN ('delivery', 'inspection', 'delay', 'milestone'))
-- );

-- -- 7. ISSUES (Punch List)
-- CREATE TABLE public.issues (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     title TEXT NOT NULL,
--     status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
--     assigned_subcontractor TEXT,
--     description TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 8. GANTT TASKS (Scheduling)
-- CREATE TABLE public.gantt_tasks (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     bill_item_id UUID REFERENCES public.bill_items(id) ON DELETE SET NULL,
--     title TEXT NOT NULL,
--     start_date DATE,
--     end_date DATE,
--     completion_percentage INTEGER DEFAULT 0
-- );

-- -- 9. TIMECLOCK (GPS Tracking)
-- CREATE TABLE public.timeclock (
--     id UUID PRIMARY KEY,
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     clock_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     clock_out TIMESTAMP WITH TIME ZONE,
--     lat_in DECIMAL(9,6),
--     lng_in DECIMAL(9,6),
--     is_verified_geofence BOOLEAN DEFAULT false
-- );

-- -- 10. MATERIAL LOGISTICS
-- CREATE TABLE public.material_logistics (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     bill_item_id UUID REFERENCES public.bill_items(id) ON DELETE SET NULL,
--     item_name TEXT NOT NULL,
--     qty_received DECIMAL(15,4),
--     delivery_note_ref TEXT,
--     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 11. RFIs (Communication)
-- CREATE TABLE public.rfis (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     subject TEXT NOT NULL,
--     to_professionals TEXT[], 
--     content TEXT,
--     status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'responded')),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 12. CHAT MESSAGES
-- CREATE TABLE public.chat_messages (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--     text TEXT NOT NULL,
--     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 13. COMPLIANCE CHECKS (Safety Audits)
-- CREATE TABLE public.compliance_checks (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     category TEXT,
--     title TEXT NOT NULL,
--     is_compliant BOOLEAN DEFAULT true,
--     notes TEXT,
--     inspector_id UUID REFERENCES auth.users(id),
--     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- 14. PERMITS
-- CREATE TABLE public.permits (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     title TEXT NOT NULL,
--     expiry_date DATE,
--     status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending'))
-- );

-- -- 15. VARIATIONS (The Bridge)
-- CREATE TABLE public.variations (
--     id UUID PRIMARY KEY,
--     project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
--     description TEXT NOT NULL,
--     qs_pricing_status TEXT DEFAULT 'unpriced' CHECK (qs_pricing_status IN ('unpriced', 'pending', 'approved')),
--     estimated_cost DECIMAL(15,2) DEFAULT 0,
--     approved_sum DECIMAL(15,2),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- -- ======================================================
-- -- SECURITY PROTOCOLS (RLS)
-- -- ======================================================

-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.site_diary ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Profiles are readable by everyone authenticated" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CREATE POLICY "Users manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Users manage own measurements" ON public.measurements FOR ALL 
-- USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- CREATE POLICY "Users manage own diaries" ON public.site_diary FOR ALL 
-- USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users manage own bill items" ON public.bill_items FOR ALL 
-- USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- -- RELOAD
-- NOTIFY pgrst, 'reload schema';