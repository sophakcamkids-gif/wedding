-- ==========================================
-- SUPABASE POSTGRESQL SETUP SCRIPT
-- Wedding Guest Manager Application Database
-- With Full Cambodia Administrative Address Lookup
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist (WARNING: This wipes existing data)
DROP TABLE IF EXISTS public.guests CASCADE;
DROP TABLE IF EXISTS public.weddings CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.villages CASCADE;
DROP TABLE IF EXISTS public.communes CASCADE;
DROP TABLE IF EXISTS public.districts CASCADE;
DROP TABLE IF EXISTS public.provinces CASCADE;

-- 3. Create 'admins' Table
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create 'weddings' Table
CREATE TABLE public.weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    host_username VARCHAR(255) UNIQUE NOT NULL,
    host_password VARCHAR(255) NOT NULL,
    khqr_img_url TEXT NOT NULL,
    khqr_usd_img_url TEXT,
    telegram_token TEXT,
    telegram_chat_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read weddings" ON public.weddings FOR SELECT USING (true);
CREATE POLICY "Users can manage their own weddings" ON public.weddings
    FOR ALL USING (auth.uid() = user_id);

-- 5. Create 'guests' Table
CREATE TABLE public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    companions INTEGER NOT NULL DEFAULT 0,
    relation_type VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    note TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    province VARCHAR(255),
    district VARCHAR(255),
    commune VARCHAR(255),
    village VARCHAR(255),
    address_details TEXT,
    is_present BOOLEAN DEFAULT FALSE,
    check_in_time VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert guests" ON public.guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can manage guests for their weddings" ON public.guests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.weddings
            WHERE weddings.id = guests.wedding_id
            AND weddings.user_id = auth.uid()
        )
    );

-- =====================================================================
-- 6. CREATE CAMBODIA FULL ADDRESS LOOKUP TABLES
-- =====================================================================

-- Create 'provinces' Table
CREATE TABLE public.provinces (
    id VARCHAR(10) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create 'districts' Table
CREATE TABLE public.districts (
    id VARCHAR(10) PRIMARY KEY,
    province_id VARCHAR(10) REFERENCES public.provinces(id) ON DELETE CASCADE NOT NULL,
    code VARCHAR(10) NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create 'communes' Table
CREATE TABLE public.communes (
    id VARCHAR(10) PRIMARY KEY,
    province_id VARCHAR(10) REFERENCES public.provinces(id) ON DELETE CASCADE,
    district_id VARCHAR(10) REFERENCES public.districts(id) ON DELETE CASCADE NOT NULL,
    code VARCHAR(10) NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create 'villages' Table
CREATE TABLE public.villages (
    id VARCHAR(10) PRIMARY KEY,
    province_id VARCHAR(10) REFERENCES public.provinces(id) ON DELETE CASCADE,
    district_id VARCHAR(10) REFERENCES public.districts(id) ON DELETE CASCADE,
    commune_id VARCHAR(10) REFERENCES public.communes(id) ON DELETE CASCADE NOT NULL,
    code VARCHAR(10) NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: To seed the full gazetteer data of 25 provinces, 197 districts, 1646 communes, and 14372 villages,
-- execute the queries from the following URL inside your Supabase SQL Editor:
-- https://raw.githubusercontent.com/4050602901-cyber/register-form/main/supabase/cambodia_address_full.sql

-- =====================================================================
-- 7. SEED DUMMY DEVELOPMENT DATA
-- =====================================================================

-- Seed Default Administrator Account (admin123 / password123)
INSERT INTO public.admins (username, password)
VALUES ('admin123', 'password123')
ON CONFLICT (username) DO NOTHING;

-- =====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read/write bypass for prototype admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype provinces" ON public.provinces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype districts" ON public.districts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype communes" ON public.communes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype villages" ON public.villages FOR ALL USING (true) WITH CHECK (true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';


-- =====================================================================
-- SAFE MIGRATION SCRIPT FOR EXISTING DATABASES (NO DATA LOSS)
-- =====================================================================
-- Run this if you already have weddings and guests tables with data!

/*
-- 1. Create Lookup Tables safely if they do not exist
CREATE TABLE IF NOT EXISTS public.provinces (
    id VARCHAR(10) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.districts (
    id VARCHAR(10) PRIMARY KEY,
    province_id VARCHAR(10) REFERENCES public.provinces(id) ON DELETE CASCADE NOT NULL,
    code VARCHAR(10) NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.communes (
    id VARCHAR(10) PRIMARY KEY,
    province_id VARCHAR(10) REFERENCES public.provinces(id) ON DELETE CASCADE,
    district_id VARCHAR(10) REFERENCES public.districts(id) ON DELETE CASCADE NOT NULL,
    code VARCHAR(10) NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.villages (
    id VARCHAR(10) PRIMARY KEY,
    province_id VARCHAR(10) REFERENCES public.provinces(id) ON DELETE CASCADE,
    district_id VARCHAR(10) REFERENCES public.districts(id) ON DELETE CASCADE,
    commune_id VARCHAR(10) REFERENCES public.communes(id) ON DELETE CASCADE NOT NULL,
    code VARCHAR(10) NOT NULL,
    name_km VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Safely add missing columns to 'guests' and 'weddings' tables if they don't exist yet
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS khqr_usd_img_url TEXT;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Update Policy for Wedding Tables
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read weddings" ON public.weddings;
CREATE POLICY "Anyone can read weddings" ON public.weddings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own weddings" ON public.weddings;
CREATE POLICY "Users can manage their own weddings" ON public.weddings FOR ALL USING (auth.uid() = user_id);

-- 4. Update Policy for Guests Tables
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert guests" ON public.guests;
CREATE POLICY "Anyone can insert guests" ON public.guests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can manage guests for their weddings" ON public.guests;
CREATE POLICY "Users can manage guests for their weddings" ON public.guests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.weddings
            WHERE weddings.id = guests.wedding_id
            AND weddings.user_id = auth.uid()
        )
    );

ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read/write bypass for prototype provinces" ON public.provinces;
CREATE POLICY "Enable read/write bypass for prototype provinces" ON public.provinces FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read/write bypass for prototype districts" ON public.districts;
CREATE POLICY "Enable read/write bypass for prototype districts" ON public.districts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read/write bypass for prototype communes" ON public.communes;
CREATE POLICY "Enable read/write bypass for prototype communes" ON public.communes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read/write bypass for prototype villages" ON public.villages;
CREATE POLICY "Enable read/write bypass for prototype villages" ON public.villages FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
*/
