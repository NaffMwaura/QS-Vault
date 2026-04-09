 
import React, { useState, type ChangeEvent } from 'react';
import { 
  Camera, import React, { useState, useEffect, type ChangeEvent } from 'react';
import { 
  Camera, 
  Save, 
  ArrowLeft, 
  User as UserIcon,
  Loader2, 
  Mail, 
  Fingerprint,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine, supabase } from "../../../lib/database/database";

/** --- TYPES --- **/

interface IdentityNodeProps {
  onBack: () => void;
  onUpdateComplete?: () => void;
}

/** --- MAIN COMPONENT: USER IDENTITY SYSTEM --- **/

const IdentityNode: React.FC<IdentityNodeProps> = ({ onBack, onUpdateComplete }) => {
  const { user, theme } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  /** * NODE HYDRATION
   * Pulls the latest verified data from the local vault or cloud.
   */
  useEffect(() => {
    const hydrateIdentity = async () => {
      if (!user || !db) return;
      
      try {
        // 1. Try Local Vault first (Speed)
        const localProfile = await db.profiles.get(user.id);
        
        if (localProfile) {
          setFullName(localProfile.full_name || '');
          setProfileImage(localProfile.avatar_url || null);
        } else {
          // 2. Fallback to Supabase if local is empty
          const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();
            
          if (data) {
            setFullName(data.full_name || '');
            setProfileImage(data.avatar_url || null);
            // Cache locally for next time
            await db.profiles.put({
              id: user.id,
              username: user.email?.split('@')[0] || 'User',
              full_name: data.full_name,
              avatar_url: data.avatar_url,
              role: 'user',
              updated_at: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn("Identity Sync Delayed:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    hydrateIdentity();
  }, [user]);

  // Initials generator for fallback UI
  const getInitials = () => {
    if (!fullName) return user?.email?.[0].toUpperCase() || '?';
    return fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Presentation check: limit image size for base64 storage
      if (file.size > 800000) {
        alert("Image exceeds 800KB. Please use a smaller profile photo for optimal site performance.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        setHasChanged(true);
      };
      reader.readAsDataURL(file);
    }
  };

  /** * SAVE PROFILE (OFFLINE-READY HANDSHAKE) */
  const handleUpdateProfile = async () => {
    if (!user || !db) return;
    setIsUpdating(true);

    const profileData = {
      id: user.id,
      full_name: fullName,
      avatar_url: profileImage,
      updated_at: new Date().toISOString()
    };

    try {
      // 1. Commit to Local Device Immediately
      await db.profiles.update(user.id, profileData);

      // 2. Queue for Cloud Sync (Outbox Pattern)
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
      console.error("Profile Transaction Failed:", err);
      setIsUpdating(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-20">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Verifying Identity Node...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
      
      <div className={`relative overflow-hidden rounded-[4rem] border p-10 sm:p-14 backdrop-blur-3xl transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50'}`}>
        
        {/* 1. TOP HUB HUD */}
        <div className="mb-14 flex items-center justify-between">
          <button 
            onClick={onBack} 
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all active:scale-90 group
              ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-900'}`}
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          {showSavedToast && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in fade-in zoom-in duration-300 shadow-lg shadow-emerald-500/5">
               <CheckCircle2 size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">Node Synced Locally</span>
            </div>
          )}
        </div>

        {/* 2. PHOTO VAULT SECTION */}
        <div className="relative mx-auto mb-14 h-48 w-48 group">
          <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-[3rem] border-8 shadow-2xl transition-all duration-500 group-hover:scale-105
            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
            {profileImage ? (
              <img src={profileImage} className="w-full h-full object-cover" alt="Verification Portrait" />
            ) : (
              <div className={`select-none text-6xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-zinc-800' : 'text-zinc-200'}`}>
                {getInitials()}
              </div>
            )}
          </div>
          
          <label className="absolute -bottom-2 -right-2 flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border-4 border-[#09090b] bg-amber-500 text-black shadow-2xl transition-all hover:scale-110 hover:bg-amber-400 active:scale-90 ring-4 ring-amber-500/10">
            <Camera size={24} className="stroke-[2.6px]" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        {/* 3. IDENTITY FEEDBACK */}
        <div className="mb-14 space-y-4 px-4 text-center">
          <h2 className={`text-4xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none wrap-break-word
            ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            {fullName || 'Authorized User'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <UserCheck size={18} className="text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none">
              Verified Site Profile
            </p>
          </div>
        </div>

        {/* 4. SETTINGS ENGINE */}
        <div className="space-y-8 pt-4 border-t border-zinc-800/40">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4 text-left">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">
                Verified Full Name
              </label>
              <div className="relative group">
                <UserIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  placeholder="Official Name..."
                  value={fullName} 
                  onChange={e => { setFullName(e.target.value); setHasChanged(true); }}
                  className={`w-full h-18 border pl-16 pr-6 rounded-[1.8rem] text-lg font-bold outline-none transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`} 
                />
              </div>
            </div>

            <div className="space-y-4 text-left opacity-60">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">
                Node Email (Read-Only)
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  disabled
                  value={user?.email || ''}
                  className={`w-full h-18 border pl-16 pr-12 rounded-[1.8rem] text-lg font-bold outline-none cursor-not-allowed
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`} 
                />
                <Lock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-800" />
              </div>
            </div>
          </div>

          <div className={`flex items-center justify-between rounded-4xl border p-6
            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
            <div className="flex items-center gap-6 overflow-hidden text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-zinc-800 bg-zinc-900 text-amber-500 shadow-xl">
                <Fingerprint size={28} strokeWidth={2.5} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic leading-none mb-2">Vault Identity Hash</p>
                <p className="text-xs font-mono font-bold uppercase tracking-tight text-zinc-400 truncate">
                  {user?.id || 'LOCAL_STANDBY_MODE'}
                </p>
              </div>
            </div>
          </div>

          <button 
            disabled={isUpdating || !hasChanged} 
            onClick={handleUpdateProfile}
            className={`flex w-full items-center justify-center gap-5 rounded-4xl py-8 shadow-2xl transition-all italic font-black uppercase text-sm tracking-[0.4em]
              ${isUpdating || !hasChanged 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-900' 
                : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.01] active:scale-95 shadow-amber-500/20'}`}
          >
            {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="stroke-[3px]" />}
            Commit Profile Updates
          </button>
        </div>
      </div>

      <footer className="mt-12 text-center opacity-20 select-none">
        <p className="text-[9px] font-black uppercase tracking-[1em] text-zinc-600 italic leading-none">
          QS VAULT OS v2.5 • IDENTITY PROTOCOL
        </p>
      </footer>
    </div>
  );
};

export default IdentityNode;
  Save, 
  ArrowLeft, 
  User as UserIcon,
  Loader2, 
  Mail, 
  Fingerprint,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine, supabase } from "../../../lib/database/database";

/** --- TYPES --- **/

interface IdentityNodeProps {
  onBack: () => void;
  onUpdateComplete?: () => void;
}

/** --- MAIN COMPONENT: USER IDENTITY SYSTEM --- **/

const IdentityNode: React.FC<IdentityNodeProps> = ({ onBack, onUpdateComplete }) => {
  const { user, theme } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  /** * NODE HYDRATION
   * Pulls the latest verified data from the local vault or cloud.
   */
  useEffect(() => {
    const hydrateIdentity = async () => {
      if (!user || !db) return;
      
      try {
        // 1. Try Local Vault first (Speed)
        const localProfile = await db.profiles.get(user.id);
        
        if (localProfile) {
          setFullName(localProfile.full_name || '');
          setProfileImage(localProfile.avatar_url || null);
        } else {
          // 2. Fallback to Supabase if local is empty
          const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();
            
          if (data) {
            setFullName(data.full_name || '');
            setProfileImage(data.avatar_url || null);
            // Cache locally for next time
            await db.profiles.put({
              id: user.id,
              username: user.email?.split('@')[0] || 'User',
              full_name: data.full_name,
              avatar_url: data.avatar_url,
              role: 'user',
              updated_at: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn("Identity Sync Delayed:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    hydrateIdentity();
  }, [user]);

  // Initials generator for fallback UI
  const getInitials = () => {
    if (!fullName) return user?.email?.[0].toUpperCase() || '?';
    return fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Presentation check: limit image size for base64 storage
      if (file.size > 800000) {
        alert("Image exceeds 800KB. Please use a smaller profile photo for optimal site performance.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        setHasChanged(true);
      };
      reader.readAsDataURL(file);
    }
  };

  /** * SAVE PROFILE (OFFLINE-READY HANDSHAKE) */
  const handleUpdateProfile = async () => {
    if (!user || !db) return;
    setIsUpdating(true);

    const profileData = {
      id: user.id,
      full_name: fullName,
      avatar_url: profileImage,
      updated_at: new Date().toISOString()
    };

    try {
      // 1. Commit to Local Device Immediately
      await db.profiles.update(user.id, profileData);

      // 2. Queue for Cloud Sync (Outbox Pattern)
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
      console.error("Profile Transaction Failed:", err);
      setIsUpdating(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 opacity-20">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Verifying Identity Node...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 text-left">
      
      <div className={`relative overflow-hidden rounded-[4rem] border p-10 sm:p-14 backdrop-blur-3xl transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50'}`}>
        
        {/* 1. TOP HUB HUD */}
        <div className="mb-14 flex items-center justify-between">
          <button 
            onClick={onBack} 
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all active:scale-90 group
              ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-900'}`}
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          {showSavedToast && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in fade-in zoom-in duration-300 shadow-lg shadow-emerald-500/5">
               <CheckCircle2 size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">Node Synced Locally</span>
            </div>
          )}
        </div>

        {/* 2. PHOTO VAULT SECTION */}
        <div className="relative mx-auto mb-14 h-48 w-48 group">
          <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-[3rem] border-8 shadow-2xl transition-all duration-500 group-hover:scale-105
            ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
            {profileImage ? (
              <img src={profileImage} className="w-full h-full object-cover" alt="Verification Portrait" />
            ) : (
              <div className={`select-none text-6xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-zinc-800' : 'text-zinc-200'}`}>
                {getInitials()}
              </div>
            )}
          </div>
          
          <label className="absolute -bottom-2 -right-2 flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border-4 border-[#09090b] bg-amber-500 text-black shadow-2xl transition-all hover:scale-110 hover:bg-amber-400 active:scale-90 ring-4 ring-amber-500/10">
            <Camera size={24} className="stroke-[2.6px]" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        {/* 3. IDENTITY FEEDBACK */}
        <div className="mb-14 space-y-4 px-4 text-center">
          <h2 className={`text-4xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none wrap-break-word
            ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
            {fullName || 'Authorized User'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <UserCheck size={18} className="text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic leading-none">
              Verified Site Profile
            </p>
          </div>
        </div>

        {/* 4. SETTINGS ENGINE */}
        <div className="space-y-8 pt-4 border-t border-zinc-800/40">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4 text-left">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">
                Verified Full Name
              </label>
              <div className="relative group">
                <UserIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  placeholder="Official Name..."
                  value={fullName} 
                  onChange={e => { setFullName(e.target.value); setHasChanged(true); }}
                  className={`w-full h-18 border pl-16 pr-6 rounded-[1.8rem] text-lg font-bold outline-none transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-950 focus:border-amber-500'}`} 
                />
              </div>
            </div>

            <div className="space-y-4 text-left opacity-60">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest italic">
                Node Email (Read-Only)
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  disabled
                  value={user?.email || ''}
                  className={`w-full h-18 border pl-16 pr-12 rounded-[1.8rem] text-lg font-bold outline-none cursor-not-allowed
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`} 
                />
                <Lock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-800" />
              </div>
            </div>
          </div>

          <div className={`flex items-center justify-between rounded-4xl border p-6
            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
            <div className="flex items-center gap-6 overflow-hidden text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-zinc-800 bg-zinc-900 text-amber-500 shadow-xl">
                <Fingerprint size={28} strokeWidth={2.5} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic leading-none mb-2">Vault Identity Hash</p>
                <p className="text-xs font-mono font-bold uppercase tracking-tight text-zinc-400 truncate">
                  {user?.id || 'LOCAL_STANDBY_MODE'}
                </p>
              </div>
            </div>
          </div>

          <button 
            disabled={isUpdating || !hasChanged} 
            onClick={handleUpdateProfile}
            className={`flex w-full items-center justify-center gap-5 rounded-4xl py-8 shadow-2xl transition-all italic font-black uppercase text-sm tracking-[0.4em]
              ${isUpdating || !hasChanged 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-900' 
                : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.01] active:scale-95 shadow-amber-500/20'}`}
          >
            {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="stroke-[3px]" />}
            Commit Profile Updates
          </button>
        </div>
      </div>

      <footer className="mt-12 text-center opacity-20 select-none">
        <p className="text-[9px] font-black uppercase tracking-[1em] text-zinc-600 italic leading-none">
          QS VAULT OS v2.5 • IDENTITY PROTOCOL
        </p>
      </footer>
    </div>
  );
};

export default IdentityNode;