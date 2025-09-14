import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '~/utils/cn';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'idle' | 'running' | 'pass' | 'fail' | 'selectable' | 'selected';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, children, variant = 'idle', size = 'md', icon, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-accent-cyan/60 focus:ring-offset-1 focus:ring-offset-control-bg';
    
    const variants = {
      idle: 'bg-text-muted/20 text-text-muted border border-text-muted/30',
      running: 'bg-running-amber/20 text-running-amber border border-running-amber/40 relative overflow-hidden',
      pass: 'bg-success-lime/20 text-success-lime border border-success-lime/40',
      fail: 'bg-fail-rose/20 text-fail-rose border border-fail-rose/40',
      selectable: 'bg-text-muted/10 text-text-muted border border-text-muted/30 hover:bg-accent-cyan/10 hover:text-accent-cyan hover:border-accent-cyan/40 cursor-pointer',
      selected: 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/60 shadow-glow-cyan/50',
    };
    
    const sizes = {
      sm: 'px-2 py-1 text-caption rounded-md',
      md: 'px-3 py-1.5 text-body-sm rounded-lg',
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Chip.displayName = 'Chip';
