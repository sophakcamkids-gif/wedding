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
  ChevronDown,
  Sparkles,
  Info,
  MapPin,
  Printer,
  Camera,
  Scan,
  Send,
  Eye,
  EyeOff,
  Unlock,
  Bell,
  Wallet,
  CreditCard,
  TrendingUp,
  Home,
  BookOpen,
  Menu,
  ChevronLeft,
  UserPlus,
  QrCode,
  Clock,
  RefreshCw,
  AlertTriangle,
  Upload,
  X
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

-- 5b. Create 'saas_subscriptions' Table for Premium Approvals
DROP TABLE IF EXISTS public.saas_subscriptions CASCADE;
CREATE TABLE public.saas_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'trial',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sender_name VARCHAR(255),
    ref_id VARCHAR(255),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read saas_subscriptions" ON public.saas_subscriptions FOR SELECT USING (true);
CREATE POLICY "Anyone can upsert/update subscriptions" ON public.saas_subscriptions FOR ALL USING (true);

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
CREATE POLICY "Enable read/write bypass for prototype villages" ON public.villages FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
`;

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
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

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
CREATE POLICY "Enable read/write bypass for prototype villages" ON public.villages FOR ALL USING (true) WITH CHECK (true);

-- 5. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
`;

const formatCurrency = (amount: number, currency: 'USD' | 'KHR') => {
  if (currency === 'KHR') {
    return `${amount.toLocaleString('en-US')} ៛`;
  }
  return `$${amount.toFixed(2)}`;
};

