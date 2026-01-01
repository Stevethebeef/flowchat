import { ComposerPrimitive, ThreadPrimitive } from '@assistant-ui/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Send, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Composer() {
  return (
    <ComposerPrimitive.Root className="fc-flex fc-items-end fc-gap-2 fc-p-4 fc-border-t fc-border-border fc-bg-background">
      <ComposerPrimitive.Input
        autoFocus
        placeholder="Type a message..."
        className={cn(
          'fc-flex-1 fc-min-h-[40px] fc-max-h-[120px] fc-resize-none',
          'fc-rounded-2xl fc-bg-muted fc-border-0',
          'fc-px-4 fc-py-2.5 fc-text-sm',
          'placeholder:fc-text-muted-foreground',
          'focus:fc-outline-none focus:fc-ring-2 focus:fc-ring-primary/20'
        )}
        rows={1}
      />

      <TooltipProvider>
        <ThreadPrimitive.If running={false}>
          <Tooltip>
            <ComposerPrimitive.Send asChild>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className="fc-h-10 fc-w-10 fc-rounded-full fc-bg-primary hover:fc-bg-primary/90 fc-flex-shrink-0"
                >
                  <Send className="fc-h-4 fc-w-4" />
                  <span className="fc-sr-only">Send message</span>
                </Button>
              </TooltipTrigger>
            </ComposerPrimitive.Send>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </ThreadPrimitive.If>

        <ThreadPrimitive.If running>
          <Tooltip>
            <ComposerPrimitive.Cancel asChild>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="destructive"
                  className="fc-h-10 fc-w-10 fc-rounded-full fc-flex-shrink-0"
                >
                  <Square className="fc-h-4 fc-w-4" />
                  <span className="fc-sr-only">Stop generating</span>
                </Button>
              </TooltipTrigger>
            </ComposerPrimitive.Cancel>
            <TooltipContent>Stop generating</TooltipContent>
          </Tooltip>
        </ThreadPrimitive.If>
      </TooltipProvider>
    </ComposerPrimitive.Root>
  );
}
