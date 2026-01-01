import { ThreadPrimitive } from '@assistant-ui/react';
import { MessageCircle } from 'lucide-react';

interface ThreadWelcomeProps {
  title?: string;
  message?: string;
  suggestions?: string[];
}

export function ThreadWelcome({
  title = 'How can we help?',
  message = "Ask us anything about our products, orders, or policies. We're here to help!",
  suggestions = [],
}: ThreadWelcomeProps) {
  return (
    <div className="fc-flex fc-flex-col fc-items-center fc-justify-center fc-h-full fc-px-6 fc-py-8 fc-text-center">
      <div className="fc-w-16 fc-h-16 fc-rounded-full fc-bg-primary/10 fc-flex fc-items-center fc-justify-center fc-mb-4">
        <MessageCircle className="fc-w-8 fc-h-8 fc-text-primary" />
      </div>

      <h2 className="fc-text-xl fc-font-semibold fc-text-foreground fc-mb-2">
        {title}
      </h2>

      <p className="fc-text-sm fc-text-muted-foreground fc-mb-6 fc-max-w-xs">
        {message}
      </p>

      {suggestions.length > 0 && (
        <div className="fc-flex fc-flex-col fc-gap-2 fc-w-full fc-max-w-xs">
          {suggestions.map((suggestion, index) => (
            <ThreadPrimitive.Suggestion
              key={index}
              prompt={suggestion}
              autoSend
              className="fc-px-4 fc-py-2 fc-text-sm fc-text-left fc-bg-muted hover:fc-bg-muted/80 fc-rounded-lg fc-transition-colors fc-cursor-pointer"
            >
              {suggestion}
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      )}
    </div>
  );
}
