import { type CardProps } from "./FeatureCard";

export const ValuePropCard = ({
  icon: Icon,
  title,
  description,
  theme,
}: CardProps) => (
  <div
    className={`p-6 sm:p-8 border rounded-2xl sm:rounded-3xl transition-all duration-500 hover:border-amber-500/30 space-y-4 flex flex-col items-start text-left group
    ${theme === "dark" ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"}`}
  >
    <div className="p-3 bg-amber-500/10 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform">
      <Icon size={20} className="text-amber-500" />
    </div>
    <div>
      <h3
        className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
      >
        {title}
      </h3>
      <p
        className={`text-[11px] sm:text-xs leading-relaxed font-bold ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}
      >
        {description}
      </p>
    </div>
  </div>
);
