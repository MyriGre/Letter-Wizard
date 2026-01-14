// AI-AGENT-HEADER
// path: /src/components/ui/button.tsx
// summary: Shadcn-style button component with variants for primary/ghost/outline.
// last-reviewed: 2025-12-08
// line-range: 1-160

import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white hover:bg-slate-800 ring-slate-900',
        secondary: 'bg-white text-slate-900 border border-slate-900 hover:bg-slate-50 ring-slate-900',
        outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 ring-slate-300',
        ghost: 'text-slate-700 hover:bg-slate-100 ring-slate-300',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    children: ReactNode;
  };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
