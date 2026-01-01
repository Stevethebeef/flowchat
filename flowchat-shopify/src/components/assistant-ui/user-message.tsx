import { MessagePrimitive } from '@assistant-ui/react';
import { cn } from '@/lib/utils';

export function UserMessage() {
  return (
    <MessagePrimitive.Root className="fc-flex fc-flex-row-reverse fc-gap-3 fc-max-w-[85%] fc-ml-auto fc-mb-4">
      <div className="fc-flex fc-flex-col fc-items-end fc-gap-1">
        <div
          className={cn(
            'fc-px-4 fc-py-2.5 fc-rounded-2xl fc-rounded-br-sm',
            'fc-bg-primary fc-text-primary-foreground',
            'fc-text-sm fc-leading-relaxed'
          )}
        >
          <MessagePrimitive.Content />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}
