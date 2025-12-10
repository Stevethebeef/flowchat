/**
 * TypingIndicator Component
 *
 * Shows animated dots while the assistant is generating a response.
 */

import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flowchat-typing-indicator">
      <div className="flowchat-typing-dots">
        <span className="flowchat-typing-dot" />
        <span className="flowchat-typing-dot" />
        <span className="flowchat-typing-dot" />
      </div>
    </div>
  );
};

export default TypingIndicator;
