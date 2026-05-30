import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Heart, 
  CheckCircle, 
  Users, 
  DollarSign, 
  Search, 
  Plus, 
  Trash2, 
  Settings, 
  Share2, 
  Database, 
  Smartphone, 
  UserCheck, 
  Download, 
  LogOut, 
  Calendar, 
  Lock, 
  User, 
  Copy, 
  FileText, 
  Check, 
  Loader2,
  ChevronRight,
  Sparkles,
  Info,
  MapPin,
  Printer,
  Camera,
  Scan,
  Send
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCodeScannerModal } from './components/QrCodeScannerModal';
import { 
  getStaticDistricts, 
  getStaticCommunes, 
  getStaticVillages 
} from './data/cambodia_addresses';

// Define TS Interfaces
interface Wedding {
  id: string;
  title: string;
  host_username: string;
  host_password?: string;
  khqr_img_url: string;
  khqr_usd_img_url?: string;
  telegram_token?: string;
  telegram_chat_id?: string;
  created_at?: string;
}

interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  phone: string;
  companions: number;
  relation_type: string;
  amount: number;
  currency: 'USD' | 'KHR';
  note: string;
  status: 'pending' | 'approved';
  created_at?: string;
  province?: string;
  district?: string;
  commune?: string;
  village?: string;
  address_details?: string;
  is_present?: boolean;
  check_in_time?: string | null;
}

const STATIC_PROVINCES = [
  { id: '12', code: '12', name_km: 'រាជធានីភ្នំពេញ', name_en: 'Phnom Penh Capital' },
  { id: '17', code: '17', name_km: 'សៀមរាប', name_en: 'Siemreap' },
  { id: '18', code: '18', name_km: 'ព្រះសីហនុ', name_en: 'Preah Sihanouk' },
  { id: '02', code: '02', name_km: 'បាត់ដំបង', name_en: 'Battambang' },
  { id: '03', code: '03', name_km: 'កំពង់ចាម', name_en: 'Kampong Cham' },
  { id: '05', code: '05', name_km: 'កំពង់ស្ពឺ', name_en: 'Kampong Speu' },
  { id: '08', code: '08', name_km: 'កណ្ដាល', name_en: 'Kandal' },
  { id: '07', code: '07', name_km: 'កំពត', name_en: 'Kampot' },
  { id: '21', code: '21', name_km: 'តាកែវ', name_en: 'Takeo' },
  { id: '20', code: '20', name_km: 'ស្វាយរៀង', name_en: 'Svay Rieng' },
  { id: '14', code: '14', name_km: 'ព្រៃវែង', name_en: 'Prey Veng' },
  { id: '01', code: '01', name_km: 'បន្ទាយមានជ័យ', name_en: 'Banteay Meanchey' },
  { id: '04', code: '04', name_km: 'កំពង់ឆ្នាំង', name_en: 'Kampong Chhnang' },
  { id: '06', code: '06', name_km: 'កំពង់ធំ', name_en: 'Kampong Thom' },
  { id: '09', code: '09', name_km: 'កោះកុង', name_en: 'Koh Kong' },
  { id: '10', code: '10', name_km: 'ក្រចេះ', name_en: 'Kratie' },
  { id: '11', code: '11', name_km: 'មណ្ឌលគិរី', name_en: 'Mondul Kiri' },
  { id: '13', code: '13', name_km: 'ព្រះវិហារ', name_en: 'Preah Vihear' },
  { id: '15', code: '15', name_km: 'ពោធិ៍សាត់', name_en: 'Pursat' },
  { id: '16', code: '16', name_km: 'រតនគិរី', name_en: 'Ratanak Kiri' },
  { id: '19', code: '19', name_km: 'ស្ទឹងត្រែង', name_en: 'Stung Treng' },
  { id: '22', code: '22', name_km: 'ឧត្ដរមានជ័យ', name_en: 'Oddar Meanchey' },
  { id: '23', code: '23', name_km: 'កែប', name_en: 'Kep' },
  { id: '24', code: '24', name_km: 'ប៉ៃលិន', name_en: 'Pailin' },
  { id: '25', code: '25', name_km: 'ត្បូងឃ្មុំ', name_en: 'Tboung Khmum' }
];

const DATABASE_BLUEPRINT_SQL = `-- ==========================================
-- SUPABASE POSTGRESQL SETUP SCRIPT
-- Wedding Guest Manager Application Database
-- With Full Cambodia Administrative Address Lookup
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist
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
    khqr_img_url TEXT NOT NULL,
    khqr_usd_img_url TEXT,
    telegram_token TEXT,
    telegram_chat_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- NOTE FOR CAMBODIA ADDRESS FULL DATA SEEDING:
-- To seed the full address lookup database of 25 provinces, 197 districts, 1646 communes, and 14372 villages:
-- Run the insert statements from the following SQL file in your Supabase SQL Editor:
-- https://raw.githubusercontent.com/4050602901-cyber/register-form/main/supabase/cambodia_address_full.sql

-- =====================================================================
-- 7. SEED DUMMY DEVELOPMENT DATA
-- =====================================================================
INSERT INTO public.admins (username, password) VALUES ('admin123', 'password123');

-- =====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read/write bypass for prototype admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype weddings" ON public.weddings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype guests" ON public.guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype provinces" ON public.provinces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype districts" ON public.districts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype communes" ON public.communes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write bypass for prototype villages" ON public.villages FOR ALL USING (true) WITH CHECK (true);`;

const DATABASE_MIGRATION_SQL = `-- =====================================================================
-- SAFE MIGRATION SCRIPT FOR EXISTING DATABASES (NO DATA LOSS)
-- =====================================================================
-- Use this script if you already have existing "guests", "weddings", or "admins" tables
-- with active data. Running this script WILL NOT delete or drop your existing data.

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

ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS companions INTEGER DEFAULT 0;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS province VARCHAR(255);
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS commune VARCHAR(255);
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS village VARCHAR(255);
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS address_details TEXT;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS is_present BOOLEAN DEFAULT FALSE;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS check_in_time VARCHAR(100);

-- 3. Ensure Row-Level Security (RLS) is enabled on new lookup tables
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Security Policies safely to avoid duplicate errors
DROP POLICY IF EXISTS "Enable read/write bypass for prototype provinces" ON public.provinces;
CREATE POLICY "Enable read/write bypass for prototype provinces" ON public.provinces FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read/write bypass for prototype districts" ON public.districts;
CREATE POLICY "Enable read/write bypass for prototype districts" ON public.districts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read/write bypass for prototype communes" ON public.communes;
CREATE POLICY "Enable read/write bypass for prototype communes" ON public.communes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read/write bypass for prototype villages" ON public.villages;
CREATE POLICY "Enable read/write bypass for prototype villages" ON public.villages FOR ALL USING (true) WITH CHECK (true);`;

const formatCurrency = (amount: number, currency: 'USD' | 'KHR') => {
  if (currency === 'KHR') {
    return `${amount.toLocaleString('en-US')} ៛`;
  }
  return `$${amount.toFixed(2)}`;
};

