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
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

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
      await db.profiles.update(user.id, profileData);

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
      
      <div className={`relative overflow-hidden rounded-[2rem] border p-5 sm:p-8 backdrop-blur-3xl transition-all duration-500
        ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'}`}>
        
        {/* 1. Header: Back Button & Title */}
        <div className="mb-10 flex items-center justify-between">
          <button 
            onClick={onBack} 
            className={`theme-admin-icon-button flex items-center justify-center rounded-2xl border transition-all active:scale-90 shadow-xl group
              ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-900'}`}
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          {showSavedToast && (
            <div className="theme-admin-chip flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in fade-in zoom-in duration-300">
               <CheckCircle2 size={14} />
               <span className="leading-none">Saved to Device</span>
            </div>
          )}
        </div>

        {/* 2. Photo Section */}
        <div className="relative mx-auto mb-10 h-40 w-40 sm:h-48 sm:w-48 group">
          <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] border-[6px] shadow-2xl transition-all duration-500 group-hover:scale-105
            ${theme === 'dark' ? 'bg-zinc-950 border-amber-500/10' : 'bg-zinc-50 border-amber-500/5 shadow-inner'}`}>
            {profileImage ? (
              <img src={profileImage} className="w-full h-full object-cover" alt="User" />
            ) : (
              <div className="select-none text-5xl font-black italic text-zinc-800 dark:text-zinc-700">
                {getInitials()}
              </div>
            )}
          </div>
          
          <label className="absolute -bottom-2 -right-2 flex h-14 w-14 cursor-pointer items-center justify-center rounded-[1.1rem] border-4 border-[#09090b] bg-amber-500 text-black shadow-2xl transition-all hover:scale-110 hover:bg-amber-400 active:scale-90">
            <Camera size={20} className="stroke-[2.6px]" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        {/* 3. User Identity Info */}
        <div className="mb-10 space-y-3 px-4 text-center">
          <h2 className={`text-3xl sm:text-4xl font-black italic tracking-tight uppercase leading-none break-words
            ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            {fullName || 'Office User'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck size={16} className="text-amber-500" />
            <p className="theme-admin-label text-amber-500 italic leading-none">
              Verified Office Profile
            </p>
          </div>
        </div>

        {/* 4. Settings Form */}
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-3 text-left">
              <label className="theme-admin-label ml-1">
                Your Full Name
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  placeholder="Enter your name..."
                  value={fullName} 
                  onChange={e => { setFullName(e.target.value); setHasChanged(true); }}
                  className={`theme-admin-input w-full border pl-11 outline-none font-semibold transition-all shadow-inner
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500'}`} 
                />
              </div>
            </div>

            <div className="space-y-3 text-left opacity-60">
              <label className="theme-admin-label ml-1">
                Account Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                  disabled
                  value={user?.email || ''}
                  className={`theme-admin-input w-full border pl-11 outline-none font-semibold cursor-not-allowed
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`} 
                />
                <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-800" />
              </div>
            </div>
          </div>

          <div className={`flex items-center justify-between rounded-[1.4rem] border p-5
            ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200 shadow-inner'}`}>
            <div className="flex items-center gap-4 overflow-hidden text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-amber-500 shadow-xl">
                <Fingerprint size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="theme-admin-label">Profile ID Number</p>
                <p className="theme-admin-meta mt-1 truncate font-mono uppercase tracking-tight">
                  {user?.id?.toUpperCase() || 'OFFLINE_CACHE'}
                </p>
              </div>
            </div>
          </div>

          <button 
            disabled={isUpdating || !hasChanged} 
            onClick={handleUpdateProfile}
            className={`theme-admin-control flex w-full items-center justify-center gap-4 rounded-[1.3rem] shadow-2xl transition-all italic min-h-[3.2rem]
              ${isUpdating || !hasChanged 
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-900' 
                : 'bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.01] active:scale-95 shadow-amber-500/10'}`}
          >
            {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} className="stroke-[2.6px]" />}
            Save Profile Changes
          </button>
        </div>
      </div>

      <footer className="mt-8 text-center opacity-40">
        <p className="theme-admin-label text-zinc-600 leading-none">
          AUTHORIZED CONSTRUCTION OS v2.0
        </p>
      </footer>
    </div>
  );
};

export default IdentityNode;
