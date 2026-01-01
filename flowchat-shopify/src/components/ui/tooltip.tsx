import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'fc-z-50 fc-overflow-hidden fc-rounded-md fc-bg-primary fc-px-3 fc-py-1.5 fc-text-xs fc-text-primary-foreground fc-animate-in fc-fade-in-0 fc-zoom-in-95 data-[state=closed]:fc-animate-out data-[state=closed]:fc-fade-out-0 data-[state=closed]:fc-zoom-out-95 data-[side=bottom]:fc-slide-in-from-top-2 data-[side=left]:fc-slide-in-from-right-2 data-[side=right]:fc-slide-in-from-left-2 data-[side=top]:fc-slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