export default function App() {
  // Connection Mode State
  const initialSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const initialSupabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const [connectionMode, setConnectionMode] = useState<'demo' | 'supabase'>(initialSupabaseUrl && initialSupabaseAnonKey ? 'supabase' : 'demo');
  const [supabaseUrl, setSupabaseUrl] = useState(initialSupabaseUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialSupabaseAnonKey);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [dbErrorMessage, setDbErrorMessage] = useState('');
  const [isInitializingDb, setIsInitializingDb] = useState(false);

  // Active User Role state
  // Roles: 'guest' | 'admin' | 'host'
  const [currentRole, setCurrentRole] = useState<'guest' | 'admin' | 'host'>('guest');

  // Supabase Client state
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  // Application Data State
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>('');

  // Authentication states
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [hostUsername, setHostUsername] = useState('');
  const [hostPassword, setHostPassword] = useState('');
  const [loggedInHostWeddingId, setLoggedInHostWeddingId] = useState<string | null>(null);

  // Form Registration state (Guest View)
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCompanions, setGuestCompanions] = useState(0);
  const [guestRelation, setGuestRelation] = useState('ខាងកូនក្រមុំ');
  const [guestAmount, setGuestAmount] = useState('');
  const [guestCurrency, setGuestCurrency] = useState<'USD' | 'KHR'>('USD');
  const [guestNote, setGuestNote] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredGuestId, setRegisteredGuestId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin and Host View visual states
  const [searchQuery, setSearchQuery] = useState('');
  const [relationFilter, setRelationFilter] = useState('ទាំងអស់');
  const [statusFilter, setStatusFilter] = useState('ទាំងអស់');

  // New Wedding Form state (Admin only)
  const [newWeddingTitle, setNewWeddingTitle] = useState('');
  const [newWeddingHostUser, setNewWeddingHostUser] = useState('');
  const [newWeddingHostPass, setNewWeddingHostPass] = useState('');
  const [newWeddingKhqrUrl, setNewWeddingKhqrUrl] = useState('');
  const [newWeddingKhqrUsdUrl, setNewWeddingKhqrUsdUrl] = useState('');
  const [showAddWeddingModal, setShowAddWeddingModal] = useState(false);

  // New Guest Form state (Admin manual add)
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  
  // Camera-based QR Code Scanner state variables
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState<{
    success: boolean;
    name?: string;
    phone?: string;
    companions?: number;
    relation?: string;
    message: string;
    timestamp: Date;
  } | null>(null);
  const [manualGuestName, setManualGuestName] = useState('');
  const [manualGuestPhone, setManualGuestPhone] = useState('');
  const [manualGuestCompanions, setManualGuestCompanions] = useState(0);
  const [manualGuestRelation, setManualGuestRelation] = useState('ខាងកូនកំលោះ');
  const [manualGuestAmount, setManualGuestAmount] = useState('');
  const [manualGuestCurrency, setManualGuestCurrency] = useState<'USD' | 'KHR'>('USD');
  const [manualGuestNote, setManualGuestNote] = useState('');
  
  // Telegram Bot Notification states
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [showTelegramSettings, setShowTelegramSettings] = useState(false);
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);
  const [showSqlDocs, setShowSqlDocs] = useState(false);

  // KHQR Edit states
  const [editKhqrUrl, setEditKhqrUrl] = useState('');
  const [editKhqrUsdUrl, setEditKhqrUsdUrl] = useState('');
  const [isSavingKhqr, setIsSavingKhqr] = useState(false);
  const [showKhqrSettings, setShowKhqrSettings] = useState(false);

  // Address States (Guest Form)
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [guestProvince, setGuestProvince] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [guestDistrict, setGuestDistrict] = useState('');
  const [selectedCommuneId, setSelectedCommuneId] = useState('');
  const [guestCommune, setGuestCommune] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [guestVillage, setGuestVillage] = useState('');
  const [guestAddressDetails, setGuestAddressDetails] = useState('');

  // Address States (Admin Manual Form)
  const [manualSelectedProvinceId, setManualSelectedProvinceId] = useState('');
  const [manualGuestProvince, setManualGuestProvince] = useState('');
  const [manualSelectedDistrictId, setManualSelectedDistrictId] = useState('');
  const [manualGuestDistrict, setManualGuestDistrict] = useState('');
  const [manualSelectedCommuneId, setManualSelectedCommuneId] = useState('');
  const [manualGuestCommune, setManualGuestCommune] = useState('');
  const [manualSelectedVillageId, setManualSelectedVillageId] = useState('');
  const [manualGuestVillage, setManualGuestVillage] = useState('');
  const [manualGuestAddressDetails, setManualGuestAddressDetails] = useState('');

  // Dropdown lists
  const [provincesList, setProvincesList] = useState<{ id: string, name_km: string, name_en: string }[]>(STATIC_PROVINCES);
  const [districtsList, setDistrictsList] = useState<{ id: string, name_km: string, name_en: string }[]>([]);
  const [communesList, setCommunesList] = useState<{ id: string, name_km: string, name_en: string }[]>([]);
  const [villagesList, setVillagesList] = useState<{ id: string, name_km: string, name_en: string }[]>([]);
  
  const [manualDistrictsList, setManualDistrictsList] = useState<{ id: string, name_km: string, name_en: string }[]>([]);
  const [manualCommunesList, setManualCommunesList] = useState<{ id: string, name_km: string, name_en: string }[]>([]);
  const [manualVillagesList, setManualVillagesList] = useState<{ id: string, name_km: string, name_en: string }[]>([]);
  
  const [dbHasAddressTables, setDbHasAddressTables] = useState(false);

  // SQL Tab State & Automatic Fetching for Split SQL Files
  const [selectedSqlTab, setSelectedSqlTab] = useState<'main_schema' | 'safe_migration' | 'provinces_districts_communes' | 'villages_part1' | 'villages_part2'>('main_schema');
  const [fetchedSqlText, setFetchedSqlText] = useState<string>('');
  const [isLoadingSql, setIsLoadingSql] = useState(false);

  useEffect(() => {
    if (selectedSqlTab === 'main_schema') {
      setFetchedSqlText(DATABASE_BLUEPRINT_SQL);
      return;
    }
    if (selectedSqlTab === 'safe_migration') {
      setFetchedSqlText(DATABASE_MIGRATION_SQL);
      return;
    }
    
    setIsLoadingSql(true);
    let filePath = '';
    if (selectedSqlTab === 'provinces_districts_communes') {
      filePath = '/cambodia_address_provinces_districts_communes.sql';
    } else if (selectedSqlTab === 'villages_part1') {
      filePath = '/cambodia_address_villages_part1.sql';
    } else if (selectedSqlTab === 'villages_part2') {
      filePath = '/cambodia_address_villages_part2.sql';
    }

    if (filePath) {
      fetch(filePath)
        .then(res => res.text())
        .then(text => {
          setFetchedSqlText(text);
          setIsLoadingSql(false);
        })
        .catch(err => {
          setFetchedSqlText(`-- Error loading file: ${err.message}\nPlease copy from: https://raw.githubusercontent.com/4050602901-cyber/register-form/main/supabase/cambodia_address_full.sql`);
          setIsLoadingSql(false);
        });
    }
  }, [selectedSqlTab]);

  // Check tables presence & load provinces
  useEffect(() => {
    if (connectionMode === 'supabase' && supabaseClient) {
      const checkAndLoadAddressTables = async () => {
        try {
          const { data, error } = await supabaseClient
            .from('provinces')
            .select('id, name_km, name_en')
            .order('name_km');
          
          if (!error && data && data.length > 0) {
            setProvincesList(data);
            setDbHasAddressTables(true);
            console.log("Successfully loaded dynamic provinces from Supabase.");
          } else {
            setProvincesList(STATIC_PROVINCES);
            setDbHasAddressTables(false);
          }
        } catch (err) {
          setProvincesList(STATIC_PROVINCES);
          setDbHasAddressTables(false);
        }
      };
      checkAndLoadAddressTables();
    } else {
      setProvincesList(STATIC_PROVINCES);
      setDbHasAddressTables(false);
    }
  }, [connectionMode, supabaseClient]);

  // Load Districts for guest form
  useEffect(() => {
    if (!selectedProvinceId) {
      setDistrictsList([]);
      setGuestDistrict('');
      return;
    }
    const prov = provincesList.find(p => p.id === selectedProvinceId);
    if (prov) {
      setGuestProvince(prov.name_km);
    }
    if (connectionMode === 'supabase' && supabaseClient && dbHasAddressTables) {
      const loadDistricts = async () => {
        try {
          const { data, error } = await supabaseClient
            .from('districts')
            .select('id, name_km, name_en')
            .eq('province_id', selectedProvinceId)
            .order('name_km');
          if (!error && data) {
            setDistrictsList(data);
          }
        } catch (e) {
          setDistrictsList([]);
        }
      };
      loadDistricts();
    } else {
      setDistrictsList(getStaticDistricts(selectedProvinceId));
    }
  }, [selectedProvinceId, connectionMode, supabaseClient, dbHasAddressTables, provincesList]);

  // Load Communes for guest form
  useEffect(() => {
    if (!selectedDistrictId) {
      setCommunesList([]);
      setGuestCommune('');
      return;
    }
    if (selectedDistrictId === 'custom_district') {
      setCommunesList([]);
      setGuestCommune('');
      return;
    }
    const dist = districtsList.find(d => d.id === selectedDistrictId);
    if (dist) {
      setGuestDistrict(dist.name_km);
    }
    if (connectionMode === 'supabase' && supabaseClient && dbHasAddressTables) {
      const loadCommunes = async () => {
        try {
          const { data, error } = await supabaseClient
            .from('communes')
            .select('id, name_km, name_en')
            .eq('district_id', selectedDistrictId)
            .order('name_km');
          if (!error && data) {
            setCommunesList(data);
          }
        } catch (e) {
          setCommunesList([]);
        }
      };
      loadCommunes();
    } else {
      setCommunesList(getStaticCommunes(selectedDistrictId));
    }
  }, [selectedDistrictId, connectionMode, supabaseClient, dbHasAddressTables, districtsList]);

  // Load Villages for guest form
  useEffect(() => {
    if (!selectedCommuneId) {
      setVillagesList([]);
      setGuestVillage('');
      return;
    }
    if (selectedCommuneId === 'custom_commune') {
      setVillagesList([]);
      setGuestVillage('');
      return;
    }
    const comm = communesList.find(c => c.id === selectedCommuneId);
    if (comm) {
      setGuestCommune(comm.name_km);
    }
    if (connectionMode === 'supabase' && supabaseClient && dbHasAddressTables) {
      const loadVillages = async () => {
        try {
          const { data, error } = await supabaseClient
            .from('villages')
            .select('id, name_km, name_en')
            .eq('commune_id', selectedCommuneId)
            .order('name_km');
          if (!error && data) {
            setVillagesList(data);
          }
        } catch (e) {
          setVillagesList([]);
        }
      };
      loadVillages();
    } else {
      setVillagesList(getStaticVillages(selectedCommuneId));
    }
  }, [selectedCommuneId, connectionMode, supabaseClient, dbHasAddressTables, communesList]);

  // Handle village name mapping for guest form
  useEffect(() => {
    if (selectedVillageId && selectedVillageId !== 'custom_village' && villagesList.length > 0) {
      const vill = villagesList.find(v => v.id === selectedVillageId);
      if (vill) {
        setGuestVillage(vill.name_km);
      }
    }
  }, [selectedVillageId, villagesList]);

  // Load Districts for manual form
  useEffect(() => {
    if (!manualSelectedProvinceId) {
      setManualDistrictsList([]);
      setManualGuestDistrict('');
      return;
    }
    const prov = provincesList.find(p => p.id === manualSelectedProvinceId);
    if (prov) {
      setManualGuestProvince(prov.name_km);
    }
    if (connectionMode === 'supabase' && supabaseClient && dbHasAddressTables) {
      const loadManualDistricts = async () => {
        try {
          const { data, error } = await supabaseClient
            .from('districts')
            .select('id, name_km, name_en')
            .eq('province_id', manualSelectedProvinceId)
            .order('name_km');
          if (!error && data) {
            setManualDistrictsList(data);
          }
        } catch (e) {
          setManualDistrictsList([]);
        }
      };
      loadManualDistricts();
    } else {
      setManualDistrictsList(getStaticDistricts(manualSelectedProvinceId));
    }
  }, [manualSelectedProvinceId, connectionMode, supabaseClient, dbHasAddressTables, provincesList]);

  // Load Communes for manual form
  useEffect(() => {
    if (!manualSelectedDistrictId) {
      setManualCommunesList([]);
      setManualGuestCommune('');
      return;
    }
    if (manualSelectedDistrictId === 'custom_district') {
      setManualCommunesList([]);
      setManualGuestCommune('');
      return;
    }
    const dist = manualDistrictsList.find(d => d.id === manualSelectedDistrictId);
    if (dist) {
      setManualGuestDistrict(dist.name_km);
    }
    if (connectionMode === 'supabase' && supabaseClient && dbHasAddressTables) {
      const loadManualCommunes = async () => {
        try {
          const { data, error } = await supabaseClient
            .from('communes')
            .select('id, name_km, name_en')
            .eq('district_id', manualSelectedDistrictId)
            .order('name_km');
          if (!error && data) {
            setManualCommunesList(data);
          }
        } catch (e) {
          setManualCommunesList([]);
        }
      };
      loadManualCommunes();
    } else {
      setManualCommunesList(getStaticCommunes(manualSelectedDistrictId));
    }
  }, [manualSelectedDistrictId, connectionMode, supabaseClient, dbHasAddressTables, manualDistrictsList]);

  // Load Villages for manual form
  useEffect(() => {
    if (!manualSelectedCommuneId) {
      setManualVillagesList([]);
      setManualGuestVillage('');
      return;
    }
    if (manualSelectedCommuneId === 'custom_commune') {
      setManualVillagesList([]);
      setManualGuestVillage('');
      return;
    }
    const comm = manualCommunesList.find(c => c.id === manualSelectedCommuneId);
    if (comm) {
      setManualGuestCommune(comm.name_km);
    }
    if (connectionMode === 'supabase' && supabaseClient && dbHasAddressTables) {
      const loadManualVillages = async () => {
        try {
          const { data, error } = await supabaseClient
            .from('villages')
            .select('id, name_km, name_en')
            .eq('commune_id', manualSelectedCommuneId)
            .order('name_km');
          if (!error && data) {
            setManualVillagesList(data);
          }
        } catch (e) {
          setManualVillagesList([]);
        }
      };
      loadManualVillages();
    } else {
      setManualVillagesList(getStaticVillages(manualSelectedCommuneId));
    }
  }, [manualSelectedCommuneId, connectionMode, supabaseClient, dbHasAddressTables, manualCommunesList]);

  // Handle village name mapping for manual form
  useEffect(() => {
    if (manualSelectedVillageId && manualSelectedVillageId !== 'custom_village' && manualVillagesList.length > 0) {
      const vill = manualVillagesList.find(v => v.id === manualSelectedVillageId);
      if (vill) {
        setManualGuestVillage(vill.name_km);
      }
    }
  }, [manualSelectedVillageId, manualVillagesList]);

  // Clipboard feedback state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Notification Banner
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // 1. Initial State for Demo mode
  const defaultWeddings: Wedding[] = [
    {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      title: "មង្គលការ លី សុខា និង អ៊ឹម ចិន្តា",
      host_username: "wedding123",
      host_password: "password123",
      khqr_img_url: "https://i.ibb.co/6NGpLTL/sample-aba-khqr.jpg"
    },
    {
      id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      title: "ពិធីមង្គលការ សុខ ជា និង គឹម ឡៃ",
      host_username: "wedding456",
      host_password: "password456",
      khqr_img_url: "https://i.ibb.co/6NGpLTL/sample-aba-khqr.jpg"
    }
  ];

  const defaultGuests: Guest[] = [
    {
      id: "g1",
      wedding_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      name: "ចាន់ សុភ័ក្ត្រ",
      phone: "012345678",
      companions: 1,
      relation_type: "ខាងកូនកំលោះ",
      amount: 50,
      currency: "USD",
      note: "សូមជូនពរឱ្យមានសុភមង្គល និងស្រលាញ់គ្នាជានិរន្តរ៍!",
      status: "approved",
      created_at: "2026-05-28T10:00:00Z",
      province: "រាជធានីភ្នំពេញ",
      district: "ខណ្ឌដូនពេញ",
      commune: "សង្កាត់ចតុមុខ",
      village: "ភូមិ១",
      address_details: "ផ្ទះលេខ ៤៥ ផ្លូវព្រះនរោត្តម"
    },
    {
      id: "g2",
      wedding_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      name: "គឹម ស្រីនី",
      phone: "098765432",
      companions: 2,
      relation_type: "ខាងកូនក្រមុំ",
      amount: 400000,
      currency: "KHR",
      note: "ជូនពរជីវិតគូជោគជ័យ និងទទួលបានបុត្រាបុត្រីឆាប់ៗ!",
      status: "approved",
      created_at: "2026-05-28T10:30:00Z",
      province: "សៀមរាប",
      district: "ក្រុងសៀមរាប",
      commune: "សង្កាត់ស្វាយដង្គំ",
      village: "ភូមិស្វាយដង្គំ",
      address_details: "ផ្ទះលេខ ១២ ផ្លូវលំ"
    },
    {
      id: "g3",
      wedding_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      name: "សេង រក្សា",
      phone: "077889911",
      companions: 0,
      relation_type: "មិត្តភក្តិ",
      amount: 30,
      currency: "USD",
      note: "ជូនពរឱ្យស្រឡាញ់គ្នាដល់ចាស់កោងខ្នង!",
      status: "pending",
      created_at: "2026-05-28T11:15:00Z",
      province: "កំពង់ចាម",
      district: "ក្រុងកំពង់ចាម",
      commune: "សង្កាត់វាលវង់",
      village: "ភូមិទី១",
      address_details: "ផ្លូវវិថីព្រះសីហនុ"
    },
    {
      id: "g4",
      wedding_id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      name: "ហេង វីរៈ",
      phone: "010556677",
      companions: 1,
      relation_type: "ផ្សេងៗ",
      amount: 160000,
      currency: "KHR",
      note: "សំណាងល្អក្នុងថ្ងៃពិសេស!",
      status: "approved",
      created_at: "2026-05-28T12:00:00Z",
      province: "ព្រះសីហនុ",
      district: "ក្រុងព្រះសីហនុ",
      commune: "សង្កាត់លេខ៤",
      village: "ភូមិទី៣",
      address_details: "ផ្ទះលេខ ៨៨ ផ្លូវឯករាជ្យ"
    }
  ];

  // Load from Supabase URL configuration if available in env
  useEffect(() => {
    // Try to load from window.env, then vite env, then localStorage
    const url = (window as any).env?.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || localStorage.getItem('wedding_manager_supabase_url') || '';
    const key = (window as any).env?.SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('wedding_manager_supabase_key') || '';
    
    if (url && key) {
      setSupabaseUrl(url);
      setSupabaseAnonKey(key);
      setConnectionMode('supabase');
    }
  }, []);

  // Initialize DB data based on Connection Mode
  useEffect(() => {
    if (connectionMode === 'demo') {
      const localWeddings = localStorage.getItem('wedding_manager_weddings');
      const localGuests = localStorage.getItem('wedding_manager_guests');
      
      if (localWeddings && localGuests) {
        setWeddings(JSON.parse(localWeddings));
        setGuests(JSON.parse(localGuests));
      } else {
        setWeddings(defaultWeddings);
        setGuests(defaultGuests);
        localStorage.setItem('wedding_manager_weddings', JSON.stringify(defaultWeddings));
        localStorage.setItem('wedding_manager_guests', JSON.stringify(defaultGuests));
      }
      setSupabaseConnected(false);
      setDbErrorMessage('');
      // set selected wedding id to first wedding if available
      const list = localWeddings ? JSON.parse(localWeddings) : defaultWeddings;
      if (list.length > 0) {
        setSelectedWeddingId(list[0].id);
      }
    } else {
      // Connect to genuine Supabase
      if (!supabaseUrl || !supabaseAnonKey) {
        setSupabaseConnected(false);
        setDbErrorMessage('សូមបញ្ចូល Supabase URL និង Anon Key ជាមុនសិន។');
        return;
      }

      setIsInitializingDb(true);
      try {
        let cleanUrl = supabaseUrl.trim();
        cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '');
        const client = createClient(cleanUrl, supabaseAnonKey.trim());
        setSupabaseClient(client);

        // Fetch Data from live Supabase Tables
        const fetchRemoteData = async () => {
          // 1. Fetch Weddings
          const { data: weddingsData, error: weddingsError } = await client
            .from('weddings')
            .select('*')
            .limit(10000)
            .order('created_at', { ascending: false });

          if (weddingsError) {
            throw weddingsError;
          }

          // 2. Fetch Guests
          const { data: guestsData, error: guestsError } = await client
            .from('guests')
            .select('*')
            .limit(10000)
            .order('created_at', { ascending: false });

          if (guestsError) {
            throw guestsError;
          }

          setWeddings(weddingsData || []);
          setGuests(guestsData || []);
          
          if (weddingsData && weddingsData.length > 0) {
            setSelectedWeddingId(weddingsData[0].id);
          }
          
          setSupabaseConnected(true);
          setDbErrorMessage('');
          showNotification('បានភ្ជាប់ទៅកាន់ database Supabase ដោយជោគជ័យ!', 'success');
        };

        fetchRemoteData().catch(err => {
          console.error(err);
          setSupabaseConnected(false);
          setDbErrorMessage(`ការតភ្ជាប់បានបរាជ័យ៖ ${err.message || err}. សូមប្រាកដថាអ្នកបានបង្កើតតារាង schema នៅក្នុង Supabase Editor រួចរាល់។`);
          showNotification('មិនអាចទាញទិន្នន័យពី Supabase បានទេ', 'error');
        }).finally(() => {
          setIsInitializingDb(false);
        });

      } catch (err: any) {
        setSupabaseConnected(false);
        setDbErrorMessage(`ការបង្កបង្កើត client មិនជោគជ័យ៖ ${err.message || err}`);
        setIsInitializingDb(false);
      }
    }
  }, [connectionMode, supabaseUrl, supabaseAnonKey]);

  // Sync back to local storage if in demo mode
  const syncLocalData = (newWeddings: Wedding[], newGuests: Guest[]) => {
    if (connectionMode === 'demo') {
      localStorage.setItem('wedding_manager_weddings', JSON.stringify(newWeddings));
      localStorage.setItem('wedding_manager_guests', JSON.stringify(newGuests));
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message: msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 6500);
  };

  // Switch role action helper
  const handleRoleSwitch = (role: 'guest' | 'admin' | 'host') => {
    setCurrentRole(role);
    setSearchQuery('');
    setRelationFilter('ទាំងអស់');
    setStatusFilter('ទាំងអស់');
  };

  // Copy helper
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    showNotification(`បានចម្លង ${label} ទៅក្ដារតម្បៀតខ្ទង់!`, 'success');
  };

  // Active Wedding Profile
  const activeWedding = useMemo(() => {
    return weddings.find(w => w.id === selectedWeddingId) || null;
  }, [weddings, selectedWeddingId]);

  // GUEST FORM SUBMISSION
  const handleRegisterGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeddingId) {
      showNotification('សូមជ្រើសរើសកម្មវិធីជាមុនសិន!', 'error');
      return;
    }
    if (!guestName.trim()) {
      showNotification('សូមបំពេញឈ្មោះរបស់អ្នក!', 'error');
      return;
    }
    if (!guestPhone.trim()) {
      showNotification('សូមបំពេញលេខទូរស័ព្ទរបស់អ្នក!', 'error');
      return;
    }

    setIsSubmitting(true);
    const floatAmount = parseFloat(guestAmount) || 0.00;

    const newGuest: Guest = {
      id: crypto.randomUUID(),
      wedding_id: selectedWeddingId,
      name: guestName.trim(),
      phone: guestPhone.trim(),
      companions: parseInt(String(guestCompanions)) || 0,
      relation_type: guestRelation,
      amount: floatAmount,
      currency: guestCurrency,
      note: guestNote.trim(),
      status: 'pending',
      province: guestProvince,
      district: guestDistrict,
      commune: guestCommune,
      village: guestVillage,
      address_details: guestAddressDetails
    };

    try {
      let createdGuestId = '';
      if (connectionMode === 'supabase' && supabaseClient) {
        const { data, error } = await supabaseClient
          .from('guests')
          .insert([newGuest])
          .select();

        if (error) throw error;
        
        if (data && data.length > 0) {
          const addedGuest = data[0] as Guest;
          createdGuestId = addedGuest.id;
          const updatedGuests = [addedGuest, ...guests];
          setGuests(updatedGuests);
        } else {
          // Fallback fetch if data not returned
          const { data: refreshedGuests } = await supabaseClient.from('guests').select('*').limit(10000).order('created_at', { ascending: false });
          if (refreshedGuests) {
            setGuests(refreshedGuests);
            createdGuestId = refreshedGuests[0]?.id || '';
          }
        }
      } else {
        // Local Mode
        const localGuestObj: Guest = {
          ...newGuest,
          id: 'g_' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        };
        createdGuestId = localGuestObj.id;
        const updated = [localGuestObj, ...guests];
        setGuests(updated);
        syncLocalData(weddings, updated);
      }

      setRegisteredGuestId(createdGuestId);
      setRegistrationSuccess(true);
      showNotification('បានចុះឈ្មោះដោយជោគជ័យ! សូមរង់ចាំការពិនិត្យពី Admin។', 'success');
      
      // Trigger Telegram Bot Notification
      try {
        const currentActiveW = weddings.find(w => w.id === selectedWeddingId);
        const relationIcon = 
          newGuest.relation_type === 'ខាងកូនកំលោះ' ? '🤵‍♂️' :
          newGuest.relation_type === 'ខាងកូនក្រមុំ' ? '👰‍♀️' :
          newGuest.relation_type === 'មិត្តភក្តិ' ? '🤝' : '✨';
        const companionsText = newGuest.companions > 0 ? `+${newGuest.companions} នាក់` : 'មកម្នាក់ឯង';
        const amountText = newGuest.amount > 0 ? formatCurrency(newGuest.amount, newGuest.currency) : 'ចងដៃផ្ទាល់ / មិនទាន់កំណត់';

        const registerMessageHtml = 
          `📥 <b>មានភ្ញៀវចុះឈ្មោះថ្មី! (New Registration)</b>\n\n` +
          `👰🤵 <b>កម្មវិធី៖</b> <code>${currentActiveW?.title || 'Wedding Event'}</code>\n` +
          `👤 <b>ឈ្មោះភ្ញៀវ៖</b> <code>${newGuest.name}</code>\n` +
          `📞 <b>លេខទូរស័ព្ទ៖</b> <code>${newGuest.phone}</code>\n` +
          `👥 <b>អ្នកមកជាមួយ៖</b> <b>${companionsText}</b>\n` +
          `🔗 <b>ទំនាក់ទំនង៖</b> ${relationIcon} ${newGuest.relation_type}\n` +
          `💰 <b>ប្រាក់ចងដៃ៖</b> <code>${amountText}</code>\n` +
          `📝 <b>ពាក្យជូនពរ៖</b> <i>"${newGuest.note || '-'}"</i>\n` +
          `📍 <b>អាសយដ្ឋាន៖</b> ${[newGuest.village, newGuest.commune, newGuest.district, newGuest.province].filter(Boolean).join(', ') || '-'}\n\n` +
          `⏳ <b>ស្ថានភាព៖</b> រង់ចាំការពិនិត្យយល់ព្រម (Pending)`;

        triggerTelegramNotification(selectedWeddingId, registerMessageHtml);
      } catch (telegramErr) {
        console.error("Telemetry error:", telegramErr);
      }

      // Clear inputs
      setGuestName('');
      setGuestPhone('');
      setGuestCompanions(0);
      setGuestRelation('ខាងកូនក្រមុំ');
      setGuestAmount('');
      setGuestNote('');
      setSelectedProvinceId('');
      setGuestProvince('');
      setSelectedDistrictId('');
      setGuestDistrict('');
      setSelectedCommuneId('');
      setGuestCommune('');
      setSelectedVillageId('');
      setGuestVillage('');
      setGuestAddressDetails('');
    } catch (err: any) {
      console.error("Guest insert error:", err);
      alert(`Error detail: ${err.message || err.toString()}`);
      if (err.message && err.message.includes("violates row-level security policy")) {
        showNotification(`បរាជ័យ៖ សូមបង្កើត RLS Policies ដោយដំណើរការកូដ "ផ្នែកទី ១" នៅក្នុង Supabase សិន`, 'error');
      } else if (err.message && err.message.includes("column")) {
        showNotification(`បរាជ័យ៖ Database របស់អ្នកចាស់ពេក! សូមដំណើរការកូដ "ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)" ក្នុង Supabase សិន។`, 'error');
      } else if (err.message && err.message.includes("id")) {
        showNotification(`បរាជ័យ៖ តារាង guests របស់អ្នកមិនមាន default uuid សំរាប់បញ្ជូល id ទេ។ សូមកែតម្រូវក្នុង Supabase`, 'error');
      } else {
        showNotification(`ការចុះឈ្មោះបរាជ័យ៖ ${err.message || err}`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ADMIN LOGIN
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default system credentials or checks admins table if live Supabase is connected
    if (adminUsername === 'admin123' && adminPassword === 'password123') {
      setIsAdminLoggedIn(true);
      showNotification('ស្វាគមន៍ការចូលមកកាន់គណនី Admin Coordinator!', 'success');
    } else {
      // Prototype allows admin123 / password123. If live, try to verify against database
      if (connectionMode === 'supabase' && supabaseConnected) {
        showNotification('កំពុងផ្ទៀងផ្ទាត់ជាមួយ Database...');
        // Standard lookup for demonstration 
        supabaseClient
          .from('admins')
          .select('*')
          .eq('username', adminUsername)
          .eq('password', adminPassword)
          .then(({ data, error }: any) => {
            if (data && data.length > 0) {
              setIsAdminLoggedIn(true);
              showNotification('ការចូលគណនី Admin ទទួលបានជោគជ័យ!', 'success');
            } else {
              showNotification('ឈ្មោះគណនី ឬលេខសម្ងាត់របស់ Admin មិនត្រឹមត្រូវទេ!', 'error');
            }
          });
      } else {
        showNotification('ឈ្មោះគណនី ឬលេខសម្ងាត់របស់ Admin មិនត្រឹមត្រូវទេ! (សាកល្បង៖ admin123 / password123)', 'error');
      }
    }
  };

  // ADMIN CREATE WEDDING EVENT
  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeddingTitle.trim() || !newWeddingHostUser.trim() || !newWeddingHostPass.trim() || !newWeddingKhqrUrl.trim()) {
      showNotification('សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់ទាំងអស់!', 'error');
      return;
    }

    const newW: any = {
      id: crypto.randomUUID(),
      title: newWeddingTitle.trim(),
      host_username: newWeddingHostUser.trim(),
      host_password: newWeddingHostPass.trim(),
      khqr_img_url: newWeddingKhqrUrl.trim()
    };

    if (newWeddingKhqrUsdUrl.trim()) {
      newW.khqr_usd_img_url = newWeddingKhqrUsdUrl.trim();
    }

    try {
      if (connectionMode === 'supabase' && supabaseClient) {
        const { data, error } = await supabaseClient
          .from('weddings')
          .insert([newW])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const addedW = data[0] as Wedding;
          const updatedWeddings = [...weddings, addedW];
          setWeddings(updatedWeddings);
          setSelectedWeddingId(addedW.id);
          if (currentRole === 'host') {
            setLoggedInHostWeddingId(addedW.id);
            setHostUsername(addedW.host_username);
          }
        } else {
          // Refetch
          const { data: refreshed } = await supabaseClient.from('weddings').select('*').limit(10000).order('created_at', { ascending: false });
          if (refreshed) {
            setWeddings(refreshed);
            if (refreshed.length > 0) {
              setSelectedWeddingId(refreshed[0].id);
              if (currentRole === 'host') {
                 setLoggedInHostWeddingId(refreshed[0].id);
                 setHostUsername(refreshed[0].host_username);
              }
            }
          }
        }
      } else {
        // Local Mode
        const localW: Wedding = {
          ...newW,
          id: 'w_' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        };
        const updated = [...weddings, localW];
        setWeddings(updated);
        setSelectedWeddingId(localW.id);
        syncLocalData(updated, guests);
        if (currentRole === 'host') {
          setLoggedInHostWeddingId(localW.id);
          setHostUsername(localW.host_username);
        }
      }

      showNotification('បានបង្កើតកម្មវិធីថ្មីដោយជោគជ័យ!', 'success');
      setNewWeddingTitle('');
      setNewWeddingHostUser('');
      setNewWeddingHostPass('');
      setNewWeddingKhqrUrl('');
      setNewWeddingKhqrUsdUrl('');
      setShowAddWeddingModal(false);
    } catch (err: any) {
      console.error("Wedding insert error:", err);
      alert(`Error detail: ${err.message || err.toString()}`);
      if (err.message && err.message.includes("violates row-level security policy")) {
        showNotification(`បរាជ័យ (RLS Policy)៖ សូមដំណើរការកូដ "ផ្នែកទី ១" នៅក្នុង Supabase សិនទើបអាចបង្កើតបាន`, 'error');
      } else if (err.message && err.message.includes("khqr_usd_img_url")) {
        showNotification(`សូមដំណើរការកូដ "ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)" ក្នុង Supabase សិន ដើម្បីអាចទាក់ទង QR ដុល្លារបាន!`, 'error');
      } else if (err.message && err.message.includes("column")) {
        showNotification(`បរាជ័យ៖ Database របស់អ្នកចាស់ពេក! សូមដំណើរការកូដ "ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)" ក្នុង Supabase សិន។`, 'error');
      } else if (err.message && err.message.includes("id")) {
        showNotification(`បរាជ័យ៖ តារាង weddings របស់អ្នកមិនមាន default gen_random_uuid() ទេ។ សូមដំណើរការផ្នែកទី១ឡើងវិញ`, 'error');
      } else {
        showNotification(`ការបង្កើតបរាជ័យ៖ ${err.message || err}`, 'error');
      }
    }
  };

  // ADMIN MANUALLY ADD GUEST
  const handleManualAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeddingId) {
      showNotification('សូមជ្រើសរើសកម្មវិធីជាមុនសិន!', 'error');
      return;
    }
    if (!manualGuestName.trim() || !manualGuestPhone.trim()) {
      showNotification('សូមបំពេញឈ្មោះ និងលេខទូរស័ព្ទភ្ញៀវ!', 'error');
      return;
    }

    const floatAmt = parseFloat(manualGuestAmount) || 0;

    const newG: Guest = {
      id: crypto.randomUUID(),
      wedding_id: selectedWeddingId,
      name: manualGuestName.trim(),
      phone: manualGuestPhone.trim(),
      companions: parseInt(String(manualGuestCompanions)) || 0,
      relation_type: manualGuestRelation,
      amount: floatAmt,
      currency: manualGuestCurrency,
      note: manualGuestNote.trim(),
      status: 'approved', // Manually added by admin are pre-approved
      province: manualGuestProvince,
      district: manualGuestDistrict,
      commune: manualGuestCommune,
      village: manualGuestVillage,
      address_details: manualGuestAddressDetails
    };

    try {
      if (connectionMode === 'supabase' && supabaseClient) {
        const { data, error } = await supabaseClient
          .from('guests')
          .insert([newG])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const addedGuest = data[0] as Guest;
          setGuests([addedGuest, ...guests]);
        } else {
          const { data: refreshed } = await supabaseClient.from('guests').select('*').limit(10000).order('created_at', { ascending: false });
          if (refreshed) setGuests(refreshed);
        }
      } else {
        const localG: Guest = {
          ...newG,
          id: 'g_' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        };
        const updated = [localG, ...guests];
        setGuests(updated);
        syncLocalData(weddings, updated);
      }

      showNotification('បានបញ្ចូលភ្ញៀវថ្មីជោគជ័យ!', 'success');
      setManualGuestName('');
      setManualGuestPhone('');
      setManualGuestCompanions(0);
      setManualGuestRelation('ខាងកូនកំលោះ');
      setManualGuestAmount('');
      setManualGuestNote('');
      setManualSelectedProvinceId('');
      setManualGuestProvince('');
      setManualSelectedDistrictId('');
      setManualGuestDistrict('');
      setManualSelectedCommuneId('');
      setManualGuestCommune('');
      setManualSelectedVillageId('');
      setManualGuestVillage('');
      setManualGuestAddressDetails('');
      setShowAddGuestModal(false);
    } catch (err: any) {
      console.error("Manual guest insert error:", err);
      alert(`Error detail: ${err.message || err.toString()}`);
      if (err.message && err.message.includes("violates row-level security policy")) {
        showNotification(`បរាជ័យ (RLS Policy)៖ សូមដំណើរការកូដ "ផ្នែកទី ១" នៅក្នុង Supabase សិនទើបអាចបញ្ចូលបាន`, 'error');
      } else if (err.message && err.message.includes("column")) {
        showNotification(`បរាជ័យ៖ Database របស់អ្នកចាស់ពេក! សូមដំណើរការកូដ "ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)" ក្នុង Supabase សិន។`, 'error');
      } else if (err.message && err.message.includes("id")) {
        showNotification(`បរាជ័យ៖ តារាង guests របស់អ្នកមិនមាន default uuid សំរាប់បញ្ជូល id ទេ។ សូមកែតម្រូវក្នុង Supabase`, 'error');
      } else {
        showNotification(`ការបញ្ចូលភ្ញៀវបរាជ័យ៖ ${err.message || err}`, 'error');
      }
    }
  };

  // ADMIN APPROVE GUEST
  const handleApproveGuest = async (guestId: string) => {
    try {
      if (connectionMode === 'supabase' && supabaseClient) {
        const { error } = await supabaseClient
          .from('guests')
          .update({ status: 'approved' })
          .eq('id', guestId);

        if (error) throw error;
      }

      // Update local state in both cases
      const updated = guests.map(g => g.id === guestId ? { ...g, status: 'approved' as const } : g);
      setGuests(updated);
      syncLocalData(weddings, updated);
      showNotification('បានយល់ព្រមអនុម័តភ្ញៀវរួចរាល់!', 'success');

      // Trigger Telegram Notification
      try {
        const approvedG = guests.find(g => g.id === guestId);
        if (approvedG) {
          const approveMessageHtml = 
            `✅ <b>បានយល់ព្រមអនុម័តភ្ញៀវ! (Guest Approved)</b>\n\n` +
            `👥 <b>ឈ្មោះភ្ញៀវ៖</b> <code>${approvedG.name}</code>\n` +
            `📞 <b>លេខទូរស័ព្ទ៖</b> <code>${approvedG.phone}</code>\n` +
            `🔗 <b>ទំនាក់ទំនង៖</b> <code>${approvedG.relation_type}</code>\n` +
            `👍 <b>ស្ថានភាព៖</b> បានយល់ព្រមចូលរួមកម្មវិធី (Approved)`;

          triggerTelegramNotification(approvedG.wedding_id, approveMessageHtml);
        }
      } catch (telegramErr) {
        console.error("Telemetry error:", telegramErr);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(`មិនអាចអនុម័តបានទេ៖ ${err.message || err}`, 'error');
    }
  };

  // TOGGLE GUEST PRESENCE (ចូលតុ / MARK AS PRESENT)
  const handleTogglePresence = async (guestId: string, currentPresence: boolean) => {
    try {
      const nextPresence = !currentPresence;
      const targetGuest = guests.find(g => g.id === guestId);
      const autoApprove = nextPresence && targetGuest && targetGuest.status === 'pending';
      const timeStr = nextPresence 
        ? new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
        : null;

      if (connectionMode === 'supabase' && supabaseClient) {
        const updatePayload: any = { is_present: nextPresence, check_in_time: timeStr };
        if (autoApprove) {
          updatePayload.status = 'approved';
        }
        const { error } = await supabaseClient
          .from('guests')
          .update(updatePayload)
          .eq('id', guestId);

        if (error) throw error;
      }

      // Update local state in both cases
      const updated = guests.map(g => {
        if (g.id === guestId) {
          return { 
            ...g, 
            is_present: nextPresence, 
            check_in_time: timeStr,
            status: autoApprove ? ('approved' as const) : g.status
          };
        }
        return g;
      });
      setGuests(updated);
      syncLocalData(weddings, updated);
      
      if (nextPresence) {
        if (autoApprove) {
          showNotification('បានយល់ព្រមអនុម័ត និងកត់ត្រាវត្តមានភ្ញៀវចូលតុ!', 'success');
        } else {
          showNotification('បានកត់ត្រាវត្តមានភ្ញៀវចូលអង្គុយនៅតុរួចរាល់!', 'success');
        }

        // Trigger Telegram Check-in Notification
        try {
          const checkedInGuest = guests.find(g => g.id === guestId);
          if (checkedInGuest) {
            const checkInTimeStr = timeStr || new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            const totalPeopleCount = 1 + (checkedInGuest.companions || 0);

            const checkInMessageHtml = 
              `🎉 <b>ភ្ញៀវបានមកដល់ និងចូលតុហើយ! (Guest Checked In)</b>\n\n` +
              `👰🤵 <b>កម្មវិធី៖</b> <code>${activeWedding?.title || 'Wedding Event'}</code>\n` +
              `👥 <b>ឈ្មោះភ្ញៀវ៖</b> <code>${checkedInGuest.name}</code>\n` +
              `📞 <b>លេខទូរស័ព្ទ៖</b> <code>${checkedInGuest.phone}</code>\n` +
              `👥 <b>សរុបមានគ្នា៖</b> <b>${totalPeopleCount} នាក់</b> (${checkedInGuest.companions > 0 ? `រួមទាំងគ្នា ${checkedInGuest.companions} នាក់` : 'មកម្នាក់ឯង'})\n` +
              `⏰ <b>ម៉ោងចូលតុ៖</b> <code>${checkInTimeStr}</code>\n` +
              `🚪 <b>របៀប Check-in៖</b> <code>ដោយម្ចាស់កម្មវិធី (Manual Host Control)</code>`;

            triggerTelegramNotification(checkedInGuest.wedding_id, checkInMessageHtml);
          }
        } catch (telegramErr) {
          console.error("Telemetry error:", telegramErr);
        }
      } else {
        showNotification('បានលុបវត្តមានភ្ញៀវចូលតុ!', 'info');
      }
    } catch (err: any) {
      console.error(err);
      showNotification(`មិនអាចកត់ត្រាវត្តមានបានទេ៖ ${err.message || err}`, 'error');
    }
  };

  // Play beautiful synthetic sound chimes
  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      // Dual high-pitch step chime
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio chime failed to play:", e);
    }
  };

  const playWarningChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
      osc.frequency.setValueAtTime(329.63, audioCtx.currentTime + 0.12);
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio chime failed:", e);
    }
  };

  const playErrorChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, audioCtx.currentTime); // Low buzz
      
      gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.warn("Audio chime failed to play:", e);
    }
  };

  // QR CODE SCAN CHECK-IN HANDLER
  const handleQrCheckIn = async (scannedId: string) => {
    const cleanId = scannedId.trim();
    if (!cleanId) return;

    // Filter active wedding: loggedInHostWeddingId || selectedWeddingId
    const activeWId = loggedInHostWeddingId || selectedWeddingId;
    const targetGuest = guests.find(g => g.id === cleanId);

    if (!targetGuest) {
      playErrorChime();
      setLastScannedResult({
        success: false,
        message: 'រកមិនឃើញទិន្នន័យភ្ញៀវ! QR Code មិនត្រឹមត្រូវ។ (Guest Not Found)',
        timestamp: new Date()
      });
      return;
    }

    // Verify if guest belongs to active wedding
    if (targetGuest.wedding_id !== activeWId) {
      playErrorChime();
      setLastScannedResult({
        success: false,
        name: targetGuest.name,
        message: 'ភ្ញៀវនេះស្ថិតនៅក្នុងកម្មវិធីផ្សេង! (Belongs to another wedding event)',
        timestamp: new Date()
      });
      return;
    }

    // Process check-in
    if (targetGuest.is_present) {
      playWarningChime();
      setLastScannedResult({
        success: true,
        name: targetGuest.name,
        phone: targetGuest.phone,
        companions: targetGuest.companions,
        relation: targetGuest.relation_type,
        message: `បានកត់ត្រាវត្តមានរួចហើយ នៅម៉ោង ${targetGuest.check_in_time} (Already Checked In)`,
        timestamp: new Date()
      });
      return;
    }

    // Update guest presence
    const timeStr = new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const autoApprove = targetGuest.status === 'pending';

    try {
      if (connectionMode === 'supabase' && supabaseClient) {
        const updatePayload: any = { is_present: true, check_in_time: timeStr };
        if (autoApprove) {
          updatePayload.status = 'approved';
        }
        const { error } = await supabaseClient
          .from('guests')
          .update(updatePayload)
          .eq('id', cleanId);

        if (error) throw error;
      }

      // Update local state
      const updated = guests.map(g => {
        if (g.id === cleanId) {
          return { 
            ...g, 
            is_present: true, 
            check_in_time: timeStr,
            status: autoApprove ? ('approved' as const) : g.status
          };
        }
        return g;
      });
      setGuests(updated);
      syncLocalData(weddings, updated);

      playSuccessChime();
      setLastScannedResult({
        success: true,
        name: targetGuest.name,
        phone: targetGuest.phone,
        companions: targetGuest.companions,
        relation: targetGuest.relation_type,
        message: autoApprove 
          ? 'បានយល់ព្រមអនុម័ត និងកត់ត្រាវត្តមានចូលតុបានជោគជ័យ! (Approved & Present)'
          : 'បានកត់ត្រាវត្តមានភ្ញៀវចូលអង្គុយនៅតុបានជោគជ័យ! (Marked Present)',
        timestamp: new Date()
      });

      // Trigger Telegram Check-in Notification
      try {
        const checkInTimeStr = timeStr || new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const totalPeopleCount = 1 + (targetGuest.companions || 0);

        const checkInMessageHtml = 
          `🚀 [ស្កេន QR] <b>ភ្ញៀវបានមកដល់ និងចូលតុហើយ! (QR Check-In)</b>\n\n` +
          `👰🤵 <b>កម្មវិធី៖</b> <code>${activeWedding?.title || 'Wedding Event'}</code>\n` +
          `👥 <b>ឈ្មោះភ្ញៀវ៖</b> <code>${targetGuest.name}</code>\n` +
          `📞 <b>លេខទូរស័ព្ទ៖</b> <code>${targetGuest.phone}</code>\n` +
          `👥 <b>សរុបមានគ្នា៖</b> <b>${totalPeopleCount} នាក់</b> (${targetGuest.companions > 0 ? `រួមទាំងគ្នា ${targetGuest.companions} នាក់` : 'មកម្នាក់ឯង'})\n` +
          `⏰ <b>ម៉ោងចូលតុ៖</b> <code>${checkInTimeStr}</code>\n` +
          `📱 <b>របៀប Check-in៖</b> <code>ស្កេនកាមេរ៉ាស្វ័យប្រវត្ត (Camera Scan)</code>`;

        triggerTelegramNotification(targetGuest.wedding_id, checkInMessageHtml);
      } catch (telegramErr) {
        console.error("Telemetry error:", telegramErr);
      }
    } catch (err: any) {
      console.error(err);
      playErrorChime();
      setLastScannedResult({
        success: false,
        name: targetGuest.name,
        message: `មិនអាចកត់ត្រាវត្តមានបានទេ៖ ${err.message || err}`,
        timestamp: new Date()
      });
    }
  };

  // ADMIN DELETE GUEST
  const handleDeleteGuest = async (guestId: string) => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុបភ្ញៀវនេះមែនទេ?')) return;

    try {
      if (connectionMode === 'supabase' && supabaseClient) {
        const { error } = await supabaseClient
          .from('guests')
          .delete()
          .eq('id', guestId);

        if (error) throw error;
      }

      // Update local state
      const updated = guests.filter(g => g.id !== guestId);
      setGuests(updated);
      syncLocalData(weddings, updated);
      showNotification('បានលុបទិន្នន័យភ្ញៀវចេញពីបញ្ជី!', 'info');
    } catch (err: any) {
      console.error(err);
      showNotification(`មិនអាចលុបទិន្នន័យបានទេ៖ ${err.message || err}`, 'error');
    }
  };

  // LOAD TELEGRAM & KHQR SETTINGS FOR ACTIVE WEDDING
  useEffect(() => {
    const activeWId = loggedInHostWeddingId || selectedWeddingId;
    if (!activeWId) {
      setTelegramToken('');
      setTelegramChatId('');
      setEditKhqrUrl('');
      setEditKhqrUsdUrl('');
      return;
    }

    const currentW = weddings.find(w => w.id === activeWId);
    if (currentW) {
      setEditKhqrUrl(currentW.khqr_img_url || '');
      setEditKhqrUsdUrl(currentW.khqr_usd_img_url || '');

      if (currentW.telegram_token || currentW.telegram_chat_id) {
        setTelegramToken(currentW.telegram_token || '');
        setTelegramChatId(currentW.telegram_chat_id || '');
      } else {
        const localConfig = localStorage.getItem(`telegram_config_${activeWId}`);
        if (localConfig) {
          try {
            const parsed = JSON.parse(localConfig);
            setTelegramToken(parsed.telegram_token || '');
            setTelegramChatId(parsed.telegram_chat_id || '');
          } catch (e) {
            setTelegramToken('');
            setTelegramChatId('');
          }
        } else {
          setTelegramToken('');
          setTelegramChatId('');
        }
      }
    }
  }, [selectedWeddingId, loggedInHostWeddingId, weddings]);

  // SEND TELEGRAM NOTIFICATION HELPER
  const sendTelegramNotification = async (token: string, chatId: string, messageHtml: string) => {
    try {
      const url = `https://api.telegram.org/bot${token.trim()}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: messageHtml,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        console.warn("Telegram API Error:", errData);
      }
    } catch (err) {
      console.error("Error sending message to Telegram Bot:", err);
    }
  };

  // TRIGGER TELEGRAM NOTIFICATION
  const triggerTelegramNotification = async (weddingId: string, messageHtml: string) => {
    const wedding = weddings.find(w => w.id === weddingId);
    if (!wedding) return;

    let token = wedding.telegram_token;
    let chatId = wedding.telegram_chat_id;

    if (!token || !chatId) {
      const localConfig = localStorage.getItem(`telegram_config_${weddingId}`);
      if (localConfig) {
        try {
          const parsed = JSON.parse(localConfig);
          token = token || parsed.telegram_token;
          chatId = chatId || parsed.telegram_chat_id;
        } catch (e) {
          // Ignore
        }
      }
    }

    if (token && chatId) {
      await sendTelegramNotification(token, chatId, messageHtml);
    }
  };

  // UPDATE KHQR SETTINGS
  const handleUpdateKhqrSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeWId = loggedInHostWeddingId || selectedWeddingId;
    if (!activeWId) {
      showNotification('សូមជ្រើសរើសកម្មវិធីជាមុនសិន!', 'error');
      return;
    }

    if (!editKhqrUrl.trim()) {
      showNotification('សូមបំពេញ URL សម្រាប់ KHQR ប្រាក់រៀល!', 'error');
      return;
    }

    setIsSavingKhqr(true);
    const khrVal = editKhqrUrl.trim();
    const usdVal = editKhqrUsdUrl.trim() || undefined;

    // Update in local state
    const updatedWeddings = weddings.map(w => {
      if (w.id === activeWId) {
        return {
          ...w,
          khqr_img_url: khrVal,
          khqr_usd_img_url: usdVal
        };
      }
      return w;
    });
    setWeddings(updatedWeddings);
    syncLocalData(updatedWeddings, guests);

    try {
      if (connectionMode === 'supabase' && supabaseClient) {
        const updatePayload: any = { khqr_img_url: khrVal };
        if (usdVal) updatePayload.khqr_usd_img_url = usdVal;
        // if user clears USD url, we can null it out if we want, but let's assume they want it empty
        else updatePayload.khqr_usd_img_url = null;

        const { error } = await supabaseClient
          .from('weddings')
          .update(updatePayload)
          .eq('id', activeWId);

        if (error) {
          console.warn("Could not update Supabase KHQR columns:", error);
          if (error.message && error.message.includes("khqr_usd_img_url")) {
            showNotification('សូមដំណើរការកូដ "ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)" ក្នុង Supabase សិន ដើម្បីអាចទាក់ទង QR ដុល្លារបាន!', 'error');
          } else {
            showNotification('មិនអាចរក្សាទុកទៅក្នុង Supabase បានទេ!', 'error');
          }
        } else {
          showNotification('បានកែប្រែ KHQR ក្នុង Database រួចរាល់!', 'success');
        }
      } else {
        showNotification('បានកែប្រែ KHQR រួចរាល់ក្នុង Local Mode!', 'success');
      }
    } catch (err: any) {
      console.warn(err);
      if (err.message && err.message.includes("khqr_usd_img_url")) {
          showNotification('សូមដំណើរការកូដ "ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)" ក្នុង Supabase សិន ដើម្បីអាចទាក់ទង QR ដុល្លារបាន!', 'error');
      } else {
          showNotification('មានបញ្ហាក្នុងការរក្សាទុក KHQR', 'error');
      }
    } finally {
      setIsSavingKhqr(false);
    }
  };

  // UPDATE TELEGRAM SETTINGS
  const handleUpdateTelegramSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeWId = loggedInHostWeddingId || selectedWeddingId;
    if (!activeWId) {
      showNotification('សូមជ្រើសរើសកម្មវិធីជាមុនសិន!', 'error');
      return;
    }

    setIsSavingTelegram(true);
    const tokenVal = telegramToken.trim();
    const chatIdVal = telegramChatId.trim();

    // Update in local state
    const updatedWeddings = weddings.map(w => {
      if (w.id === activeWId) {
        return {
          ...w,
          telegram_token: tokenVal,
          telegram_chat_id: chatIdVal
        };
      }
      return w;
    });
    setWeddings(updatedWeddings);
    syncLocalData(updatedWeddings, guests);

    // Persist in local storage for fallback
    localStorage.setItem(`telegram_config_${activeWId}`, JSON.stringify({
      telegram_token: tokenVal,
      telegram_chat_id: chatIdVal
    }));

    try {
      if (connectionMode === 'supabase' && supabaseClient) {
        const { error } = await supabaseClient
          .from('weddings')
          .update({
            telegram_token: tokenVal,
            telegram_chat_id: chatIdVal
          })
          .eq('id', activeWId);

        if (error) {
          console.warn("Could not update Supabase columns:", error);
          showNotification('បានរក្សាទុកការកំណត់ Telegram ក្នុង Browser (សាកសមសម្រាប់ local/offline ប្រើប្រាស់)', 'info');
        } else {
          showNotification('បានរក្សាទុកការកំណត់ Telegram ទៅក្នុង Database និង Browser រួចរាល់!', 'success');
        }
      } else {
        showNotification('បានរក្សាទុកការកំណត់ Telegram Bot រួចរាល់!', 'success');
      }
    } catch (err: any) {
      console.warn(err);
      showNotification('បានរក្សាទុកក្នុង Browser រួចរាល់!', 'success');
    } finally {
      setIsSavingTelegram(false);
    }
  };

  // TEST TELEGRAM CONNECTION
  const handleTestTelegramConnection = async () => {
    const tokenVal = telegramToken.trim();
    const chatIdVal = telegramChatId.trim();

    if (!tokenVal || !chatIdVal) {
      showNotification('សូមបំពេញ Token និង Chat ID ជាមុនសិន!', 'error');
      return;
    }

    try {
      const testMessage = `🤖 <b>សាកល្បងភ្ជាប់ប្រព័ន្ធ Telegram Bot ជោគជ័យ! (Test Connected)</b>\n\n` + 
        `🎉 ស្វាគមន៍មកកាន់ប្រព័ន្ធរបស់<b>កម្មវិធី៖</b> <code>${activeWedding?.title || 'សាកល្បង'}</code>\n` +
        `📅 <b>ម៉ោងតេស្ត៖</b> <code>${new Date().toLocaleTimeString('km-KH')}</code>\n\n` +
        `ប្រព័ន្ធជូនដំណឹងរបស់លោកអ្នកត្រូវបានកំណត់រចនាសម្ព័ន្ធរួចរាល់ និងដំណើរការបានយ៉ាងល្អឥតខ្ចោះ!`;

      const url = `https://api.telegram.org/bot${tokenVal}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatIdVal,
          text: testMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });

      const resData = await response.json();
      if (response.ok && resData.ok) {
        showNotification('សារតេស្តត្រូវបានផ្ញើទៅតេឡេក្រាមហើយ! សូមពិនិត្យមើលក្នុងឆាត។', 'success');
      } else {
        showNotification(`បរាជ័យ៖ ${resData.description || 'ពិនិត្យមើល Token ឬ Chat ID ម្តងទៀត'}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showNotification(`មិនអាចភ្ជាប់ទៅកាន់ Telegram Bot៖ ${err.message || err}`, 'error');
    }
  };

  // HOST LOGIN
  const handleHostLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find matching wedding credentials
    const foundWedding = weddings.find(w => 
      w.host_username.toLowerCase() === hostUsername.trim().toLowerCase() && 
      w.host_password === hostPassword.trim()
    );

    if (foundWedding) {
      setLoggedInHostWeddingId(foundWedding.id);
      setSelectedWeddingId(foundWedding.id); // Locked into this wedding
      showNotification(`ស្វាគមន៍ម្ចាស់កម្មវិធី៖ ${foundWedding.title}!`, 'success');
    } else {
      showNotification('ឈ្មោះគណនី ឬលេខសម្ងាត់ម្ចាស់កម្មវិធីមិនត្រឹមត្រូវទេ!', 'error');
    }
  };

  // STATS GENERATOR FOR LOGGED WEDDING (Used in Host View)
  const stats = useMemo(() => {
    const targetWeddingId = loggedInHostWeddingId || selectedWeddingId;
    const weddingGuests = guests.filter(g => g.wedding_id === targetWeddingId);
    const approvedGuests = weddingGuests.filter(g => g.status === 'approved');

    const totalRegistered = weddingGuests.length;
    
    // Attendees = Total approved guests count + total companionship of approved guests
    const actualAttendees = approvedGuests.reduce((acc, current) => {
      // Each approved guest counts as 1 (the registered person) + companions
      return acc + 1 + current.companions;
    }, 0);

    const totalGiftMoneyUSD = approvedGuests.filter(g => g.currency === 'USD').reduce((acc, current) => acc + current.amount, 0);
    const totalGiftMoneyKHR = approvedGuests.filter(g => g.currency === 'KHR').reduce((acc, current) => acc + current.amount, 0);

    return {
      totalRegistered,
      actualAttendees,
      totalGiftMoneyUSD,
      totalGiftMoneyKHR
    };
  }, [guests, selectedWeddingId, loggedInHostWeddingId]);

  // FILTERED GUESTS FOR LIST (Used both in host and admin view)
  const filteredGuests = useMemo(() => {
    const targetWeddingId = currentRole === 'host' ? (loggedInHostWeddingId || selectedWeddingId) : selectedWeddingId;
    
    return guests.filter(g => {
      if (g.wedding_id !== targetWeddingId) return false;

      // search filter
      const keyword = searchQuery.toLowerCase();
      const matchesSearch = g.name.toLowerCase().includes(keyword) || g.phone.toLowerCase().includes(keyword);

      // relation filter
      const matchesRelation = relationFilter === 'ទាំងអស់' || g.relation_type === relationFilter;

      // status filter
      const matchesStatus = statusFilter === 'ទាំងអស់' || g.status === statusFilter;

      return matchesSearch && matchesRelation && matchesStatus;
    });
  }, [guests, selectedWeddingId, currentRole, loggedInHostWeddingId, searchQuery, relationFilter, statusFilter]);

  // EXPORT TO EXCEL
  const handleExportExcel = () => {
    const activeW = weddings.find(w => w.id === (loggedInHostWeddingId || selectedWeddingId));
    const title = activeW ? activeW.title : "Wedding_Guest";
    
    // Structure with Khmer titles
    const dataToExport = filteredGuests.map((g, index) => ({
      'ល.រ': index + 1,
      'ឈ្មោះភ្ញៀវ': g.name,
      'លេខទូរស័ព្ទ': g.phone,
      'ខេត្ត/ក្រុង': g.province || '-',
      'ស្រុក/ខណ្ឌ': g.district || '-',
      'ឃុំ/សង្កាត់': g.commune || '-',
      'ភូមិ': g.village || '-',
      'អាសយដ្ឋានលម្អិត': g.address_details || '-',
      'ចំនួនអ្នកមកជាមួយ (នាក់)': g.companions,
      'ប្រភេទទំនាក់ទំនង': g.relation_type,
      'ប្រាក់ចងដៃចូលរួម': formatCurrency(g.amount, g.currency),
      'ប្រភេទរូបិយប័ណ្ណ': g.currency,
      'កំណត់សម្គាល់': g.note || '-',
      'ស្ថានភាពផ្ទៀងផ្ទាត់': g.status === 'approved' ? 'បានអនុម័ត (Approved)' : 'រង់ចាំពិនិត្យ (Pending)',
      'ថ្ងៃចុះឈ្មោះ': g.created_at ? new Date(g.created_at).toLocaleString('km-KH') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Design spreadsheet columns sizes
    const wscols = [
      { wch: 6 },  // No
      { wch: 25 }, // Name
      { wch: 15 }, // Phone
      { wch: 18 }, // Province
      { wch: 18 }, // District
      { wch: 18 }, // Commune
      { wch: 18 }, // Village
      { wch: 30 }, // Address Details
      { wch: 25 }, // Companions
      { wch: 18 }, // Relation
      { wch: 20 }, // Amount
      { wch: 10 }, // Currency
      { wch: 30 }, // Note
      { wch: 22 }, // Status
      { wch: 22 }  // Date
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "បញ្ជីភ្ញៀវកិត្តិយស");
    
    XLSX.writeFile(wb, `បញ្ជីភ្ញៀវ_${title.replace(/\s+/g, '_')}.xlsx`);
    showNotification('ទាញយកឯកសារ Excel បានជោគជ័យ!', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf6f6] selection:bg-rose-100 selection:text-wedding-700 antialiased font-sans">
      <div className="flex-1 flex flex-col print:hidden">
      
      {/* Top Banner indicating Database Sync Status */}
      {/* Development / Connection Top Bar */}
      {/* 
      <div className="bg-slate-900 text-white py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs space-y-2 md:space-y-0 text-center md:text-left font-mono">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full inline-block ${connectionMode === 'supabase' && supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>
              {connectionMode === 'supabase' && supabaseConnected 
                ? `ភ្ជាប់ទៅកាន់លីង Supabase រួចរាល់` 
                : 'របៀបសាកល្បងមូលដ្ឋាន (សរសេរទៅទិន្នន័យ LocalStorage)'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setConnectionMode('demo')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${connectionMode === 'demo' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
              id="btn-mode-demo"
            >
              Demo Mode
            </button>
            <button 
              onClick={() => setConnectionMode('supabase')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${connectionMode === 'supabase' ? 'bg-[#3ecf8e] text-slate-950 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
              id="btn-mode-supabase"
            >
              Supabase Mode
            </button>
          </div>
        </div>
      </div>
      */}

      {/* Supabase connection manager drawer when selecting Supabase mode */}
      {connectionMode === 'supabase' && (
        <div className="bg-slate-800 border-b border-slate-700 text-slate-100 p-4 transition-all">
          <div className="max-w-5xl mx-auto">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowSupabaseSettings(!showSupabaseSettings)}
            >
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2 mt-1">
                <Database className="w-4 h-4" />
                <h3 className="text-sm">ការកំណត់ទំនាក់ទំនងមូលដ្ឋានទិន្នន័យ Supabase</h3>
              </div>
              <span className="p-1 px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold transition-all whitespace-nowrap">
                {showSupabaseSettings ? 'លាក់ការកំណត់ ▴' : 'បង្ហាញការកំណត់ ▾'}
              </span>
            </div>
            
            {showSupabaseSettings && (
              <div className="animate-fade-in mt-2 border-t border-slate-700 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-xs text-slate-400 mb-1 font-mono">SUPABASE_URL</label>
                    <input 
                      type="text" 
                      placeholder="https://your-project.supabase.co" 
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value.replace(/\/rest\/v1\/?$/, ''))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      id="inp-supabase-url"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-xs text-slate-400 mb-1 font-mono">SUPABASE_ANON_KEY</label>
                    <input 
                      type="password" 
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      id="inp-supabase-key"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      onClick={() => {
                        if (!supabaseUrl || !supabaseAnonKey) {
                          showNotification('សូមបំពេញ URL និង Key រួចរាល់!', 'error');
                          return;
                        }
                        setConnectionMode('supabase');
                        localStorage.setItem('wedding_manager_supabase_url', supabaseUrl);
                        localStorage.setItem('wedding_manager_supabase_key', supabaseAnonKey);
                        // Force re-trigger of DB init
                        const u = supabaseUrl;
                        setSupabaseUrl('');
                        setTimeout(() => setSupabaseUrl(u), 10);
                      }}
                      disabled={isInitializingDb}
                      className="w-full text-center bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold rounded px-4 py-1.5 text-xs transition duration-150 cursor-pointer disabled:opacity-50"
                      id="btn-supabase-connect"
                    >
                      {isInitializingDb ? 'កំពុងភ្ជាប់...' : 'បញ្ជាក់តភ្ជាប់'}
                    </button>
                  </div>
                </div>

                {dbErrorMessage && (
                  <div className="mt-3 text-xs bg-red-900/40 border border-red-700 text-red-200 p-2.5 rounded flex items-start space-x-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{dbErrorMessage}</span>
                  </div>
                )}

                <div className="mt-3 text-[11px] text-slate-400 flex flex-wrap gap-x-4">
                  <span>* ប្រសិនបើអ្នកមិនទាន់បានបង្កើត table SQL សម្បូរព័ត៌មាននៅក្នុង Supabase ទេ សូមចុចចម្លង DDL setup code នៅផ្នែកខាងក្រោមទំព័រនេះ។</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Elegant Header Area (Bento Grid Theme) */}
      <header className="bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between px-6 py-4 md:py-0 md:h-16 shrink-0 shadow-sm gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 flex items-center justify-center w-12 h-12 bg-white rounded-xl border border-slate-100 shadow-xs text-emerald-600">
            <Users className="w-7 h-7" />
            {/* Tiny ornament heart badge */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xs border-2 border-white">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
              ប្រព័ន្ធគ្រប់គ្រងភ្ញៀវចូលរួមកម្មវិធី
            </h1>
            <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500 font-semibold italic">
              Event Guest Management System
            </p>
          </div>
        </div>

        {/* Core App Role Switchers in a clean Bento styled Navigation Bar */}
        <nav className="flex bg-slate-100 p-1 rounded-xl relative z-10 shadow-inner">
          <button
            onClick={() => handleRoleSwitch('guest')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center space-x-1 cursor-pointer ${
              currentRole === 'guest'
                ? 'bg-white text-wedding-600 shadow-sm'
                : 'text-slate-550 hover:text-slate-800'
            }`}
            id="role-guest-view"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>ទំព័រចុះឈ្មោះ (Guest)</span>
          </button>
          
          <button
            onClick={() => handleRoleSwitch('admin')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center space-x-1 cursor-pointer ${
              currentRole === 'admin'
                ? 'bg-white text-wedding-600 shadow-sm'
                : 'text-slate-550 hover:text-slate-800'
            }`}
            id="role-admin-view"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>អ្នកសម្របសម្រួល (Admin)</span>
          </button>
          
          <button
            onClick={() => handleRoleSwitch('host')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center space-x-1 cursor-pointer ${
              currentRole === 'host'
                ? 'bg-white text-wedding-600 shadow-sm'
                : 'text-slate-550 hover:text-slate-800'
            }`}
            id="role-host-view"
          >
            <Users className="w-3.5 h-3.5" />
            <span>ម្ចាស់កម្មវិធី (Host)</span>
          </button>
        </nav>
      </header>

      {/* Floating Status Notification Banner */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`shadow-xl rounded-lg p-4 border flex items-center space-x-3 max-w-sm ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <CheckCircle className={`w-5 h-5 shrink-0 ${notification.type === 'success' ? 'text-emerald-500' : notification.type === 'error' ? 'text-red-500' : 'text-slate-500'}`} />
            <p className="text-xs font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative z-10">

        {/* ========================================================================= */}
        {/* 1. PUBLIC GUEST VIEW */}
        {/* ========================================================================= */}
        {currentRole === 'guest' && (
          <div className="max-w-2xl mx-auto">
            
            {/* Wedding selection dropdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <label className="block text-slate-700 font-medium text-sm mb-2 text-center md:text-left">
                សូមជ្រើសរើសកម្មវិធីដែលអ្នកត្រូវចូលរួម៖
              </label>
              {weddings.length === 0 ? (
                <div className="py-2.5 text-center text-slate-400 text-xs">
                  មិនទាន់មានកម្មវិធីណាមួយត្រូវបានបង្កើតឡើងនៅឡើយទេ។ សូមបង្កើតក្នុងឋានៈជា Admin ជាមុនសិន។
                </div>
              ) : (
                <select
                  value={selectedWeddingId}
                  onChange={(e) => {
                    setSelectedWeddingId(e.target.value);
                    setRegistrationSuccess(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:ring-2 focus:ring-wedding-500 focus:outline-none transition-all cursor-pointer text-sm"
                  id="sel-wedding-guest-view"
                >
                  {weddings.map((w) => (
                    <option key={w.id} value={w.id}>{w.title}</option>
                  ))}
                </select>
              )}
            </div>

            {registrationSuccess ? (
              /* Success Landing Card */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center relative overflow-hidden">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-50 rounded-full flex items-center justify-center -z-10 animate-pulse"></div>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">ការចុះឈ្មោះរបស់អ្នកបានជោគជ័យ!</h3>
                <p className="text-slate-500 text-xs mt-3 leading-relaxed max-w-md mx-auto">
                  សូមអរគុណជាអនេកចំពោះការចំណាយពេលចុះឈ្មោះចូលរួមកម្មវិធី។ ព័ត៌មានរបស់អ្នកកំពុងស្ថិតក្នុងការត្រួតពិនិត្យ និងយល់ព្រមពីអ្នកសម្របសម្រួល។
                </p>

                {registeredGuestId && (
                  <div className="mt-6">
                    <p className="text-slate-700 text-sm font-bold mb-3">QR Code របស់អ្នកសម្រាប់ចូលរួមកម្មវិធី៖</p>
                    <div className="mx-auto inline-block bg-white p-3 border border-slate-200 rounded-2xl shadow-sm">
                      <QRCodeSVG value={registeredGuestId} size={150} />
                    </div>
                    <p className="text-slate-500 text-[11px] mt-2">សូមបង្ហាញ QR Code នេះនៅពេលមកដល់ទីតាំងកម្មវិធី</p>
                  </div>
                )}

                {(activeWedding?.khqr_img_url || activeWedding?.khqr_usd_img_url) && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <p className="text-slate-600 text-sm font-semibold mb-4 flex items-center justify-center gap-1">
                      <Heart className="w-4 h-4 fill-rose-500 stroke-rose-500" />
                      អ្នកក៏អាចធ្វើការចងដៃជាប្រាក់ឌីជីថលតាម KHQR ខាងក្រោមនេះ៖
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                      {activeWedding?.khqr_img_url && (
                        <div className="max-w-xs bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner relative group w-full">
                          <img 
                            src={activeWedding.khqr_img_url} 
                            alt="Wedding KHQR Code KHR" 
                            className="w-full h-auto object-contain rounded-xl"
                            onError={(e)=>{
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('placehold.co')) {
                                target.src = "https://placehold.co/400x500?text=Invalid+QR+Image+URL\\nPlease+use+Direct+Link+(.jpg/.png)";
                              }
                            }}
                          />
                          <div className="text-[11px] text-slate-700 mt-3 text-center font-bold bg-slate-200/60 py-1.5 rounded-lg border border-slate-200">
                            គណនីប្រាក់រៀល (KHR)
                          </div>
                        </div>
                      )}

                      {activeWedding?.khqr_usd_img_url && (
                        <div className="max-w-xs bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner relative group w-full">
                          <img 
                            src={activeWedding.khqr_usd_img_url} 
                            alt="Wedding KHQR Code USD" 
                            className="w-full h-auto object-contain rounded-xl"
                            onError={(e)=>{
                              const target = e.target as HTMLImageElement;
                              if (!target.src.includes('placehold.co')) {
                                target.src = "https://placehold.co/400x500?text=Invalid+QR+Image+URL\\nPlease+use+Direct+Link+(.jpg/.png)";
                              }
                            }}
                          />
                          <div className="text-[11px] text-slate-700 mt-3 text-center font-bold bg-slate-200/60 py-1.5 rounded-lg border border-slate-200">
                            គណនីប្រាក់ដុល្លារ (USD)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setRegistrationSuccess(false)}
                  className="mt-6 inline-flex items-center space-x-2 text-xs font-semibold text-wedding-700 hover:text-wedding-800 border border-wedding-200 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-full transition duration-150 cursor-pointer"
                  id="btn-register-again"
                >
                  <span>ចុះឈ្មោះភ្ញៀវផ្សេងទៀត</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Public Registration Form */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
                <div className="flex items-center space-x-3 border-b border-rose-50 pb-4 mb-6">
                  <div className="p-2.5 bg-rose-50 text-wedding-600 rounded-xl">
                    <Heart className="w-5 h-5 fill-wedding-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">ទម្រង់ចុះឈ្មោះភ្ញៀវចូលរួម</h2>
                    <p className="text-slate-400 text-xs mt-0.5">សូមបំពេញព័ត៌មានខាងក្រោមដើម្បីឱ្យម្ចាស់ដើមការងាយស្រួលរៀបចំទីកន្លែង។</p>
                  </div>
                </div>

                <form onSubmit={handleRegisterGuest} className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-medium text-xs mb-1.5 flex items-center gap-1">
                      <span>ឈ្មោះរបស់អ្នក (Guest Name)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. សុខ ម៉ារ៉ា"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-wedding-500 focus:bg-white focus:outline-none transition-all"
                      id="inp-guest-name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-medium text-xs mb-1.5 flex items-center gap-1">
                        <span>លេខទូរស័ព្ទ (Phone Number)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="ឧ. 012345678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-wedding-500 focus:bg-white focus:outline-none transition-all"
                        id="inp-guest-phone"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium text-xs mb-1.5">
                        ប្រភេទទំនាក់ទំនង (Relation Type)
                      </label>
                      <select
                        value={guestRelation}
                        onChange={(e) => setGuestRelation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-wedding-500 focus:outline-none transition-all cursor-pointer"
                        id="sel-guest-relation"
                      >
                        <option value="ខាងកូនក្រមុំ">ខាងកូនក្រមុំ (Bride Only)</option>
                        <option value="ខាងកូនកំលោះ">ខាងកូនកំលោះ (Groom Only)</option>
                        <option value="មិត្តភក្តិ">មិត្តភក្តិ (Friend)</option>
                        <option value="ផ្សេងៗ">ផ្សេងៗ (Other)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-medium text-xs mb-1.5">
                        count of visitors (Number of Companions)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="ឧ. 0"
                        value={guestCompanions}
                        onChange={(e) => setGuestCompanions(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-wedding-500 focus:bg-white focus:outline-none transition-all"
                        id="inp-guest-companions"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium text-xs mb-1.5">
                        ចំនួនប្រាក់ចងដៃ (Gift Amount)
                      </label>
                      <div className="relative flex">
                        <select
                          value={guestCurrency}
                          onChange={(e) => setGuestCurrency(e.target.value as 'USD'|'KHR')}
                          className="bg-slate-50 border border-slate-200 border-r-0 rounded-l-xl px-3 py-2.5 text-slate-700 text-sm focus:ring-2 focus:ring-wedding-500 focus:outline-none transition-all cursor-pointer font-semibold z-10"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="KHR">KHR (៛)</option>
                        </select>
                        <input
                          type="number"
                          placeholder={guestCurrency === 'USD' ? "ឧ. 50" : "ឧ. 200000"}
                          value={guestAmount}
                          onChange={(e) => setGuestAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-wedding-500 focus:bg-white focus:outline-none transition-all -ml-[1px]"
                          id="inp-guest-amount"
                        />
                      </div>
                    </div>
                  </div>

                  {/* អាសយដ្ឋានភ្ញៀវ (Guest Address) */}
                  <div className="bg-rose-50/20 p-4.5 rounded-2xl border border-rose-100/40 space-y-3.5">
                    <span className="text-xs font-bold text-rose-800 tracking-wider uppercase block border-b border-rose-100/50 pb-1.5 font-sans">អាសយដ្ឋា​នស្នាក់នៅ (YOUR ADDRESS)</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-600 text-[11px] font-medium mb-1 flex items-center gap-1 font-sans">
                          <span>ខេត្ត/រាជធានី (Province)</span>
                        </label>
                        <select
                          value={selectedProvinceId}
                          onChange={(e) => {
                            setSelectedProvinceId(e.target.value);
                            setSelectedDistrictId('');
                            setSelectedCommuneId('');
                            setSelectedVillageId('');
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all cursor-pointer font-sans"
                          id="sel-guest-province"
                        >
                          <option value="">-- ជ្រើសរើសខេត្ត/រាជធានី --</option>
                          {provincesList.map(p => (
                            <option key={p.id} value={p.id}>{p.name_km} ({p.name_en})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 text-[11px] font-medium mb-1 flex items-center gap-1 font-sans">
                          <span>ស្រុក/ខណ្ឌ (District)</span>
                        </label>
                        <select
                          value={selectedDistrictId}
                          onChange={(e) => {
                            setSelectedDistrictId(e.target.value);
                            setSelectedCommuneId('');
                            setSelectedVillageId('');
                            if (e.target.value !== 'custom_district') {
                              const dist = districtsList.find(d => d.id === e.target.value);
                              if (dist) setGuestDistrict(dist.name_km);
                            } else {
                              setGuestDistrict('');
                            }
                          }}
                          disabled={!selectedProvinceId}
                          className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all cursor-pointer font-sans"
                          id="sel-guest-district"
                        >
                          <option value="">-- {selectedProvinceId ? 'ជ្រើសរើសស្រុក/ខណ្ឌ' : 'សូមជ្រើសរើសខេត្តមុនសិន'} --</option>
                          {districtsList.map(d => (
                            <option key={d.id} value={d.id}>{d.name_km} ({d.name_en})</option>
                          ))}
                          {selectedProvinceId && (
                            <option value="custom_district">+ បញ្ចូលឈ្មោះស្រុក/ខណ្ឌផ្សេងទៀត... (Custom)</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Custom District Text Input if needed */}
                    {selectedDistrictId === 'custom_district' && (
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 animate-fade-in space-y-1">
                        <label className="block text-slate-600 text-[11px] font-medium font-sans">ឈ្មោះស្រុក/ខណ្ឌ ផ្សេងទៀត (Custom District Name)</label>
                        <input
                          type="text"
                          placeholder="ឧ. ស្រុកគិរីវង់"
                          value={guestDistrict}
                          onChange={(e) => setGuestDistrict(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all font-sans"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-slate-600 text-[11px] font-medium mb-1 flex items-center gap-1 font-sans">
                          <span>ឃុំ/សង្កាត់ (Commune)</span>
                        </label>
                        <select
                          value={selectedCommuneId}
                          onChange={(e) => {
                            setSelectedCommuneId(e.target.value);
                            setSelectedVillageId('');
                            if (e.target.value !== 'custom_commune') {
                              const comm = communesList.find(c => c.id === e.target.value);
                              if (comm) setGuestCommune(comm.name_km);
                            } else {
                              setGuestCommune('');
                            }
                          }}
                          disabled={!selectedDistrictId || selectedDistrictId === 'custom_district'}
                          className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all cursor-pointer font-sans"
                          id="sel-guest-commune"
                        >
                          <option value="">-- {selectedDistrictId === 'custom_district' ? 'សូមបំពេញឈ្មោះស្រុកខាងលើ' : selectedDistrictId ? 'ជ្រើសរើសឃុំ/សង្កាត់' : 'សូមជ្រើសរើសស្រុកមុនសិន'} --</option>
                          {communesList.map(c => (
                            <option key={c.id} value={c.id}>{c.name_km} ({c.name_en})</option>
                          ))}
                          {selectedDistrictId && selectedDistrictId !== 'custom_district' && (
                            <option value="custom_commune">+ បញ្ចូលឈ្មោះឃុំ/សង្កាត់ផ្សេងទៀត... (Custom)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 text-[11px] font-medium mb-1 flex items-center gap-1 font-sans">
                          <span>ភូមិ (Village)</span>
                        </label>
                        <select
                          value={selectedVillageId}
                          onChange={(e) => {
                            setSelectedVillageId(e.target.value);
                            if (e.target.value !== 'custom_village') {
                              const vill = villagesList.find(v => v.id === e.target.value);
                              if (vill) setGuestVillage(vill.name_km);
                            } else {
                              setGuestVillage('');
                            }
                          }}
                          disabled={!selectedCommuneId || selectedCommuneId === 'custom_commune'}
                          className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all cursor-pointer font-sans"
                          id="sel-guest-village"
                        >
                          <option value="">-- {selectedCommuneId === 'custom_commune' ? 'សូមបំពេញឈ្មោះឃុំខាងលើ' : selectedCommuneId ? (villagesList.length > 0 ? 'ជ្រើសរើសភូមិ' : 'គ្មានទិន្នន័យភូមិ (សូមបញ្ចូលខាងក្រោម)') : 'សូមជ្រើសរើសឃុំមុនសិន'} --</option>
                          {villagesList.map(v => (
                            <option key={v.id} value={v.id}>{v.name_km} ({v.name_en})</option>
                          ))}
                          {selectedCommuneId && selectedCommuneId !== 'custom_commune' && (
                            <option value="custom_village">+ បញ្ចូលឈ្មោះភូមិផ្សេងទៀត... (Custom)</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Custom Commune Name Input field if needed */}
                    {selectedCommuneId === 'custom_commune' && (
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 animate-fade-in space-y-1">
                        <label className="block text-slate-600 text-[11px] font-medium font-sans">ឈ្មោះឃុំ/សង្កាត់ ផ្សេងទៀត (Custom Commune Name)</label>
                        <input
                          type="text"
                          placeholder="ឧ. ឃុំអង្គប្រាសាទ"
                          value={guestCommune}
                          onChange={(e) => setGuestCommune(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all font-sans"
                        />
                      </div>
                    )}

                    {/* Custom Village Name Input field if needed */}
                    {(selectedVillageId === 'custom_village' || (selectedCommuneId && selectedCommuneId !== 'custom_commune' && villagesList.length === 0)) && (
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 animate-fade-in space-y-1">
                        <label className="block text-slate-600 text-[11px] font-medium font-sans">ឈ្មោះភូមិ ផ្សេងទៀត (Custom Village Name)</label>
                        <input
                          type="text"
                          placeholder="ឧ. ភូមិអូរ"
                          value={guestVillage}
                          onChange={(e) => setGuestVillage(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all font-sans"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-600 text-[11px] font-medium mb-1">អាសយដ្ឋានលម្អិត (House No./Street/Details)</label>
                      <input
                        type="text"
                        placeholder="ឧ. ផ្ទះលេខ ១២A ផ្លូវ ៧៨"
                        value={guestAddressDetails}
                        onChange={(e) => setGuestAddressDetails(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all"
                        id="inp-guest-address-details"
                      />
                    </div>
                  </div>                         

                  <div>
                    <label className="block text-slate-700 font-medium text-xs mb-1.5">
                      កំណត់សម្គាល់ជូនពរ (Notes / Blessings)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="ឧ. សូមជូនពរឱ្យមានសុភមង្គល និងជោគជ័យ!"
                      value={guestNote}
                      onChange={(e) => setGuestNote(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:ring-2 focus:ring-wedding-500 focus:bg-white focus:outline-none transition-all"
                      id="inp-guest-note"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || weddings.length === 0}
                    className="w-full py-3 px-4 bg-wedding-600 hover:bg-wedding-700 disabled:bg-slate-300 disabled:cursor-not-allowed justify-center items-center gap-1 text-white font-semibold rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer flex"
                    id="btn-guest-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>កំពុងចុះឈ្មោះ...</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 fill-white" />
                        <span>ចុះឈ្មោះឥឡូវនេះ (Register Now)</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ADMIN VIEW (Wedding Coordinator) */}
        {/* ========================================================================= */}
        {currentRole === 'admin' && (
          <div className="space-y-6">
            {!isAdminLoggedIn ? (
              /* Admin Login Form */
              <div className="bg-white rounded-2xl border border-rose-100 shadow-md p-6 max-w-md mx-auto">
                <div className="flex flex-col items-center mb-6">
                  <div className="p-3.5 bg-rose-50 text-wedding-600 rounded-full mb-2">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">ផ្ទៀងផ្ទាត់គណនី Admin</h3>
                  <p className="text-slate-400 text-xs mt-1 text-center">សូមបំពេញព័ត៌មានខាងក្រោម ដើម្បីគ្រប់គ្រងបញ្ជីភ្ញៀវ។</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1">ឈ្មោះគណនី (Username)</label>
                    <input
                      type="text"
                      placeholder="ចម្លង៖ admin123"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-wedding-500 focus:outline-none transition-all"
                      id="inp-admin-user"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1">លេខសម្ងាត់ (Password)</label>
                    <input
                      type="password"
                      placeholder="ចម្លង៖ password123"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-wedding-500 focus:outline-none transition-all"
                      id="inp-admin-pass"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-wedding-600 hover:bg-wedding-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                    id="btn-admin-login-submit"
                  >
                    បញ្ចូលគណនីសម្របសម្រួល
                  </button>
                </form>

                <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col space-y-1 text-[11px] text-slate-400 text-center">
                  <span>* គណនីសាកល្បង៖ <strong className="text-slate-600 font-mono">admin123</strong> / <strong className="text-slate-600 font-mono">password123</strong></span>
                </div>
              </div>
            ) : (
              /* Logged Admin Dashboard */
              <div className="space-y-6">
                
                {/* Admin Management Toolbar */}
                <div className="bg-white rounded-2xl border border-rose-100 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 uppercase font-semibold">ជ្រើសរើសកម្មវិធីជាក់ស្តែង</label>
                      <select
                        value={selectedWeddingId}
                        onChange={(e) => setSelectedWeddingId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none text-xs cursor-pointer min-w-[200px]"
                        id="sel-wedding-admin"
                      >
                        {weddings.map((w) => (
                          <option key={w.id} value={w.id}>{w.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="self-end">
                      <button
                        onClick={() => setShowAddWeddingModal(true)}
                        className="bg-wedding-50 hover:bg-wedding-100 border border-wedding-200 text-wedding-700 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
                        id="btn-add-wedding-modal"
                      >
                        <Plus className="w-4 h-4" />
                        <span>បង្កើតកម្មវិធីថ្មី</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-auto">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">គណនីសម្របសម្រួល</p>
                      <p className="text-xs font-semibold text-slate-700">Admin Coordinator</p>
                    </div>
                    <button
                      onClick={() => setIsAdminLoggedIn(false)}
                      className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition cursor-pointer"
                      title="ចាកចេញ"
                      id="btn-admin-logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Guest Database Table */}
                <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-rose-50 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">ស្វែងរក និងអនុម័តភ្ញៀវការ ({filteredGuests.length} នាក់)</h2>
                      <p className="text-[11px] text-slate-400">អ្នកអាចយល់ព្រម ឬលុបទិន្នន័យភ្ញៀវដែលបានស្កេនចុះឈ្មោះដោយស្វ័យប្រវត្ត។</p>
                    </div>

                     <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setLastScannedResult(null);
                          setShowQrScanner(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-xs cursor-pointer animate-fade-in text-nowrap"
                        id="btn-scan-qr-admin"
                      >
                        <Scan className="w-4 h-4 text-white" />
                        <span>ស្កេន QR Code ចូលតុ</span>
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center space-x-1.5 shadow-xs cursor-pointer mr-2 animate-fade-in"
                        id="btn-print-checkin-admin"
                      >
                        <Printer className="w-4 h-4 text-slate-500" />
                        <span>ព្រីនបញ្ជីឈ្មោះ</span>
                      </button>

                      <button
                        onClick={() => setShowAddGuestModal(true)}
                        className="bg-wedding-600 hover:bg-wedding-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
                        id="btn-add-guest-modal"
                      >
                        <Plus className="w-4.5 h-4.5" />
                        <span>បញ្ចូលភ្ញៀវផ្ទាល់ដៃ</span>
                      </button>
                    </div>
                  </div>

                  {/* Filters Area */}
                  <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="ស្វែងរកតាម ឈ្មោះ ឬ លេខទូរស័ព្ទ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-wedding-500 transition-all"
                        id="inp-admin-search"
                      />
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={relationFilter}
                        onChange={(e) => setRelationFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                        id="sel-admin-filter-relation"
                      >
                        <option value="ទាំងអស់">ប្រភេទទំនាក់ទំនង៖ ទាំងអស់</option>
                        <option value="ខាងកូនក្រមុំ">ខាងកូនក្រមុំ</option>
                        <option value="ខាងកូនកំលោះ">ខាងកូនកំលោះ</option>
                        <option value="មិត្តភក្តិ">មិត្តភក្តិ</option>
                        <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                        id="sel-admin-filter-status"
                      >
                        <option value="ទាំងអស់">ស្ថានភាព៖ ទាំងអស់</option>
                        <option value="approved">បានអនុម័ត (Approved)</option>
                        <option value="pending">រង់ចាំការពិនិត្យ (Pending)</option>
                      </select>
                    </div>
                  </div>

                  {/* Desktop Guest Table */}
                  <div className="overflow-x-auto min-h-[300px]">
                    {filteredGuests.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 space-y-2">
                        <Info className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-xs">មិនមានទិន្នន័យភ្ញៀវដែលត្រូវគ្នានឹងលក្ខខណ្ឌចម្រោះទេ!</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs text-slate-600" id="tbl-admin-guests">
                        <thead className="bg-[#fff9f9] text-slate-700 uppercase tracking-wider text-[11px] border-b border-rose-50">
                          <tr>
                            <th className="px-5 py-3.5">ភ្ញៀវកិត្តិយស</th>
                            <th className="px-5 py-3.5">ទូរស័ព្ទ / ទំនាក់ទំនង</th>
                            <th className="px-5 py-3.5">អ្នករួមដំណើរ (នាក់)</th>
                            <th className="px-5 py-3.5">ប្រាក់ចងដៃ ($)</th>
                            <th className="px-5 py-3.5">កំណត់សម្គាល់</th>
                            <th className="px-5 py-3.5 text-center">ស្ថានភាព</th>
                            <th className="px-5 py-3.5 text-center">ម៉ោងចូលតុ (Check-in)</th>
                            <th className="px-5 py-3.5 text-right">សកម្មភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredGuests.map((g) => (
                            <tr key={g.id} className="hover:bg-rose-50/20 transition duration-150">
                              <td className="px-5 py-4">
                                <span className="font-bold text-slate-800 block text-sm">{g.name}</span>
                                <div className="flex justify-between items-center mt-0.5 gap-2">
                                  <span className="text-[10px] text-slate-400">ID: {g.id.substr(0,8)}</span>
                                </div>
                                {g.province && (
                                  <div className="flex items-center text-[10px] text-slate-500 mt-1 max-w-[200px]" title={[g.address_details, g.village, g.commune, g.district, g.province].filter(Boolean).join(', ')}>
                                    <MapPin className="w-3.5 h-3.5 text-rose-400 mr-0.5 shrink-0" />
                                    <span className="truncate">
                                      {[g.address_details, g.village, g.commune, g.district, g.province].filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-mono text-xs block mb-1 text-slate-700">{g.phone}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 inline-block">
                                  {g.relation_type}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center font-bold text-slate-800 text-sm">
                                {g.companions} នាក់
                              </td>
                              <td className="px-5 py-4 text-pink-600 font-bold text-sm whitespace-nowrap">
                                {formatCurrency(g.amount, g.currency)}
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-slate-500 max-w-xs break-words italic line-clamp-2" title={g.note}>
                                  {g.note || '-'}
                                </p>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                  g.status === 'approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                }`}>
                                  {g.status === 'approved' ? 'បានអនុម័ត' : 'រង់ចាំពិនិត្យ'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                {g.is_present ? (
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 shadow-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      ចូលតុរួចរាល់
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 font-semibold">{g.check_in_time}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">មិនទាន់ចូលតុ</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleTogglePresence(g.id, !!g.is_present)}
                                    className={`py-1 px-2.5 font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-0.5 border ${
                                      g.is_present
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                        : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                                    }`}
                                    title={g.is_present ? "លុបវត្តមាន" : "កត់ត្រាវត្តមាន (ចូលតុ)"}
                                    id={`btn-presence-${g.id}`}
                                  >
                                    <UserCheck className={`w-3.5 h-3.5 ${g.is_present ? 'text-slate-450' : 'text-sky-500'}`} />
                                    <span>{g.is_present ? 'ចាកចេញ' : 'ចូលតុ'}</span>
                                  </button>

                                  {g.status === 'pending' && (
                                    <button
                                      onClick={() => handleApproveGuest(g.id)}
                                      className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-0.5"
                                      title="យល់ព្រម"
                                      id={`btn-approve-${g.id}`}
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>ចុចអនុម័ត</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteGuest(g.id)}
                                    className="p-1 px-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                                    title="លុបភ្ញៀវ"
                                    id={`btn-delete-${g.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. HOST VIEW (Wedding Owner/Bride & Groom) */}
        {/* ========================================================================= */}
        {currentRole === 'host' && (
          <div className="space-y-6">
            {!loggedInHostWeddingId ? (
              /* Host Login Card */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-md mx-auto">
                <div className="flex flex-col items-center mb-6">
                  <div className="p-3.5 bg-pink-50 text-wedding-600 rounded-full mb-2">
                    <Heart className="w-6 h-6 fill-wedding-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">ផ្ទៀងផ្ទាត់គណនី ម្ចាស់កម្មវិធី</h3>
                  <p className="text-slate-400 text-xs mt-1 text-center">សូមបំពេញព័ត៌មានខាងក្រោម ដែលបានកំណត់ដោយ Admin Coordinator។</p>
                </div>

                <form onSubmit={handleHostLogin} className="space-y-4">
                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1">ឈ្មោះគណនីម្ចាស់ការ (Host Username)</label>
                    <input
                      type="text"
                      placeholder="ចម្លង៖ wedding123"
                      value={hostUsername}
                      onChange={(e) => setHostUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-wedding-500 focus:outline-none transition-all"
                      id="inp-host-user"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-xs font-semibold mb-1">លេខសម្ងាត់ម្ចាស់ការ (Host Password)</label>
                    <input
                      type="password"
                      placeholder="ចម្លង៖ password123"
                      value={hostPassword}
                      onChange={(e) => setHostPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-wedding-500 focus:outline-none transition-all"
                      id="inp-host-pass"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-wedding-600 hover:bg-wedding-700 text-white font-semibold rounded-xl text-xs transition duration-150 shadow-sm cursor-pointer"
                    id="btn-host-login-submit"
                  >
                    ចូលពិនិត្យរបាយការណ៍
                  </button>

                  <div className="mt-5 border-t border-slate-100 pt-5 flex flex-col space-y-3 items-center">
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-xs text-slate-500">មិនទាន់មានគណនីមែនទេ?</span>
                      <button
                        type="button"
                        onClick={() => setShowAddWeddingModal(true)}
                        className="text-xs font-bold text-wedding-600 hover:text-wedding-700 underline cursor-pointer transition-colors"
                      >
                        ចុះឈ្មោះបង្កើតកម្មវិធីថ្មីនៅទីនេះ
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      * គណនីសាកល្បង៖ <strong className="text-slate-600 font-mono">wedding123</strong> / <strong className="text-slate-600 font-mono">password123</strong>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              /* Host Detailed Dashboard and Analytics */
              <div className="space-y-6 animate-fade-in">
                
                {/* Host Title & Header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-100 uppercase tracking-wider">
                      ម្ចាស់កម្មវិធី (Host)
                    </span>
                    <h2 className="text-base md:text-lg font-bold text-slate-900 mt-1">
                      {activeWedding?.title || 'កម្មវិធី'}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setLastScannedResult(null);
                        setShowQrScanner(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-sm hover:shadow-md cursor-pointer animate-fade-in text-nowrap"
                      id="btn-scan-qr-host"
                    >
                      <Scan className="w-4 h-4 text-white" />
                      <span>ស្កេន QR Code ចូលតុ</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      id="btn-print-checkin-host"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                      <span>ព្រីនបញ្ជីឈ្មោះ</span>
                    </button>

                    <button
                      onClick={handleExportExcel}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      id="btn-export-excel"
                    >
                      <Download className="w-4 h-4" />
                      <span>Excel</span>
                    </button>

                    <button
                      onClick={() => setLoggedInHostWeddingId(null)}
                      className="p-2.5 bg-red-55 text-red-655 hover:bg-red-100 rounded-xl transition cursor-pointer"
                      title="ចាកចេញ"
                      id="btn-host-logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3 Styled Statistical Cards (Bento Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Total Registered */}
                  <div className="bg-pink-50 border border-pink-100 rounded-2xl p-6 shadow-sm flex items-center space-x-4 relative overflow-hidden group transition duration-200 hover:shadow-md">
                    <div className="absolute right-0 bottom-0 p-4 opacity-5 text-pink-600 select-none group-hover:scale-125 transition duration-300">
                      <FileText className="w-24 h-24" />
                    </div>
                    <div className="p-4 bg-white text-pink-600 rounded-2xl shadow-sm">
                      <FileText className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs text-pink-700 font-bold uppercase tracking-wider">ចំនួនភ្ញៀវចុះឈ្មោះសរុប</span>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1 font-mono">
                        {stats.totalRegistered} <span className="text-xs font-normal text-slate-500 font-sans">នាក់</span>
                      </h3>
                      <p className="text-[10px] text-pink-600 mt-0.5 font-bold">* រាប់បញ្ចូលទាំងភ្ញៀវមិនទាន់អនុម័ត</p>
                    </div>
                  </div>

                  {/* Card 2: Actual Attendees */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm flex items-center space-x-4 relative overflow-hidden group transition duration-200 hover:shadow-md">
                    <div className="absolute right-0 bottom-0 p-4 opacity-5 text-indigo-600 select-none group-hover:scale-125 transition duration-300">
                      <Users className="w-24 h-24" />
                    </div>
                    <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider">ចំនួនអ្នកចូលរួមជាក់ស្តែង</span>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 mt-1 font-mono">
                        {stats.actualAttendees} <span className="text-xs font-normal text-slate-500 font-sans">នាក់</span>
                      </h3>
                      <p className="text-[10px] text-indigo-600 mt-0.5 font-bold">* គិតតែភ្ញៀវដែលបានអនុម័តរួច</p>
                    </div>
                  </div>

                  {/* Card 3: Total Gift Money */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm flex items-center space-x-4 relative overflow-hidden group transition duration-200 hover:shadow-md">
                    <div className="absolute right-0 bottom-0 p-4 opacity-5 text-emerald-600 select-none group-hover:scale-125 transition duration-300">
                      <DollarSign className="w-24 h-24" />
                    </div>
                    <div className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">សរុបប្រាក់ចងដៃ</span>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1 font-mono leading-tight">
                        {formatCurrency(stats.totalGiftMoneyUSD, 'USD')} <br className="hidden md:block" />
                        <span className="text-lg md:text-xl text-emerald-700">{formatCurrency(stats.totalGiftMoneyKHR, 'KHR')}</span>
                      </h3>
                      <p className="text-[10px] text-emerald-600 mt-0.5 font-bold">* គណនាយោងតាមភ្ញៀវអនុម័ត</p>
                    </div>
                  </div>
                </div>

                {/* KHQR SETTINGS SECTION FOR HOST */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowKhqrSettings(!showKhqrSettings)}>
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 leading-snug">
                          ⚙️ ការកំណត់ KHQR លុយចងដៃ (បច្ចុប្បន្នភាព)
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">បើក/បិទ KHQR ឬ បន្ថែម-កែប្រែ រូបភាព QR Code សម្រាប់ប្រាក់រៀល-ដុល្លារ</p>
                      </div>
                    </div>
                    <span className="p-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-550 rounded-lg text-xs font-bold transition-all whitespace-nowrap">
                      {showKhqrSettings ? 'លាក់ការកំណត់ ▴' : 'បង្ហាញការកំណត់ ▾'}
                    </span>
                  </div>

                  {showKhqrSettings && (
                    <div className="pt-5 animate-fade-in font-sans border-t border-slate-100 mt-5">
                      <form onSubmit={handleUpdateKhqrSettings} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">Link រូបភាព KHQR សម្រាប់ប្រាក់រៀល (KHR) *</label>
                          <input
                            type="text"
                            placeholder="ឧទាហរណ៍៖ https://i.ibb.co/..."
                            value={editKhqrUrl}
                            onChange={(e) => setEditKhqrUrl(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-xs font-mono focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">Link រូបភាព KHQR សម្រាប់ប្រាក់ដុល្លារ (USD) (ស្រេចចិត្ត)</label>
                          <input
                            type="text"
                            placeholder="ឧទាហរណ៍៖ https://i.ibb.co/..."
                            value={editKhqrUsdUrl}
                            onChange={(e) => setEditKhqrUsdUrl(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 text-xs font-mono focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition-all"
                          />
                        </div>
                        
                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={isSavingKhqr}
                            className={`px-5 py-2 text-xs text-white font-bold rounded-xl transition shadow-sm ${
                              isSavingKhqr ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 hover:shadow-md'
                            }`}
                          >
                            {isSavingKhqr ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកលេខកូដ KHQR'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* TELEGRAM NOTIFICATION BOT SETTINGS SECTION */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTelegramSettings(!showTelegramSettings)}>
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-1.5 leading-snug">
                          <span>⚙️ ការកំណត់ប្រព័ន្ធតេឡេក្រាម Telegram Bot ផ្តល់ដំណឹង</span>
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-full">ឥតគិតថ្លៃ ១០០%</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">ទទួលសារលម្អិតភ្លាមៗលើតេឡេក្រាមរាល់ពេលមានភ្ញៀវចុះឈ្មោះ ឬចូលតុ (Check-in)</p>
                      </div>
                    </div>
                    <span className="p-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-550 rounded-lg text-xs font-bold transition-all whitespace-nowrap">
                      {showTelegramSettings ? 'លាក់ការកំណត់ ▴' : 'បង្ហាញការកំណត់ ▾'}
                    </span>
                  </div>

                  {showTelegramSettings && (
                    <div className="pt-5 space-y-5 animate-fade-in font-sans">
                      {/* Telegram Bot Description & Fast Setup Instructions */}
                      <div className="bg-gradient-to-r from-sky-50/50 to-indigo-50/50 border border-sky-100 rounded-xl p-4 text-xs text-sky-950">
                        <h4 className="font-extrabold text-sky-900 mb-1.5 flex items-center gap-1">
                          <span>💡 ការណែនាំរហ័សអំពីរបៀបបង្កើត Telegram Notification Bot ៖</span>
                        </h4>
                        <ol className="list-decimal list-inside space-y-1.5 text-slate-600 tracking-wide text-[11px]">
                          <li>ស្វែងរក <strong className="text-sky-700">@BotFather</strong> លើកម្មវិធី Telegram រួចផ្ញើសារ <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">/newbot</code> ដើម្បីបង្កើត Bot រួចចម្លងយក <strong>HTTP API Token</strong>។</li>
                          <li>ចងចាំថាត្រូវចុច <strong>Start (ចាប់ផ្តើម)</strong> ឆាតទៅកាន់ Bot ដែលទើបបង្កើតរួចនោះ!</li>
                          <li>ដើម្បីទទួលបាន Chat ID ៖ ស្វែងរកគ្រុប ឬផ្ញើសារទៅ <strong className="text-sky-700">@userinfobot</strong> ផ្ញើសាររក ID ផ្ទាល់ខ្លួន ឬទាញ Bot ចូលគ្រុប (Group) រួចឆែក Chat ID (ជាទូទៅផ្តើមដោយសញ្ញាដក <strong>-</strong> សម្រាប់គ្រុប)។</li>
                        </ol>
                      </div>

                      <form onSubmit={handleUpdateTelegramSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">Telegram Bot Token (HTTP API Token)</label>
                          <input
                            type="text"
                            placeholder="ឧទាហរណ៍៖ 123456789:ABCdefGhI_klmNoPQRsTuvWxyZ..."
                            value={telegramToken}
                            onChange={(e) => setTelegramToken(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-mono focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all"
                            id="telegram-token-input-host"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">Telegram Chat ID (User ID ឬ Group/Channel ID)</label>
                          <input
                            type="text"
                            placeholder="ឧទាហរណ៍៖ 987654321 ឬ -100123456789"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-xs font-mono focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all"
                            id="telegram-chat-id-input-host"
                          />
                        </div>

                        <div className="md:col-span-2 flex flex-wrap gap-2.5 pt-2">
                          <button
                            type="submit"
                            disabled={isSavingTelegram}
                            className="px-5 py-2.5 bg-wedding-600 hover:bg-wedding-700 text-white text-xs font-bold rounded-xl shadow-xs transition duration-150 flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                            id="telegram-save-btn-host"
                          >
                            <span>{isSavingTelegram ? 'កំពុងរក្សាទុក...' : '💾 រក្សារាល់ការផ្លាស់ប្តូរ (Save)'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleTestTelegramConnection}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition duration-150 flex items-center justify-center space-x-1 cursor-pointer"
                            id="telegram-test-btn-host"
                          >
                            <span>⚡ សាកល្បងផ្ញើសារតេស្ត (Test Message)</span>
                          </button>
                        </div>
                      </form>

                      {connectionMode === 'supabase' && (
                        <div className="pt-2 border-t border-dashed border-slate-150">
                          <details className="text-[11px] text-slate-450 hover:text-slate-600 cursor-pointer">
                            <summary className="font-semibold text-slate-500">🛠️ ការណែនាំសម្រាប់ SQL Schema Supabase (សម្រាប់អ្នកអភិវឌ្ឍន៍-Developer)</summary>
                            <p className="mt-1 pb-1">ក្នុងករណីប្រើប្រាស់ប្រព័ន្ធ database ផ្ទាល់ខ្លួនរបស់លោកអ្នក សូមដំណើរការ SQL Command នេះនៅក្នុង Supabase SQL Editor ដើម្បីអាចភ្ជាប់រក្សាទុក configuration value បានជារៀងរហូត៖</p>
                            <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-[10px] font-mono select-all overflow-x-auto mt-1 border border-slate-800">
{`ALTER TABLE weddings ADD COLUMN telegram_token TEXT;
ALTER TABLE weddings ADD COLUMN telegram_chat_id TEXT;`}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* READ ONLY Host Guest Ledger with Filter/Search */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-55/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">តារាងបញ្ជីលម្អិតភ្ញៀវដែលត្រូវចូលរួម ({filteredGuests.length} នាក់)</h2>
                      <p className="text-[11px] text-slate-400">អ្នកអាចស្វែងរក ត្រងទិន្នន័យ ព្រមទាំងនាំចេញដោនឡូតទៅជាឯកសារ Excel ដោយសេរី។</p>
                    </div>
                  </div>

                  {/* Filters Area */}
                  <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 bg-slate-50/30">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="ស្វែងរកតាម ឈ្មោះ ឬ លេខទូរស័ព្ទ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 text-slate-800 transition-all font-sans"
                        id="inp-host-search"
                      />
                    </div>

                    <div className="flex gap-2 font-sans text-xs">
                      <select
                        value={relationFilter}
                        onChange={(e) => setRelationFilter(e.target.value)}
                        className="text-xs font-bold bg-white border border-slate-200 rounded px-3 py-1.5 focus:outline-none cursor-pointer"
                        id="sel-host-filter-relation"
                      >
                        <option value="ទាំងអស់">ប្រភេទទំនាក់ទំនង៖ ទាំងអស់</option>
                        <option value="ខាងកូនក្រមុំ">ខាងកូនក្រមុំ</option>
                        <option value="ខាងកូនកំលោះ">ខាងកូនកំលោះ</option>
                        <option value="មិត្តភក្តិ">មិត្តភក្តិ</option>
                        <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs font-bold bg-white border border-slate-200 rounded px-3 py-1.5 focus:outline-none cursor-pointer"
                        id="sel-host-filter-status"
                      >
                        <option value="ទាំងអស់">ស្ថានភាព៖ ទាំងអស់</option>
                        <option value="approved">បានអនុម័ត (Approved)</option>
                        <option value="pending">រង់ចាំការពិនិត្យ (Pending)</option>
                      </select>
                    </div>
                  </div>

                  {/* Desktop Guest Table */}
                  <div className="overflow-x-auto min-h-[300px]">
                    {filteredGuests.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 space-y-2">
                        <Info className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-xs">មិនមានទិន្នន័យភ្ញៀវដែលត្រូវគ្នាទេ!</p>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs text-slate-600" id="tbl-host-guests">
                        <thead className="bg-[#f8fafc] text-slate-550 uppercase tracking-wider text-[11px] border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">ភ្ញៀវកិត្តិយស</th>
                            <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">លេខទូរស័ព្ទ / ទំនាក់ទំនង</th>
                            <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">អ្នករួមដំណើរ (នាក់)</th>
                            <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">ប្រាក់ចងដៃ ($)</th>
                            <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500">កំណត់សម្គាល់ជូនពរ</th>
                            <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 text-center">ស្ថានភាព</th>
                            <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 text-center">ម៉ោងចូលតុ (Check-in)</th>
                            <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-slate-500 text-right">សកម្មភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredGuests.map((g, index) => (
                            <tr key={g.id} className="hover:bg-slate-50 transition duration-150">
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-900 block text-sm">{g.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ល.រ៖ {index+1}</span>
                                {g.province && (
                                  <div className="flex items-center text-[10px] text-slate-500 mt-1 max-w-[200px]" title={[g.address_details, g.village, g.commune, g.district, g.province].filter(Boolean).join(', ')}>
                                    <MapPin className="w-3.5 h-3.5 text-pink-400 mr-0.5 shrink-0" />
                                    <span className="truncate">
                                      {[g.address_details, g.village, g.commune, g.district, g.province].filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-mono text-xs block mb-1 text-slate-800">{g.phone}</span>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-100 inline-block uppercase">
                                  {g.relation_type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-slate-800 text-sm">
                                {g.companions} នាក់
                              </td>
                              <td className="px-6 py-4 text-pink-600 font-bold text-sm whitespace-nowrap">
                                {formatCurrency(g.amount, g.currency)}
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-slate-500 max-w-xs break-words italic line-clamp-2" title={g.note}>
                                  {g.note || '-'}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  g.status === 'approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {g.status === 'approved' ? 'បានអនុម័ត' : 'រង់ចាំពិនិត្យ'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {g.is_present ? (
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 shadow-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      ចូលតុរួចរាល់
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 font-semibold">{g.check_in_time}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[10px] italic">មិនទាន់ចូលតុ</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleTogglePresence(g.id, !!g.is_present)}
                                    className={`py-1 px-2.5 font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-0.5 border ${
                                      g.is_present
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                        : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300'
                                    }`}
                                    title={g.is_present ? "លុបវត្តមាន" : "កត់ត្រាវត្តមាន (ចូលតុ)"}
                                    id={`btn-host-presence-${g.id}`}
                                  >
                                    <UserCheck className={`w-3.5 h-3.5 ${g.is_present ? 'text-slate-450' : 'text-sky-500'}`} />
                                    <span>{g.is_present ? 'ចាកចេញ' : 'ចូលតុ'}</span>
                                  </button>

                                  {g.status === 'pending' && (
                                    <button
                                      onClick={() => handleApproveGuest(g.id)}
                                      className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-0.5"
                                      title="អនុម័ត"
                                      id={`btn-host-approve-${g.id}`}
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      <span>ចុចអនុម័ត</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>


              </div>
            )}
          </div>
        )}

      </main>

      {/* ========================================================== */}
      {/* MODALS & OVERLAYS */}
      {/* ========================================================== */}

      {/* ADMIN ADD WEDDING EVENT MODAL */}
      {showAddWeddingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-rose-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-rose-50 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">បង្កើតកម្មវិធីថ្មី</h3>
              <button 
                onClick={() => setShowAddWeddingModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateWedding} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ចំណងជើងកម្មវិធី (ឧ. មង្គលការ, ខួបកំណើត, ជប់លៀង...)</label>
                <input
                  type="text"
                  placeholder="ឧ. មង្គលការ កញ្ញា សុជាតា និង លោក វីរៈ"
                  value={newWeddingTitle}
                  onChange={(e) => setNewWeddingTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Username ម្ចាស់ការ</label>
                  <input
                    type="text"
                    placeholder="ឧ. virak123"
                    value={newWeddingHostUser}
                    onChange={(e) => setNewWeddingHostUser(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Password ម្ចាស់ការ</label>
                  <input
                    type="text"
                    placeholder="សម្ងាត់"
                    value={newWeddingHostPass}
                    onChange={(e) => setNewWeddingHostPass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Link រូបភាព KHQR សម្រាប់ប្រាក់រៀល (KHR) *</label>
                <input
                  type="text"
                  placeholder="ឧ. https://i.ibb.co/... (ត្រូវបញ្ចប់ដោយ .jpg ឬ .png)"
                  value={newWeddingKhqrUrl}
                  onChange={(e) => setNewWeddingKhqrUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all font-mono"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">* សម្រាប់លីង QR ទូទាត់ប្រាក់រៀល (ABA Pay, ACLEDA, etc.)</p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Link រូបភាព KHQR សម្រាប់ប្រាក់ដុល្លារ (USD) (ស្រេចចិត្ត)</label>
                <input
                  type="text"
                  placeholder="ឧ. https://i.ibb.co/... (ម៉ាស៊ីននឹងបង្ហាញទាំង២ប្រសិនបើមាន)"
                  value={newWeddingKhqrUsdUrl}
                  onChange={(e) => setNewWeddingKhqrUsdUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all font-mono"
                />
                <p className="text-[11px] text-rose-500 font-medium mt-1.5">* ចំណាំ៖ សូមប្រើប្រាស់ "Direct link" សម្រាប់រូបភាព (បញ្ចប់ដោយ .jpg ឬ .png)</p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-wedding-600 hover:bg-wedding-700 text-white font-bold rounded-xl transition duration-150 shadow-sm cursor-pointer"
              >
                រក្សាទុកកម្មវិធី
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CAM-BASED QR CODE SCANNER MODAL */}
      {showQrScanner && (
        <QrCodeScannerModal
          onClose={() => setShowQrScanner(false)}
          onScan={handleQrCheckIn}
          lastResult={lastScannedResult}
          setLastResult={setLastScannedResult}
        />
      )}

      {/* ADMIN ADD MANUAL GUEST MODAL */}
      {showAddGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-rose-100 shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-rose-50 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-800">ចុះឈ្មោះភ្ញៀវដោយទូទាត់ផ្ទាល់ (Add Pre-Approved Guest)</h3>
              <button 
                onClick={() => setShowAddGuestModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleManualAddGuest} className="p-5 space-y-4 text-xs font-sans overflow-y-auto flex-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ឈ្មោះភ្ញៀវកិត្តិយស * (Guest Name)</label>
                <input
                  type="text"
                  placeholder="ឧ. លោក សុខ បញ្ញា"
                  value={manualGuestName}
                  onChange={(e) => setManualGuestName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">លេខទូរស័ព្ទ *</label>
                  <input
                    type="tel"
                    placeholder="012xxxxxx"
                    value={manualGuestPhone}
                    onChange={(e) => setManualGuestPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ប្រភេទទំនាក់ទំនង</label>
                  <select
                    value={manualGuestRelation}
                    onChange={(e) => setManualGuestRelation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="ខាងកូនក្រមុំ">ខាងកូនក្រមុំ</option>
                    <option value="ខាងកូនកំលោះ">ខាងកូនកំលោះ</option>
                    <option value="មិត្តភក្តិ">មិត្តភក្តិ</option>
                    <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">អ្នកមកជាមួយ (នាក់)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={manualGuestCompanions}
                    onChange={(e) => setManualGuestCompanions(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ចំនួនប្រាក់ចងដៃ</label>
                  <div className="relative flex">
                    <select
                      value={manualGuestCurrency}
                      onChange={(e) => setManualGuestCurrency(e.target.value as 'USD'|'KHR')}
                      className="bg-slate-50 border border-slate-200 border-r-0 rounded-l-xl px-2 py-2 text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer font-semibold z-10 text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="KHR">KHR</option>
                    </select>
                    <input
                      type="number"
                      placeholder={manualGuestCurrency === 'USD' ? "50" : "200000"}
                      value={manualGuestAmount}
                      onChange={(e) => setManualGuestAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none -ml-[1px]"
                    />
                  </div>
                </div>
              </div>

              {/* អាសយដ្ឋានភ្ញៀវ (Manual Guest Address) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                <span className="font-bold text-slate-700 block border-b border-slate-200 pb-1">អាសយដ្ឋា​នស្នាក់នៅ (Address)</span>
                
                {dbHasAddressTables ? (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-500 mb-0.5">ខេត្ត/រាជធានី</label>
                        <select
                          value={manualSelectedProvinceId}
                          onChange={(e) => {
                            setManualSelectedProvinceId(e.target.value);
                            setManualSelectedDistrictId('');
                            setManualSelectedCommuneId('');
                            setManualSelectedVillageId('');
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-[11px] focus:outline-none cursor-pointer"
                        >
                          <option value="">-- ជ្រើសរើសខេត្ត --</option>
                          {provincesList.map(p => (
                            <option key={p.id} value={p.id}>{p.name_km}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-0.5">ស្រុក/ខណ្ឌ</label>
                        <select
                          value={manualSelectedDistrictId}
                          onChange={(e) => {
                            setManualSelectedDistrictId(e.target.value);
                            setManualSelectedCommuneId('');
                            setManualSelectedVillageId('');
                          }}
                          disabled={!manualSelectedProvinceId}
                          className="w-full bg-white border border-slate-200 disabled:bg-slate-100 rounded-lg px-2 py-1 text-slate-800 text-[11px] focus:outline-none cursor-pointer"
                        >
                          <option value="">-- {manualSelectedProvinceId ? 'ជ្រើសរើសស្រុក' : 'ជ្រើសរើសខេត្តមុន'} --</option>
                          {manualDistrictsList.map(d => (
                            <option key={d.id} value={d.id}>{d.name_km}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-500 mb-0.5">ឃុំ/សង្កាត់</label>
                        <select
                          value={manualSelectedCommuneId}
                          onChange={(e) => {
                            setManualSelectedCommuneId(e.target.value);
                            setManualSelectedVillageId('');
                          }}
                          disabled={!manualSelectedDistrictId}
                          className="w-full bg-white border border-slate-200 disabled:bg-slate-100 rounded-lg px-2 py-1 text-slate-800 text-[11px] focus:outline-none cursor-pointer"
                        >
                          <option value="">-- {manualSelectedDistrictId ? 'ជ្រើសរើសឃុំ' : 'ជ្រើសរើសស្រុកមុន'} --</option>
                          {manualCommunesList.map(c => (
                            <option key={c.id} value={c.id}>{c.name_km}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-0.5">ភូមិ</label>
                        <select
                          value={manualSelectedVillageId}
                          onChange={(e) => setManualSelectedVillageId(e.target.value)}
                          disabled={!manualSelectedCommuneId}
                          className="w-full bg-white border border-slate-200 disabled:bg-slate-100 rounded-lg px-2 py-1 text-slate-800 text-[11px] focus:outline-none cursor-pointer"
                        >
                          <option value="">-- {manualSelectedCommuneId ? (manualVillagesList.length > 0 ? 'ជ្រើសរើសភូមិ' : 'គ្មានភូមិ (បំពេញខាងក្រោម)') : 'ជ្រើសរើសឃុំមុន'} --</option>
                          {manualVillagesList.map(v => (
                            <option key={v.id} value={v.id}>{v.name_km}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {manualSelectedCommuneId && manualVillagesList.length === 0 && (
                      <div>
                        <label className="block text-slate-500 mb-0.5">ឈ្មោះភូមិ</label>
                        <input
                          type="text"
                          placeholder="ឧ. ភូមិកំរៀង"
                          value={manualGuestVillage}
                          onChange={(e) => setManualGuestVillage(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-[11px] focus:outline-none"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-500 mb-0.5">ខេត្ត/រាជធានី</label>
                        <select
                          value={manualGuestProvince}
                          onChange={(e) => setManualGuestProvince(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-[11px] cursor-pointer"
                        >
                          <option value="">-- ជ្រើសរើសខេត្ត --</option>
                          {STATIC_PROVINCES.map(p => (
                            <option key={p.code} value={p.name_km}>{p.name_km}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-0.5">ស្រុក/ខណ្ឌ</label>
                        <input
                          type="text"
                          placeholder="ឧ. ខណ្ឌដូនពេញ"
                          value={manualGuestDistrict}
                          onChange={(e) => setManualGuestDistrict(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-500 mb-0.5">ឃុំ/សង្កាត់</label>
                        <input
                          type="text"
                          placeholder="ឧ. សង្កាត់ចតុមុខ"
                          value={manualGuestCommune}
                          onChange={(e) => setManualGuestCommune(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-0.5">ភូមិ</label>
                        <input
                          type="text"
                          placeholder="ឧ. ភូមិ១"
                          value={manualGuestVillage}
                          onChange={(e) => setManualGuestVillage(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-slate-500 mb-0.5">អាសយដ្ឋានលម្អិត</label>
                  <input
                    type="text"
                    placeholder="ឧ. ផ្ទះលេខ ១២A ផ្លូវ ៧៨"
                    value={manualGuestAddressDetails}
                    onChange={(e) => setManualGuestAddressDetails(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">កំណត់សម្គាល់ (Notes)</label>
                <textarea
                  rows={2}
                  placeholder="កំណត់សម្គាល់បន្ថែម..."
                  value={manualGuestNote}
                  onChange={(e) => setManualGuestNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-wedding-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-wedding-600 hover:bg-wedding-700 text-white font-bold rounded-xl transition duration-150 cursor-pointer text-xs"
              >
                ចុះឈ្មោះភ្ញៀវ pre-approved ទូទាត់រួច
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Supabase Technical Documentation & Copier Section (Collapsible) */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-12 py-10 px-4 font-sans text-xs">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <span>🛠️ របៀបតម្លើង PostgreSQL Database ក្នុង Supabase</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                សូមអនុវត្តតាមការណែនាំខាងក្រោម ដើម្បីដំណើរការ Database និងបញ្ជីអាសយដ្ឋានរដ្ឋបាលកម្ពុជានៅលើគណនី Supabase ផ្ទាល់ខ្លួនរបស់អ្នក។
              </p>
            </div>
            <button
              onClick={() => setShowSqlDocs(!showSqlDocs)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              {showSqlDocs ? 'លាក់ការណែនាំ ▴' : 'បង្ហាញការណែនាំ ▾'}
            </button>
          </div>

          {showSqlDocs && (
            <div className="space-y-6 animate-fade-in">
              {/* Explanation Alert Box for 'Query is too large' Error */}
              <div className="bg-amber-950/40 border border-amber-900/50 p-4.5 rounded-xl text-amber-200/90 leading-relaxed space-y-2">
                <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <span>⚠️ របៀបដោះស្រាយបញ្ហា "Query is too large to be run via the SQL Editor" និងកុំឱ្យបាត់បង់ទិន្នន័យចាស់</span>
            </h4>
            <div className="space-y-1.5 text-[11px] leading-normal font-sans">
              <p>
                <strong>១. សម្រាប់អ្នកមានទិន្នន័យចាស់ស្រាប់៖</strong> ប្រសិនបើលោកអ្នកធ្លាប់មានតារាងទិន្នន័យ និងបញ្ជីភ្ញៀវចាស់ៗនៅក្នុង Supabase រួចហើយ សូមកុំយកកូដផ្នែកទី ១ (សម្រាប់ Web ថ្មី) ទៅដំណើរការឡើយព្រោះវានឹងលុបទិន្នន័យចាស់ចោល! ផ្ទុយទៅវិញ <strong>សូមចុចលើ Tab "ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)"</strong> ដើម្បីទទួលបានកូដ SQL សុវត្ថិភាពសម្រាប់ការអាប់ដេត (Migration)។
              </p>
              <p>
                <strong>២. មូលហេតុធុងបញ្ហា "Query is too large"៖</strong> ដោយសារតែទិន្នន័យភូមិឃុំស្រុកខ្មែរពេញលេញ (១៤,៣៧២ ភូមិ) មានទំហំធំខ្លាំង (ជាង ១៥,០០០ ជួរ) ពេលលោកអ្នកចម្លងកូដទាំងអស់ទៅដំណើរការតែម្តងគត់ក្នុងផ្ទាំង SQL Editor នោះប្រព័ន្ធ Supabase នឹងបដិសេធ។
              </p>
              <p>
                <strong>៣. ដំណោះស្រាយ៖</strong> ដើម្បីដំណើរការបានជោគជ័យ ១០០% សូមធ្វើការចម្លងកូដទៅដំណើរការក្នុង SQL Editor ម្តងមួយផ្នែកតាមលំដាប់លំដោយដោយប្រើប៊ូតុង Tab ខាងក្រោម។
              </p>
            </div>
          </div>

          {/* Responsive tab bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedSqlTab('main_schema')}
              className={`px-2.5 py-2 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                selectedSqlTab === 'main_schema'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div>ផ្នែកទី ១ (ថ្មីស្រឡាង)</div>
              <div className="text-[9px] mt-0.5 opacity-80 font-normal">លុបចោល បង្កើតថ្មី</div>
            </button>
            <button
              onClick={() => setSelectedSqlTab('safe_migration')}
              className={`px-2.5 py-2 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                selectedSqlTab === 'safe_migration'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div>ផ្នែកទី ១ (រក្សាទិន្នន័យ)</div>
              <div className="text-[9px] mt-0.5 opacity-80 font-normal">អាប់ដេតស្ងាត់ៗ (Safe)</div>
            </button>
            <button
              onClick={() => setSelectedSqlTab('provinces_districts_communes')}
              className={`px-2.5 py-2 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                selectedSqlTab === 'provinces_districts_communes'
                  ? 'bg-wedding-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div>ផ្នែកទី ២</div>
              <div className="text-[9px] mt-0.5 opacity-80 font-normal">ខេត្ត-ក្រុង-ស្រុក-ឃុំ</div>
            </button>
            <button
              onClick={() => setSelectedSqlTab('villages_part1')}
              className={`px-2.5 py-2 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                selectedSqlTab === 'villages_part1'
                  ? 'bg-wedding-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div>ផ្នែកទី ៣</div>
              <div className="text-[9px] mt-0.5 opacity-80 font-normal">បញ្ជីភូមិភាគ ១</div>
            </button>
            <button
              onClick={() => setSelectedSqlTab('villages_part2')}
              className={`px-2.5 py-2 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                selectedSqlTab === 'villages_part2'
                  ? 'bg-wedding-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div>ផ្នែកទី ៤</div>
              <div className="text-[9px] mt-0.5 opacity-80 font-normal">បញ្ជីភូមិភាគ ២</div>
            </button>
          </div>

          {/* Copy Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {selectedSqlTab === 'main_schema' && (
                <span>👉 <strong className="text-red-400">ផ្នែកទី ១ (Core App Schema - ថ្មីស្រឡាង)</strong>: បង្កើតតារាងគ្រប់គ្រងពីដំបូង (លុបចោល និងបង្កើតជាថ្មីសម្រាប់ Web ថ្មីគ្មានទិន្នន័យចាស់)។</span>
              )}
              {selectedSqlTab === 'safe_migration' && (
                <span>👉 <strong className="text-emerald-400">ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់ / Database Upgrade)</strong>: បន្ថែមកូដអាសយដ្ឋានរដ្ឋបាលខ្មែរ និងថែមកូឡឹមថ្មីៗចូលតារាងចាស់ដោយសុវត្ថិភាពខ្ពស់បំផុត មិនបាត់ទិន្នន័យភ្ញៀវទាល់តែសោះ!</span>
              )}
              {selectedSqlTab === 'provinces_districts_communes' && (
                <span>👉 <strong>ផ្នែកទី ២ (Provinces, Districts, Communes)</strong>: បញ្ចូលបញ្ជី ២៥ ខេត្តក្រុង, ១៩៧ ស្រុកខណ្ឌ និង ១,៦៤៦ ឃុំសង្កាត់។</span>
              )}
              {selectedSqlTab === 'villages_part1' && (
                <span>👉 <strong>ផ្នែកទី ៣ (Villages Part 1)</strong>: បញ្ចូលទិន្នន័យភូមិពីខេត្ត ០១ ដល់ ១២ (បន្ទាយមានជ័យ ដល់ រាជធានីភ្នំពេញ)។</span>
              )}
              {selectedSqlTab === 'villages_part2' && (
                <span>👉 <strong>ផ្នែកទី ៤ (Villages Part 2)</strong>: បញ្ចូលទិន្នន័យភូមិពីខេត្ត ១៣ ដល់ ២៥ (ព្រះវិហារ ដល់ ត្បូងឃ្មុំ)។</span>
              )}
            </div>

            <button
              onClick={() => {
                if (fetchedSqlText) {
                  let nameLabel = '';
                  if (selectedSqlTab === 'main_schema') nameLabel = 'ផ្នែកទី ១ (Core Schema)';
                  else if (selectedSqlTab === 'safe_migration') nameLabel = 'ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)';
                  else if (selectedSqlTab === 'provinces_districts_communes') nameLabel = 'ផ្នែកទី ២ (Provinces-Districts-Communes)';
                  else if (selectedSqlTab === 'villages_part1') nameLabel = 'ផ្នែកទី ៣ (Villages Part 1)';
                  else if (selectedSqlTab === 'villages_part2') nameLabel = 'ផ្នែកទី ៤ (Villages Part 2)';
                  
                  handleCopyText(fetchedSqlText, nameLabel);
                }
              }}
              disabled={isLoadingSql || !fetchedSqlText}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer whitespace-nowrap"
            >
              {copiedText && (copiedText.startsWith(`ផ្នែកទី`) || copiedText.includes(`រក្សាទិន្នន័យ`)) ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">បានចម្លងរួចរាល់!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>ចម្លងកូដ SQL ផ្នែកនេះ</span>
                </>
              )}
            </button>
          </div>

          {/* SQL Preview Box */}
          <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-800 relative min-h-[160px] flex flex-col justify-between">
            {isLoadingSql ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="w-8 h-8 border-4 border-wedding-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs text-slate-400 animate-pulse font-sans">កំពុងទាញយកទិន្នន័យ SQL ពីម៉ាស៊ីនបម្រើ (Downloading SQL chunk...)</div>
              </div>
            ) : (
              <>
                <div className="max-h-72 overflow-y-auto overflow-x-auto select-all">
                  <pre className="text-[10.5px] text-slate-400 font-mono leading-relaxed select-all whitespace-pre">
                    {fetchedSqlText}
                  </pre>
                </div>
                <div className="text-[9.5px] text-slate-500 font-mono mt-3 text-right">
                  ជួរទិន្នន័យសរុប៖ {fetchedSqlText ? fetchedSqlText.split('\n').length.toLocaleString() : 0} ជួរ
                </div>
              </>
            )}
          </div>
          </div>
          )}

          <p className="text-center text-slate-500 text-[10px]">
            រៀបចំឡើងដោយបច្ចេកវិទ្យា Supabase, Vite, Tailwind CSS, និង React 19 - រក្សាសិទ្ធគ្រប់យ៉ាង © 2026
          </p>
        </div>
      </footer>

      </div>

      {/* PRINT-ONLY GUEST LEDGER TEMPLATE FOR PHYSICAL CHECK-IN AT WEDDING ENTRANCE */}
      <div className="hidden print:block bg-white text-black p-4 w-full font-serif text-[10px] leading-tight" id="printable-ledger">
        
        {/* Header Section */}
        <div className="text-center border-b-2 border-double border-slate-800 pb-3 mb-4">
          <span className="text-[8px] uppercase tracking-wider font-mono text-slate-500 block mb-0.5">
            បញ្ជីឆែកឈ្មោះភ្ញៀវកិត្តិយសផ្លូវការ - Official Wedding Guest Check-In Ledger
          </span>
          <h1 className="text-lg font-bold font-sans text-slate-900 mb-0.5">
            {activeWedding?.title || "កម្មវិធីអាពាហ៍ពិពាហ៍"}
          </h1>
          <div className="flex justify-center items-center gap-4 text-[9px] font-medium text-slate-600 mt-1 font-mono">
            <div>
              <span>ចំនួនភ្ញៀវក្នុងបញ្ជី៖ </span>
              <strong className="text-slate-900 font-bold">{filteredGuests.length} នាក់</strong>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <span>ការត្រងបច្ចុប្បន្ន៖ </span>
              <span className="text-slate-800 font-semibold">
                {relationFilter === 'ទាំងអស់' ? 'គ្រប់ប្រភេទទំនាក់ទំនង' : relationFilter} • {statusFilter === 'ទាំងអស់' ? 'គ្រប់ស្ថានភាព' : statusFilter}
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <span>បោះពុម្ព៖ </span>
              <span className="text-slate-900 font-semibold">
                {new Date().toLocaleDateString('km-KH')} {new Date().toLocaleTimeString('km-KH')}
              </span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <table className="w-full border-collapse border border-slate-400">
          <thead>
            <tr className="bg-slate-100 font-sans text-slate-800 text-[9px]">
              <th className="border border-slate-400 px-1 py-1.5 text-center w-[30px]">ល.រ</th>
              <th className="border border-slate-400 px-2 py-1.5 text-left w-[130px]">ឈ្មោះភ្ញៀវកិត្តិយស</th>
              <th className="border border-slate-400 px-2 py-1.5 text-left w-[100px]">លេខទូរស័ព្ទ / ទំនាក់ទំនង</th>
              <th className="border border-slate-400 px-1.5 py-1.5 text-center w-[55px]">មកជាមួយ</th>
              <th className="border border-slate-400 px-2 py-1.5 text-left text-slate-700">អាសយដ្ឋានស្នាកនៅ</th>
              <th className="border border-slate-400 px-2 py-1.5 text-left w-[120px]">ពាក្យជូនពរពីភ្ញៀវ</th>
              <th className="border border-slate-400 px-2 py-1.5 text-center w-[90px]">ចងដៃ (បច្ចុប្បន្ន)</th>
              <th className="border border-slate-400 px-2 py-1.5 text-center w-[90px]">កត់ចំណាំ (ជាក់ស្តែង)</th>
              <th className="border border-slate-400 px-2 py-1.5 text-center w-[95px]">ហត្ថលេខា / ស្នាមមេដៃ</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-slate-400 px-3 py-6 text-center text-slate-400 italic">
                  គ្មានទិន្នន័យភ្ញៀវស្របតាមលក្ខខណ្ឌចម្រោះឡើយ។ (No matching guests to print)
                </td>
              </tr>
            ) : (
              filteredGuests.map((g, index) => {
                const fullAddress = [g.address_details, g.village, g.commune, g.district, g.province]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <tr key={g.id} className="border-b border-slate-400">
                    <td className="border border-slate-400 px-1 py-1 text-center font-mono">{index + 1}</td>
                    <td className="border border-slate-400 px-2 py-1 font-bold font-sans text-slate-900 leading-tight">
                      <div>{g.name}</div>
                      {g.is_present && (
                        <div className="text-[7.5px] text-emerald-700 font-sans font-semibold mt-0.5 flex items-center">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                          វត្តមាន៖ {g.check_in_time}
                        </div>
                      )}
                      {g.status === 'pending' && <span className="text-[7.5px] text-amber-600 font-normal mt-0.5 block italic">(Pending)</span>}
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-slate-800 leading-tight">
                      <div className="font-mono text-[9px]">{g.phone || '-'}</div>
                      <div className="text-[7.5px] text-slate-500 font-sans">{g.relation_type}</div>
                    </td>
                    <td className="border border-slate-400 px-1.5 py-1 text-center font-bold text-slate-900 whitespace-nowrap">
                      {g.companions > 0 ? `+${g.companions} នាក់` : 'មកម្នាក់ឯង'}
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-slate-600 text-[8.5px] leading-tight">
                      {fullAddress || '-'}
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-slate-500 text-[8px] italic leading-tight max-w-[120px] truncate-2-lines">
                      {g.note ? `"${g.note}"` : '-'}
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-center font-mono">
                      {g.amount > 0 ? (
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-1 rounded border border-emerald-200 font-sans">
                          {formatCurrency(g.amount, g.currency as any)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[7.5px]">-</span>
                      )}
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-center font-mono">
                      {/* Blank space for physical check-in recorders to note down if guest makes unexpected gift envelope or payment */}
                      <div className="border-b border-dashed border-slate-300 w-full h-3.5 mt-1"></div>
                    </td>
                    <td className="border border-slate-400 px-2 py-1 text-center">
                      {/* Blank space for physical guest signature or thumbprint */}
                      <div className="border-b border-dashed border-slate-300 w-full h-3.5 mt-1"></div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer info panel for the printed output */}
        <div className="mt-4 flex justify-between items-center text-[7.5px] text-slate-500 border-t border-slate-200 pt-2 font-mono">
          <div>
            <span>ប្រព័ន្ធគ្រប់គ្រងការចុះឈ្មោះការ និងឆែកឈ្មោះភ្ញៀវការគាំទ្រដោយស្វ័យប្រវត្ត - Event Entrance Check-in Assistant © 2026</span>
          </div>
          <div className="text-right">
            <span>ទំព័រទី ______ នៃ ______</span>
          </div>
        </div>
      </div>

    </div>
  );
}
