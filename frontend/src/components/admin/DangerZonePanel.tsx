import { ShieldAlert } from 'lucide-react';

export const DangerZonePanel = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}) => (
  <div className="theme-admin-danger rounded-[1.8rem] p-5 sm:p-6">
    <div className="mb-4 flex items-center gap-3">
      <ShieldAlert size={18} className="text-rose-500" />
      <h3 className="theme-title text-lg font-black">{title}</h3>
    </div>
    <p className="theme-subtle mb-5 text-sm leading-relaxed">{description}</p>
    <button
      type="button"
      onClick={onAction}
      className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
    >
      {actionLabel}
    </button>
  </div>
);
