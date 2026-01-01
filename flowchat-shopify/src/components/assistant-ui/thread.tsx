import { forwardRef } from 'react';
import { ThreadPrimitive } from '@assistant-ui/react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThreadWelcome } from './thread-welcome';
import { UserMessage } from './user-message';
import { AssistantMessage } from './assistant-message';
import { Composer } from './composer';

export const Thread = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    return (
      <ThreadPrimitive.Root
        ref={ref}
        className={cn(
          'fc-flex fc-flex-col fc-h-full fc-bg-background',
          className
        )}
      >
        <ThreadPrimitive.Empty>
          <ThreadWelcome />
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Viewport asChild>
          <ScrollArea className="fc-flex-1 fc-px-4">
            <div className="fc-py-4">
              <ThreadPrimitive.Messages
                components={{
                  UserMessage,
                  AssistantMessage,
                }}
              />
            </div>
          </ScrollArea>
        </ThreadPrimitive.Viewport>

        <Composer />
      </ThreadPrimitive.Root>
    );
  }
);
Thread.displayName = 'Thread';
