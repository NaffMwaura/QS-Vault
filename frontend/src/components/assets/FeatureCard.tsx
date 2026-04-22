import { type LucideIcon } from "lucide-react";

export interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon: Icon, title, description }: CardProps) => (
  <div className="theme-surface-card p-8 sm:p-12 rounded-sm border transition-all duration-500 hover:scale-[1.02] hover:border-amber-500/30 text-center group relative overflow-hidden">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-amber-500 transition-all duration-500">
      <Icon
        size={32}
        className="text-amber-500 group-hover:text-black transition-colors"
      />
    </div>
    <h3 className="theme-title text-lg sm:text-xl font-black uppercase tracking-tight mb-4">
      {title}
    </h3>
    <p className="theme-muted text-sm leading-relaxed font-medium">
      {description}
    </p>
  </div>
);
