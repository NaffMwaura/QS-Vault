import React, { useState, type ChangeEvent } from "react";
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
  Lock,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { db, syncEngine } from "../../../lib/database/database";

interface IdentityNodeProps {
  onBack: () => void;
  onUpdateComplete?: () => void;
}

const IdentityNode: React.FC<IdentityNodeProps> = ({
  onBack,
  onUpdateComplete,
}) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(() => user?.user_metadata?.full_name || "");
  const [profileImage, setProfileImage] = useState<string | null>(
    () => user?.user_metadata?.avatar_url || null,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const getInitials = () => {
    if (!fullName) return user?.email?.[0]?.toUpperCase() || "?";
    return fullName
      .split(" ")
      .filter(Boolean)
      .map((name: string) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 900000) {
      alert("Image exceeds 900KB. Use a compressed photo for optimal site speed.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
      setHasChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);

    const profileData = {
      id: user.id,
      full_name: fullName,
      avatar_url: profileImage,
      updated_at: new Date().toISOString(),
    };

    try {
      await db.profiles.update(user.id, profileData);
      await syncEngine.queueChange("profiles", user.id, "UPDATE", profileData);

      setHasChanged(false);
      setShowSavedToast(true);
      onUpdateComplete?.();

      setTimeout(() => {
        setIsUpdating(false);
        setTimeout(() => setShowSavedToast(false), 3000);
      }, 800);
    } catch (err) {
      console.error("Profile Transaction Failed.", err);
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-8 text-left duration-700">
      <div className="theme-panel relative overflow-hidden rounded-[2rem] p-5 shadow-2xl backdrop-blur-3xl transition-all duration-500 sm:p-8">
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={onBack}
            className="theme-button-secondary group flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl transition-all active:scale-90"
          >
            <ArrowLeft
              size={20}
              className="transition-transform group-hover:-translate-x-1"
            />
          </button>

          {showSavedToast && (
            <div className="animate-in fade-in zoom-in flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase text-emerald-500 duration-300">
              <CheckCircle2 size={14} />
              <span className="leading-none tracking-widest">Saved to Device</span>
            </div>
          )}
        </div>

        <div className="group relative mx-auto mb-10 h-40 w-40 sm:h-48 sm:w-48">
          <div className="theme-card flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] border-[6px] shadow-inner shadow-2xl transition-all duration-500 group-hover:scale-105">
            {profileImage ? (
              <img
                src={profileImage}
                className="h-full w-full object-cover"
                alt="Identity Portrait"
              />
            ) : (
              <div className="theme-heading select-none text-5xl font-black italic opacity-70">
                {getInitials()}
              </div>
            )}
          </div>

          <label className="absolute -bottom-2 -right-2 flex h-14 w-14 cursor-pointer items-center justify-center rounded-[1.1rem] border-4 border-[var(--app-bg)] bg-amber-500 text-black shadow-2xl transition-all hover:scale-110 hover:bg-amber-400 active:scale-90">
            <Camera size={20} className="stroke-[2.6px]" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        <div className="mb-10 space-y-3 px-4 text-center">
          <h2 className="theme-heading break-words text-3xl font-black uppercase italic leading-none tracking-tight sm:text-4xl">
            {fullName || "Office User"}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck size={16} className="theme-accent" />
            <p className="theme-meta theme-accent text-[10px] font-black uppercase italic leading-none tracking-widest">
              Verified Office Profile
            </p>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-3 text-left">
              <label className="theme-meta ml-1 text-[10px] font-black uppercase italic tracking-widest">
                Your Full Name
              </label>
              <div className="relative">
                <UserIcon
                  size={16}
                  className="theme-icon absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  placeholder="Enter your name..."
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setHasChanged(true);
                  }}
                  className="theme-input w-full rounded-2xl p-4 pl-11 font-semibold shadow-inner outline-none transition-all focus:theme-border"
                />
              </div>
            </div>

            <div className="space-y-3 text-left opacity-60">
              <label className="theme-meta ml-1 text-[10px] font-black uppercase italic tracking-widest">
                Account Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="theme-icon absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  disabled
                  value={user.email || ""}
                  className="theme-input w-full cursor-not-allowed rounded-2xl p-4 pl-11 font-semibold opacity-50 outline-none"
                />
                <Lock
                  size={12}
                  className="theme-meta absolute right-4 top-1/2 -translate-y-1/2 opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="theme-card flex items-center justify-between rounded-[1.4rem] p-5 shadow-inner">
            <div className="flex items-center gap-4 overflow-hidden text-left">
              <div className="theme-panel theme-accent-surface flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xl">
                <Fingerprint size={20} className="theme-accent" />
              </div>
              <div className="overflow-hidden">
                <p className="theme-meta text-[10px] font-black uppercase italic tracking-widest">
                  Profile ID Number
                </p>
                <p className="theme-body mt-1 truncate font-mono text-sm uppercase tracking-tight">
                  {user.id.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <button
            disabled={isUpdating || !hasChanged}
            onClick={handleUpdateProfile}
            className={`flex min-h-[3.8rem] w-full items-center justify-center gap-4 rounded-[1.3rem] text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all
              ${
                isUpdating || !hasChanged
                  ? "theme-button-secondary cursor-not-allowed opacity-50"
                  : "theme-button-primary"
              }`}
          >
            {isUpdating ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} className="stroke-[2.6px]" />
            )}
            Save Profile Changes
          </button>
        </div>
      </div>

      <footer className="mt-8 text-center opacity-40">
        <p className="theme-meta text-[9px] font-black uppercase leading-none tracking-widest">
          AUTHORIZED CONSTRUCTION OS v2.0
        </p>
      </footer>
    </div>
  );
};

export default IdentityNode;
