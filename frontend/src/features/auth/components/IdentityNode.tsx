/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, type ChangeEvent } from 'react';
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
    PROFILE MODULE: MANAGE YOUR OFFICE IDENTITY
    Works offline via Dexie + syncs via Supabase
   ====================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useAuth: any = () => ({
  user: { id: 'dev-user-001', email: 'surveyor@vault.systems', user_metadata: { full_name: 'Naftaly Mwaura' } },
  theme: 'dark',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let syncEngine: any = null;

const resolveModules = async () => {
  try {
    const authMod = await import("../../auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../../lib/database/database");
    if (dbMod.db) db = dbMod.db; 
    if (dbMod.syncEngine) syncEngine = dbMod.syncEngine;
  } catch (e) {
    // Shims active for sandbox stability
  }
};

resolveModules();

/** --- TYPES --- **/

interface IdentityNodeProps {
  onBack: () => void;
  onUpdateComplete?: () => void;
}

/** --- MAIN COMPONENT --- **/

const IdentityNode: React.FC<IdentityNodeProps> = ({ onBack, onUpdateComplete }) => {
  const { user, theme } = useAuth();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Simple logic to get first two letters of name if no photo exists
  const getInitials = () => {
    if (!fullName) return '?';
    return fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
      setHasChanged(true);
    }
  };

  /** * SAVE PROFILE (OFFLINE-FIRST)
   * 1. Updates the local device memory (Dexie)
   * 2. Queues the change to send to the cloud later
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
      // 1. Save to this laptop/phone immediately
      await db.profiles.put(profileData);

      // 2. Add to the "To-Do" list for the Cloud sync
      if (syncEngine?.queueChange) {
        await syncEngine.queueChange('profiles', user.id, 'UPDATE', profileData);
      }
      
      setHasChanged(false);
      setShowSavedToast(true);
      if (onUpdateComplete) onUpdateComplete();
      
      setTimeout(() => {
        setIsUpdating(false);
        setTimeout(() => setShowSavedToast(false), 3000);
      }, 800);
    } catch (err) {
      console.error("Profile Save Error:", err);
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
      
      <div className={`p-8 sm:p-20 rounded-[4rem] sm:rounded-[5rem] backdrop-blur-3xl border relative overflow-hidden transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}`}>
        
        {/* 1. Header: Back Button & Title */}
        <div className="flex justify-between items-center mb-16">
          <button 
            onClick={onBack} 
            className={`p-4 sm:p-5 rounded-2xl border transition-all active:scale-90 shadow-xl group
              ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-900'}`}
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          {showSavedToast && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in fade-in zoom-in duration-300">
               <CheckCircle2 size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">Saved to Device</span>
            </div>
          )}
        </div>

        {/* 2. Photo Section */}
        <div className="relative w-48 sm:w-56 h-48 sm:h-56 mx-auto mb-12 group">
          <div className={`w-full h-full rounded-[4rem] border-8 overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105
            ${theme === 'dark' ? 'bg-zinc-950 border-amber-500/10' : 'bg-zinc-50 border-amber-500/5 shadow-inner'}`}>
            {profileImage ? (
              <img src={profileImage} className="w-full h-full object-cover" alt="User" />
            ) : (
              <div className="text-zinc-800 dark:text-zinc-700 font-black text-6xl italic select-none">
                {getInitials()}
              </div>
            )}
          </div>
          
          <label className="absolute -bottom-3 -right-3 p-5 sm:p-6 bg-amber-500 text-black rounded-[1.8rem] shadow-2xl cursor-pointer hover:bg-amber-400 hover:scale-110 transition-all active:scale-90 border-4 border-[#09090b]">
            <Camera size={24} className="stroke-[3px]" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        {/* 3. User Identity Info */}
        <div className="space-y-4 text-center mb-16 px-4">
          <h2 className={`text-4xl sm:text-6xl font-black italic tracking-tighter uppercase leading-none wrap-break-word
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            {fullName || 'Office User'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck size={16} className="text-amber-500" />
            <p className="text-sm font-black text-amber-500 uppercase tracking-[0.3em] italic leading-none">
              Verified Office Profile
            </p>
          </div>
        </div>

        {/* 4. Settings Form */}
        <div className="space-y-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-[0.4em] italic">
                Your Full Name
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  placeholder="Enter your name..."
                  value={fullName} 
                  onChange={e => { setFullName(e.target.value); setHasChanged(true); }}
                  className={`w-full p-6 pl-14 rounded-4xl border outline-none font-bold text-lg transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500'}`} 
                />
              </div>
            </div>

            <div className="space-y-3 text-left opacity-60">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-[0.4em] italic">
                Account Email
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
            <div className="flex items-center gap-6 text-left overflow-hidden">
              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-amber-500 shadow-xl shrink-0">
                <Fingerprint size={24} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Profile ID Number</p>
                <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-tighter mt-1 truncate">
                  {user?.id?.toUpperCase() || 'OFFLINE_CACHE'}
                </p>
              </div>
            </div>
          </div>

          <button 
            disabled={isUpdating || !hasChanged} 
            onClick={handleUpdateProfile}
            className={`w-full py-7 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-5 italic
              ${isUpdating || !hasChanged 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-900' 
                : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.01] active:scale-95 shadow-amber-500/10'}`}
          >
            {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="stroke-[3px]" />}
            Save Profile Changes
          </button>
        </div>
      </div>

      <footer className="mt-12 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 leading-none">
          AUTHORIZED CONSTRUCTION OS v2.0
        </p>
      </footer>
    </div>
  );
};

export default IdentityNode;