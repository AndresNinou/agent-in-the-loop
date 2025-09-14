import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '~/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, isLoading, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-cyan/60 focus:ring-offset-2 focus:ring-offset-control-bg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] hover:translate-y-[-1px] active:translate-y-[0px]';
    
    const variants = {
      primary: 'bg-orchestrate text-white hover:shadow-glow-cyan hover:shadow-lg shadow-md',
      secondary: 'bg-accent-violet text-white hover:bg-accent-violet/90 hover:shadow-glow-cyan hover:shadow-lg shadow-md',
      ghost: 'text-accent-cyan hover:text-text-bright hover:bg-accent-cyan/10 border border-accent-cyan/30 hover:border-accent-cyan/60 hover:shadow-glow-cyan/50',
      danger: 'bg-fail-rose text-white hover:bg-fail-rose/90 hover:shadow-glow-fail hover:shadow-lg shadow-md',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-body-sm rounded-xl',
      lg: 'px-6 py-3 text-body rounded-xl',
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isLoading && 'cursor-wait',
          className
        )}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
