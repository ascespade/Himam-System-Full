import { ButtonHTMLAttributes, forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@/shared/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', href, children, ...props }, ref) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
      variant === 'primary' && 'bg-primary text-white hover:bg-primary-hover',
      variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      variant === 'outline' && 'border-2 border-primary text-primary hover:bg-primary/10',
      variant === 'ghost' && 'text-foreground hover:bg-muted',
      size === 'sm' && 'px-4 py-2 text-sm',
      size === 'md' && 'px-6 py-3 text-base',
      size === 'lg' && 'px-8 py-4 text-lg',
      className
    )

    if (href) {
      return (
        <Link href={href} className={baseClasses}>
          {children}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        className={baseClasses}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
