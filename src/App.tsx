import React, { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import bakongLogo from './bakong-logo.png';
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
  Info
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Define TS Interfaces
interface Wedding {
  id: string;
  title: string;
  host_username: string;
  host_password?: string;
  khqr_img_url: string;
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
}

const formatCurrency = (amount: number, currency: 'USD' | 'KHR') => {
  if (currency === 'KHR') {
    return `${amount.toLocaleString('en-US')} ៛`;
  }
  return `$${amount.toFixed(2)}`;
};

export default function App() {
  // Connection Mode State
  const [connectionMode, setConnectionMode] = useState<'demo' | 'supabase'>('demo');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
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
  const [showAddWeddingModal, setShowAddWeddingModal] = useState(false);

  // New Guest Form state (Admin manual add)
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [manualGuestName, setManualGuestName] = useState('');
  const [manualGuestPhone, setManualGuestPhone] = useState('');
  const [manualGuestCompanions, setManualGuestCompanions] = useState(0);
  const [manualGuestRelation, setManualGuestRelation] = useState('ខាងកូនកំលោះ');
  const [manualGuestAmount, setManualGuestAmount] = useState('');
  const [manualGuestCurrency, setManualGuestCurrency] = useState<'USD' | 'KHR'>('USD');
  const [manualGuestNote, setManualGuestNote] = useState('');

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
      created_at: "2026-05-28T10:00:00Z"
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
      created_at: "2026-05-28T10:30:00Z"
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
      created_at: "2026-05-28T11:15:00Z"
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
      created_at: "2026-05-28T12:00:00Z"
    }
  ];

  // Load from Supabase URL configuration if available in env
  useEffect(() => {
    // Try to load from window.env
    const url = (window as any).env?.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const key = (window as any).env?.SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
    
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
        const client = createClient(supabaseUrl, supabaseAnonKey);
        setSupabaseClient(client);

        // Fetch Data from live Supabase Tables
        const fetchRemoteData = async () => {
          // 1. Fetch Weddings
          const { data: weddingsData, error: weddingsError } = await client
            .from('weddings')
            .select('*')
            .order('created_at', { ascending: false });

          if (weddingsError) {
            throw weddingsError;
          }

          // 2. Fetch Guests
          const { data: guestsData, error: guestsError } = await client
            .from('guests')
            .select('*')
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
    }, 4000);
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
      showNotification('សូមជ្រើសរើសកម្មវិធីមង្គលការជាមុនសិន!', 'error');
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

    const newGuest: Omit<Guest, 'id'> = {
      wedding_id: selectedWeddingId,
      name: guestName.trim(),
      phone: guestPhone.trim(),
      companions: parseInt(String(guestCompanions)) || 0,
      relation_type: guestRelation,
      amount: floatAmount,
      currency: guestCurrency,
      note: guestNote.trim(),
      status: 'pending'
    };

    try {
      if (connectionMode === 'supabase' && supabaseClient) {
        const { data, error } = await supabaseClient
          .from('guests')
          .insert([newGuest])
          .select();

        if (error) throw error;
        
        if (data && data.length > 0) {
          const addedGuest = data[0] as Guest;
          const updatedGuests = [addedGuest, ...guests];
          setGuests(updatedGuests);
        } else {
          // Fallback fetch if data not returned
          const { data: refreshedGuests } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });
          if (refreshedGuests) setGuests(refreshedGuests);
        }
      } else {
        // Local Mode
        const localGuestObj: Guest = {
          ...newGuest,
          id: 'g_' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        };
        const updated = [localGuestObj, ...guests];
        setGuests(updated);
        syncLocalData(weddings, updated);
      }

      setRegistrationSuccess(true);
      showNotification('បានចុះឈ្មោះដោយជោគជ័យ! សូមរង់ចាំការពិនិត្យពី Admin។', 'success');
      
      // Clear inputs
      setGuestName('');
      setGuestPhone('');
      setGuestCompanions(0);
      setGuestRelation('ខាងកូនក្រមុំ');
      setGuestAmount('');
      setGuestNote('');
    } catch (err: any) {
      console.error(err);
      showNotification(`ការចុះឈ្មោះបរាជ័យ៖ ${err.message || err}`, 'error');
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

    const newW: Omit<Wedding, 'id'> = {
      title: newWeddingTitle.trim(),
      host_username: newWeddingHostUser.trim(),
      host_password: newWeddingHostPass.trim(),
      khqr_img_url: newWeddingKhqrUrl.trim()
    };

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
        } else {
          // Refetch
          const { data: refreshed } = await supabaseClient.from('weddings').select('*').order('created_at', { ascending: false });
          if (refreshed) {
            setWeddings(refreshed);
            if (refreshed.length > 0) setSelectedWeddingId(refreshed[0].id);
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
      }

      showNotification('បានបង្កើតកម្មវិធីមង្គលការថ្មីដោយជោគជ័យ!', 'success');
      setNewWeddingTitle('');
      setNewWeddingHostUser('');
      setNewWeddingHostPass('');
      setNewWeddingKhqrUrl('');
      setShowAddWeddingModal(false);
    } catch (err: any) {
      console.error(err);
      showNotification(`ការបង្កើតបរាជ័យ៖ ${err.message || err}`, 'error');
    }
  };

  // ADMIN MANUALLY ADD GUEST
  const handleManualAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeddingId) {
      showNotification('សូមជ្រើសរើសកម្មវិធីមង្គលការជាមុនសិន!', 'error');
      return;
    }
    if (!manualGuestName.trim() || !manualGuestPhone.trim()) {
      showNotification('សូមបំពេញឈ្មោះ និងលេខទូរស័ព្ទភ្ញៀវ!', 'error');
      return;
    }

    const floatAmt = parseFloat(manualGuestAmount) || 0;

    const newG: Omit<Guest, 'id'> = {
      wedding_id: selectedWeddingId,
      name: manualGuestName.trim(),
      phone: manualGuestPhone.trim(),
      companions: parseInt(String(manualGuestCompanions)) || 0,
      relation_type: manualGuestRelation,
      amount: floatAmt,
      currency: manualGuestCurrency,
      note: manualGuestNote.trim(),
      status: 'approved' // Manually added by admin are pre-approved
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
          const { data: refreshed } = await supabaseClient.from('guests').select('*').order('created_at', { ascending: false });
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
      setShowAddGuestModal(false);
    } catch (err: any) {
      console.error(err);
      showNotification(`ការបញ្ចូលភ្ញៀវបរាជ័យ៖ ${err.message || err}`, 'error');
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
    } catch (err: any) {
      console.error(err);
      showNotification(`មិនអាចអនុម័តបានទេ៖ ${err.message || err}`, 'error');
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
      showNotification(`ស្វាគមន៍ម្ចាស់ពិធីការមង្គលការ៖ ${foundWedding.title}!`, 'success');
    } else {
      showNotification('ឈ្មោះគណនី ឬលេខសម្ងាត់ម្ចាស់មង្គលការមិនត្រឹមត្រូវទេ!', 'error');
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
      { wch: 25 }, // Companions
      { wch: 18 }, // Relation
      { wch: 20 }, // Amount
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
      
      {/* Top Banner indicating Database Sync Status */}
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

      {/* Supabase connection manager drawer when selecting Supabase mode */}
      {connectionMode === 'supabase' && (
        <div className="bg-slate-800 border-b border-slate-700 text-slate-100 p-4 transition-all">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-2">
              <Database className="w-4 h-4" />
              <h3 className="text-sm">ការកំណត់ទំនាក់ទំនងមូលដ្ឋានទិន្នន័យ Supabase</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-xs text-slate-400 mb-1 font-mono">SUPABASE_URL</label>
                <input 
                  type="text" 
                  placeholder="https://your-project.supabase.co" 
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
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

            <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap gap-x-4">
              <span>* ប្រសិនបើអ្នកមិនទាន់បានបង្កើត table SQL សម្បូរព័ត៌មាននៅក្នុង Supabase ទេ សូមចុចចម្លង DDL setup code នៅផ្នែកខាងក្រោមទំព័រនេះ។</span>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Header Area (Bento Grid Theme) */}
      <header className="bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between px-6 py-4 md:py-0 md:h-16 shrink-0 shadow-sm gap-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 flex items-center">
            <img 
              src={bakongLogo} 
              alt="Bakong Logo" 
              className="h-10 w-auto object-contain rounded-lg border border-slate-100 p-0.5 bg-white shadow-xs" 
              referrerPolicy="no-referrer" 
            />
            {/* Tiny ornament heart badge */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-wedding-600 rounded-full flex items-center justify-center text-white shadow-xs">
              <Heart className="w-2 h-2 fill-white stroke-none" />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
              ប្រព័ន្ធគ្រប់គ្រង និងចុះឈ្មោះសន្លឹកការ
            </h1>
            <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500 font-semibold italic">
              Wedding Guest Management System
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
            <span>ម្ចាស់មង្គលការ (Host)</span>
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
                សូមជ្រើសរើស កម្មវិធីអាពាហ៍ពិពាហ៍ ដែលអ្នកត្រូវចូលរួម៖
              </label>
              {weddings.length === 0 ? (
                <div className="py-2.5 text-center text-slate-400 text-xs">
                  មិនទាន់មានកម្មវិធីអាពាហ៍ពិពាហ៍ណាមួយត្រូវបានបង្កើតឡើងនៅឡើយទេ។ សូមបង្កើតក្នុងឋានៈជា Admin ជាមុនសិន។
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
                  សូមអរគុណជាអនេកចំពោះការចំណាយពេលចុះឈ្មោះចូលរួមមង្គលការរបស់ពួកយើង។ ព័ត៌មានរបស់អ្នកកំពុងស្ថិតក្នុងការត្រួតពិនិត្យ និងយល់ព្រមពីអ្នកសម្របសម្រួល។
                </p>

                {activeWedding?.khqr_img_url && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <p className="text-slate-600 text-sm font-semibold mb-3 flex items-center justify-center gap-1">
                      <Heart className="w-4 h-4 fill-rose-500 stroke-rose-500" />
                      អ្នកក៏អាចធ្វើការចងដៃជាប្រាក់ឌីជីថលតាម KHQR ខាងក្រោមនេះ៖
                    </p>
                    
                    <div className="max-w-xs mx-auto bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner relative group">
                      <img 
                        src={activeWedding.khqr_img_url} 
                        alt="Wedding KHQR Code" 
                        className="w-full h-auto object-contain rounded-xl"
                        onError={(e)=>{
                          // fallback standard scan image
                          (e.target as HTMLImageElement).src = "https://i.ibb.co/6NGpLTL/sample-aba-khqr.jpg";
                        }}
                      />
                      <div className="text-[11px] text-slate-500 mt-2 text-center italic font-mono">
                        ការស្កេនទូទាត់ប្រាក់ចងដៃពីចម្ងាយ
                      </div>
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
                        ចំនួនអ្នកមកជាមួយ (Number of Companions)
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

                  <div>
                    <label className="block text-slate-700 font-medium text-xs mb-1.5">
                      កំណត់សម្គាល់ជូនពរ (Notes / Blessings)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="ឧ. សូមជូនពរឱ្យមានសុភមង្គលក្នុងជីវិតអាពាហ៍ពិពាហ៍ថ្មី!"
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
                      <label className="block text-[11px] text-slate-400 mb-1 uppercase font-semibold">ជ្រើសរើសមង្គលការជាក់ស្តែង</label>
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
                        <span>បង្កើតមង្គលការថ្មី</span>
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
                        onClick={() => setShowAddGuestModal(true)}
                        className="bg-wedding-600 hover:bg-wedding-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center space-x-1 cursor-pointer mr-2"
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
                            <th className="px-5 py-3.5 text-right">សកម្មភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredGuests.map((g) => (
                            <tr key={g.id} className="hover:bg-rose-50/20 transition duration-150">
                              <td className="px-5 py-4">
                                <span className="font-bold text-slate-800 block text-sm">{g.name}</span>
                                <span className="text-[10px] text-slate-400">ID: {g.id.substr(0,8)}</span>
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
                              <td className="px-5 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
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
                                    className="p-1 px-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all cursor-pointer"
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
                  <h3 className="text-lg font-bold text-slate-800">ផ្ទៀងផ្ទាត់គណនី ម្ចាស់មង្គលការ</h3>
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
                </form>

                <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col space-y-1 text-[11px] text-slate-400 text-center">
                  <span>* គណនីសាកល្បង៖ <strong className="text-slate-600 font-mono">wedding123</strong> / <strong className="text-slate-600 font-mono">password123</strong></span>
                </div>
              </div>
            ) : (
              /* Host Detailed Dashboard and Analytics */
              <div className="space-y-6 animate-fade-in">
                
                {/* Host Title & Header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-100 uppercase tracking-wider">
                      ម្ចាស់អាពាហ៍ពិពាហ៍ (Host)
                    </span>
                    <h2 className="text-base md:text-lg font-bold text-slate-900 mt-1">
                      {activeWedding?.title || 'កម្មវិធីមង្គលការ'}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-3">
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredGuests.map((g, index) => (
                            <tr key={g.id} className="hover:bg-slate-50 transition duration-150">
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-900 block text-sm">{g.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ល.រ៖ {index+1}</span>
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* READ ONLY Host Guest Ledger with Filter/Search */}
                <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-rose-50 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">តារាងបញ្ជីលម្អិតភ្ញៀវដែលត្រូវចូលរួម ({filteredGuests.length} នាក់)</h2>
                      <p className="text-[11px] text-slate-400">អ្នកអាចស្វែងរក ត្រងទិន្នន័យ ព្រមទាំងនាំចេញដោនឡូតទៅជាឯកសារ Excel ដោយសេរី។</p>
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
                        id="inp-host-search"
                      />
                    </div>

                    <div className="flex gap-2 font-sans text-xs">
                      <select
                        value={relationFilter}
                        onChange={(e) => setRelationFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
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
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
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
                        <thead className="bg-[#fff9f9] text-slate-700 uppercase tracking-wider text-[11px] border-b border-rose-50">
                          <tr>
                            <th className="px-5 py-3.5">ភ្ញៀវកិត្តិយស</th>
                            <th className="px-5 py-3.5">លេខទូរស័ព្ទ / ទំនាក់ទំនង</th>
                            <th className="px-5 py-3.5">អ្នករួមដំណើរ (នាក់)</th>
                            <th className="px-5 py-3.5">ប្រាក់ចងដៃ ($)</th>
                            <th className="px-5 py-3.5">កំណត់សម្គាល់ជូនពរ</th>
                            <th className="px-5 py-3.5 text-center">ស្ថានភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredGuests.map((g, index) => (
                            <tr key={g.id} className="hover:bg-rose-50/20 transition duration-150">
                              <td className="px-5 py-4">
                                <span className="font-bold text-slate-800 block text-sm">{g.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ល.រ៖ {index+1}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-mono text-xs block mb-1 text-slate-700">{g.phone}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 inline-block">
                                  {g.relation_type}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center font-bold text-slate-850 text-sm">
                                {g.companions} នាក់
                              </td>
                              <td className="px-5 py-4 text-emerald-700 font-bold text-sm">
                                ${g.amount.toFixed(2)}
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
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {g.status === 'approved' ? 'បានអនុម័ត' : 'រង់ចាំពិនិត្យ'}
                                </span>
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
              <h3 className="text-sm font-bold text-slate-800">បង្កើតកម្មវិធីមង្គលការថ្មី</h3>
              <button 
                onClick={() => setShowAddWeddingModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateWedding} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ចំណងជើងអាពាហ៍ពិពាហ៍ (e.g., មង្គលការ លី សុខា និង អ៊ឹម ចិន្តា)</label>
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
                <label className="block text-slate-700 font-semibold mb-1">ImgBB scan-to-pay ABA KHQR Image URL</label>
                <input
                  type="text"
                  placeholder="ឧ. https://i.ibb.co/..."
                  value={newWeddingKhqrUrl}
                  onChange={(e) => setNewWeddingKhqrUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-1 focus:ring-wedding-500 focus:outline-none transition-all font-mono"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">* សម្រាប់លីង QR ទូទាត់ប្រាក់ចងដៃពីចម្ងាយ (ABA Pay, ACLEDA, etc.)</p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-wedding-600 hover:bg-wedding-700 text-white font-bold rounded-xl transition duration-150 shadow-sm cursor-pointer"
              >
                រក្សាទុកកម្មវិធីអាពាហ៍ពិពាហ៍
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN ADD MANUAL GUEST MODAL */}
      {showAddGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-rose-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-rose-50 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">ចុះឈ្មោះភ្ញៀវដោយទូទាត់ផ្ទាល់ (Add Pre-Approved Guest)</h3>
              <button 
                onClick={() => setShowAddGuestModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleManualAddGuest} className="p-5 space-y-4 text-xs font-sans">
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
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-12 py-8 px-4 font-sans text-xs">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <p className="text-white font-bold text-sm">Wedding Guest Manager Database Blueprint (SQL Schema &amp; DDL)</p>
              <p className="text-slate-400 text-[11px] mt-0.5">ចម្លងកូដ PostgreSQL នេះយកទៅដាក់ក្នុង SQL Editor របស់ Supabase ដើម្បីដំណើរការ Database</p>
            </div>
            
            <button
              onClick={() => handleCopyText(`-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist
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
    khqr_img_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create 'guests' Table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    companions INTEGER NOT NULL DEFAULT 0,
    relation_type VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    note TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Seed default administrator
INSERT INTO admins (username, password) VALUES ('admin123', 'password123');`, 'PostgreSQL DDL Code')}
              className="mt-2 md:mt-0 bg-slate-800 hover:bg-slate-700 text-xs text-white border border-slate-700 px-3.5 py-1.5 rounded-lg flex items-center space-x-1 transition cursor-pointer"
            >
              {copiedText === 'PostgreSQL DDL Code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText === 'PostgreSQL DDL Code' ? 'បានចម្លងរួច!' : 'ចម្លង PostgreSQL SQL'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
            <pre className="text-[10px] text-slate-400 font-mono leading-relaxed select-all">
{`-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist
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
    khqr_img_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create 'guests' Table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    companions INTEGER NOT NULL DEFAULT 0,
    relation_type VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    note TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Seed default administrator
INSERT INTO admins (username, password) VALUES ('admin123', 'password123');`}
            </pre>
          </div>

          <p className="text-center text-slate-500 text-[10px]">
            រៀបចំឡើងដោយបច្ចេកវិទ្យា Supabase, Vite, Tailwind CSS, និង React 19 - រក្សាសិទ្ធគ្រប់យ៉ាង © 2026
          </p>
        </div>
      </footer>

    </div>
  );
}
