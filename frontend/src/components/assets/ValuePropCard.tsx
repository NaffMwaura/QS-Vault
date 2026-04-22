import { type CardProps } from "./FeatureCard";

export const ValuePropCard = ({
  icon: Icon,
  title,
  description,
}: CardProps) => (
  <div className="theme-surface-card-soft p-6 sm:p-8 border rounded-sm transition-all duration-500 hover:border-amber-500/30 space-y-4 flex flex-col items-start text-left group">
    <div className="p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform">
      <Icon size={20} className="text-amber-500" />
    </div>
    <div>
      <h3 className="theme-title text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] mb-2">
        {title}
      </h3>
      <p className="theme-muted text-[11px] sm:text-xs leading-relaxed font-bold">
        {description}
      </p>
    </div>
  </div>
);
