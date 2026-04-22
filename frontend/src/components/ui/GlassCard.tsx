import React from "react";
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  interactive = false,
}) => {
  const baseStyles =
    "backdrop-blur-2xl border transition-all duration-500 rounded-[0.5rem] overflow-hidden";
  const themeStyles = "theme-surface-overlay";

  const interactiveStyles = interactive
    ? "hover:scale-[1.01] hover:border-amber-500/30 cursor-pointer active:scale-[0.99] group/glass"
    : "";

  return (
    <div
      className={`${baseStyles} ${themeStyles} ${interactiveStyles} ${className}`}
    >
      {interactive && (
        <div className="absolute inset-0 opacity-0 group-hover/glass:opacity-100 transition-opacity duration-700 pointer-events-none bg-linear-to-br from-amber-500/3 to-transparent" />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GlassCard;
