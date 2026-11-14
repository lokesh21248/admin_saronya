import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3473]/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[#0B3473] text-white hover:bg-[#082654] shadow-sm',
        secondary: 'bg-[#1455A0] text-white hover:bg-[#0f407a] shadow-sm',
        gold: 'bg-[#F5BD24] text-[#172033] font-semibold hover:bg-[#e0ab1f] shadow-sm',
        destructive: 'bg-[#DC2626] text-white hover:bg-[#b91c1c] shadow-sm',
        outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-[#172033]',
        ghost: 'hover:bg-slate-100 text-[#172033]',
        link: 'text-[#0B3473] underline-offset-4 hover:underline',
        success: 'bg-[#16A36A] text-white hover:bg-[#138355] shadow-sm',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

