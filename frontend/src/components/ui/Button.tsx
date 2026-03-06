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

/** --- BUTTON COMPONENT --- **/

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
  
  // Base architectural styles for the QS Vault Design System
  const baseStyles = "px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer";
  
  // Variant Logic (Light/Dark compliant)
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 border border-amber-500/10",
    
    secondary: "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700",
    
    ghost: "text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-amber-500/5 border border-transparent",
    
    outline: "bg-transparent border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 backdrop-blur-md",
    
    danger: "bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white"
  };

  return (
    <button 
      {...props} 
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin stroke-[3px]" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span className="leading-none">{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;