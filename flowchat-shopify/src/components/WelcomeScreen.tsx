/**
 * Welcome Screen Component
 * Displays welcome message and suggested prompts using Assistant UI primitives
 */

import { ThreadPrimitive } from '@assistant-ui/react';
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  message: string;
  prompts: string[];
}

export function WelcomeScreen({ message, prompts }: WelcomeScreenProps) {
  return (
    <div className="fc-welcome-screen">
      <div className="fc-welcome-icon">
        <Sparkles size={32} />
      </div>

      <p className="fc-welcome-message">{message}</p>

      {prompts.length > 0 && (
        <div className="fc-suggested-prompts">
          {prompts.map((prompt, index) => (
            <ThreadPrimitive.Suggestion
              key={index}
              prompt={prompt}
              method="replace"
              autoSend
              asChild
            >
              <button className="fc-prompt-btn">
                {prompt}
              </button>
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      )}
    </div>
  );
}
