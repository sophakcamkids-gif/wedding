-- ==========================================
-- SUPABASE POSTGRESQL SETUP SCRIPT
-- Wedding Guest Manager Application Database
-- With Full Cambodia Administrative Address Lookup
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist (for clean installation)
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
    title VARCHAR(255) NOT NULL,
    host_username VARCHAR(255) UNIQUE NOT NULL,
    host_password VARCHAR(255) NOT NULL,
    khqr_img_url TEXT NOT NULL, -- ImgBB KHQR image URL
    telegram_token TEXT, -- Optional Telegram Bot Token
    telegram_chat_id TEXT, -- Optional Telegram Chat ID (User/Group/Channel ID)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create 'guests' Table
CREATE TABLE public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    companions INTEGER NOT NULL DEFAULT 0,
    relation_type VARCHAR(255) NOT NULL, -- 'ខាងកូនកំលោះ', 'ខាងកូនក្រមុំ', 'មិត្តភក្តិ', 'ផ្សេងៗ'
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    note TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending' or 'approved'
    province VARCHAR(255),
    district VARCHAR(255),
    commune VARCHAR(255),
    village VARCHAR(255),
    address_details TEXT,
    is_present BOOLEAN DEFAULT FALSE,
    check_in_time VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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

-- Seed Dummy Wedding Event for Demonstration
INSERT INTO public.weddings (id, title, host_username, host_password, khqr_img_url)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'មង្គលការ លី សុខា និង អ៊ឹម ចិន្តា', 
    'wedding123', 
    'password123', 
    'https://i.ibb.co/6NGpLTL/sample-aba-khqr.jpg'
)
ON CONFLICT (host_username) DO NOTHING;

-- Seed initial guests for demonstration (pending / approved)
INSERT INTO public.guests (wedding_id, name, phone, companions, relation_type, amount, currency, note, status, province, district, commune, village, address_details)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ចាន់ សុភ័ក្ត្រ', '012345678', 1, 'ខាងកូនកំលោះ', 50.00, 'USD', 'សូមជូនពរឱ្យមានសុភមង្គល!', 'approved', 'រាជធានីភ្នំពេញ', 'ខណ្ឌដូនពេញ', 'សង្កាត់ចតុមុខ', 'ភូមិ១', 'ផ្ទះលេខ ១២ ផ្លូវមហាក្សត្រ'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'គឹម ស្រីនី', '098765432', 2, 'ខាងកូនក្រមុំ', 400000.00, 'KHR', 'ជូនពរជីវិតគូជោគជ័យ', 'approved', 'សៀមរាប', 'ក្រុងសៀមរាប', 'សង្កាត់ស្វាយដង្គំ', 'ភូមិស្វាយដង្គំ', 'ផ្ទះលេខ ៧A ផ្លូវសាលារៀន'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'សេង រក្សា', '077889911', 0, 'មិត្តភក្តិ', 30.00, 'USD', 'ជូនពរឱ្យស្រឡាញ់គ្នាដល់ចាស់កោងខ្នង', 'pending', 'រាជធានីភ្នំពេញ', 'ខណ្ឌសែនសុខ', 'សង្កាត់ទឹកថ្លា', 'ភូមិចុងថ្នល់', 'ផ្ទះលេខ ១០ B ផ្លូវ ២៧១')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;

-- Since this is a prototype, we create permissive public policies 
-- to allow easy access from the client-side without complex authentication setup.

-- Policies for 'admins'
CREATE POLICY "Enable read/write bypass for prototype admins" ON public.admins 
    FOR ALL USING (true) WITH CHECK (true);

-- Policies for 'weddings'
CREATE POLICY "Enable read/write bypass for prototype weddings" ON public.weddings 
    FOR ALL USING (true) WITH CHECK (true);

-- Policies for 'guests'
CREATE POLICY "Enable read/write bypass for prototype guests" ON public.guests 
    FOR ALL USING (true) WITH CHECK (true);

-- Policies for Cambodia Address Lookup Tables
CREATE POLICY "Enable read/write bypass for prototype provinces" ON public.provinces 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read/write bypass for prototype districts" ON public.districts 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read/write bypass for prototype communes" ON public.communes 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable read/write bypass for prototype villages" ON public.villages 
    FOR ALL USING (true) WITH CHECK (true);
