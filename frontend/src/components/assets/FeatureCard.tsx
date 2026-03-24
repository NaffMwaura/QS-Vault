import { type LucideIcon } from "lucide-react";

export interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  theme: "light" | "dark";
}

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  theme,
}: CardProps) => (
  <div
    className={`p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border transition-all duration-500 hover:scale-[1.02] text-center group relative overflow-hidden
    ${
      theme === "dark"
        ? "bg-zinc-900/40 border-zinc-800 shadow-2xl hover:border-amber-500/30"
        : "bg-white border-zinc-200 shadow-xl hover:border-amber-500/30"
    }`}
  >
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-amber-500 transition-all duration-500">
      <Icon
        size={32}
        className="text-amber-500 group-hover:text-black transition-colors"
      />
    </div>
    <h3
      className={`text-lg sm:text-xl font-black uppercase tracking-tight mb-4 ${theme === "dark" ? "text-white" : "text-zinc-900"}`}
    >
      {title}
    </h3>
    <p
      className={`text-sm leading-relaxed font-medium ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}
    >
      {description}
    </p>
  </div>
);
