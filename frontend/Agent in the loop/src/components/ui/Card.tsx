import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '~/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'focus' | 'hover';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, variant = 'default', padding = 'md', ...props }, ref) => {
    const baseStyles = 'glass rounded-2xl shadow-card transition-all duration-200';
    
    const variants = {
      default: '',
      focus: 'ring-2 ring-accent-cyan/60',
      hover: 'hover:shadow-card-hover hover:scale-[1.02] cursor-pointer',
    };
    
    const paddings = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
