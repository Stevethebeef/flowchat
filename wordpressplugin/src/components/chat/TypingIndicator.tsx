/**
 * TypingIndicator Component
 *
 * Shows animated dots while the assistant is generating a response.
 */

import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="n8n-chat-typing-indicator">
      <div className="n8n-chat-typing-dots">
        <span className="n8n-chat-typing-dot" />
        <span className="n8n-chat-typing-dot" />
        <span className="n8n-chat-typing-dot" />
      </div>
    </div>
  );
};

export default TypingIndicator;