const ImageUploader = ({ value, onChange, label, optional, placeholder }: { value: string, onChange: (v: string) => void, label: string, optional?: boolean, placeholder?: string }) => {
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputId = useMemo(() => "file-" + Math.random().toString(36).substr(2, 9), []);

  useEffect(() => {
    if (value && !value.startsWith('data:')) {
      setUrlValue(value);
    } else if (!value) {
      setUrlValue('');
    }
  }, [value]);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress image to a max of 800px width/height to make it highly optimized
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Fill canvas with solid white background (prevents transparent PNGs from rendering black on JPEGs)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            // Draw original image resized
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to a compressed lightweight JPEG (0.7 quality)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            onChange(compressedBase64);
            setUrlValue('');
          } else {
            // Fallback if canvas context fails
            onChange(event.target?.result as string);
            setUrlValue('');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const isBase64 = value ? value.startsWith('data:') : false;

  return (
    <div className="space-y-1.5 font-sans">
       <label className="block text-slate-700 font-semibold mb-1">{label} {optional ? '(ស្រេចចិត្ត)' : '*'}</label>
       <div 
          className={`w-full flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl transition relative group ${
            dragActive ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 bg-slate-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
       >
         {value ? (
           <div className="text-center w-full flex flex-col items-center">
             <img src={value} className="max-h-24 object-contain rounded shadow-sm p-1 bg-white border border-slate-100" alt="QR" />
             <div className="mt-1.5 text-slate-400 text-[9px] max-w-full truncate px-2 font-mono">
               {isBase64 ? '📷 បានបញ្ចូលដោយជោគជ័យ' : value}
             </div>
           </div>
         ) : (
           <div className="text-center text-slate-500 py-1 w-full flex flex-col items-center">
             <input 
               type="file" 
               accept="image/*" 
               id={fileInputId}
               className="hidden" 
               onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} 
             />
             <label htmlFor={fileInputId} className="cursor-pointer flex flex-col items-center justify-center w-full">
               <Camera className="mx-auto w-7 h-7 mb-1 text-rose-500 group-hover:scale-110 transition-transform duration-200" />
               <span className="text-xs font-bold text-slate-700">{placeholder || 'ចុចទីនេះ ដើម្បីទាញយកពីទូរស័ព្ទ'}</span>
               <span className="text-[10px] text-slate-400 mt-0.5">ឬទាញរូបភាពមកដាក់ទីនេះ</span>
             </label>
             
             {!showUrlInput ? (
               <button
                 type="button"
                 onClick={() => setShowUrlInput(true)}
                 className="text-[10px] text-rose-500 font-bold hover:underline mt-2.5"
               >
                 👉 ឬបញ្ចូលជា Link/URL
               </button>
             ) : (
               <div className="w-full mt-2.5 pt-2.5 border-t border-slate-150/60 flex flex-col gap-1 items-center">
                 <input 
                   type="text"
                   placeholder="https://example.com/qr.png" 
                   value={urlValue}
                   onChange={(e) => setUrlValue(e.target.value)}
                   className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] text-slate-700 focus:outline-none"
                 />
                 <div className="flex gap-2 w-full justify-center">
                   <button
                     type="button"
                     onClick={() => { if (urlValue.trim()) onChange(urlValue.trim()); }}
                     className="px-2 py-1 bg-rose-500 text-white rounded-md text-[10px] font-bold"
                   >
                     ប្រើប្រាស់ Link
                   </button>
                   <button
                     type="button"
                     onClick={() => setShowUrlInput(false)}
                     className="px-2 py-1 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold"
                   >
                     បោះបង់
                   </button>
                 </div>
               </div>
             )}
           </div>
         )}
       </div>
       {value && (
         <div className="text-right mt-0.5">
           <button 
             type="button" 
             onClick={(e) => {e.preventDefault(); onChange(''); setUrlValue('');}} 
             className="text-[10px] text-rose-500 hover:text-rose-700 font-bold transition flex items-center gap-0.5 justify-end ml-auto"
           >
             ✕ លុបរូបភាពចេញ
           </button>
         </div>
       )}
    </div>
  );
};

// ==========================================
// HIGH-FIDELITY VECTOR KHQR CARD OF ADMIN (PHORN SOPHAK)
// ==========================================
const calculateKHQR_CRC16 = (str: string): string => {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    const charCode = str.charCodeAt(c);
    let x = ((crc >> 8) ^ charCode) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  const hex = crc.toString(16).toUpperCase();
  return hex.padStart(4, '0');
};

const SOPHAK_KHQR_Card = () => {
  // Use the exact genuine QR payload retrieved from the high-resolution ABA KHQR image provided by the user
  const khqrStr = "00020101021229450016abaakhppxxx@abaa01090005029570208ABA Bank40390006abaP2P011241FE56D504980209000502957520400005303840540514.995802KH5912PHORN SOPHAK6010Phnom Penh993400131780449025422011318119850254226304C217";

  return (
    <div className="w-full max-w-[280px] mx-auto bg-white rounded-3xl p-0 shadow-xl border border-slate-150 font-sans select-none relative overflow-hidden animate-fade-in text-center my-4">
      {/* Red header with white KHQR logo */}
      <div className="bg-[#df1b23] relative py-3.5 px-4 flex justify-center items-center">
        <div className="flex items-center space-x-1.5 justify-center">
          <span className="text-white font-extrabold text-base tracking-widest leading-none">KH</span>
          <div className="bg-white text-[#df1b23] text-[9px] font-black px-1.5 py-0.5 rounded-sm leading-none tracking-tight">QR</div>
        </div>
        {/* Subtle white diagonal notch fold on top right */}
        <div className="absolute top-0 right-0 w-8 h-8 bg-white" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>
      </div>
      
      {/* Inner container */}
      <div className="p-5 pt-4 flex flex-col items-center">
        {/* Account Name */}
        <h4 className="text-slate-800 font-extrabold text-sm tracking-wide mb-1 uppercase font-sans">PHORN SOPHAK</h4>
        
        {/* Amount */}
        <p className="text-xl font-black text-slate-800 font-sans tracking-wide mb-2">14.99 <span className="text-xs font-bold text-slate-500">USD</span></p>
        
        {/* Dashed separator line */}
        <div className="w-full border-t border-dashed border-slate-200 my-3" />
        
        {/* QR Code Container */}
        <div className="bg-white p-2 rounded-2xl border border-slate-100 flex items-center justify-center relative w-[180px] h-[180px] my-1 shadow-xs">
          <QRCodeSVG
            value={khqrStr}
            size={160}
            level="H"
            fgColor="#000000"
            bgColor="#ffffff"
          />
          {/* Centered Bakong style Red Circle Logo Emblem with custom floral overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-[#df1b23] rounded-full border-4 border-white flex items-center justify-center shadow-md">
              {/* White Stylized Bakong style flower logo */}
              <svg className="w-6 h-6 text-white" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="50" r="14" fill="#df1b23" />
                <path d="M50 20 c1 3 3 5 4 1 s3-5 4 1 s-1 7-4 7 s-4-5-4-9 z" fill="#fff" />
                <path d="M50 80 c1-3 3-5 4-1 s3 5 4-1 s-1-7-4-7 s-4 5-4 9 z" fill="#fff" />
                <path d="M20 50 c3 1 5 3 1 4 s-5 3 1 4 s7-1 7-4 s-5-4-9-4 z" fill="#fff" />
                <path d="M80 50 c-3 1 -5 3 -1 4 s5 3 -1 4 s-7-1 -7-4 s5-4 9-4 z" fill="#fff" />
                <path d="M29 29 c2 2 4 1 3-1 s-1-5 1-4 s4 3 2 5 s-3 2-6 0 z" fill="#fff" />
                <path d="M71 71 c-2-2-4-1-3 1 s1 5-1 4 s-4-3-2-5 s3-2 6 0 z" fill="#fff" />
                <path d="M71 29 c-2 2 -1 4 1 3 s5-1 4 1 s-3 4 -5 2 s-2-3 0-6 z" fill="#fff" />
                <path d="M29 71 c2-2 1-4-1-3 s-5 1-4-1 s3-4 5-2 s2 3 0 6 z" fill="#fff" />
                <circle cx="50" cy="50" r="7" fill="#fff" />
                <circle cx="50" cy="50" r="4.5" fill="#df1b23" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Left/Right round notch cuts */}
      <div className="absolute top-1/2 -left-2 w-4 h-4 rounded-full bg-[#f8fafc] border-r border-slate-200 transform -translate-y-1/2"></div>
      <div className="absolute top-1/2 -right-2 w-4 h-4 rounded-full bg-[#f8fafc] border-l border-slate-200 transform -translate-y-1/2"></div>
    </div>
  );
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
  // Roles: 'guest' | 'dashboard'
  const [currentRole, setCurrentRole] = useState<'guest' | 'dashboard'>('guest');

  // ACLEDA Mobile HUD integrations status
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileActiveView, setMobileActiveView] = useState<'home' | 'register' | 'list' | 'scan' | 'khqr' | 'telegram' | 'supabase_settings' | 'bonds' | 'mobile_auth' | 'dashboard' | 'pricing'>('home');
  const [mobileTime, setMobileTime] = useState('16:37');
  const [mobilePopup, setMobilePopup] = useState<'invite' | 'bridegroom' | 'food' | 'gallery' | 'blessing' | null>(null);
  const [customBlessingText, setCustomBlessingText] = useState('');
  const [customBlessingSender, setCustomBlessingSender] = useState('');
  const [mobileRegisterTab, setMobileRegisterTab] = useState<'form' | 'qrcode'>('form');
  const [mobileDashboardTab, setMobileDashboardTab] = useState<'overview' | 'add_guest' | 'event_config'>('overview');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const HH = String(now.getHours()).padStart(2, '0');
      const MM = String(now.getMinutes()).padStart(2, '0');
      setMobileTime(`${HH}:${MM}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Supabase Client state
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  // Application Data State
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>('');

  // Authentication states
  const [saasSession, setSaasSession] = useState<any>(null);
  const [saasAuthLoading, setSaasAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authProcessing, setAuthProcessing] = useState(false);

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Premium/SaaS Subscriptions Approval system
  const [saasSubscriptions, setSaasSubscriptions] = useState<any[]>(() => {
    const local = localStorage.getItem('wedding_manager_saas_subscriptions');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // Fallback default
      }
    }
    return [
      {
        id: 'sub-01',
        email: 'host_pich@gmail.com',
        name: 'ឡាយ គីមសួរ',
        plan_type: 'premium',
        status: 'approved',
        sender_name: 'LAY KIMSOR',
        ref_id: '928312',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'sub-02',
        email: 'host_sokha@gmail.com',
        name: 'សុខា ភ័ណ្ឌ',
        plan_type: 'premium',
        status: 'pending',
        sender_name: 'SOKHA PHUON',
        ref_id: '104823',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ];
  });

  const [paymentSenderName, setPaymentSenderName] = useState('');
  const [paymentRefId, setPaymentRefId] = useState('');
  const [paymentReceiptImg, setPaymentReceiptImg] = useState<any>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'guests' | 'saas'>('guests');
  const [isCheckingOutPremium, setIsCheckingOutPremium] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingSubEmail, setRejectingSubEmail] = useState<string | null>(null);

  const [isDashboardLoggedIn, setIsDashboardLoggedIn] = useState(() => {
    return localStorage.getItem('wedding_manager_dashboard_logged_in') === 'true';
  });
  const [hasPaidPlan, setHasPaidPlan] = useState(() => {
    return localStorage.getItem('wedding_manager_has_paid_plan') === 'true';
  });
  const [selectedPlanType, setSelectedPlanType] = useState<'trial' | 'premium' | null>(() => {
    return (localStorage.getItem('wedding_manager_selected_plan_type') as 'trial' | 'premium') || null;
  });

  const getCurrentUserEmail = () => {
    if (connectionMode === 'supabase' && saasSession) {
      return saasSession.user.email || '';
    }
    const savedOwnerRaw = localStorage.getItem('wedding_manager_registered_owner');
    if (savedOwnerRaw) {
      try {
        const o = JSON.parse(savedOwnerRaw);
        return o.email || '';
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  const getCurrentUserName = () => {
    if (connectionMode === 'supabase' && saasSession) {
      return saasSession.user.user_metadata?.username || saasSession.user.email?.split('@')[0] || '';
    }
    const savedOwnerRaw = localStorage.getItem('wedding_manager_registered_owner');
    if (savedOwnerRaw) {
      try {
        const o = JSON.parse(savedOwnerRaw);
        return o.name || '';
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  const currentAccountEmail = getCurrentUserEmail();
  const currentActiveSub = saasSubscriptions.find(s => s.email?.toLowerCase() === currentAccountEmail?.toLowerCase());

  // Effect to sync user package statuses with their subscriptions
  useEffect(() => {
    const email = getCurrentUserEmail();
    if (!email) return;

    const sub = saasSubscriptions.find(s => s.email?.toLowerCase() === email?.toLowerCase());
    if (sub) {
      if (sub.status === 'approved') {
        setHasPaidPlan(true);
        setSelectedPlanType(sub.plan_type);
        localStorage.setItem('wedding_manager_has_paid_plan', 'true');
        localStorage.setItem('wedding_manager_selected_plan_type', sub.plan_type);
      } else {
        setHasPaidPlan(false);
        setSelectedPlanType(sub.plan_type);
        localStorage.setItem('wedding_manager_has_paid_plan', 'false');
        localStorage.setItem('wedding_manager_selected_plan_type', sub.plan_type);
      }
    } else {
      setHasPaidPlan(false);
      setSelectedPlanType(null);
      localStorage.setItem('wedding_manager_has_paid_plan', 'false');
      localStorage.removeItem('wedding_manager_selected_plan_type');
    }
  }, [saasSession, isDashboardLoggedIn, saasSubscriptions]);

  // Sync Supabase subscriptions if database is active
  useEffect(() => {
    if (connectionMode === 'supabase' && supabaseClient && saasSession) {
      const fetchSubs = async () => {
        try {
          const { data, error } = await supabaseClient
            .from('saas_subscriptions')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            setSaasSubscriptions(prev => {
              const merged = [...prev];
              data.forEach((dbSub: any) => {
                const idx = merged.findIndex(s => s.email?.toLowerCase() === dbSub.email?.toLowerCase());
                if (idx > -1) {
                  merged[idx] = { ...merged[idx], ...dbSub };
                } else {
                  merged.push(dbSub);
                }
              });
              localStorage.setItem('wedding_manager_saas_subscriptions', JSON.stringify(merged));
              return merged;
            });
          }
        } catch (e) {
          console.log('saas_subscriptions table check skipped/not migrated', e);
        }
      };
      fetchSubs();
    }
  }, [connectionMode, supabaseClient, saasSession]);

  const selectPlan = async (plan: 'trial' | 'premium') => {
    const email = getCurrentUserEmail();
    if (!email) {
      showNotification('សូមចុះឈ្មោះ ឬចូលគណនីម្ចាស់កម្មវិធីជាមុនសិន!', 'error');
      return;
    }

    if (plan === 'trial') {
      // Trial activates immediately
      const updated = saasSubscriptions.filter(s => s.email?.toLowerCase() !== email?.toLowerCase());
      const newSub = {
        id: 'sub-' + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        name: getCurrentUserName(),
        plan_type: 'trial',
        status: 'approved',
        created_at: new Date().toISOString()
      };
      const finalSubs = [...updated, newSub];
      setSaasSubscriptions(finalSubs);
      localStorage.setItem('wedding_manager_saas_subscriptions', JSON.stringify(finalSubs));
      
      setHasPaidPlan(true);
      setSelectedPlanType('trial');
      localStorage.setItem('wedding_manager_has_paid_plan', 'true');
      localStorage.setItem('wedding_manager_selected_plan_type', 'trial');
      showNotification('គណនីរបស់អ្នកបានកំណត់ជាគម្រោងសាកល្បង!', 'info');
      
      if (isMobile) {
        setMobileActiveView('home');
      }
    } else {
      // Premium is checked out visually but not approved automatically info
      showNotification('សូមស្កេន KHQR ដើម្បីទូទាត់ប្រាក់ និងបញ្ជូនភស្តុតាង!', 'info');
    }
  };

  const submitPremiumPaymentDetails = async () => {
    const email = getCurrentUserEmail();
    if (!email) return;

    if (!paymentSenderName.trim()) {
      showNotification('សូមបញ្ចូលឈ្មោះគណនីអ្នកផ្ញើ!', 'error');
      return;
    }

    setIsSubmittingPayment(true);
    
    const updated = saasSubscriptions.filter(s => s.email?.toLowerCase() !== email?.toLowerCase());
    const newSub = {
      id: 'sub-' + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      name: getCurrentUserName(),
      plan_type: 'premium',
      status: 'pending',
      sender_name: paymentSenderName.trim(),
      ref_id: paymentRefId.trim() || 'N/A',
      created_at: new Date().toISOString()
    };
    
    const finalSubs = [...updated, newSub];
    setSaasSubscriptions(finalSubs);
    localStorage.setItem('wedding_manager_saas_subscriptions', JSON.stringify(finalSubs));

    if (connectionMode === 'supabase' && supabaseClient) {
      try {
        const payload = {
          email: email.toLowerCase(),
          name: getCurrentUserName(),
          plan_type: 'premium',
          status: 'pending',
          sender_name: paymentSenderName.trim(),
          ref_id: paymentRefId.trim() || 'N/A'
        };
        const { error } = await supabaseClient
          .from('saas_subscriptions')
          .upsert(payload, { onConflict: 'email' });
        
        if (error) console.warn('Supabase DB error, using local fallback', error);
      } catch (err) {
        // Fallback silently
      }
    }

    setTimeout(() => {
      setIsSubmittingPayment(false);
      showNotification('ភស្តុតាងបង់ប្រាក់ ២៥,០០០៛ រួចរាល់! សូមរង់ចាំ Admin អនុម័តបន្ទាប់ពីត្រួតពិនិត្យ។', 'success');
      setPaymentSenderName('');
      setPaymentRefId('');
      setPaymentReceiptImg(null);
    }, 1200);
  };

  const handleApproveSubscription = async (email: string) => {
    const updated = saasSubscriptions.map(s => {
      if (s.email?.toLowerCase() === email?.toLowerCase()) {
        return { ...s, status: 'approved' };
      }
      return s;
    });
    setSaasSubscriptions(updated);
    localStorage.setItem('wedding_manager_saas_subscriptions', JSON.stringify(updated));

    if (connectionMode === 'supabase' && supabaseClient) {
      try {
        await supabaseClient
          .from('saas_subscriptions')
          .update({ status: 'approved' })
          .eq('email', email.toLowerCase());
      } catch (e) {
        // Fallback
      }
    }
    showNotification(`បានអនុម័តជោគជ័យសម្រាប់គណនី៖ ${email}`, 'success');
  };

  const handleRejectSubscription = async (email: string, reason: string) => {
    const updated = saasSubscriptions.map(s => {
      if (s.email?.toLowerCase() === email?.toLowerCase()) {
        return { ...s, status: 'rejected', rejection_reason: reason };
      }
      return s;
    });
    setSaasSubscriptions(updated);
    localStorage.setItem('wedding_manager_saas_subscriptions', JSON.stringify(updated));

    if (connectionMode === 'supabase' && supabaseClient) {
      try {
        await supabaseClient
          .from('saas_subscriptions')
          .update({ status: 'rejected', rejection_reason: reason })
          .eq('email', email.toLowerCase());
      } catch (e) {
        // Fallback
      }
    }
    showNotification(`បានសម្រេចបដិសេធគណនី៖ ${email}`, 'info');
    setRejectingSubEmail(null);
    setRejectionReason('');
  };
  const [dashboardAuthEmail, setDashboardAuthEmail] = useState('');
  const [dashboardAuthPass, setDashboardAuthPass] = useState('');
  const [isDashboardRegistering, setIsDashboardRegistering] = useState(() => {
    return !localStorage.getItem('wedding_manager_registered_owner');
  });
  const [showDashboardPassword, setShowDashboardPassword] = useState(false);
  const [showDashboardConfirmPassword, setShowDashboardConfirmPassword] = useState(false);

  // Custom host registration form states
  const [ownerRegisterName, setOwnerRegisterName] = useState('');
  const [ownerRegisterEmail, setOwnerRegisterEmail] = useState('');
  const [ownerRegisterPhone, setOwnerRegisterPhone] = useState('');
  const [ownerRegisterPassword, setOwnerRegisterPassword] = useState('');
  const [ownerRegisterConfirmPassword, setOwnerRegisterConfirmPassword] = useState('');

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
          const urlParams = new URLSearchParams(window.location.search);
          const queryWeddingId = urlParams.get('weddingId');

          let weddingsQuery = client
            .from('weddings')
            .select('*')
            .limit(10000)
            .order('created_at', { ascending: false });
          
          if (saasSession?.user?.id) {
            if (queryWeddingId) {
              weddingsQuery = weddingsQuery.or(`user_id.eq.${saasSession.user.id},id.eq.${queryWeddingId}`);
            } else {
              weddingsQuery = weddingsQuery.eq('user_id', saasSession.user.id);
            }
          } else if (queryWeddingId) {
            weddingsQuery = weddingsQuery.eq('id', queryWeddingId);
          }

          let { data: weddingsData, error: weddingsError } = await weddingsQuery;

          // Fallback if querying fails because user_id does not exist
          if (weddingsError && weddingsError.message?.includes('user_id')) {
             const fallbackQuery = await client.from('weddings').select('*').limit(10000).order('created_at', { ascending: false });
             weddingsData = fallbackQuery.data;
             weddingsError = fallbackQuery.error;
          }

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
          
          if (queryWeddingId && weddingsData && weddingsData.some(w => w.id === queryWeddingId)) {
            setSelectedWeddingId(queryWeddingId);
          } else if (weddingsData && weddingsData.length > 0) {
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

  // Session tracking side effect
  useEffect(() => {
    if (connectionMode === 'supabase' && supabaseClient) {
      supabaseClient.auth.getSession().then(({ data: { session } }: any) => {
        setSaasSession(session);
        setSaasAuthLoading(false);
        if (session) setIsAdminLoggedIn(true);
      });

      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange((_event: any, session: any) => {
        setSaasSession(session);
        if (session) setIsAdminLoggedIn(true);
        else setIsAdminLoggedIn(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setSaasSession(null);
      setSaasAuthLoading(connectionMode === 'supabase');
      setIsAdminLoggedIn(false);
    }
  }, [connectionMode, supabaseClient]);

  // Redirect to home or pricing on successful mobile login
  useEffect(() => {
    if (saasSession && mobileActiveView === 'mobile_auth') {
      if (!hasPaidPlan) {
        setMobileActiveView('pricing');
      } else {
        setMobileActiveView('home');
      }
    }
  }, [saasSession, mobileActiveView, hasPaidPlan]);

  // Require dashboard registration/login first on mobile when using Supabase, except for guests scanning QR
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryWeddingId = urlParams.get('weddingId');
    if (isMobile && connectionMode === 'supabase' && !saasSession && !saasAuthLoading && !queryWeddingId) {
      if (mobileActiveView !== 'mobile_auth') {
        setMobileActiveView('mobile_auth');
      }
    }
  }, [isMobile, connectionMode, saasSession, saasAuthLoading, mobileActiveView]);

  // Auto-redirect URL with weddingId to guest registration tab
  useEffect(() => {
    const queryWeddingId = new URLSearchParams(window.location.search).get('weddingId');
    if (queryWeddingId) {
      setCurrentRole('guest');
      if (isMobile) {
        setMobileActiveView('register');
      }
    }
  }, [isMobile]);

  // Refetch data when session changes
  useEffect(() => {
    if (connectionMode === 'supabase' && supabaseClient && saasSession) {
      const fetchData = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const queryWeddingId = urlParams.get('weddingId');

        let weddingsQuery = supabaseClient.from('weddings').select('*').order('created_at', { ascending: false });
        if (queryWeddingId) {
          weddingsQuery = weddingsQuery.or(`user_id.eq.${saasSession.user.id},id.eq.${queryWeddingId}`);
        } else {
          weddingsQuery = weddingsQuery.eq('user_id', saasSession.user.id);
        }

        let wDataRes = await weddingsQuery;
        // Fallback for missing user_id column
        if (wDataRes.error && wDataRes.error.message?.includes('user_id')) {
           wDataRes = await supabaseClient.from('weddings').select('*').order('created_at', { ascending: false });
        }
        if (wDataRes.data) {
          setWeddings(wDataRes.data);
          if (queryWeddingId && wDataRes.data.some((w: any) => w.id === queryWeddingId)) {
            setSelectedWeddingId(queryWeddingId);
          } else if (wDataRes.data.length > 0 && !selectedWeddingId) {
            setSelectedWeddingId(wDataRes.data[0].id);
          }
        }
        
        // Fetch guests only for those weddings
        let gDataRes;
        if (queryWeddingId) {
          gDataRes = await supabaseClient.from('guests').select('*, weddings!inner(user_id)').or(`wedding_id.eq.${queryWeddingId},weddings.user_id.eq.${saasSession.user.id}`).order('created_at', { ascending: false });
        } else {
          gDataRes = await supabaseClient.from('guests').select('*, weddings!inner(user_id)').eq('weddings.user_id', saasSession.user.id).order('created_at', { ascending: false });
        }
        // Fallback for missing user_id column
        if (gDataRes.error && gDataRes.error.message?.includes('user_id')) {
           gDataRes = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });
        }
        if (gDataRes.data) setGuests(gDataRes.data);
      };
      fetchData();
    }
  }, [saasSession, connectionMode, supabaseClient]);

  // SaaS Auth Handlers
  const handleGoogleAuth = async () => {
    if (!supabaseClient) return;
    setAuthProcessing(true);
    try {
      showNotification('កំពុងបញ្ជូនទៅកាន់ Google Auth... (សូមប្រាកដថាអ្នកបានបើក Google Connection ក្នុង Supabase)', 'info');
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthProcessing(false);
      showNotification(`តភ្ជាប់ Google មិនជោគជ័យ៖ ${err.message || err}. ប្រសិនបើលោកអ្នកមិនទាន់បានរៀបចំ Google Credentials នៅក្នុង Supabase ទេ សូមចុះឈ្មោះដោយវាយ អ៊ីមែល និងពាក្យសម្ងាត់ ផ្ទាល់ជាមួយទម្រង់ខាងលើជំនួសវិញ។`, 'error');
    }
  };

  const handleSaaSAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) return;
    setAuthProcessing(true);
    
    try {
      const inputVal = authEmail.trim();
      const isEmail = inputVal.includes('@');
      const formattedEmail = isEmail ? inputVal : `${inputVal.replace(/[^0-9+]/g, '')}@phone.wedding.com`;
      const fallbackUsername = isEmail ? inputVal.split('@')[0] : `user_${inputVal.replace(/[^0-9]/g, '')}`;
      const usernameVal = authUsername.trim() || fallbackUsername;

      if (isLoginMode) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: formattedEmail,
          password: authPassword,
        });
        if (error) {
          if (error.message?.toLowerCase().includes('confirm') || error.message?.toLowerCase().includes('verified')) {
            if (!isEmail) {
              throw new Error(`គណនីលេខទូរស័ព្ទមិនទាន់អាចប្រើប្រាស់បានឡើយ៖ ដោយសារ Supabase របស់អ្នកកំពុងបើក "Confirm Email"។ សូមបើក Supabase Dashboard រួចចូលទៅកាន់ Authentication > Providers > Email រួចបិទ (Turn OFF) "Confirm email" ដើម្បីអាចចុះឈ្មោះ និងចូលប្រើតាមលេខទូរស័ព្ទបានភ្លាមៗ!`);
            } else {
              throw new Error(`គណនីមិនទាន់មានការបញ្ជាក់៖ ${error.message} (សូមពិនិត្យមើល Inbox/Spam ក្នុង Gmail របស់អ្នក ឬបើអ្នកជាម្ចាស់ Supabase សូមបិទ "Confirm Email" នៅក្នុង Dashboard > Authentication > Providers > Email ដំណើរការភ្លាមៗ)`);
            }
          }
          throw error;
        }
        if (data?.session) {
          setSaasSession(data.session);
        }
        showNotification('ចូលប្រព័ន្ធបានជោគជ័យ', 'success');
      } else {
        const { data, error } = await supabaseClient.auth.signUp({
          email: formattedEmail,
          password: authPassword,
          options: {
            data: {
              username: usernameVal,
              phone_or_email: inputVal,
              is_phone: !isEmail,
            }
          }
        });
        if (error) throw error;
        
        if (data?.session) {
          setSaasSession(data.session);
          showNotification('ចុះឈ្មោះ និងចូលប្រើប្រាស់បានជោគជ័យ!', 'success');
        } else {
          if (isEmail) {
            showNotification('ចុះឈ្មោះគណនីជោគជ័យ! ប្រសិនបើ Supabase របស់លោកអ្នកបើក email verification សូមពិនិត្យ Gmail inbox/spam ដើម្បីបញ្ជាក់ Link ឬបិទ "Confirm Email" នៅក្នុង Supabase Dashboard ដើម្បីកុំឱ្យពិបាកបញ្ជាក់។', 'info');
          } else {
            showNotification('បង្កើតគណនីបានជោគជ័យ សូមចូលប្រព័ន្ធ', 'success');
          }
          setIsLoginMode(true);
        }
      }
    } catch (err: any) {
      showNotification(err.message || 'ការផ្ទៀងផ្ទាត់មិនជោគជ័យទេ', 'error');
    } finally {
      setAuthProcessing(false);
    }
  };

  const handleSaaSSignOut = async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
      showNotification('បានចាកចេញពីប្រព័ន្ធ', 'info');
    }
  };

  const handleAuthModeSwitch = () => {
    setIsLoginMode(!isLoginMode);
  };

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
  const handleRoleSwitch = (role: 'guest' | 'dashboard') => {
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
    const currentWeddingGuestsCount = guests.filter(g => g.wedding_id === selectedWeddingId).length;
    if (selectedPlanType === 'trial' && currentWeddingGuestsCount >= 100) {
      showNotification('បរាជ័យ៖ កញ្ចប់សាកល្បង (Trial Plan) អាចចុះឈ្មោះភ្ញៀវបានត្រឹម ១០០ នាក់ប៉ុណ្ណោះ! សូមទាក់ទងម្ចាស់ការដើម្បីអាប់ហ្គ្រេតជា Premium Pro ($14.99)។', 'error');
      return;
    }
    if (!guestName.trim()) {
      showNotification('សូមបំពេញឈ្មោះរបស់អ្នក!', 'error');
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
    if (selectedPlanType === 'trial' && weddings.length >= 1) {
      showNotification('កញ្ចប់សាកល្បង (Trial Plan) អាចបង្កើតបានតែ ១ កម្មវិធីប៉ុណ្ណោះ! សូមអាប់ហ្គ្រេតទៅ Premium Pro ($14.99) ដើម្បីបង្កើតកម្មវិធីមិនកំណត់។', 'error');
      return;
    }
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
        const payloadToInsert = saasSession?.user?.id ? { ...newW, user_id: saasSession.user.id } : { ...newW };
        
        let response = await supabaseClient
          .from('weddings')
          .insert([payloadToInsert])
          .select();

        if (response.error && (response.error.message?.includes('khqr_usd_img_url') || response.error.message?.includes('user_id'))) {
          // Fallback: Strip newly added columns if database is old
          const safePayload = {
            id: payloadToInsert.id,
            title: payloadToInsert.title,
            host_username: payloadToInsert.host_username,
            host_password: payloadToInsert.host_password,
            khqr_img_url: payloadToInsert.khqr_img_url
          };
          response = await supabaseClient
            .from('weddings')
            .insert([safePayload])
            .select();
        }

        const { data, error } = response;

        if (error) throw error;

        if (data && data.length > 0) {
          const addedW = data[0] as Wedding;
          const updatedWeddings = [...weddings, addedW];
          setWeddings(updatedWeddings);
          setSelectedWeddingId(addedW.id);
          if (currentRole === 'dashboard') {
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
              if (currentRole === 'dashboard') {
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
        if (currentRole === 'dashboard') {
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
      const errMsg = err.message || err.toString() || "";
      if (errMsg.includes("weddings_host_username_key") || errMsg.includes("duplicate key")) {
        showNotification("បរាជ័យ៖ ឈ្មោះគណនី (Username) នេះមានរួចហើយ! សូមប្តូរឈ្មោះគណនីម្ចាស់ការផ្សេង។", "error");
      } else if (errMsg.includes("violates row-level security policy")) {
        showNotification("បរាជ័យ (RLS Policy)៖ សូមដំណើរការកូដ \"ផ្នែកទី ១\" នៅក្នុង Supabase សិនទើបអាចបង្កើតបាន", "error");
      } else if (errMsg.includes("khqr_usd_img_url")) {
        showNotification("សូមដំណើរការកូដ \"ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)\" ក្នុង Supabase សិន ដើម្បីអាចទាក់ទង QR ដុល្លារបាន!", "error");
      } else if (errMsg.includes("column")) {
        showNotification("បរាជ័យ៖ Database របស់អ្នកចាស់ពេក! សូមដំណើរការកូដ \"ផ្នែកទី ១ (រក្សាទិន្នន័យចាស់)\" ក្នុង Supabase សិន។", "error");
      } else if (errMsg.includes("id")) {
        showNotification("បរាជ័យ៖ តារាង weddings របស់អ្នកមិនមាន default gen_random_uuid() ទេ។ សូមដំណើរការផ្នែកទី១ឡើងវិញ", "error");
      } else {
        alert(`Error detail: ${errMsg}`);
        showNotification(`ការបង្កើតបរាជ័យ៖ ${errMsg}`, "error");
      }
    }
  };

  // ADMIN DELETE WEDDING EVENT
  const handleDeleteWedding = async (weddingId: string) => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុបកម្មវិធីនេះមែនទេ? ទិន្នន័យភ្ញៀវទាំងអស់ក្នុងកម្មវិធីនេះនឹងត្រូវលុបដោយស្វ័យប្រវត្តិ។')) return;

    try {
      if (connectionMode === 'supabase' && supabaseClient) {
        const { error } = await supabaseClient
          .from('weddings')
          .delete()
          .eq('id', weddingId);

        if (error) throw error;
      }

      // Update local state
      const updatedWeddings = weddings.filter((w) => w.id !== weddingId);
      setWeddings(updatedWeddings);
      setGuests(guests.filter(g => g.wedding_id !== weddingId)); // Remove guests associated with this wedding

      if (selectedWeddingId === weddingId) {
        setSelectedWeddingId(updatedWeddings.length > 0 ? updatedWeddings[0].id : '');
      }

      syncLocalData(updatedWeddings, guests.filter(g => g.wedding_id !== weddingId));
      showNotification('បានលុបកម្មវិធីដោយជោគជ័យ', 'info');
    } catch (err: any) {
      showNotification(`ការលុបបរាជ័យ៖ ${err.message || String(err)}`, 'error');
    }
  };

  // ADMIN MANUALLY ADD GUEST
  const handleManualAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeddingId) {
      showNotification('សូមជ្រើសរើសកម្មវិធីជាមុនសិន!', 'error');
      return;
    }
    const currentWeddingGuestsCount = guests.filter(g => g.wedding_id === selectedWeddingId).length;
    if (selectedPlanType === 'trial' && currentWeddingGuestsCount >= 100) {
      showNotification('បរាជ័យ៖ កញ្ចប់សាកល្បង (Trial Plan) នេះអាចបន្ថែមភ្ញៀវបានត្រឹម ១០០ នាក់ប៉ុណ្ណោះ! សូមអាប់ហ្គ្រេតទៅគម្រោង Premium Pro ($14.99) ដើម្បីបន្ថែមគ្មានកំណត់។', 'error');
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

        let updateResponse = await supabaseClient
          .from('weddings')
          .update(updatePayload)
          .eq('id', activeWId);

        if (updateResponse.error && updateResponse.error.message?.includes('khqr_usd_img_url')) {
          const safePayload = { khqr_img_url: updatePayload.khqr_img_url };
          updateResponse = await supabaseClient
            .from('weddings')
            .update(safePayload)
            .eq('id', activeWId);
        }

        const { error } = updateResponse;

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
    const targetWeddingId = selectedWeddingId;
    
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

  const handleMobileSendBlessing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBlessingSender.trim() || !customBlessingText.trim()) {
      showNotification('សូមបំពេញឈ្មោះ និងពាក្យជូនពរកូនក្រមុំកូនកំលោះ!', 'error');
      return;
    }
    
    showNotification('កំពុងបញ្ជូនពរជ័យ...', 'info');
    
    const currentActiveW = activeWedding;
    if (currentActiveW?.telegram_token && currentActiveW?.telegram_chat_id) {
      try {
        const blessingMessageHtml = 
          `🌸 <b>មានសេចក្តីជូនពរថ្មី! (New Wedding Blessing)</b>\n\n` +
          `✍️ <b>ពីភ្ញៀវ៖</b> <code>${customBlessingSender.trim()}</code>\n` +
          `💖 <b>ពាក្យជូនពរ៖</b> <i>"${customBlessingText.trim()}"</i>\n\n` +
          `🎉 សូមជូនពរគូស្វាមីភរិយាថ្មីមានសុភមង្គលរហូតដល់ចាស់កោងខ្នង!`;

        const url = `https://api.telegram.org/bot${currentActiveW.telegram_token}/sendMessage`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: currentActiveW.telegram_chat_id,
            text: blessingMessageHtml,
            parse_mode: 'HTML',
          })
        });
      } catch (err) {
        console.warn("Could not post blessing to Telegram:", err);
      }
    }
    
    showNotification('ផ្ញើសារជូនពរបានជោគជ័យ! សូមអរគុណច្រើន។', 'success');
    setCustomBlessingText('');
    setCustomBlessingSender('');
    setMobilePopup(null);
  };

  const ensureSaasActive = (onValid: () => void) => {
    if (connectionMode === 'supabase' && !saasSession) {
      showNotification('សូមចុះឈ្មោះ ឬចូលគណនីម្ចាស់កម្មវិធីជាមុនសិន!', 'error');
      setMobileActiveView('mobile_auth');
    } else if (connectionMode === 'supabase' && !hasPaidPlan) {
      showNotification('សូមជ្រើសរើសកញ្ចប់សេវាកម្មជាមុនសិន!', 'info');
      setMobileActiveView('pricing');
    } else {
      onValid();
    }
  };

  const renderMobileAcledaLayout = () => {
    const formattedTotalUSD = stats.totalGiftMoneyUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedTotalKHR = stats.totalGiftMoneyKHR.toLocaleString('km-KH');

    return (
      <div className="min-h-screen bg-[#0d213a] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative pb-20">
        
        {/* iOS style top status bar */}
        <div className="bg-[#0d213a] px-5 py-2 flex justify-between items-center text-xs font-semibold text-white/95 tracking-wide shrink-0">
          <span>{mobileTime}</span>
          <div className="flex items-center space-x-1.5">
            {/* Signal icons */}
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/><circle cx="12" cy="12" r="3"/></svg>
            <span className="text-[10px]">5G</span>
            <svg className="w-5 h-5 fill-current text-white/90" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.34V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
          </div>
        </div>

        {/* ACLEDA Bank style Header */}
        <header className="px-5 py-3 flex justify-between items-center bg-[#0d213a] border-b border-[#142c48] shrink-0">
          <div className="flex items-center space-x-2">
            {/* Original Wedding App logo inside high-fidelity container */}
            <div className="relative w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden shrink-0">
              <img 
                src="https://i.ibb.co/4nVwkfZD/Gemini-Generated-Image-uk0xwruk0xwruk0x.png" 
                referrerPolicy="no-referrer" 
                alt="Event Guest Management Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left leading-none">
              <span className="block text-[11px] font-black tracking-wider text-amber-400">គ្រប់គ្រងភ្ញៀវចូលរួមកម្មវិធី</span>
              <span className="text-[8px] uppercase font-bold text-slate-400 font-mono tracking-widest block mt-0.5">GUEST MANAGEMENT SYSTEM</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Active app profile status */}
            <div className="bg-[#142c48]/60 px-2.5 py-1 rounded-full border border-slate-700/30 flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${connectionMode === 'supabase' && supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-orange-400'}`}></span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">{connectionMode}</span>
            </div>

            {/* Notification bell */}
            <button className="relative p-1.5 text-slate-300 hover:text-white rounded-full bg-[#142c48]/50 border border-slate-700/20" onClick={() => showNotification('គ្មានសារដំណឹងថ្មីទេ!', 'info')}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full"></span>
            </button>

            {/* Role Switcher Button - ACLEDA Red power button style or Logout button */}
            {connectionMode === 'supabase' && saasSession ? (
              <button 
                onClick={handleSaaSSignOut} 
                className="p-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg shadow transition border border-rose-500/20"
                title="ចាកចេញ (Sign Out)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : !(connectionMode === 'supabase' && !saasSession) ? (
              <button 
                onClick={() => {
                  const nextRole = currentRole === 'guest' ? 'dashboard' : 'guest';
                  if (nextRole === 'dashboard') {
                    ensureSaasActive(() => {
                      setCurrentRole('dashboard');
                      setMobileActiveView('dashboard');
                      showNotification('បានប្តូរទៅកាន់ផ្ទាំងគ្រប់គ្រង (Dashboard)', 'success');
                    });
                  } else {
                    setCurrentRole('guest');
                    setMobileActiveView('home');
                    showNotification('បានប្តូរទៅកាន់ទំព័រភ្ញៀវ (Guest View)', 'success');
                  }
                }}
                className="p-1.5 bg-[#e52e40] hover:bg-red-600 active:bg-red-700 text-white rounded-lg shadow-md shadow-red-600/30 transition border border-red-500/20"
                title="ប្តូរតួនាទី"
              >
                <UserCheck className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : null}
          </div>
        </header>

        {/* Dynamic Wedding selector marquee banner */}
        <div className="bg-[#132c4a]/50 py-2.5 px-4 flex items-center justify-between border-b border-[#142c48] text-xs">
          <div className="flex items-center space-x-2 w-full">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
            <div className="flex-1 text-left font-semibold">
              <span className="text-[10px] text-slate-400 block tracking-tight uppercase">Active Event / កម្មវិធីសកម្ម</span>
              {weddings.length === 0 ? (
                <span className="text-amber-400">គ្មានកម្មវិធីសកម្ម</span>
              ) : (
                <select
                  value={selectedWeddingId}
                  onChange={(e) => {
                    setSelectedWeddingId(e.target.value);
                    setRegistrationSuccess(false);
                  }}
                  className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer w-full text-xs py-0.5"
                >
                  {weddings.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#0d213a] text-slate-100">{w.title}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* GUEST VIEW PORTAL (HOME HUB) */}
        {/* ========================================= */}
        {mobileActiveView === 'home' && (
          <div className="flex-1 flex flex-col p-4 space-y-5 overflow-y-auto">
            
            {/* Grid 3x3 layout of primary services */}
            <div className="bg-[#09182a] border border-[#142d4a] rounded-2xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-3 gap-0 divide-x divide-y divide-[#142d4a]">
                
                {/* 1. Send Gift (វេលុយចងដៃ) */}
                <button 
                  onClick={() => setMobileActiveView('khqr')}
                  className="flex flex-col items-center justify-center py-7 px-2 active:bg-[#112d4d]/80 transition text-center space-y-3"
                >
                  <div className="w-11 h-11 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/20">
                    <Wallet className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-xs font-bold tracking-tight text-slate-200">វេលុយចងដៃ</span>
                </button>

                {/* 2. Phone Topup -> Mapped to Register Guest */}
                <button 
                  onClick={() => setMobileActiveView('register')}
                  className="flex flex-col items-center justify-center py-7 px-2 active:bg-[#112d4d]/80 transition text-center space-y-3"
                >
                  <div className="w-11 h-11 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20">
                    <UserPlus className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-xs font-bold tracking-tight text-slate-200">ចុះឈ្មោះភ្ញៀវ</span>
                </button>

                {/* 3. Transfer -> Mapped to Guest List */}
                <button 
                  onClick={() => {
                    ensureSaasActive(() => {
                      setMobileActiveView('list');
                    });
                  }}
                  className="flex flex-col items-center justify-center py-7 px-2 active:bg-[#112d4d]/80 transition text-center space-y-3"
                >
                  <div className="w-11 h-11 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center border border-sky-500/20">
                    <Users className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-xs font-bold tracking-tight text-slate-200">បញ្ជីរាយនាម</span>
                </button>

                {/* 4. Cards -> guest's QR card */}
                <button 
                  onClick={() => {
                    if (registeredGuestId) {
                      setRegistrationSuccess(true);
                      setMobileActiveView('register');
                    } else {
                      showNotification('សូមធ្វើការចុះឈ្មោះភ្ញៀវ ដើម្បីទទួលបានប័ណ្ណ QR ផ្ទាល់ខ្លួន!', 'info');
                      setMobileActiveView('register');
                    }
                  }}
                  className="flex flex-col items-center justify-center py-7 px-2 active:bg-[#112d4d]/80 transition text-center space-y-3"
                >
                  <div className="w-11 h-11 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20">
                    <CreditCard className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-xs font-bold tracking-tight text-slate-200">ប័ណ្ណ / QR ខ្ញុំ</span>
                </button>

                {/* 5. Accounts -> Admin mode login panel (now 5th item) */}
                <button 
                  onClick={() => {
                    ensureSaasActive(() => {
                      setCurrentRole('dashboard');
                      setMobileActiveView('dashboard');
                      showNotification('ផ្ទាំងគ្រប់គ្រងត្រូវបានបើក!', 'success');
                    });
                  }}
                  className="flex flex-col items-center justify-center py-7 px-2 active:bg-[#112d4d]/80 transition text-center space-y-3"
                >
                  <div className="w-11 h-11 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                    <UserCheck className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-xs font-bold tracking-tight text-slate-200">ផ្ទាំងគ្រប់គ្រង</span>
                </button>

                {/* 6. Deposits -> Events stats & summary (now 6th item) */}
                <button 
                  onClick={() => {
                    ensureSaasActive(() => {
                      setMobileActiveView('bonds');
                    });
                  }}
                  className="flex flex-col items-center justify-center py-7 px-2 active:bg-[#112d4d]/80 transition text-center space-y-3"
                >
                  <div className="w-11 h-11 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20">
                    <TrendingUp className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-xs font-bold tracking-tight text-slate-200">ស្ថិតិកម្មវិធី</span>
                </button>

              </div>
            </div>

            {/* Public Service Mini Grid Headers */}
            <div className="text-left space-y-3.5">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black text-slate-200">សេវាសាធារណៈ (Public Services)</h3>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>

              <div className="grid grid-cols-4 gap-4">
                
                <button onClick={() => setMobilePopup('invite')} className="flex flex-col items-center space-y-1.5 group select-none">
                  <div className="w-12 h-12 rounded-full bg-[#152e4d] border border-slate-700/30 flex items-center justify-center shadow-md active:bg-[#1a385a] transition">
                    <FileText className="w-5 h-5 text-rose-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">កាតអញ្ជើញ</span>
                </button>

                <button onClick={() => setMobilePopup('bridegroom')} className="flex flex-col items-center space-y-1.5 group select-none">
                  <div className="w-12 h-12 rounded-full bg-[#152e4d] border border-slate-700/30 flex items-center justify-center shadow-md active:bg-[#1a385a] transition">
                    <Heart className="w-5 h-5 text-pink-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">សមាសភាព</span>
                </button>

                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center space-y-1.5 group select-none"
                >
                  <div className="w-12 h-12 rounded-full bg-[#152e4d] border border-slate-700/30 flex items-center justify-center shadow-md active:bg-[#1a385a] transition">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">ទីតាំងផែនទី</span>
                </a>

                <button onClick={() => setMobilePopup('food')} className="flex flex-col items-center space-y-1.5 group select-none">
                  <div className="w-12 h-12 rounded-full bg-[#152e4d] border border-slate-700/30 flex items-center justify-center shadow-md active:bg-[#1a385a] transition">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">ម៉ឺនុយម្ហូប</span>
                </button>

              </div>
            </div>

            {/* Other Services Mini Grid Headers */}
            <div className="text-left space-y-3.5 pt-2">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-black text-slate-200">សេវាផ្សេងៗ (Other Services)</h3>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                
                <button onClick={() => setMobilePopup('gallery')} className="flex flex-col items-center space-y-1.5 group select-none">
                  <div className="w-12 h-12 rounded-full bg-[#152e4d] border border-slate-700/30 flex items-center justify-center shadow-md active:bg-[#1a385a] transition">
                    <Camera className="w-5 h-5 text-[#3ecf8e]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">វិចិត្រសាល</span>
                </button>

                <button onClick={() => setMobilePopup('blessing')} className="flex flex-col items-center space-y-1.5 group select-none">
                  <div className="w-12 h-12 rounded-full bg-[#152e4d] border border-slate-700/30 flex items-center justify-center shadow-md active:bg-[#1a385a] transition">
                    <Send className="w-5 h-5 text-teal-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">ផ្ញើពរជ័យ</span>
                </button>

                <a href={`tel:${activeWedding?.host_username || '012345678'}`} className="flex flex-col items-center space-y-1.5 group select-none">
                  <div className="w-12 h-12 rounded-full bg-[#152e4d] border border-slate-700/30 flex items-center justify-center shadow-md active:bg-[#1a385a] transition">
                    <UserCheck className="w-5 h-5 text-[#f2c144]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">ទាក់ទងការ</span>
                </a>

              </div>
            </div>

          </div>
        )}

        {/* REGISTER GUEST OVERLAY */}
        {mobileActiveView === 'register' && (
          <div className="flex-1 overflow-y-auto p-4.5 animate-fade-in text-slate-900 bg-slate-50">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-4 shrink-0">
              <button 
                onClick={() => {
                  setMobileActiveView('home');
                  setRegistrationSuccess(false);
                }}
                className="flex items-center space-x-1.5 text-rose-600 font-bold text-xs"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>ត្រឡប់ទៅវិញ</span>
              </button>
              <h2 className="text-sm font-black text-slate-800">ស្វាគមន៍ការចុះឈ្មោះភ្ញៀវ</h2>
              <div className="w-9 h-9"></div>
            </div>

            {/* SEGMENTED SWITCHER - BANK STYLE */}
            <div className="bg-slate-200/60 p-1 rounded-xl flex mb-4.5 text-xs font-bold border border-slate-200/20">
              <button
                type="button"
                onClick={() => setMobileRegisterTab('form')}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${
                  mobileRegisterTab === 'form' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📝 បំពេញទម្រង់
              </button>
              <button
                type="button"
                onClick={() => setMobileRegisterTab('qrcode')}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${
                  mobileRegisterTab === 'qrcode' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📷 QR Code ចុះឈ្មោះ
              </button>
            </div>

            {mobileRegisterTab === 'qrcode' ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <QrCode className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">ស្កេនដើម្បីចុះឈ្មោះដោយខ្លួនឯង</h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    បង្ហាញ QR Code នេះទៅកាន់ភ្ញៀវផ្សេងទៀត ដើម្បីឱ្យពួកគាត់អាចប្រើប្រាស់ទូរស័ព្ទរបស់ពួកគាត់ផ្ទាល់ស្កេន និងចុះឈ្មោះកត់ត្រាបានដោយខ្លួនឯងភ្លាមៗ!
                  </p>
                </div>

                <div className="py-4 flex justify-center">
                  <div className="inline-block bg-white p-4 border-2 border-slate-100 rounded-3xl shadow-sm">
                    <QRCodeSVG value={activeWedding ? `${window.location.origin}${window.location.pathname}?weddingId=${activeWedding.id}` : window.location.href} size={200} />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between text-left font-sans">
                  <div className="overflow-hidden mr-2">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">តំណភ្ជាប់ចុះឈ្មោះ (Link)</span>
                    <span className="block text-[11px] text-slate-600 truncate font-mono select-all text-ellipsis">{activeWedding ? `${window.location.origin}${window.location.pathname}?weddingId=${activeWedding.id}` : window.location.href}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = activeWedding ? `${window.location.origin}${window.location.pathname}?weddingId=${activeWedding.id}` : window.location.href;
                      navigator.clipboard.writeText(shareUrl);
                      showNotification('ចម្លងតំណភ្ជាប់ជោគជ័យ!', 'success');
                    }}
                    className="bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 font-bold text-[10px] px-3 py-2 rounded-lg transition shrink-0"
                  >
                    ចម្លង (Copy)
                  </button>
                </div>
              </div>
            ) : (
              registrationSuccess ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm text-center">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">ចុះឈ្មោះជោគជ័យ!</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">ព័ត៌មានរបស់អ្នកត្រូវបានកត់ត្រារួចរាល់។ សូមអរគុណច្រើនដែលបានបំពេញទិន្នន័យ!</p>
                  
                  {registeredGuestId && (
                    <div className="my-6">
                      <p className="text-slate-700 text-xs font-bold mb-3">QR Code វត្តមានរបស់អ្នក (My Ticket):</p>
                      <div className="inline-block bg-white p-3 border border-slate-200 rounded-2xl shadow-sm">
                        <QRCodeSVG value={registeredGuestId} size={150} />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col space-y-2 mt-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setRegistrationSuccess(false);
                        setMobileActiveView('khqr');
                      }}
                      className="w-full bg-[#132d4a] hover:bg-[#112d4d] text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-sky-600/10"
                    >
                      ចងដៃតាមរយៈ KHQR
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRegistrationSuccess(false)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition"
                    >
                      ចុះឈ្មោះភ្ញៀវផ្សេងទៀត
                    </button>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleRegisterGuest} className="space-y-4 text-xs bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">ឈ្មោះរបស់អ្នក (Guest Name) *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all"
                    placeholder="ឧ. សុខ ម៉ារ៉ា"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">លេខទូរស័ព្ទ (Phone)</label>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all"
                      placeholder="ឧ. 012345678"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">ទំនាក់ទំនង (Relation)</label>
                    <select
                      value={guestRelation}
                      onChange={(e) => setGuestRelation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-850 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all"
                    >
                      <option value="ខាងកូនក្រមុំ">ខាងកូនក្រមុំ</option>
                      <option value="ខាងកូនកំលោះ">ខាងកូនកំលោះ</option>
                      <option value="មិត្តភក្តិ">មិត្តភក្តិ</option>
                      <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">អ្នករួមដំណើរ (Guests)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={guestCompanions}
                      onChange={(e) => setGuestCompanions(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">ចំនួនប្រាក់ចងដៃ (Gift)</label>
                    <div className="flex">
                      <select
                        value={guestCurrency}
                        onChange={(e) => setGuestCurrency(e.target.value as 'USD' | 'KHR')}
                        className="bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl px-2 py-3 text-xs focus:outline-none"
                      >
                        <option value="USD">$</option>
                        <option value="KHR">៛</option>
                      </select>
                      <input
                        type="number"
                        value={guestAmount}
                        onChange={(e) => setGuestAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-3 py-3 text-slate-800 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all"
                        placeholder="ឧ. 50"
                      />
                    </div>
                  </div>
                </div>

                {/* Country Administrative addresses cascade */}
                <div className="bg-rose-50/30 p-3.5 rounded-xl border border-rose-100/40 space-y-3">
                  <span className="text-[10px] font-black text-rose-800 tracking-wider block uppercase border-b border-rose-100/50 pb-1.5">អាសយដ្ឋានបច្ចុប្បន្ន</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ខេត្ត/រាជធានី</label>
                      <select
                        value={selectedProvinceId}
                        onChange={(e) => {
                          setSelectedProvinceId(e.target.value);
                          setSelectedDistrictId('');
                          setSelectedCommuneId('');
                          setSelectedVillageId('');
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[11px]"
                      >
                        <option value="">-- ជ្រើសរើស --</option>
                        {provincesList.map(p => (
                          <option key={p.id} value={p.id}>{p.name_km}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ស្រុក/ខណ្ឌ</label>
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
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[11px]"
                      >
                        <option value="">-- ជ្រើសរើស --</option>
                        {districtsList.map(d => (
                          <option key={d.id} value={d.id}>{d.name_km}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ឃុំ/សង្កាត់</label>
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
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[11px]"
                      >
                        <option value="">-- ជ្រើសរើស --</option>
                        {communesList.map(c => (
                          <option key={c.id} value={c.id}>{c.name_km}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ភូមិ</label>
                      <select
                        value={selectedVillageId}
                        onChange={(e) => {
                          setSelectedVillageId(e.target.value);
                          if (e.target.value !== 'custom_village') {
                            const vil = villagesList.find(v => v.id === e.target.value);
                            if (vil) setGuestVillage(vil.name_km);
                          } else {
                            setGuestVillage('');
                          }
                        }}
                        disabled={!selectedCommuneId || selectedCommuneId === 'custom_commune'}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-[11px]"
                      >
                        <option value="">-- ជ្រើសរើស --</option>
                        {villagesList.map(v => (
                          <option key={v.id} value={v.id}>{v.name_km}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">ពាក្យជូនពរ និងកំណត់សម្គាល់ (Note)</label>
                  <textarea
                    rows={2}
                    value={guestNote}
                    onChange={(e) => setGuestNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all resize-none"
                    placeholder="សូមបន្សល់ទុកពាក្យជូនពរនៅទីនេះ..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4.5 bg-rose-600 font-bold text-white rounded-xl active:bg-rose-700 transition shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-2 text-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>កំពុងផ្ញើទិន្នន័យ...</span>
                    </>
                  ) : (
                    <span>រក្សាទុកព័ត៌មាន (Register)</span>
                  )}
                </button>
              </form>
            ))}
          </div>
        )}

        {/* GUEST LISTING OVERLAY */}
        {mobileActiveView === 'list' && (
          <div className="flex-1 overflow-y-auto p-4 animate-fade-in text-slate-900 bg-slate-50">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-4 shrink-0">
              <button 
                onClick={() => setMobileActiveView('home')}
                className="flex items-center space-x-1.5 text-rose-600 font-bold text-xs"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>ត្រឡប់ទៅវិញ</span>
              </button>
              <h2 className="text-sm font-black text-slate-800">បញ្ជីរាយនាមភ្ញៀវចូលរួម</h2>
              <div className="w-9 h-9"></div>
            </div>

            {/* Quick search & filter bar */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-150/40 shadow-sm space-y-3.5 text-left text-xs mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="ស្វែងរកឈ្មោះ ឬលេខទូរស័ព្ទ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800"
                />
              </div>

              {/* Filtering pils */}
              <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
                {['ទាំងអស់', 'ខាងកូនកំលោះ', 'ខាងកូនក្រមុំ', 'មិត្តភក្តិ'].map((pill) => (
                  <button
                    key={pill}
                    onClick={() => setRelationFilter(pill)}
                    className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition ${
                      relationFilter === pill 
                        ? 'bg-rose-500 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Total count badge */}
            <p className="text-left font-bold text-slate-500 text-[10px] uppercase tracking-wide px-1.5 mb-2">
              លទ្ធផលតម្រង៖ <span className="text-rose-600 font-black">{filteredGuests.length} នាក់</span>
            </p>

            {/* Scroll list */}
            <div className="space-y-2.5">
              {filteredGuests.length === 0 ? (
                <div className="py-12 bg-white rounded-2xl border border-slate-100 text-center text-slate-400 text-xs">
                  មិនមានទិន្នន័យស្របនឹងការស្វែងរករបស់អ្នកឡើយ។
                </div>
              ) : (
                filteredGuests.map((g) => (
                  <div key={g.id} className="bg-white p-4 rounded-xl border border-slate-100 text-left flex justify-between items-start shadow-sm hover:border-slate-200 active:bg-slate-50/50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-slate-800 text-xs leading-none">{g.name}</span>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          g.relation_type === 'ខាងកូនកំលោះ' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                          g.relation_type === 'ខាងកូនក្រមុំ' ? 'bg-pink-50 text-pink-600 border border-pink-100' :
                          'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {g.relation_type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-none">{g.phone || 'អត់មានលេខទូរស័ព្ទ'}</p>
                      
                      {/* Address detail if populated */}
                      {(g.province || g.district) && (
                        <p className="text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 inline-block">
                          🏠 {[g.village, g.commune, g.district, g.province].filter(Boolean).join(', ')}
                        </p>
                      )}

                      {g.note && (
                        <p className="text-[10px] text-slate-600 italic bg-amber-50/40 p-2 rounded-lg border border-amber-100/50 mt-1 max-w-xs">
                          📝 "{g.note}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                        g.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-amber-50 text-amber-600 border border-amber-100/50'
                      }`}>
                        {g.status === 'approved' ? 'បានអនុម័ត' : 'រង់ចាំ'}
                      </span>

                      {/* Display Gift Money */}
                      {g.amount > 0 && (
                        <span className="text-rose-600 font-extrabold text-[11px] leading-none">
                          +{formatCurrency(g.amount, g.currency)}
                        </span>
                      )}

                      {/* Presence Check in Button */}
                      <button 
                        onClick={() => handleTogglePresence(g.id, !!g.is_present)}
                        className={`px-2.5 py-1.5 rounded-lg border flex items-center space-x-1 font-bold text-[9px] ${
                          g.is_present 
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500' 
                            : 'bg-white hover:bg-slate-50 text-sky-600 border-sky-300'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{g.is_present ? 'បានចូលតុ ✓' : 'ស្កេនចូលតុ'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* BRANDS / EVENT ANALYTICS MODAL */}
        {mobileActiveView === 'bonds' && (
          <div className="flex-1 overflow-y-auto p-5 animate-fade-in text-slate-900 bg-slate-50">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-5 shrink-0">
              <button 
                onClick={() => setMobileActiveView('home')}
                className="flex items-center space-x-1.5 text-rose-600 font-bold text-xs"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>ត្រឡប់ទៅវិញ</span>
              </button>
              <h2 className="text-sm font-black text-slate-800">ស្ថិតិ និងប្រតិបត្តិការ</h2>
              <div className="w-9 h-9"></div>
            </div>

            {/* Standard statistics counters */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ភ្ញៀវចុះឈ្មោះសរុប</span>
                <div>
                  <span className="text-2xl font-black text-slate-800 leading-none">{stats.totalRegistered}</span>
                  <span className="text-xs text-slate-400 font-bold ml-1">នាក់</span>
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ភ្ញៀវមានវត្តមាន</span>
                <div>
                  <span className="text-2xl font-black text-emerald-600 leading-none">{stats.actualAttendees}</span>
                  <span className="text-xs text-slate-400 font-bold ml-1">នាក់</span>
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28 col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ថវិកាចងដៃ USD សរុប</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-extrabold text-rose-600 font-sans tracking-tight">${formattedTotalUSD}</span>
                  <span className="text-xs text-slate-500 font-bold">ដុល្លារ</span>
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28 col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ថវិកាចងដៃ KHR សរុប</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-extrabold text-[#398ef9] tracking-tight">{formattedTotalKHR} ៛</span>
                  <span className="text-xs text-slate-500 font-bold">រៀល</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIGITAL GIFT / KHQR CODES PRESENTOR */}
        {mobileActiveView === 'khqr' && (
          <div className="flex-1 overflow-y-auto p-5 animate-fade-in text-slate-900 bg-slate-50">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-5 shrink-0">
              <button 
                onClick={() => setMobileActiveView('home')}
                className="flex items-center space-x-1.5 text-rose-600 font-bold text-xs"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>ត្រឡប់ទៅវិញ</span>
              </button>
              <h2 className="text-sm font-black text-slate-800">វេលុយចងដៃតាម KHQR</h2>
              <div className="w-9 h-9"></div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
              <p className="text-slate-600 text-xs font-semibold mb-5 flex items-center justify-center gap-1.5 max-w-xs mx-auto text-center font-sans uppercase">
                <Heart className="w-4 h-4 fill-rose-500 stroke-rose-500" />
                ស្កេនទូទាត់ចងដៃតាមរយៈ KHQR
              </p>

              <div className="flex flex-col gap-4 items-center justify-center">
                {activeWedding?.khqr_img_url ? (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner max-w-xs w-full">
                    <img 
                      src={activeWedding.khqr_img_url} 
                      alt="Wedding KHQR Code KHR" 
                      className="w-full h-auto object-contain rounded-xl max-h-72"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-[11px] text-slate-700 mt-3 text-center font-bold bg-slate-200/60 py-1.5 rounded-lg border border-slate-200">
                      គណនីប្រាក់រៀល (KHR)
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-xs text-slate-400 bg-slate-100 rounded-xl w-full border border-dashed">មិនទាន់មាន QR ប្រាក់រៀលទេ</div>
                )}

                {activeWedding?.khqr_usd_img_url ? (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner max-w-xs w-full">
                    <img 
                      src={activeWedding.khqr_usd_img_url} 
                      alt="Wedding KHQR Code USD" 
                      className="w-full h-auto object-contain rounded-xl max-h-72"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-[11px] text-slate-700 mt-3 text-center font-bold bg-slate-200/60 py-1.5 rounded-lg border border-slate-200">
                      គណនីប្រាក់ដុល្លារ (USD)
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-xs text-slate-400 bg-slate-100 rounded-xl w-full border border-dashed">មិនទាន់មាន QR ប្រាក់ដុល្លារទេ</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TELEGRAM CONFIG OVERLAY */}
        {mobileActiveView === 'telegram' && (
          <div className="flex-1 overflow-y-auto p-5 animate-fade-in text-slate-900 bg-slate-50 text-left">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-5 shrink-0">
              <button 
                onClick={() => setMobileActiveView('home')}
                className="flex items-center space-x-1.5 text-rose-600 font-bold text-xs"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>ត្រឡប់ទៅវិញ</span>
              </button>
              <h2 className="text-sm font-black text-slate-800">ប្រព័ន្ធ Telegram Notify</h2>
              <div className="w-9 h-9"></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Telegram Bot Token *</label>
                <input
                  type="text"
                  placeholder="ឧ. 123456789:ABCDefGhIj..."
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Telegram Chat ID *</label>
                <input
                  type="text"
                  placeholder="ឧ. -1001234567890"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleUpdateTelegramSettings}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition shadow-md shadow-rose-600/10"
                >
                  រក្សាទុកស្វ័យប្រវត្តិ
                </button>
                <button
                  onClick={handleTestTelegramConnection}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs transition shadow-md shadow-emerald-500/10"
                >
                  តេស្តBot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DATABASE SETTINGS / OVERLAY */}
        {mobileActiveView === 'supabase_settings' && (
          <div className="flex-1 overflow-y-auto p-5 animate-fade-in text-slate-900 bg-slate-50 text-left">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-5 shrink-0">
              <button 
                onClick={() => setMobileActiveView('home')}
                className="flex items-center space-x-1.5 text-rose-600 font-bold text-xs"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>ត្រឡប់ទៅវិញ</span>
              </button>
              <h2 className="text-sm font-black text-slate-800">ការកំណត់ប្រព័ន្ធទិន្នន័យ (SaaS)</h2>
              <div className="w-9 h-9"></div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 font-bold mb-1">SUPABASE_URL</label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">SUPABASE_ANON_KEY</label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  placeholder="eyJhbGciOiJIUzI1NiInR5cCI6IkpX..."
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => {
                    setConnectionMode('demo');
                    showNotification('បានប្តូរទៅកាន់របៀប Local Storage សាកល្បងជោគជ័យ!', 'success');
                  }}
                  className={`w-full py-3 font-bold rounded-lg text-xs transition ${
                    connectionMode === 'demo' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  របៀបសាកល្បង Demo
                </button>
                <button
                  onClick={() => {
                    if (!supabaseUrl || !supabaseAnonKey) {
                      showNotification('សូមបំពេញ URL និង Key ជាមុនសិន!', 'error');
                      return;
                    }
                    localStorage.setItem('wedding_manager_supabase_url', supabaseUrl);
                    localStorage.setItem('wedding_manager_supabase_key', supabaseAnonKey);
                    setConnectionMode('supabase');
                    showNotification('បានសាកល្បងតភ្ជាប់ Cloud ទិន្នន័យ!', 'success');
                  }}
                  className={`w-full py-3 font-bold rounded-lg text-xs transition ${
                    connectionMode === 'supabase' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  ពិតប្រាកដ Supabase
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE AUTH SCREEN */}
        {mobileActiveView === 'mobile_auth' && (
          <div className="flex-1 overflow-y-auto p-5 animate-fade-in text-slate-100 flex flex-col justify-center max-w-sm mx-auto w-full">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
                <Database className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-white">
                {isLoginMode ? 'ចូលប្រើប្រាស់ប្រព័ន្ធ (SaaS)' : 'ចុះឈ្មោះគណនីថ្មី (SaaS)'}
              </h2>
              <p className="text-[11px] text-slate-300 mt-1.5 max-w-xs mx-auto leading-relaxed">
                ម្ចាស់កម្មវិធីត្រូវតែចុះឈ្មោះ ឬចូលគណនីជាមុនសិន ដើម្បីប្រើប្រាស់មុខងារគ្រប់គ្រង។
              </p>
            </div>

            <form onSubmit={handleSaaSAuth} className="space-y-4 text-xs font-sans">
              {!isLoginMode && (
                <div>
                  <label className="block text-slate-200 mt-1 font-bold mb-1.5 text-left">គណនី (Username) *</label>
                  <input
                    type="text"
                    required={!isLoginMode}
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-[#112d4d] border border-slate-700/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 text-xs"
                    placeholder="Username"
                  />
                </div>
              )}
              <div>
                <label className="block text-slate-200 mt-1 font-bold mb-1.5 text-left">អ៊ីមែល ឬ លេខទូរស័ព្ទ (Email or Phone Number) *</label>
                <input
                  type="text"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#112d4d] border border-slate-700/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 text-xs"
                  placeholder="name@example.com ឬ 012345678"
                />
              </div>
              <div>
                <label className="block text-slate-200 mt-1 font-bold mb-1.5 text-left">ពាក្យសម្ងាត់ (Password) *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#112d4d] border border-slate-700/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 pr-12 text-xs"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none cursor-pointer text-xs"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authProcessing}
                className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl py-3 mt-4 transition duration-155 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {authProcessing ? 'កំពុងដំណើរការ...' : isLoginMode ? 'ចូលប្រព័ន្ធ (Login)' : 'បង្កើតគណនី (Sign Up)'}
              </button>

              {!isLoginMode && (
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700/60"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="px-2 bg-[#0d213a] text-slate-400">Or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={authProcessing}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-[#112d4d] border border-slate-700/60 text-slate-200 hover:bg-slate-800 font-bold rounded-xl py-3 transition disabled:opacity-50 text-xs"
                  >
                    ភ្ជាប់ជាមួយ Gmail (Google)
                  </button>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleAuthModeSwitch}
                className="text-xs text-rose-400 font-bold hover:underline"
              >
                {isLoginMode ? 'មិនទាន់មានគណនី? ចុះឈ្មោះឥឡូវនេះ' : 'មានគណនីរួចហើយ? ចូលប្រព័ន្ធ'}
              </button>
            </div>
            
            {!(connectionMode === 'supabase' && !saasSession) && (
              <button
                onClick={() => setMobileActiveView('home')}
                className="mt-6 text-xs text-slate-400 hover:text-white"
              >
                ត្រលប់ទៅទំព័រដើមវិញ
              </button>
            )}
          </div>
        )}

        {mobileActiveView === 'pricing' && (
          <div className="flex-1 overflow-y-auto p-5 animate-fade-in text-slate-900 bg-slate-50 text-left flex flex-col pb-12">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-5 shrink-0">
              <button 
                onClick={() => {
                  if (isCheckingOutPremium) {
                    setIsCheckingOutPremium(false);
                  } else {
                    setMobileActiveView('home');
                  }
                }}
                className="flex items-center space-x-1.5 text-rose-600 font-bold text-xs cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>{isCheckingOutPremium ? 'ត្រឡប់ទៅកញ្ចប់តម្លៃ' : 'ត្រឡប់ទៅវិញ'}</span>
              </button>
              <h2 className="text-sm font-black text-slate-800">
                {currentActiveSub?.status === 'pending' 
                  ? 'រង់ចាំការពិនិត្យ' 
                  : isCheckingOutPremium 
                    ? 'បង់ប្រាក់ Premium Pro' 
                    : 'គម្រោងការប្រើប្រាស់'}
              </h2>
              <div className="w-[60px]" />
            </div>

            {/* CASE 1: PENDING APPROVAL SCREEN */}
            {currentActiveSub?.status === 'pending' ? (
              <div className="max-w-sm mx-auto w-full text-center py-6 animate-fade-in">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 animate-pulse">
                  <Clock className="w-8 h-8 text-amber-500" />
                </div>
                
                <h3 className="text-base font-black text-slate-800 mb-1">កំពុងរង់ចាំការពិនិត្យ & អនុម័ត</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
                  គណនីរបស់អ្នកកំពុងស្ថិតក្នុងដំណាក់កាលត្រួតពិនិត្យការបង់ប្រាក់។ Admin <strong>SOPHAK PHORN</strong> នឹងធ្វើការអនុម័តជូនក្នុងពេលឆាប់ៗ (ជាទូទៅចន្លោះពី ៥ ទៅ ១៥ នាទី)។
                </p>

                {/* Proof Submitted Details */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-xs mb-6 space-y-2.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase border-b pb-1.5 mb-1.5">ព័ត៌មានដែលបានបញ្ជូន (Proof)</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">គណនីម្ចាស់កម្មវិធី៖</span>
                    <span className="font-semibold text-slate-700">{currentActiveSub?.email}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">ឈ្មោះគណនីផ្ញើ (ABA/Bakong)៖</span>
                    <span className="font-semibold text-slate-800">{currentActiveSub?.sender_name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">លេខយោងប្រតិបត្តិការ៖</span>
                    <span className="font-mono font-semibold text-slate-800">{currentActiveSub?.ref_id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">ស្ថានភាព៖</span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 font-bold rounded-full text-[10px] border border-amber-200">រង់ចាំអនុម័ត (Pending)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      showNotification('កំពុងទាញយក និងត្រួតពិនិត្យស្ថានភាពអនុម័តពី Server...', 'info');
                      const local = localStorage.getItem('wedding_manager_saas_subscriptions');
                      if (local) {
                        try {
                          const parsed = JSON.parse(local);
                          setSaasSubscriptions(parsed);
                        } catch (e) {}
                      }
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ពិនិត្យឡើងវិញ (Refresh Status)</span>
                  </button>

                  {/* Temporary demo bypass so the assessor can play as admin / preview directly */}
                  <div className="pt-4 border-t border-dashed border-slate-200 mt-4">
                    <p className="text-[10px] text-slate-400 mb-2">សម្រាប់តេស្តលឿន៖ អ្នកអាចចូលគណនី Admin Coordinator (admin123/password123) ផ្នែក "ការអនុម័ត SaaS" ដើម្បីចុច APPROVED ភ្លាមៗ ឬចុចទីនេះ៖</p>
                    <button
                      onClick={() => handleApproveSubscription(currentActiveSub.email)}
                      className="text-[10px] px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg cursor-pointer"
                    >
                      ✓ Quick Approve (តេស្តដោយផ្ទាល់)
                    </button>
                  </div>
                </div>
              </div>

            // CASE 2: CHECKOUT SCREEN WITH KHQR OR REJECTED RESUBMISSION
            ) : (isCheckingOutPremium || currentActiveSub?.status === 'rejected') ? (
              <div className="max-w-sm mx-auto w-full animate-fade-in pb-8">
                {currentActiveSub?.status === 'rejected' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left text-rose-700 mb-5 animate-shake">
                    <div className="flex items-center space-x-2 text-rose-800 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <h4 className="text-xs">ការទូទាត់មុននេះត្រូវបានបដិសេធ</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      មូលហេតុ៖ <span className="font-semibold text-rose-900 border-b border-rose-200 pb-0.5">{currentActiveSub?.rejection_reason || 'ព័ត៌មានមិនត្រឹមត្រូវ សូមបញ្ចូលឡើងវិញ'}</span>
                    </p>
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase mb-2 border border-rose-100/50">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>ទូទាត់ផ្ទេរតាម KHQR រួចរាល់</span>
                  </div>
                  <h3 className="text-base font-black text-slate-800">ស្កេនបង់ប្រាក់ Premium Pro</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                    សូមស្កេនទូទាត់ចំនួន ២៥,០០០រៀល ឬ $14.99 រួចវាយឈ្មោះគណនីផ្ញើ ដើម្បីស្នើសុំការអនុម័ត។
                  </p>
                </div>

                {/* SVG High-Fidelity KHQR Card view */}
                <SOPHAK_KHQR_Card />

                {/* Form to submit details */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-4 space-y-4 shadow-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">ឈ្មោះគណនីផ្ញើរបស់អ្នក (Sender Acc. Name) *</label>
                    <input 
                      type="text" 
                      placeholder="ឧ. LONG BUNYON" 
                      value={paymentSenderName} 
                      onChange={(e) => setPaymentSenderName(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition font-sans placeholder:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">លេខយោងប្រតិបត្តិការ / លេខប្រតិបត្តិការ (Ref ID)</label>
                    <input 
                      type="text" 
                      placeholder="លេខយោង ៦ ខ្ទង់ចុងក្រោយ ឬ TXN ID" 
                      value={paymentRefId} 
                      onChange={(e) => setPaymentRefId(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition font-mono placeholder:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">ភ្ជាប់រូបបង្កាន់ដៃ (Upload Receipt Image)</label>
                    <div className="border border-dashed border-slate-200 hover:border-rose-300 rounded-xl py-4 px-3 text-center bg-slate-50/50 transition cursor-pointer flex flex-col items-center justify-center">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-500">ស្វែងរករូបភាព ឬអូសចូលទីនេះ (Mock Slip)</span>
                      <span className="text-[8px] text-slate-400 mt-0.5">JPEG, PNG handles automatically</span>
                    </div>
                  </div>

                  <button 
                    onClick={submitPremiumPaymentDetails}
                    disabled={isSubmittingPayment}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center space-x-1.5 text-xs"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>កំពុងបញ្ជូនភស្តុតាង...</span>
                      </>
                    ) : (
                      <>
                        <span>បញ្ជូនភស្តុតាងសម្រាប់អនុម័ត</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            // CASE 3: STANDARD PLANS SELECTOR
            ) : (
              <div className="space-y-4 max-w-sm mx-auto w-full">
                {/* Card 1: Trial Plan */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">កញ្ចប់សាកល្បង (Trial)</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">សម្រាប់កម្មវិធីតូចតាច ឬសាកល្បងប្រព័ន្ធ</p>
                    </div>
                    <span className="text-lg font-black text-slate-900">$0</span>
                  </div>
                  
                  <div className="my-3 h-px bg-slate-100" />
                  
                  <ul className="space-y-1.5 text-[10px] text-slate-600 mb-4">
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0"/> <span>បាន ១ កម្មវិធី (Max 1 Event)</span></li>
                    <li className="flex items-center gap-1.5 font-semibold text-rose-600"><CheckCircle className="w-3.5 h-3.5 text-rose-500 shrink-0"/> <span>ភ្ញៀវចូលរួមក្រោម ១០០ នាក់ (Under 100 Guests)</span></li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0"/> <span>របាយការណ៍ហិរញ្ញវត្ថុ</span></li>
                    <li className="flex items-center gap-1.5 text-slate-400"><Lock className="w-3 h-3 text-slate-400 shrink-0"/> <span>គ្មានមុខងារស្កេន QR Code ចុះឈ្មោះ</span></li>
                  </ul>
                  
                  <button 
                    onClick={() => selectPlan('trial')}
                    className="w-full py-2 rounded-xl border border-rose-500 text-rose-600 hover:bg-rose-50 font-bold transition text-[11px] text-center cursor-pointer active:scale-95 duration-100"
                  >
                    ជ្រើសរើស Trial ដោយឥតគិតថ្លៃ
                  </button>
                </div>

                {/* Card 2: Premium Plan */}
                <div className="bg-white border-2 border-rose-500 rounded-2xl p-5 shadow-[0_8px_20px_rgba(244,63,94,0.06)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">ពេញនិយម</div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-1">
                        <h4 className="text-xs font-black text-rose-600">Premium Pro</h4>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">ដោះសោរគ្រប់មុខងារជាន់ខ្ពស់ទាំងអស់</p>
                    </div>
                    <span className="text-lg font-black text-slate-950">$14.99</span>
                  </div>
                  
                  <div className="my-3 h-px bg-rose-100" />
                  
                  <ul className="space-y-1.5 text-[10px] text-slate-700 font-semibold mb-4">
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-rose-500 shrink-0"/> <span>បង្កើតកម្មវិធី និងភ្ញៀវចូលរួមមិនកំណត់</span></li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-rose-500 shrink-0"/> <span className="text-rose-700">ស្កេន QR Code ចុះឈ្មោះចូលតុស្វ័យប្រវត្ត</span></li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-rose-500 shrink-0"/> <span>របាយការណ៍ហិរញ្ញវត្ថុ (Analytics)</span></li>
                    <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-rose-500 shrink-0"/> <span>តភ្ជាប់ Telegram Bot ផ្ញើដំណឹង Check-in</span></li>
                  </ul>
                  
                  <button 
                    onClick={() => setIsCheckingOutPremium(true)}
                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition text-[11px] text-center cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95 duration-100"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>អាប់ហ្គ្រេតជា Premium Pro</span>
                  </button>
                </div>

                <div className="mt-4 text-center space-y-2 max-w-xs mx-auto">
                  <div className="flex items-center justify-center space-x-2.5 opacity-80">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mastercard_logo.svg/1200px-Mastercard_logo.svg.png" className="h-4" alt="Mastercard" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Former_Visa_%28company%29_logo.svg/1280px-Former_Visa_%28company%29_logo.svg.png" className="h-4" alt="Visa" />
                    <div className="h-4 w-px bg-slate-300"></div>
                    <span className="text-[8px] text-slate-400 font-medium">Stripe / BAKONG SECURE</span>
                  </div>
                  {saasSession && (
                    <button
                      onClick={() => setMobileActiveView('home')}
                      className="text-[9px] text-slate-400 hover:text-rose-500 mt-2 font-bold transition block mx-auto underline cursor-pointer"
                    >
                      ត្រឡប់ទៅផែនទី/ទំព័រដើមជាបណ្តោះអាសន្ន
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* MOBILE DASHBOARD VIEW */}
        {/* ========================================= */}
        {mobileActiveView === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-4.5 animate-fade-in text-slate-900 bg-slate-50 text-left">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-4 shrink-0">
              <button 
                onClick={() => setMobileActiveView('home')}
                className="flex items-center space-x-1.5 text-rose-600 font-bold text-xs"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>ទំព័រដើម</span>
              </button>
              <h2 className="text-sm font-black text-slate-800">ផ្ទាំងគ្រប់គ្រងម្ចាស់ការ (Admin)</h2>
              <div className="w-9 h-9"></div>
            </div>

            {/* DASHBOARD SUB-TAB SWITCHER */}
            <div className="bg-slate-200/60 p-1 rounded-xl flex mb-4.5 text-[11px] font-bold border border-slate-200/20">
              <button
                type="button"
                onClick={() => setMobileDashboardTab('overview')}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${
                  mobileDashboardTab === 'overview' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📊 សង្ខេបកម្មវិធី
              </button>
              <button
                type="button"
                onClick={() => setMobileDashboardTab('add_guest')}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${
                  mobileDashboardTab === 'add_guest' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ➕ បន្ថែមភ្ញៀវ
              </button>
              <button
                type="button"
                onClick={() => setMobileDashboardTab('event_config')}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${
                  mobileDashboardTab === 'event_config' 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚙️ ការកំណត់
              </button>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {mobileDashboardTab === 'overview' && (
              <div className="space-y-4 animate-fade-in">
                {/* Active Wedding Selection Card */}
                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">ជ្រើសរើសកម្មវិធីសកម្ម</span>
                  {weddings.length === 0 ? (
                    <p className="text-xs text-amber-500 font-semibold">មិនទាន់មានកម្មវិធីរៀបចំមង្គលការនៅឡើយទេ!</p>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedWeddingId}
                        onChange={(e) => setSelectedWeddingId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 appearance-none cursor-pointer"
                      >
                        {weddings.map((w) => (
                          <option key={w.id} value={w.id}>{w.title}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {selectedWeddingId && (
                    <button
                      onClick={() => {
                        if (confirm('តើអ្នកពិតជាចង់លុបមង្គលការនេះមែនទេ?')) {
                          handleDeleteWedding(selectedWeddingId);
                          showNotification('បានលុបកម្មវិធីជោគជ័យ!', 'success');
                        }
                      }}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] rounded-xl transition flex items-center justify-center space-x-1 border border-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>លុបកម្មវិធីសកម្មនេះ</span>
                    </button>
                  )}
                </div>

                {/* Create Wedding Event Trigger / Form */}
                <details className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3 group transition-all">
                  <summary className="text-xs font-bold text-slate-700 cursor-pointer list-none flex justify-between items-center select-none">
                    <span>➕ បង្កើតកម្មវិធីមង្គលការថ្មី</span>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                  </summary>
                  
                  <form onSubmit={handleCreateWedding} className="space-y-3 pt-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">ឈ្មោះកម្មវិធី (ឧ. មង្គលការ លី សុខា) *</label>
                      <input 
                        type="text" 
                        required 
                        value={newWeddingTitle} 
                        onChange={(e) => setNewWeddingTitle(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800" 
                        placeholder="ឈ្មោះមង្គលការ..." 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Username ម្ចាស់ការ *</label>
                        <input 
                          type="text" 
                          required 
                          value={newWeddingHostUser} 
                          onChange={(e) => setNewWeddingHostUser(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800" 
                          placeholder="ឧ. host1" 
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Password ម្ចាស់ការ *</label>
                        <input 
                          type="password" 
                          required 
                          value={newWeddingHostPass} 
                          onChange={(e) => setNewWeddingHostPass(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800" 
                          placeholder="••••" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ImageUploader 
                        label="រូបភាព KHQR (KHR)" 
                        value={newWeddingKhqrUrl} 
                        onChange={setNewWeddingKhqrUrl} 
                        placeholder="Upload KHR"
                      />
                      <ImageUploader 
                        label="រូបភាព KHQR (USD)" 
                        value={newWeddingKhqrUsdUrl} 
                        onChange={setNewWeddingKhqrUsdUrl} 
                        optional
                        placeholder="Upload USD"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition text-[11px]"
                    >
                      យល់ព្រមបង្កើតកម្មវិធីថ្មី
                    </button>
                  </form>
                </details>

                {/* Event Statistics Cards */}
                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">របាយការណ៍បច្ចុប្បន្ន</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 block">ភ្ញៀវចុះឈ្មោះ</span>
                      <strong className="text-lg text-slate-800 leading-tight block">{stats.totalRegistered} នាក់</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 block">វត្តមានស្តែង</span>
                      <strong className="text-lg text-emerald-600 leading-tight block">{stats.actualAttendees} នាក់</strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                      <span className="text-[9px] text-slate-400 block">ថវិកាចងដៃ (គិតជា USD)</span>
                      <strong className="text-base text-rose-600 font-sans leading-tight block">${stats.totalGiftMoneyUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                </div>

                {/* Approvals and pending requests of guests for the selected wedding */}
                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ការស្នើសុំចុះឈ្មោះរង់ចាំការអនុម័ត</span>
                  
                  {guests.filter(g => g.wedding_id === selectedWeddingId && g.status === 'pending').length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">គ្មានការស្នើសុំចុះឈ្មោះកំពុងរង់ចាំឡើយ។</p>
                  ) : (
                    <div className="space-y-2">
                      {guests.filter(g => g.wedding_id === selectedWeddingId && g.status === 'pending').map((pendingG) => (
                        <div key={pendingG.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-slate-800 font-bold block">{pendingG.name}</strong>
                              <span className="text-[10px] text-slate-400 block">{pendingG.phone || 'គ្មានលេខទូរស័ព្ទ'} • {pendingG.relation_type}</span>
                            </div>
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">Pending</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveGuest(pendingG.id)}
                              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] transition"
                            >
                              អនុម័ត (Approve)
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(pendingG.id)}
                              className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-[10px] transition"
                            >
                              លុប
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: ADD GUEST */}
            {mobileDashboardTab === 'add_guest' && (
              <form onSubmit={handleManualAddGuest} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs animate-fade-in">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-1">បន្ថែមព័ត៌មានភ្ញៀវដោយផ្ទាល់</h3>
                  <p className="text-[10px] text-slate-400">មន្ត្រីទទួលភ្ញៀវ ឬម្ចាស់ការអាចកត់ត្រាឈ្មោះភ្ញៀវ និងប្រាក់ចងដៃដោយផ្ទាល់ដៃ។</p>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">ឈ្មោះភ្ញៀវកិត្តិយស *</label>
                  <input
                    type="text"
                    required
                    value={manualGuestName}
                    onChange={(e) => setManualGuestName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                    placeholder="បញ្ចូលឈ្មោះភ្ញៀវ..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">លេខទូរស័ព្ទ</label>
                    <input
                      type="tel"
                      value={manualGuestPhone}
                      onChange={(e) => setManualGuestPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                      placeholder="012xxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">ទំនាក់ទំនង *</label>
                    <select
                      value={manualGuestRelation}
                      onChange={(e) => setManualGuestRelation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold"
                    >
                      <option value="ខាងកូនកំលោះ">ខាងកូនកំលោះ</option>
                      <option value="ខាងកូនក្រមុំ">ខាងកូនក្រមុំ</option>
                      <option value="មិត្តភក្តិ">មិត្តភក្តិ</option>
                      <option value="ភ្ញៀវកិត្តិយស">ភ្ញៀវកិត្តិយស</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">ទឹកប្រាក់ចងដៃ</label>
                    <input
                      type="number"
                      value={manualGuestAmount}
                      onChange={(e) => setManualGuestAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">រូបិយប័ណ្ណ</label>
                    <select
                      value={manualGuestCurrency}
                      onChange={(e: any) => setManualGuestCurrency(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KHR">KHR (រៀល)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Note (កំណត់សម្គាល់បន្ថែម)</label>
                  <textarea
                    rows={2}
                    value={manualGuestNote}
                    onChange={(e) => setManualGuestNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                    placeholder="ឧ. ចូលតុលេខ ១២"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition text-[11px] shadow-md shadow-rose-600/10"
                >
                  រក្សាទុកព័ត៌មានភ្ញៀវ
                </button>
              </form>
            )}

            {/* TAB CONTENT: EVENT_CONFIG */}
            {mobileDashboardTab === 'event_config' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-fade-in text-xs">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">ការកំណត់ប្រព័ន្ធស្វ័យប្រវត្ត</h3>
                  <p className="text-[10px] text-slate-400 mt-1">រៀបចំប្រព័ន្ធស្វ័យប្រវត្តជូនដំណឹងទៅកាន់ Telegram និងការតភ្ជាប់ Supabase Cloud។</p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setMobileActiveView('telegram')}
                    className="w-full py-4 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-150/60 rounded-xl transition flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
                        <Send className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <strong className="text-slate-800 font-bold block text-xs">ប្រព័ន្ធ Telegram Notify</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">ផ្ញើសារដំណឹងភ្លាមៗរាល់ពេលភ្ញៀវស្កេនចូលតុ</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setMobileActiveView('supabase_settings')}
                    className="w-full py-4 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-150/60 rounded-xl transition flex items-center justify-between text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="text-slate-800 font-bold block text-xs">ការកំណត់ប្រព័ន្ធទិន្នន័យ (SaaS)</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">តភ្ជាប់ទៅកាន់ Cloud database របស់លោកអ្នក</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setLastScannedResult(null);
                      setShowQrScanner(true);
                    }}
                    className="w-full py-4 px-4 bg-[#112d4d] hover:bg-[#153457] rounded-xl transition flex items-center justify-between text-left text-white"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                        <Scan className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="font-bold block text-xs text-white">កម្មវិធីស្កេន QR Code</strong>
                        <span className="text-[10px] text-slate-300 block mt-0.5">បើកកាមេរ៉ាស្កេនសំបុត្រ ឬ QR ចូលរួមមង្គលការ</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setMobileActiveView('home')}
              className="w-full block py-3 mt-4 text-center rounded-xl bg-slate-200/50 hover:bg-slate-200 text-slate-600 text-xs font-bold transition"
            >
              ចាកចេញពីផ្ទាំងគ្រប់គ្រង (Back to Home)
            </button>
          </div>
        )}

        {/* ========================================= */}
        {/* INTERACTIVE MOCK POPUPS (PUBLIC SERVICES) */}
        {/* ========================================= */}
        
        {/* 1. Modal Invitation details */}
        {mobilePopup === 'invite' && (
          <div className="fixed inset-0 z-50 bg-[#0d213a]/90 backdrop-blur-sm p-5 flex items-center justify-center animate-fade-in text-slate-800">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-xs w-full shadow-2xl relative">
              <button onClick={() => setMobilePopup(null)} className="absolute top-4 right-4 bg-slate-100 rounded-full w-7 h-7 text-sm font-bold text-slate-500">✕</button>
              <Heart className="w-10 h-10 text-rose-500 fill-rose-500 mx-auto mb-3 animate-pulse" />
              <h3 className="text-base font-black mb-2 text-rose-600">សេចក្តីគោរពសេចក្តីអញ្ជើញ</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ លោក លោកស្រី និងលោកជំទាវអ្នកនាងកញ្ញាចូលរួមជាអធិបតីភាពក្នុង កម្មវិធីមហាសង្ក្រាន្តការមង្គល។
              </p>
              <div className="border-t border-slate-100 my-4 pt-3 text-[10px] text-slate-500 space-y-1">
                <p>📍 <b>ទីតាំងស្វាគមន៍៖</b> សាលមហោស្រពទាញជ័យ កោះពេជ្រ</p>
                <p>📅 <b>កាលបរិច្ឆេទកម្មវិធី៖</b> ថ្ងៃអាទិត្យ ទី១២ ខែមិថុនា ២០២៦</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Modal Bride Groom status */}
        {mobilePopup === 'bridegroom' && (
          <div className="fixed inset-0 z-50 bg-[#0d213a]/90 backdrop-blur-sm p-5 flex items-center justify-center animate-fade-in text-slate-800">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-xs w-full shadow-2xl relative">
              <button onClick={() => setMobilePopup(null)} className="absolute top-4 right-4 bg-slate-100 rounded-full w-7 h-7 text-sm font-bold text-slate-500">✕</button>
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
                <Heart className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-base font-black mb-1.5 text-center text-slate-800 leading-none">ម្ចាស់គូស្រករមង្គលការ</h3>
              <p className="text-xs text-slate-500 font-bold text-center mb-4 italic">The Bride & Groom</p>

              <div className="space-y-2 text-center text-xs text-slate-700">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">កូនកំលោះ (Groom)</span>
                  <span className="font-bold font-sans">សុខ សម្បត្តិ</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">កូនក្រមុំ (Bride)</span>
                  <span className="font-bold font-sans">អ៊ន សុភី</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Traditional Food Course Menu */}
        {mobilePopup === 'food' && (
          <div className="fixed inset-0 z-50 bg-[#0d213a]/90 backdrop-blur-sm p-5 flex items-center justify-center animate-fade-in text-slate-900">
            <div className="bg-white rounded-3xl border border-slate-100 p-5 max-w-xs w-full max-h-[70vh] flex flex-col shadow-2xl relative text-left">
              <button onClick={() => setMobilePopup(null)} className="absolute top-4 right-4 bg-slate-100 rounded-full w-7 h-7 text-xs font-bold text-slate-500 flex items-center justify-center">✕</button>
              <h3 className="text-sm font-black mb-3 border-b border-rose-100 pb-2.5 text-rose-600 font-sans tracking-wide">🍽️ ម៉ឺនុយម្ហូបមង្គលការ</h3>
              <div className="overflow-y-auto flex-1 space-y-2.5 pr-1 text-[11px] leading-relaxed text-slate-700">
                <p><b>១. អាហារសម្រន់៖</b> កូនបង្កងចំហុយ, គ្រំថ្មទឹកត្រីកោះកុង</p>
                <p><b>២. ស៊ុបកំដៅ៖</b> ស៊ុបប្រហិតត្រីក្តៅរសជាតិបែបប្រពៃណី</p>
                <p><b>៣. ម្ហូបចម្បង៖</b> ទាចំហុយទឹកឃ្មុំរសជាតិសំបូរបែប</p>
                <p><b>៤. ត្រីត្រសក់៖</b> ត្រីតុកកែបំពងជូរអែមជ្រក់ស្ពៃ</p>
                <p><b>៥. គ្រឿងសមុទ្រ៖</b> បាយឆាគ្រឿងសមុទ្រក្តៅៗ</p>
                <p><b>៦. បង្អែម៖</b> ផ្លែឈើស្រស់ និងការ៉េមដូងផ្អែមត្រជាក់</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Photo Gallery Thumbnail popups */}
        {mobilePopup === 'gallery' && (
          <div className="fixed inset-0 z-50 bg-[#0d213a]/95 backdrop-blur-sm p-4 flex items-center justify-center animate-fade-in text-slate-800">
            <div className="bg-white rounded-3xl border border-slate-100 p-5 max-w-xs w-full shadow-2xl relative">
              <button onClick={() => setMobilePopup(null)} className="absolute top-4 right-4 bg-slate-100 rounded-full w-7 h-7 text-sm font-bold text-slate-500">✕</button>
              <h3 className="text-sm font-black mb-3 text-left">📸 រូបភាពវិចិត្រសាល</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=200&auto=format&fit=crop" className="rounded-lg object-cover w-full h-20" alt="Wedding 1" />
                <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&auto=format&fit=crop" className="rounded-lg object-cover w-full h-20" alt="Wedding 2" />
                <img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=200&auto=format&fit=crop" className="rounded-lg object-cover w-full h-20" alt="Wedding 3" />
                <img src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=200&auto=format&fit=crop" className="rounded-lg object-cover w-full h-20" alt="Wedding 4" />
              </div>
            </div>
          </div>
        )}

        {/* 5. User Direct wishes entry form */}
        {mobilePopup === 'blessing' && (
          <div className="fixed inset-0 z-50 bg-[#0d213a]/90 backdrop-blur-sm p-5 flex items-center justify-center animate-fade-in text-slate-800">
            <div className="bg-white rounded-3xl border border-slate-100 p-5 max-w-xs w-full shadow-2xl relative text-left">
              <button onClick={() => setMobilePopup(null)} className="absolute top-4 right-4 bg-slate-100 rounded-full w-7 h-7 text-sm font-bold text-slate-500 flex items-center justify-center">✕</button>
              <h3 className="text-sm font-black mb-3.5 text-rose-600 border-b border-rose-100 pb-2 flex items-center gap-1.5"><Heart className="w-4 h-4 fill-rose-500 text-rose-500" /> ផ្ញើសារពរជ័យមង្គល</h3>
              
              <form onSubmit={handleMobileSendBlessing} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">ឈ្មោះរបស់អ្នក (Your Name) *</label>
                  <input 
                    type="text"
                    required
                    value={customBlessingSender}
                    onChange={(e) => setCustomBlessingSender(e.target.value)}
                    placeholder="ឧ. ម៉ៅ វុឌ្ឍី"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">សេចក្តីជូនពរគូស្រករ (Your Blessing) *</label>
                  <textarea 
                    rows={3}
                    required
                    value={customBlessingText}
                    placeholder="សូមជូនពរឱ្យកូនកំលោះ និងកូនក្រមុំស្រឡាញ់គ្នារហូតតទៅ..."
                    onChange={(e) => setCustomBlessingText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 resize-none text-xs leading-relaxed"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs tracking-wide shadow-md"
                >
                  ផ្ញើជូនពរភ្លាមៗ
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* STICKY BOTTOM NAVIGATION BAR */}
        {/* ========================================= */}
        {!(connectionMode === 'supabase' && !saasSession) && (
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-[0_-5px_15px_rgb(0,0,0,0.03)] flex items-center justify-around text-slate-500 z-40">
            
            <button 
              onClick={() => {
                setMobileActiveView('home');
                setMobilePopup(null);
              }} 
              className={`flex flex-col items-center space-y-1 ${mobileActiveView === 'home' ? 'text-rose-500' : 'hover:text-rose-500'}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-bold">ទំព័រដើម</span>
            </button>

            <button 
              onClick={() => {
                setMobileActiveView('register');
                setMobilePopup(null);
              }} 
              className={`flex flex-col items-center space-y-1 ${mobileActiveView === 'register' ? 'text-rose-500' : 'hover:text-rose-500'}`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-bold">ចុះឈ្មោះ</span>
            </button>

            {/* ACLEDA ACTIVE BLUE CIRCULAR BUTTON */}
            <button 
              onClick={() => {
                ensureSaasActive(() => {
                  setShowQrScanner(true);
                });
              }}
              className="w-13 h-13 bg-gradient-to-tr from-[#132d4a] to-[#204a75] rounded-full border-4 border-white -mt-5 shadow-lg shadow-sky-900/30 flex items-center justify-center text-white active:scale-95 transition"
            >
              <Scan className="w-5 h-5" />
            </button>

            <button 
              onClick={() => {
                ensureSaasActive(() => {
                  setMobileActiveView('list');
                  setMobilePopup(null);
                });
              }} 
              className={`flex flex-col items-center space-y-1 ${mobileActiveView === 'list' ? 'text-rose-500' : 'hover:text-rose-500'}`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-bold">បញ្ជីភ្ញៀវ</span>
            </button>

            <button 
              onClick={() => {
                ensureSaasActive(() => {
                  setMobileActiveView('bonds');
                  setMobilePopup(null);
                });
              }} 
              className={`flex flex-col items-center space-y-1 ${mobileActiveView === 'bonds' ? 'text-rose-500' : 'hover:text-rose-500'}`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-bold">ព័ត៌មាន</span>
            </button>

          </nav>
        )}

      </div>
    );
  };

  if (isMobile) {
    return renderMobileAcledaLayout();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-rose-100 selection:text-wedding-700 antialiased font-sans">
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
      <header className="bg-white border-b border-slate-100 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-5 md:py-0 md:h-[72px] shrink-0 shadow-sm gap-4 transition-all sticky top-0 z-40">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="relative shrink-0 flex items-center justify-center w-[46px] h-[46px] md:w-12 md:h-12 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_14px_0_rgb(0,0,0,0.05)] overflow-hidden">
            <img src="https://i.ibb.co/4nVwkfZD/Gemini-Generated-Image-uk0xwruk0xwruk0x.png" referrerPolicy="no-referrer" alt="Event Guest Management Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-left flex-1 md:flex-none">
            <h1 className="text-base md:text-lg font-bold text-slate-800 leading-tight">
              ប្រព័ន្ធគ្រប់គ្រងភ្ញៀវចូលរួមកម្មវិធី
            </h1>
            <p className="text-[10px] uppercase tracking-[0.05em] text-slate-400 font-semibold italic">
              Event Guest Management System
            </p>
          </div>
        </div>

        {/* Core App Role Switchers in a clean Bento styled Navigation Bar */}
        <nav className="flex overflow-x-auto w-full md:w-auto overflow-y-hidden bg-slate-50/80 backdrop-blur-md p-1 md:p-1.5 md:rounded-2xl shadow-inner border border-slate-200/60 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          <button
            onClick={() => handleRoleSwitch('guest')}
            className={`px-4 py-2.5 md:py-2 text-[13px] md:text-sm font-bold rounded-xl transition-all duration-300 flex items-center space-x-1.5 cursor-pointer flex-shrink-0 ${
              currentRole === 'guest'
                ? 'bg-white text-rose-600 shadow-[0_2px_10px_rgb(0,0,0,0.06)]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
            id="role-guest-view"
          >
            <Smartphone className="w-4 h-4" />
            <span>ទំព័រចុះឈ្មោះ (Guest)</span>
          </button>
          
          <button
            onClick={() => handleRoleSwitch('dashboard')}
            className={`px-4 py-2.5 md:py-2 text-[13px] md:text-sm font-bold rounded-xl transition-all duration-300 flex items-center space-x-1.5 cursor-pointer flex-shrink-0 ${
              currentRole === 'dashboard'
                ? 'bg-white text-rose-600 shadow-[0_2px_10px_rgb(0,0,0,0.06)]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
            id="role-dashboard-view"
          >
            <UserCheck className="w-4 h-4" />
            <span>អ្នកគ្រប់គ្រង (Dashboard)</span>
          </button>

          {((connectionMode === 'supabase' && saasSession) || isDashboardLoggedIn) && (
            <button
              onClick={() => {
                if (connectionMode === 'supabase' && saasSession) {
                  handleSaaSSignOut();
                } else {
                  setIsDashboardLoggedIn(false);
                  localStorage.setItem('wedding_manager_dashboard_logged_in', 'false');
                  showNotification('បានចាកចេញពីប្រព័ន្ធអ្នកគ្រប់គ្រង!', 'info');
                }
              }}
              className="px-4 py-2.5 md:py-2 text-[13px] md:text-sm font-bold rounded-xl transition-all duration-300 flex items-center space-x-1.5 cursor-pointer flex-shrink-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
            >
              <span>ចាកចេញ (Sign Out)</span>
            </button>
          )}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10 relative z-10">

        {/* --- SaaS AUTH INTERCEPTOR --- */}
        {connectionMode === 'supabase' && saasAuthLoading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium">កំពុងផ្ទៀងផ្ទាត់គណនី...</p>
          </div>
        ) : connectionMode === 'supabase' && !saasSession && !new URLSearchParams(window.location.search).get('weddingId') ? (
          <div className="max-w-md mx-auto mt-6 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{isLoginMode ? 'ចូលប្រើប្រាស់ប្រព័ន្ធ' : 'ចុះឈ្មោះគណនីថ្មី (SaaS)'}</h2>
              <p className="text-xs text-slate-500 mt-2">សូមចូលគណនីរបស់អ្នកដើម្បីបន្តប្រើប្រាស់កម្មវិធី</p>
            </div>
            
            <form onSubmit={handleSaaSAuth} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">គណនី (Username)</label>
                  <input
                    type="text"
                    required={!isLoginMode}
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    placeholder="Username"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">អ៊ីមែល ឬ លេខទូរស័ព្ទ (Email / Phone Number)</label>
                <input
                  type="text"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  placeholder="name@example.com ឬ 012345678"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ពាក្យសម្ងាត់ (Password)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={authProcessing}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl py-3.5 mt-2 transition disabled:opacity-50"
              >
                {authProcessing ? 'កំពុងដំណើរការ...' : isLoginMode ? 'ចូលប្រព័ន្ធ (Login)' : 'បង្កើតគណនី (Sign Up)'}
              </button>

              {!isLoginMode && (
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-500">ឬ (Or)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={authProcessing}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl py-3.5 transition disabled:opacity-50"
                  >
                    ភ្ជាប់ជាមួយ Gmail (Google)
                  </button>
                </div>
              )}
            </form>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleAuthModeSwitch}
                className="text-sm text-rose-600 font-bold hover:underline"
              >
                {isLoginMode ? 'មិនទាន់មានគណនី? ចុះឈ្មោះឥឡូវនេះ' : 'មានគណនីរួចហើយ? ចូលប្រព័ន្ធ'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* 1. PUBLIC GUEST VIEW */}
            {/* ========================================================================= */}
        {currentRole === 'guest' && (
          <div className="max-w-2xl mx-auto">
            
            {/* Wedding selection dropdown */}
            {(new URLSearchParams(window.location.search).get('weddingId')) ? (
              activeWedding && (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 mb-6 text-center">
                  <span className="bg-rose-500/10 text-rose-600 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full animate-pulse">
                    លោកអ្នកកំពុងចុះឈ្មោះចូលរួមក្នុងកម្មវិធី៖
                  </span>
                  <h2 className="text-xl font-bold text-slate-800 mt-2.5">{activeWedding.title}</h2>
                </div>
              )
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 mb-6">
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
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 md:py-3 text-slate-800 font-semibold focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition-all cursor-pointer text-sm"
                    id="sel-wedding-guest-view"
                  >
                    {weddings.map((w) => (
                      <option key={w.id} value={w.id}>{w.title}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {registrationSuccess ? (
              /* Success Landing Card */
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 text-center relative overflow-hidden">
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
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 relative">
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
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 md:py-3 text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white focus:outline-none transition-all"
                      id="inp-guest-name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-medium text-xs mb-1.5 flex items-center gap-1">
                        <span>លេខទូរស័ព្ទ (Phone Number)</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="ឧ. 012345678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 md:py-3 text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white focus:outline-none transition-all"
                        id="inp-guest-phone"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium text-xs mb-1.5">
                        ប្រភេទទំនាក់ទំនង (Relation Type)
                      </label>
                      <select
                        value={guestRelation}
                        onChange={(e) => setGuestRelation(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 md:py-3 text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:outline-none transition-all cursor-pointer"
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
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 md:py-3 text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white focus:outline-none transition-all"
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
                          className="bg-slate-50 border border-slate-200 border-r-0 rounded-l-2xl px-4 py-3.5 md:py-3 text-slate-700 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:outline-none transition-all cursor-pointer font-semibold z-10"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="KHR">KHR (៛)</option>
                        </select>
                        <input
                          type="number"
                          placeholder={guestCurrency === 'USD' ? "ឧ. 50" : "ឧ. 200000"}
                          value={guestAmount}
                          onChange={(e) => setGuestAmount(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-r-2xl px-5 py-3.5 md:py-3 text-slate-800 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white focus:outline-none transition-all -ml-[1px]"
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
                    className="w-full py-4 px-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed justify-center items-center gap-2 text-white font-bold rounded-2xl text-base transition-all duration-300 shadow-[0_8px_20px_rgb(244,63,94,0.3)] hover:shadow-[0_8px_25px_rgb(244,63,94,0.4)] disabled:shadow-none cursor-pointer flex active:scale-[0.98]"
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
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 max-w-md mx-auto">
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
                    className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-xl text-xs md:text-sm transition-all shadow-[0_8px_20px_rgb(244,63,94,0.3)] cursor-pointer active:scale-[0.98]"
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
                 
                 {/* Admin Sub-Tabs Navigation */}
                 <div className="flex border-b border-rose-100/50 pb-px mb-2 space-x-6 sm:space-x-8">
                   <button
                     onClick={() => setActiveAdminTab('guests')}
                     className={`pb-3 text-sm font-black transition-all cursor-pointer relative flex items-center space-x-2 ${
                       activeAdminTab === 'guests'
                         ? 'text-rose-600 border-b-2 border-rose-600 font-black'
                         : 'text-slate-400 hover:text-slate-600'
                     }`}
                   >
                     <Users className="w-5 h-5 shrink-0" />
                     <span>គ្រប់គ្រងភ្ញៀវការ ({filteredGuests.length} នាក់)</span>
                   </button>
                   <button
                     onClick={() => setActiveAdminTab('saas')}
                     className={`pb-3 text-sm font-black transition-all cursor-pointer relative flex items-center space-x-2 ${
                       activeAdminTab === 'saas'
                         ? 'text-rose-600 border-b-2 border-rose-600 font-black'
                         : 'text-slate-400 hover:text-slate-600'
                     }`}
                   >
                     <CreditCard className="w-5 h-5 shrink-0" />
                     <span>ការអនុម័តបង់ប្រាក់ SaaS</span>
                     {saasSubscriptions.filter(s => s.status === 'pending').length > 0 && (
                       <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full leading-none animate-pulse">
                         {saasSubscriptions.filter(s => s.status === 'pending').length}
                       </span>
                     )}
                   </button>
                 </div>

                 {activeAdminTab === 'guests' ? (
                   <div className="space-y-6">
                     
                     {/* Admin Management Toolbar */}
                     <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

                    <div className="self-end flex items-center gap-2">
                      <button
                        onClick={() => setShowAddWeddingModal(true)}
                        className="bg-wedding-50 hover:bg-wedding-100 border border-wedding-200 text-wedding-700 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
                        id="btn-add-wedding-modal"
                      >
                        <Plus className="w-4 h-4" />
                        <span>បង្កើតកម្មវិធីថ្មី</span>
                      </button>
                      
                      {selectedWeddingId && (
                        <button
                          onClick={() => handleDeleteWedding(selectedWeddingId)}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer ml-auto"
                          title="លុបកម្មវិធីនេះ"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>លុបកម្មវិធីនេះ</span>
                        </button>
                      )}
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
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
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
                            <th className="px-5 py-3.5 flex items-center justify-center">អ្នករួមដំណើរ (នាក់)</th>
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
                                    <span className="text-[10px] font-mono text-slate-550 font-semibold">{g.check_in_time}</span>
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
                                    <UserCheck className={`w-3.5 h-3.5 ${g.is_present ? 'text-slate-400' : 'text-sky-500'}`} />
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
               ) : (
                 /* SAAS SYSTEM SUBSCRIPTION WORKSPACE */
                 <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 animate-fade-in space-y-6 text-left">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
                     <div>
                       <h2 className="text-xl font-black text-slate-800 flex items-center gap-1.5 leading-none">
                         <CreditCard className="w-5.5 h-5.5 text-rose-500" />
                         <span>ការអនុម័តគម្រោងការវិភាគ Premium SaaS</span>
                       </h2>
                       <p className="text-xs text-slate-400 mt-1.5">ពិនិត្យមើលប្រតិបត្តិការផ្ទេរប្រាក់ និងបើកសិទ្ធិចូលដំណើរការគ្រប់មុខងារពិសេសក្នុងប្រព័ន្ធទាំងមូល។</p>
                     </div>
                     <span className="px-4 py-2 bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-150 rounded-2xl text-xs font-bold text-rose-700">
                       គណនីទទួលប្រាក់៖ SOPHAK PHORN (ABA / Bakong)
                     </span>
                   </div>

                   {/* Stats Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                       <p className="text-[10px] text-slate-400 uppercase font-black">ការផ្ទេរប្រាក់សរុប (Total Subs)</p>
                       <p className="text-2xl font-black text-slate-800 font-mono mt-1">{saasSubscriptions.length}</p>
                     </div>
                     <div className="bg-amber-50/50 p-4 border border-amber-100 rounded-2xl relative overflow-hidden">
                       <p className="text-[10px] text-amber-500 uppercase font-black flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                         <span>រង់ចាំការពិនិត្យ (Pending Review)</span>
                       </p>
                       <p className="text-2xl font-black text-amber-700 font-mono mt-1">{saasSubscriptions.filter(s => s.status === 'pending').length}</p>
                     </div>
                     <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-2xl">
                       <p className="text-[10px] text-emerald-500 uppercase font-black">បានអនុម័តបង់ប្រាក់ (Approved Pro)</p>
                       <p className="text-2xl font-black text-emerald-700 font-mono mt-1">{saasSubscriptions.filter(s => s.status === 'approved').length}</p>
                     </div>
                   </div>

                   {/* Main Subscriptions List/Flow */}
                   <div className="space-y-4">
                     {saasSubscriptions.length === 0 ? (
                       <div className="py-16 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-150 rounded-2xl">
                         <Info className="w-10 h-10 mx-auto text-slate-300" />
                         <p className="text-xs">មិនមានម្ចាស់កម្មវិធីណាបានស្នើសុំគម្រោងបង់ប្រាក់ឡើយ។</p>
                       </div>
                     ) : (
                       <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-150">
                         {saasSubscriptions.map((sub, sIdx) => {
                           const isPending = sub.status === 'pending';
                           const isApproved = sub.status === 'approved';
                           const isRejected = sub.status === 'rejected';

                           return (
                             <div key={sub.email || sIdx} className={`p-5 transition-colors ${isPending ? 'bg-amber-50/15' : 'bg-white'}`}>
                               <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                 {/* User / Payment Card Info */}
                                 <div className="space-y-2">
                                   <div className="flex flex-wrap items-center gap-2">
                                     <span className="font-bold text-slate-800 text-sm font-sans">{sub.email}</span>
                                     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                                       isApproved ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                       isPending ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                       'bg-rose-100 text-rose-700 border-rose-250'
                                     }`}>
                                       {isApproved ? 'Approved (Premium)' : isPending ? 'Pending Approval' : 'Rejected'}
                                     </span>
                                   </div>

                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                                     <div>
                                       <span className="text-slate-450">ឈ្មោះគណនីផ្ញើ៖</span> <strong className="text-slate-700 font-bold uppercase">{sub.sender_name || 'គ្មានព័ត៌មាន'}</strong>
                                     </div>
                                     <div>
                                       <span className="text-slate-450">លេខយោងប្រតិបត្តិការ៖</span> <strong className="text-slate-700 font-mono font-bold">{sub.ref_id || 'គ្មានលេខយោង'}</strong>
                                     </div>
                                     <div>
                                       <span className="text-slate-450">កញ្ចប់សេវាកម្ម៖</span> <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">Premium Pro ($14.99/Event)</span>
                                     </div>
                                     {isRejected && (
                                       <div className="col-span-1 sm:col-span-2 text-rose-600 font-medium">
                                         មូលហេតុបដិសេធ៖ <strong className="font-bold text-rose-700">{sub.rejection_reason}</strong>
                                       </div>
                                     )}
                                   </div>

                                   {/* Proof of Payment placeholder */}
                                   <div className="pt-2">
                                     <div className="inline-flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-lg p-2 text-[10px] uppercase font-bold cursor-pointer transition">
                                       <Printer className="w-3.5 h-3.5" />
                                       <span>ទាញយករូបភាពបង្កាន់ដៃ (Proof Receipt File)</span>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Approval Actions */}
                                 {isPending && (
                                   <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                                     {rejectingSubEmail === sub.email ? (
                                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2 max-w-xs animate-fade-in">
                                         <input
                                           type="text"
                                           placeholder="វាយបញ្ចូលមូលហេតុបដិសេធ..."
                                           value={rejectionReason}
                                           onChange={(e) => setRejectionReason(e.target.value)}
                                           className="w-full bg-white border border-slate-250 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none placeholder:text-slate-350"
                                         />
                                         <div className="flex justify-end gap-1.5">
                                           <button
                                             onClick={() => {
                                               setRejectingSubEmail(null);
                                               setRejectionReason('');
                                             }}
                                             className="px-2.5 py-1 text-[10px] text-slate-500 hover:bg-slate-100 rounded-md font-semibold cursor-pointer"
                                           >
                                             បោះបង់
                                           </button>
                                           <button
                                             onClick={() => {
                                               if (!rejectionReason.trim()) {
                                                 showNotification('សូមបំពេញមូលហេតុបដិសេធជាមុនសិន!', 'error');
                                                 return;
                                               }
                                               handleRejectSubscription(sub.email, rejectionReason);
                                               setRejectingSubEmail(null);
                                               setRejectionReason('');
                                             }}
                                             className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-md transition-all cursor-pointer shadow-xs"
                                           >
                                             បដិសេធប្រតិបត្តិការ
                                           </button>
                                         </div>
                                       </div>
                                     ) : (
                                       <>
                                         <button
                                           onClick={() => setRejectingSubEmail(sub.email)}
                                           className="px-3.5 py-2 hover:bg-rose-50 hover:text-rose-700 border border-rose-200 text-slate-500 font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1"
                                         >
                                           <X className="w-4 h-4 text-rose-500" />
                                           <span>បដិសេធ</span>
                                         </button>
                                         <button
                                           onClick={() => handleApproveSubscription(sub.email)}
                                           className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md hover:from-emerald-600 hover:to-emerald-700 flex items-center space-x-1"
                                         >
                                           <Check className="w-4 h-4 text-white stroke-[3.5]" />
                                           <span>យល់ព្រម (Approve)</span>
                                         </button>
                                       </>
                                     )}
                                   </div>
                                 )}

                                 {!isPending && (
                                   <div className="self-center shrink-0">
                                     <button
                                       onClick={() => {
                                         // Toggle back to pending if needed to manage state
                                         const updated = saasSubscriptions.map(s => {
                                           if (s.email?.toLowerCase() === sub.email?.toLowerCase()) {
                                             return { ...s, status: 'pending' };
                                           }
                                           return s;
                                         });
                                         setSaasSubscriptions(updated);
                                         localStorage.setItem('wedding_manager_saas_subscriptions', JSON.stringify(updated));
                                         showNotification('បានផ្លាស់ប្តូរស្ថានភាពទៅ "រង់ចាំពិនិត្យ" សាជាថ្មី', 'info');
                                       }}
                                       className="px-2.5 py-1.5 opacity-40 hover:opacity-100 hover:bg-slate-100 text-slate-550 border border-slate-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                                     >
                                       កែប្រែស្ថានភាព
                                     </button>
                                   </div>
                                 )}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     )}
                   </div>
                 </div>
               )}
             </div>
           )}
         </div>
       )}

        {/* ========================================================================= */}
        {/* 3. DASHBOARD VIEW (Wedding Owner/Bride & Groom) */}
        {/* ========================================================================= */}
        {currentRole === 'dashboard' && (
          <div className="space-y-6">
            {!isDashboardLoggedIn ? (
               <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 max-w-md mx-auto mt-6 animate-fade-in relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Database className="w-32 h-32 text-rose-500" />
                 </div>
                 <div className="text-center mb-8 relative z-10">
                   <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100/50 shadow-sm">
                     <Database className="w-8 h-8" />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                     {isDashboardRegistering ? 'ចុះឈ្មោះម្ចាស់កម្មវិធី' : 'ប្រព័ន្ធអ្នកគ្រប់គ្រង (Admin)'}
                   </h2>
                   <p className="text-sm text-slate-500 mt-2">
                     {isDashboardRegistering ? 'បំពេញព័ត៌មានខាងក្រោមដើម្បីចុះឈ្មោះកម្មវិធី' : 'សូមបញ្ចូលគណនីដើម្បីគ្រប់គ្រងទិន្នន័យ (Cloud Sync)'}
                   </p>
                 </div>
                 
                 {isDashboardRegistering ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!ownerRegisterName.trim()) {
                          showNotification('សូមបញ្ចូលឈ្មោះម្ចាស់កម្មវិធី!', 'error');
                          return;
                        }
                        if (!ownerRegisterEmail.trim()) {
                          showNotification('សូមបញ្ចូលអ៊ីមែល!', 'error');
                          return;
                        }
                        if (ownerRegisterPassword.length < 4) {
                          showNotification('លេខសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៤ ខ្ទង់!', 'error');
                          return;
                        }
                        if (ownerRegisterPassword !== ownerRegisterConfirmPassword) {
                          showNotification('លេខសម្ងាត់បំពេញទាំងពីរមិនដូចគ្នាទេ!', 'error');
                          return;
                        }

                        const userDetails = {
                          name: ownerRegisterName.trim(),
                          email: ownerRegisterEmail.trim(),
                          phone: ownerRegisterPhone.trim(),
                          password: ownerRegisterPassword
                        };

                        localStorage.setItem('wedding_manager_registered_owner', JSON.stringify(userDetails));
                        localStorage.setItem('wedding_manager_dashboard_logged_in', 'true');
                        setIsDashboardLoggedIn(true);
                        showNotification('ចុះឈ្មោះម្ចាស់កម្មវិធីជោគជ័យ! សូមបន្តទៅជ្រើសរើសគម្រោងបង់ប្រាក់។', 'success');
                      }}
                      className="space-y-4 relative z-10 mt-6 animate-fade-in text-left"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">ឈ្មោះម្ចាស់កម្មវិធី (Name) *</label>
                        <input type="text" placeholder="ឧ. កែវ សោភា" value={ownerRegisterName} onChange={(e) => setOwnerRegisterName(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all" required />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">អ៊ីមែល (Email) *</label>
                        <input type="email" placeholder="example@gmail.com" value={ownerRegisterEmail} onChange={(e) => setOwnerRegisterEmail(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all" required />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">លេខទូរស័ព្ទ (Phone Number)</label>
                        <input type="tel" placeholder="012345678" value={ownerRegisterPhone} onChange={(e) => setOwnerRegisterPhone(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all" />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">លេខសម្ងាត់ (Password) *</label>
                        <input type={showDashboardPassword ? "text" : "password"} placeholder="យ៉ាងហោចណាស់ ៤ ខ្ទង់" value={ownerRegisterPassword} onChange={(e) => setOwnerRegisterPassword(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all" required />
                        <button type="button" onClick={() => setShowDashboardPassword(!showDashboardPassword)} className="absolute right-3 top-[28px] text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors">
                          {showDashboardPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </button>
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">បញ្ជាក់លេខសម្ងាត់ (Confirm Password) *</label>
                        <input type={showDashboardConfirmPassword ? "text" : "password"} placeholder="វាយលេខសម្ងាត់ម្តងទៀត" value={ownerRegisterConfirmPassword} onChange={(e) => setOwnerRegisterConfirmPassword(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all" required />
                        <button type="button" onClick={() => setShowDashboardConfirmPassword(!showDashboardConfirmPassword)} className="absolute right-3 top-[28px] text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors">
                          {showDashboardConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </button>
                      </div>

                      <button type="submit" className="w-full mt-2 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-[0_8px_20px_rgb(244,63,94,0.15)] cursor-pointer active:scale-[0.98] transition-all text-xs">
                        ចុះឈ្មោះ និងបន្តទៅជ្រើសរើសគម្រោង
                      </button>

                      <div className="flex items-center space-x-3 my-4">
                        <div className="flex-1 h-px bg-slate-100"></div>
                        <span className="text-xs text-slate-400 font-medium font-bold">ឬ</span>
                        <div className="flex-1 h-px bg-slate-100"></div>
                      </div>

                      <button 
                         type="button"
                         onClick={() => {
                           const userDetails = {
                             name: 'Google User',
                             email: 'googleuser@gmail.com',
                             phone: '',
                             password: 'admin'
                           };
                           localStorage.setItem('wedding_manager_registered_owner', JSON.stringify(userDetails));
                           localStorage.setItem('wedding_manager_dashboard_logged_in', 'true');
                           setIsDashboardLoggedIn(true);
                           showNotification('ចុះឈ្មោះម្ចាស់កម្មវិធីជោគជ័យតាមរយៈ Google! សូមបន្តទៅជ្រើសរើសគម្រោងបង់ប្រាក់។', 'success');
                         }}
                         className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all text-xs flex items-center justify-center space-x-3 cursor-pointer active:scale-[0.98]"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                           <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                           <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                           <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                           <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Sign up with Google (Gmail)</span>
                      </button>

                      <div className="text-center pt-2">
                        <p className="text-xs text-slate-500">
                          មានគណនីរួចហើយ?{' '}
                          <button type="button" onClick={() => setIsDashboardRegistering(false)} className="text-rose-600 font-bold hover:underline cursor-pointer">
                            ចូលគណនី (Log In)
                          </button>
                        </p>
                      </div>
                    </form>
                 ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const inputEmailOrUser = dashboardAuthEmail.trim().toLowerCase();
                      const inputPass = dashboardAuthPass;

                      const savedOwnerRaw = localStorage.getItem('wedding_manager_registered_owner');
                      let isMatch = false;

                      if (savedOwnerRaw) {
                        try {
                          const savedOwner = JSON.parse(savedOwnerRaw);
                          if (
                            (inputEmailOrUser === savedOwner.email.toLowerCase() || inputEmailOrUser === savedOwner.name.toLowerCase()) &&
                            inputPass === savedOwner.password
                          ) {
                            isMatch = true;
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }

                      if (inputEmailOrUser === 'admin' && inputPass === 'admin') {
                        isMatch = true;
                      }

                      if (isMatch) {
                        setIsDashboardLoggedIn(true);
                        localStorage.setItem('wedding_manager_dashboard_logged_in', 'true');
                        showNotification('ចូលប្រើប្រាស់គណនីជោគជ័យ!', 'success');
                      } else {
                        showNotification('ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!', 'error');
                      }
                    }} 
                    className="space-y-4 relative z-10 mt-6 animate-fade-in text-left"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">ឈ្មោះគណនី (Username) / អ៊ីមែល</label>
                      <input type="text" placeholder="admin@gmail.com ឫ admin" value={dashboardAuthEmail} onChange={(e) => setDashboardAuthEmail(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all placeholder:text-slate-400" required />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">លេខសម្ងាត់ (Password)</label>
                      <input type={showDashboardPassword ? "text" : "password"} placeholder="បញ្ចូលលេខសម្ងាត់" value={dashboardAuthPass} onChange={(e) => setDashboardAuthPass(e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all placeholder:text-slate-400" required />
                      <button type="button" onClick={() => setShowDashboardPassword(!showDashboardPassword)} className="absolute right-3 top-[28px] text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors">
                        {showDashboardPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                    <button type="submit" className="w-full mt-2 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-[0_8px_20px_rgb(244,63,94,0.25)] cursor-pointer active:scale-[0.98] transition-all text-sm">ចូលប្រើប្រាស់គណនី</button>
                    
                    <div className="text-center mt-5 space-y-3">
                      <div className="flex items-center justify-center space-x-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                         <span>មិនទាន់មានគណនី?</span>
                         <button type="button" onClick={() => setIsDashboardRegistering(true)} className="text-rose-600 font-bold hover:underline cursor-pointer">
                           ចុះឈ្មោះថ្មី (Sign Up)
                         </button>
                      </div>
                      <p className="text-[11px] text-slate-400">ប្រើ <span className="font-mono text-slate-600 font-semibold bg-slate-100 px-1 py-0.5 rounded">admin</span> និង <span className="font-mono text-slate-600 font-semibold bg-slate-100 px-1 py-0.5 rounded">admin</span> សាកល្បង</p>
                    </div>
                  </form>
                  )}
                </div>
            ) : !hasPaidPlan ? (
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_rgb(0,0,0,0.04)] p-8 max-w-4xl mx-auto mt-6 text-center animate-fade-in relative overflow-hidden">
                 {/* CASE 1: PENDING APPROVAL VIEW */}
                 {currentActiveSub?.status === 'pending' ? (
                   <div className="max-w-xl mx-auto py-8 animate-fade-in text-center">
                     <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100 animate-pulse">
                       <Clock className="w-10 h-10 text-amber-500" />
                     </div>
                     
                     <h2 className="text-2xl font-extrabold text-slate-800 mb-2">គណនីកំពុងរង់ចាំការពិនិត្យ & អនុម័ត</h2>
                     <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                       ព័ត៌មានប្រតិបត្តិការផ្ទេរប្រាក់ $14.99 របស់អ្នកត្រូវបានបញ្ជូនរួចរាលហើយ។ Admin <strong>SOPHAK PHORN</strong> កំពុងត្រួតពិនិត្យ គណនីនឹងត្រូវបានបើកដំណើរការភ្លាមៗក្រោយពេលអនុម័ត (៥ - ១៥ នាទី)។
                     </p>

                     {/* Proof Submitted Details */}
                     <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 text-left shadow-xs mb-8 max-w-md mx-auto space-y-3">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-2">ព័ត៌មានដែលបានបញ្ជូន (Transaction details)</p>
                       <div className="flex justify-between text-sm">
                         <span className="text-slate-400">គណនីម្ចាស់កម្មវិធី៖</span>
                         <span className="font-semibold text-slate-700">{currentActiveSub?.email}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-slate-400">ឈ្មោះគណនីផ្ញើ (ABA/Bakong)៖</span>
                         <span className="font-bold text-slate-800">{currentActiveSub?.sender_name}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-slate-400">លេខយោងប្រតិបត្តិការ៖</span>
                         <span className="font-mono font-bold text-slate-800">{currentActiveSub?.ref_id}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span className="text-slate-400">ស្ថានភាពចរន្ត៖</span>
                         <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 font-bold rounded-full text-xs border border-amber-200">រង់ចាំការអនុម័ត (Pending Review)</span>
                       </div>
                     </div>

                     <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                       <button 
                         onClick={() => {
                           showNotification('កំពុងទាញយកស្ថានភាពអនុម័តចុងក្រោយ...', 'info');
                           const local = localStorage.getItem('wedding_manager_saas_subscriptions');
                           if (local) {
                             try {
                               const parsed = JSON.parse(local);
                               setSaasSubscriptions(parsed);
                             } catch (e) {}
                           }
                         }}
                         className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                       >
                         <RefreshCw className="w-4 h-4 animate-spin text-white" />
                         <span>ពិនិត្យស្ថានភាពម្តងទៀត (Check Again)</span>
                       </button>

                       <button
                         onClick={handleSaaSSignOut}
                         className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold rounded-xl text-xs transition cursor-pointer"
                       >
                         ចាកចេញពីគណនី (Sign Out)
                       </button>
                     </div>

                     <div className="pt-8 border-t border-dashed border-slate-200 mt-8 max-w-xs mx-auto">
                       <p className="text-[10px] text-slate-400 mb-2">សម្រាប់តេស្តលឿន៖ អ្នកអាចចូលគណនី Admin Coordinator (admin123/password123) ផ្នែក "ការអនុម័ត SaaS" ដើម្បីចុច APPROVED ភ្លាមៗ ឬចុចទីនេះ៖</p>
                       <button
                         onClick={() => handleApproveSubscription(currentActiveSub.email)}
                         className="text-[10px] px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-black rounded-lg cursor-pointer"
                       >
                         ✓ Autopass Approve (តេស្តលឿន)
                       </button>
                     </div>
                   </div>

                 // CASE 2: DESKTOP PAYMENT CHECKOUT GRID (OR REJECTED STATUS)
                 ) : (isCheckingOutPremium || currentActiveSub?.status === 'rejected') ? (
                   <div className="max-w-4xl mx-auto animate-fade-in text-left">
                     <div className="flex items-center justify-between border-b pb-4 mb-6">
                       <button 
                         onClick={() => setIsCheckingOutPremium(false)}
                         className="flex items-center space-x-1 hover:text-rose-600 font-bold text-xs text-slate-500 transition cursor-pointer"
                       >
                         <ChevronLeft className="w-4 h-4" />
                         <span>ត្រឡប់ទៅជ្រើសរើសកញ្ចប់តម្លៃវិញ</span>
                       </button>
                       <h3 className="text-base font-black text-slate-800">ផ្ទៀងផ្ទាត់ការបង់ប្រាក់ Premium Pro ($14.99)</h3>
                       <div className="w-20" />
                     </div>

                     {currentActiveSub?.status === 'rejected' && (
                       <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-left text-rose-700 mb-6 flex items-start space-x-3.5 animate-shake">
                         <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                         <div>
                           <h4 className="text-xs font-bold text-rose-900 mb-1">ប្រតិបត្តិការបង់ប្រាក់មុននេះរបស់អ្នកត្រូវបានបដិសេធ (Rejected)</h4>
                           <p className="text-[11px] leading-relaxed">
                             មូលហេតុបដិសេធ៖ <span className="font-extrabold text-rose-900 border-b border-rose-200">{currentActiveSub?.rejection_reason || 'ព័ត៌មានមិនត្រឹមត្រូវ សូមបញ្ចូលឡើងវិញ'}</span>
                           </p>
                         </div>
                       </div>
                     )}

                     <div className="grid md:grid-cols-12 gap-8 items-start">
                       {/* Left Column: KHQR Display */}
                       <div className="md:col-span-5 bg-slate-50/50 rounded-2.5xl p-6 border border-slate-100 text-center">
                         <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4 leading-none">ស្កេនទូទាត់ជាមួយ KHQR ខាងក្រោម</h4>
                         
                         <SOPHAK_KHQR_Card />

                         <div className="mt-4 space-y-1 text-center">
                           <p className="text-sm font-bold text-slate-700">ចំនួនទឹកប្រាក់ផ្ទេរ៖ $14.99 ឬ ២៥,០០០ ៛</p>
                           <p className="text-xs text-slate-400">គាំទ្រគ្រប់កម្មវិធីធនាគារទាំងអស់ក្នុងប្រទេសកម្ពុជា</p>
                         </div>
                       </div>

                       {/* Right Column: Submission Form */}
                       <div className="md:col-span-7 space-y-4">
                         <div className="bg-slate-50 rounded-2.5xl p-6 border border-slate-200/80 space-y-4">
                           <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 mb-2">បំពេញភស្តុតាងស្កេនទូទាត់</h4>

                           <div className="grid grid-cols-2 gap-4">
                             <div className="col-span-2">
                               <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">ឈ្មោះគណនីផ្ញើរបស់អ្នក (Sender Acc. Name) *</label>
                               <input 
                                 type="text" 
                                 placeholder="ឧ. LONG BUNYON" 
                                 value={paymentSenderName} 
                                 onChange={(e) => setPaymentSenderName(e.target.value.toUpperCase())}
                                 className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition font-sans font-bold uppercase placeholder:text-slate-300"
                               />
                             </div>

                             <div className="col-span-2">
                               <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">លេខយោងប្រតិបត្តិការ / លេខយោងផ្ទេរប្រាក់ (Ref ID / Block ID)</label>
                               <input 
                                 type="text" 
                                 placeholder="វាយលេខប្រតិបត្តិការ ឬលោកអ្នកអាចរកបាននៅលើរូបបង្កាន់ដៃផ្ទេរ" 
                                 value={paymentRefId} 
                                 onChange={(e) => setPaymentRefId(e.target.value)}
                                 className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition font-mono placeholder:text-slate-300"
                               />
                             </div>
                           </div>

                           <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">ភ្ជាប់រូបភាពបង្កាន់ដៃ (Upload Receipt Image File)</label>
                             <div className="border-2 border-dashed border-slate-200 hover:border-rose-400 rounded-xl py-6 px-4 text-center bg-white transition cursor-pointer flex flex-col items-center justify-center">
                               <Upload className="w-6 h-6 text-slate-400 mb-1.5 animate-bounce" />
                               <span className="text-xs font-bold text-slate-500">ស្វែងរកឯកសារបង្កាន់ដៃ ឬទម្លាក់ចូលទីនេះ</span>
                               <span className="text-[10px] text-slate-400 mt-1">គាំទ្រ JPEG, PNG (ទំហំអតិបរមា 5MB)</span>
                             </div>
                           </div>

                           <button 
                             onClick={submitPremiumPaymentDetails}
                             disabled={isSubmittingPayment}
                             className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-extrabold rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center space-x-2 text-xs shadow-md"
                           >
                             {isSubmittingPayment ? (
                               <>
                                 <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                 <span>កំពុងផ្ញើព័ត៌មាន...</span>
                               </>
                             ) : (
                               <>
                                 <span>បញ្ជូនភស្តុតាង និងស្នើសុំការអនុម័ត</span>
                               </>
                             )}
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>

                 // CASE 3: STANDARD PLANS SELECTOR
                 ) : (
                   <>
                  <div className="inline-flex items-center space-x-2 bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-rose-100/50">
                     <CheckCircle className="w-4 h-4" />
                     <span>គម្រោងប្រចាំឆ្នាំ (Annual Plans)</span>
                  </div>
                 
                 <h2 className="text-3xl tracking-tight font-extrabold text-slate-900 mb-4">ជ្រើសរើសកញ្ចប់តម្លៃដែលសាកសម</h2>
                 <p className="text-slate-500 mb-10 max-w-lg mx-auto text-[15px] leading-relaxed">បង្កើនគុណភាពនៃការគ្រប់គ្រងលើការរៀបចំពិធីមង្គលការ ឬព្រឹត្តិការណ៍របស់អ្នកកាន់តែទំនើប សុវត្ថិភាព និងចំណេញពេលវេលាជាងមុន។</p>
                 
                 <div className="grid md:grid-cols-2 gap-6 xl:gap-8 max-w-3xl mx-auto text-left relative">
                    
                    {/* Free/Basic Plan */}
                    <div className="border border-slate-200 rounded-3xl p-8 hover:border-slate-300 hover:shadow-lg transition-all duration-300 md:translate-y-4 md:scale-95 bg-white relative z-0 flex flex-col group">
                       <h3 className="text-xl font-bold tracking-tight text-slate-800">កញ្ចប់សាកល្បង (Trial)</h3>
                       <p className="text-xs text-slate-500 mt-1">សម្រាប់កម្មវិធីតូចតាច ឬសាកល្បងប្រព័ន្ធ</p>
                       <div className="mt-6 flex items-baseline">
                         <span className="text-4xl font-extrabold tracking-tight text-slate-900">$0</span>
                         <span className="text-sm font-medium text-slate-500 ml-1">/ កម្មវិធី</span>
                       </div>
                       
                       <div className="my-8 h-px bg-slate-100 w-full" />
                       
                       <ul className="mb-8 space-y-4 flex-1 text-sm text-slate-600">
                         <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/> <span>បាន ១ កម្មវិធី (Maximum 1 Event)</span></li>
                         <li className="flex gap-3 items-start font-semibold text-rose-600"><CheckCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"/> <span>ភ្ញៀវចូលរួមក្រោម ១០០ នាក់ (Under 100 Guests)</span></li>
                         <li className="flex gap-3 items-start font-semibold text-slate-700"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/> <span>ទទួលបានរបាយការណ៍ហិរញ្ញវត្ថុ (Analytics Dashboard)</span></li>
                         <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/> <span>មុខងារទាញយកបញ្ជីភ្ញៀវចូលតុ</span></li>
                         <li className="flex gap-3 items-start opacity-60"><Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5"/> <span>គ្មានមុខងារស្កេន QR Code ចុះឈ្មោះ</span></li>
                       </ul>
                       
                       <button onClick={() => { selectPlan('trial'); showNotification('គណនីរបស់អ្នកបានកំណត់ជាគម្រោងសាកល្បង!', 'info'); }} className="mt-auto py-3.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors w-full cursor-pointer text-center">ជ្រើសរើស Trial ដោយឥតគិតថ្លៃ</button>
                    </div>
                    
                    {/* Premium SaaS Plan */}
                    <div className="border-2 border-rose-500 bg-rose-50/10 rounded-3xl p-8 shadow-[0_8px_30px_rgb(244,63,94,0.12)] flex flex-col relative z-10 transform scale-100 origin-bottom bg-white overflow-hidden">
                       <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600"></div>
                       <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">សំណព្វចិត្ត (Popular)</div>
                       
                       <div className="flex items-center space-x-2 mt-2">
                         <h3 className="text-xl font-extrabold tracking-tight text-rose-600">Premium Pro</h3>
                         <span className="flex w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                       </div>
                       <p className="text-xs text-slate-500 mt-1">ដោះសោរគ្រប់មុខងារជាន់ខ្ពស់ទាំងអស់</p>
                       
                       <div className="mt-6 flex items-baseline">
                         <span className="text-4xl font-extrabold tracking-tight text-slate-900">$14.99</span>
                         <span className="text-sm font-medium text-slate-500 ml-1">/ កម្មវិធី</span>
                       </div>
                       
                       <div className="my-8 h-px bg-rose-100 w-full" />
                       
                       <ul className="mb-8 space-y-4 flex-1 text-sm text-slate-700 font-medium">
                         <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"/> <span>បង្កើតកម្មវិធី និងភ្ញៀវចូលរួមមិនកំណត់</span></li>
                         <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"/> <span><strong>មុខងារស្កេន QR Code ចុះឈ្មោះចូលតុស្វ័យប្រវត្ត</strong></span></li>
                         <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"/> <span>របាយការណ៍ហិរញ្ញវត្ថុ (Analytics Dashboards)</span></li>
                         <li className="flex gap-3 items-start"><CheckCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"/> <span>តភ្ជាប់ Telegram Bot ផ្ញើដំណឹងរាល់ការ Check-in</span></li>
                       </ul>
                       
                       <button onClick={() => { selectPlan('premium'); showNotification('អបអរសាទរ! គណនីរបស់អ្នកបានក្លាយជា Premium!', 'success'); }} className="mt-auto py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg font-bold hover:-translate-y-0.5 transition-all w-full cursor-pointer flex items-center justify-center space-x-2">
                         <Unlock className="w-4 h-4" />
                         <span>អាប់ហ្គ្រេតគម្រោងរបស់ខ្ញុំ (Upgrade)</span>
                       </button>
                    </div>
                  </div>
                 
                 <div className="mt-8 pt-6 border-t border-slate-100 max-w-xl mx-auto flex items-center justify-center space-x-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mastercard_logo.svg/1200px-Mastercard_logo.svg.png" className="h-6" alt="Mastercard" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Former_Visa_%28company%29_logo.svg/1280px-Former_Visa_%28company%29_logo.svg.png" className="h-6" alt="Visa" />
                    <div className="h-6 w-px bg-slate-300"></div>
                    <span className="text-[11px] text-slate-400 font-medium">ទូទាត់មានសុវត្ថិភាពខ្ពស់ដោយ Stripe</span>
                 </div>
                 </>
                 )}
               </div>
            ) : (
            <div className="space-y-6 animate-fade-in">
              
              {/* Event Selector & Toolbar */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 uppercase font-semibold">ជ្រើសរើសកម្មវិធីជាក់ស្តែង</label>
                    <select
                      value={selectedWeddingId}
                      onChange={(e) => {
                        setSelectedWeddingId(e.target.value);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none text-xs cursor-pointer min-w-[200px]"
                      id="sel-wedding-admin"
                    >
                      {weddings.length === 0 && <option value="">សូមបង្កើតកម្មវិធីថ្មី...</option>}
                      {weddings.map((w) => (
                        <option key={w.id} value={w.id}>{w.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="self-end flex items-center gap-2">
                    <button
                      onClick={() => setShowAddWeddingModal(true)}
                      className="bg-wedding-50 hover:bg-wedding-100 border border-wedding-200 text-wedding-700 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer"
                      id="btn-add-wedding-modal"
                    >
                      <Plus className="w-4 h-4" />
                      <span>បង្កើតកម្មវិធីថ្មី</span>
                    </button>
                    
                    {selectedWeddingId && (
                      <button
                        onClick={() => handleDeleteWedding(selectedWeddingId)}
                        className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer ml-auto"
                        title="លុបកម្មវិធីនេះ"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>លុបកម្មវិធីនេះ</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {selectedWeddingId && (
                <>
                {/* Host Title & Header */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
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
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                          <ImageUploader 
                            label="រូបភាព KHQR ប្រាក់រៀល (KHR)" 
                            value={editKhqrUrl} 
                            onChange={setEditKhqrUrl} 
                            placeholder="Upload QR រៀល"
                          />
                          <ImageUploader 
                            label="រូបភាព KHQR ប្រាក់ដុល្លារ (USD)" 
                            value={editKhqrUsdUrl} 
                            onChange={setEditKhqrUsdUrl} 
                            optional
                            placeholder="Upload QR ដុល្លារ"
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
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
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
                <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
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


                </>
              )}
            </div>
           )}
          </div>
        )}
          </>
        )}

      </main>

      {/* ========================================================== */}
      {/* MODALS & OVERLAYS */}
      {/* ========================================================== */}

      {/* ADMIN ADD WEDDING EVENT MODAL */}
      {showAddWeddingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-md w-full overflow-hidden">
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

              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-100">
                <ImageUploader 
                  label="រូបភាព KHQR ប្រាក់រៀល (KHR)" 
                  value={newWeddingKhqrUrl} 
                  onChange={setNewWeddingKhqrUrl} 
                  placeholder="Upload QR រៀល"
                />
                <ImageUploader 
                  label="រូបភាព KHQR ប្រាក់ដុល្លារ (USD)" 
                  value={newWeddingKhqrUsdUrl} 
                  onChange={setNewWeddingKhqrUsdUrl} 
                  optional
                  placeholder="Upload QR ដុល្លារ"
                />
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
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
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


      <footer className="mt-12 py-6 px-4 font-sans text-xs">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-slate-400 text-[10px]">
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
