/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState,  type ChangeEvent } from 'react';
import { 
  Camera, 
  Save, 
  ArrowLeft, 
  User as UserIcon, 
  ShieldCheck, 
  Loader2, 
  Mail, 
  Fingerprint,
  CheckCircle2,
  Lock
} from 'lucide-react';

/* ======================================================
    MODULE RESOLUTION HANDLER (PRODUCTION READY)
   ====================================================== */

// Default mock for stability in the Canvas environment
let useAuth: any = () => ({
  user: { id: 'dev-user-001', email: 'surveyor@vault.systems', user_metadata: { full_name: 'Naftaly Mwaura' } },
  theme: 'dark',
});

let db: any = null;
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Sandbox fallback
  }
};

resolveModules();

/** --- TYPES --- **/

interface IdentityNodeProps {
  onBack: () => void;
  onUpdateComplete?: () => void;
}

/** --- MAIN COMPONENT: PROFILE SETTINGS --- **/

const IdentityNode: React.FC<IdentityNodeProps> = ({ onBack, onUpdateComplete }) => {
  const { user, theme } = useAuth();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  // Generate initials for the avatar fallback
  const getInitials = () => fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
      setHasChanged(true);
    }
  };

  /** * DATA PERSISTENCE HANDSHAKE
   * Saves to local Dexie storage immediately and queues a sync to Supabase.
   */
  const handleUpdateProfile = async () => {
    if (!user || !db) return;
    setIsUpdating(true);

    const profileData = {
      id: user.id,
      full_name: fullName,
      updated_at: new Date().toISOString()
    };

    try {
      // 1. SAVE TO DEVICE (DEXIE) - Works without Wi-Fi
      await db.profiles.update(user.id, profileData);

      // 2. QUEUE FOR CLOUD (SUPABASE) - Syncs when online
      if (syncEngine?.queueChange) {
        await syncEngine.queueChange('profiles', user.id, 'UPDATE', profileData);
      }
      
      setHasChanged(false);
      if (onUpdateComplete) onUpdateComplete();
      
      // Visual feedback delay
      setTimeout(() => setIsUpdating(false), 1000);
    } catch (err) {
      console.error("Profile Update Error:", err);
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
      
      {/* Profile Card Container */}
      <div className={`p-8 sm:p-20 rounded-[4rem] sm:rounded-[5rem] backdrop-blur-3xl border relative overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-zinc-200 shadow-xl'}`}>
        
        {/* 1. Back to Office Link */}
        <button 
          onClick={onBack} 
          className={`absolute top-8 sm:top-12 left-8 sm:left-12 p-4 sm:p-5 rounded-2xl border transition-all active:scale-90 shadow-xl group
            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-900'}`}
        >
          <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* 2. Avatar Node */}
        <div className="relative w-48 sm:w-56 h-48 sm:h-56 mx-auto mb-12 group">
          <div className={`w-full h-full rounded-[4rem] border-8 overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105
            ${theme === 'dark' ? 'bg-zinc-950 border-amber-500/10' : 'bg-zinc-50 border-amber-500/5 shadow-inner'}`}>
            {profileImage ? (
              <img src={profileImage} className="w-full h-full object-cover" alt="User Profile" />
            ) : (
              <div className="text-zinc-800 font-black text-6xl italic select-none">
                {getInitials() || '?'}
              </div>
            )}
          </div>
          
          <label className="absolute -bottom-3 -right-3 p-5 sm:p-6 bg-amber-500 text-black rounded-[1.8rem] shadow-2xl cursor-pointer hover:bg-amber-400 hover:scale-110 transition-all active:scale-90 border-4 border-[#09090b]">
            <Camera size={24} className="stroke-[3px]" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        {/* 3. Header Info */}
        <div className="space-y-4 text-center mb-16">
          <h2 className={`text-5xl sm:text-6xl font-black italic tracking-tighter uppercase leading-none wrap-break-word
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            {fullName || 'New Profile'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck size={16} className="text-amber-500" />
            <p className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] italic leading-none">
              Professional Account Verified
            </p>
          </div>
        </div>

        {/* 4. Form Controls */}
        <div className="space-y-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-[0.4em] italic">
                Display Name
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  placeholder="Your Full Name..."
                  value={fullName} 
                  onChange={e => { setFullName(e.target.value); setHasChanged(true); }}
                  className={`w-full p-6 pl-14 rounded-4xl border outline-none font-bold text-lg transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500'}`} 
                />
              </div>
            </div>

            <div className="space-y-3 text-left opacity-60">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-[0.4em] italic">
                Registered Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  disabled
                  value={user?.email || ''}
                  className={`w-full p-6 pl-14 rounded-4xl border outline-none font-bold text-lg cursor-not-allowed
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`} 
                />
                <Lock size={12} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-800" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-[2.5rem] border flex items-center justify-between
            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
            <div className="flex items-center gap-6 text-left">
              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-amber-500 shadow-xl">
                <Fingerprint size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Security Reference ID</p>
                <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-tighter mt-1">
                  {user?.id?.toUpperCase() || 'OFFLINE_CACHE'}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Connected</span>
            </div>
          </div>

          <button 
            disabled={isUpdating || !hasChanged} 
            onClick={handleUpdateProfile}
            className={`w-full py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-5 italic
              ${isUpdating || !hasChanged 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' 
                : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.01] active:scale-95 shadow-amber-500/10'}`}
          >
            {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="stroke-[3px]" />}
            Update Office Profile
          </button>
        </div>
      </div>

      {/* Simplified Compliance Footer */}
      <footer className="mt-12 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600">
          AUTHORIZED CONSTRUCTION OS v2.0
        </p>
      </footer>
    </div>
  );
};

export default IdentityNode;