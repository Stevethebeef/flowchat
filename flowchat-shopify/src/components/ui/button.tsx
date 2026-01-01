import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'fc-inline-flex fc-items-center fc-justify-center fc-gap-2 fc-whitespace-nowrap fc-rounded-md fc-text-sm fc-font-medium fc-transition-colors focus-visible:fc-outline-none focus-visible:fc-ring-1 focus-visible:fc-ring-ring disabled:fc-pointer-events-none disabled:fc-opacity-50 [&_svg]:fc-pointer-events-none [&_svg]:fc-size-4 [&_svg]:fc-shrink-0',
  {
    variants: {
      variant: {
        default: 'fc-bg-primary fc-text-primary-foreground fc-shadow hover:fc-bg-primary/90',
        destructive: 'fc-bg-destructive fc-text-destructive-foreground fc-shadow-sm hover:fc-bg-destructive/90',
        outline: 'fc-border fc-border-border fc-bg-background fc-shadow-sm hover:fc-bg-accent hover:fc-text-accent-foreground',
        secondary: 'fc-bg-muted fc-text-muted-foreground fc-shadow-sm hover:fc-bg-muted/80',
        ghost: 'hover:fc-bg-accent hover:fc-text-accent-foreground',
        link: 'fc-text-primary fc-underline-offset-4 hover:fc-underline',
      },
      size: {
        default: 'fc-h-9 fc-px-4 fc-py-2',
        sm: 'fc-h-8 fc-rounded-md fc-px-3 fc-text-xs',
        lg: 'fc-h-10 fc-rounded-md fc-px-8',
        icon: 'fc-h-9 fc-w-9',
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
