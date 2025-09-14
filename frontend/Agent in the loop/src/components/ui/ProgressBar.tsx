import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '~/utils/cn';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  progress: number; // 0-100
  variant?: 'default' | 'success' | 'error';
  size?: 'sm' | 'md';
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, progress, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles = 'w-full bg-text-muted/20 rounded-full overflow-hidden';
    
    const variants = {
      default: 'bg-cyan-violet',
      success: 'bg-verified',
      error: 'bg-fail-rose',
    };
    
    const sizes = {
      sm: 'h-1',
      md: 'h-2',
    };

    const clampedProgress = Math.max(0, Math.min(100, progress));

    return (
      <div
        className={cn(
          baseStyles,
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            variants[variant]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
