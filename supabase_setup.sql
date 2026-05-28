-- ==========================================
-- SUPABASE POSTGRESQL SETUP SCRIPT
-- Wedding Guest Manager Application Database
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist (for clean installation)
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS weddings CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- 3. Create 'admins' Table
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create 'weddings' Table
CREATE TABLE weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    host_username VARCHAR(255) UNIQUE NOT NULL,
    host_password VARCHAR(255) NOT NULL,
    khqr_img_url TEXT NOT NULL, -- ImgBB KHQR image URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create 'guests' Table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    companions INTEGER NOT NULL DEFAULT 0,
    relation_type VARCHAR(255) NOT NULL, -- 'ខាងកូនកំលោះ', 'ខាងកូនក្រមុំ', 'មិត្តភក្តិ', 'ផ្សេងៗ'
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    note TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending' or 'approved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Seed Default Administrator Account
-- Account: admin123 / password123
INSERT INTO admins (username, password)
VALUES ('admin123', 'password123')
ON CONFLICT (username) DO NOTHING;

-- 7. Seed Dummy Wedding Event for Demonstration
INSERT INTO weddings (id, title, host_username, host_password, khqr_img_url)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'មង្គលការ លី សុខា និង អ៊ឹម ចិន្តា', 
    'wedding123', 
    'password123', 
    'https://i.ibb.co/6NGpLTL/sample-aba-khqr.jpg' -- Placeholder ImgBB or dynamic ABA KHQR format
)
ON CONFLICT (host_username) DO NOTHING;

-- Seed initial guests for demonstration (pending / approved)
INSERT INTO guests (wedding_id, name, phone, companions, relation_type, amount, note, status)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ចាន់ សុភ័ក្ត្រ', '012345678', 1, 'ខាងកូនកំលោះ', 50.00, 'សូមជូនពរឱ្យមានសុភមង្គល!', 'approved'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'គឹម ស្រីនី', '098765432', 2, 'ខាងកូនក្រមុំ', 100.00, 'ជូនពរជីវិតគូជោគជ័យ', 'approved'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'សេង រក្សា', '077889911', 0, 'មិត្តភក្តិ', 30.00, 'ជូនពរឱ្យស្រឡាញ់គ្នាដល់ចាស់កោងខ្នង', 'pending')
ON CONFLICT DO NOTHING;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Since this is a prototype, we create fully permissive public policies 
-- to allow easy access from the client-side without heavy authentication setup.

-- Policies for 'admins'
CREATE POLICY "Enable read/write bypass for prototype admins" ON admins 
    FOR ALL USING (true) WITH CHECK (true);

-- Policies for 'weddings'
CREATE POLICY "Enable read/write bypass for prototype weddings" ON weddings 
    FOR ALL USING (true) WITH CHECK (true);

-- Policies for 'guests'
CREATE POLICY "Enable read/write bypass for prototype guests" ON guests 
    FOR ALL USING (true) WITH CHECK (true);
