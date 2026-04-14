import React, { useState, type ChangeEvent } from 'react';
import { 
  Camera, Save, ArrowLeft, User as UserIcon, ShieldCheck, 
  Loader2, Mail, Fingerprint, CheckCircle2, Lock
} from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

interface IdentityNodeProps {
  onBack: () => void;
  onUpdateComplete?: () => void;
}

const IdentityNode: React.FC<IdentityNodeProps> = ({ onBack, onUpdateComplete }) => {
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

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

  const handleUpdateProfile = async () => {
    if (!user || !db) return;
    setIsUpdating(true);

    const profileData = {
      id: user.id,
      full_name: fullName,
      updated_at: new Date().toISOString()
    };

    try {
      await db.profiles.update(user.id, profileData);

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
      
      <div className="theme-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-8 backdrop-blur-3xl transition-all duration-500 shadow-2xl">
        
        <div className="mb-10 flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="theme-button-secondary flex w-12 h-12 items-center justify-center rounded-2xl transition-all active:scale-90 shadow-xl group hover:theme-accent"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          {showSavedToast && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-500 animate-in fade-in zoom-in duration-300">
               <CheckCircle2 size={14} />
               <span className="leading-none tracking-widest">Saved to Device</span>
            </div>
          )}
        </div>

        <div className="relative mx-auto mb-10 h-40 w-40 sm:h-48 sm:w-48 group">
          <div className="theme-card flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] border-[6px] shadow-2xl transition-all duration-500 group-hover:scale-105 shadow-inner">
            {profileImage ? (
              <img src={profileImage} className="w-full h-full object-cover" alt="User" />
            ) : (
              <div className="select-none text-5xl font-black italic theme-heading opacity-70">
                {getInitials()}
              </div>
            )}
          </div>
          
          <label className="absolute -bottom-2 -right-2 flex h-14 w-14 cursor-pointer items-center justify-center rounded-[1.1rem] border-4 border-[var(--app-bg)] bg-amber-500 text-black shadow-2xl transition-all hover:scale-110 hover:bg-amber-400 active:scale-90">
            <Camera size={20} className="stroke-[2.6px]" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>

        <div className="mb-10 space-y-3 px-4 text-center">
          <h2 className="theme-heading text-3xl sm:text-4xl font-black italic tracking-tight uppercase leading-none break-words">
            {fullName || 'Office User'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck size={16} className="theme-accent" />
            <p className="theme-meta theme-accent tracking-widest text-[10px] uppercase font-black italic leading-none">
              Verified Office Profile
            </p>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-3 text-left">
              <label className="theme-meta text-[10px] font-black uppercase italic tracking-widest ml-1">
                Your Full Name
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 theme-icon" />
                <input 
                  placeholder="Enter your name..."
                  value={fullName} 
                  onChange={e => { setFullName(e.target.value); setHasChanged(true); }}
                  className="theme-input p-4 w-full pl-11 rounded-2xl outline-none font-semibold transition-all shadow-inner focus:theme-border" 
                />
              </div>
            </div>

            <div className="space-y-3 text-left opacity-60">
              <label className="theme-meta text-[10px] font-black uppercase italic tracking-widest ml-1">
                Account Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 theme-icon" />
                <input 
                  disabled
                  value={user?.email || ''}
                  className="theme-input p-4 rounded-2xl w-full pl-11 outline-none font-semibold cursor-not-allowed opacity-50" 
                />
                <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 theme-meta opacity-50" />
              </div>
            </div>
          </div>

          <div className="theme-card flex items-center justify-between rounded-[1.4rem] p-5 shadow-inner">
            <div className="flex items-center gap-4 overflow-hidden text-left">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl theme-panel theme-accent-surface shadow-xl">
                <Fingerprint size={20} className="theme-accent" />
              </div>
              <div className="overflow-hidden">
                <p className="theme-meta text-[10px] font-black uppercase tracking-widest italic">Profile ID Number</p>
                <p className="theme-body mt-1 truncate font-mono text-sm uppercase tracking-tight">
                  {user?.id?.toUpperCase() || 'OFFLINE_CACHE'}
                </p>
              </div>
            </div>
          </div>

          <button 
            disabled={isUpdating || !hasChanged} 
            onClick={handleUpdateProfile}
            className={`flex w-full items-center justify-center gap-4 rounded-[1.3rem] shadow-2xl transition-all font-black uppercase tracking-widest text-[10px] min-h-[3.8rem]
              ${isUpdating || !hasChanged 
                ? 'theme-button-secondary opacity-50 cursor-not-allowed' 
                : 'theme-button-primary'}`}
          >
            {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} className="stroke-[2.6px]" />}
            Save Profile Changes
          </button>
        </div>
      </div>

      <footer className="mt-8 text-center opacity-40">
        <p className="theme-meta tracking-widest uppercase font-black text-[9px] leading-none">
          AUTHORIZED CONSTRUCTION OS v2.0
        </p>
      </footer>
    </div>
  );
};

export default IdentityNode;
