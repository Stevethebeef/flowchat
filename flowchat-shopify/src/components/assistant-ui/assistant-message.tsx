import { MessagePrimitive } from '@assistant-ui/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownText } from './markdown-text';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="fc-flex fc-gap-3 fc-max-w-[85%] fc-mr-auto fc-mb-4">
      <Avatar className="fc-h-8 fc-w-8 fc-flex-shrink-0">
        <AvatarFallback className="fc-bg-primary/10 fc-text-primary">
          <Sparkles className="fc-h-4 fc-w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="fc-flex fc-flex-col fc-gap-1">
        <div
          className={cn(
            'fc-px-4 fc-py-2.5 fc-rounded-2xl fc-rounded-bl-sm',
            'fc-bg-muted fc-text-foreground',
            'fc-text-sm fc-leading-relaxed'
          )}
        >
          <MessagePrimitive.Content
            components={{
              Text: ({ text }: { text: string }) => <MarkdownText text={text} />,
            }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}
