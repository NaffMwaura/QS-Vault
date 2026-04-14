import React from 'react';
import { Loader2 } from 'lucide-react';

/** --- TYPES & INTERFACES --- **/

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/** --- MAIN COMPONENT: PROFESSIONAL UI BUTTON --- **/

const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = "", 
  variant = "primary", 
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props 
}) => {
  
  /** * DESIGN TOKENS
   * These base styles create the "Microsoft-tier" professional feel:
   * - rounded-2xl: Soft but modern industrial corners.
   * - font-black: Maximum readability.
   * - tracking-[0.2em]: Professional letter spacing.
   */
  const baseStyles = "px-6 py-3.5 rounded-sm font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer select-none";
  
  // High-Contrast Variant Logic
  const variants: Record<ButtonVariant, string> = {
    primary: "theme-button-primary shadow-lg",
    
    secondary: "theme-button-secondary shadow-md",
    
    ghost: "text-[var(--app-meta)] hover:text-[var(--app-accent-strong)] hover:bg-[color-mix(in_srgb,var(--app-accent-strong)_5%,transparent)] border border-transparent",
    
    outline: "bg-transparent border-2 border-[var(--app-border)] text-[var(--app-body)] hover:bg-[color-mix(in_srgb,var(--app-body)_5%,transparent)] backdrop-blur-md",
    
    danger: "theme-status-error shadow-sm hover:bg-[var(--app-error)] hover:text-white"
  };

  return (
    <button 
      {...props} 
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin stroke-[3px]" />
          <span className="opacity-70 italic">Processing...</span>
        </div>
      ) : (
        <>
          {leftIcon && <span className="shrink-0 transition-transform group-hover:scale-110">{leftIcon}</span>}
          <span className="leading-none">{children}</span>
          {rightIcon && <span className="shrink-0 transition-transform group-hover:scale-110">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;