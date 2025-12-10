/**
 * MessagesTab Component
 *
 * Welcome screen, placeholder, and error message settings.
 */

import React, { useState } from 'react';
import type { AdminInstance } from '../../../types';

interface MessagesTabProps {
  instance: Partial<AdminInstance>;
  updateField: (path: string, value: unknown) => void;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  instance,
  updateField,
}) => {
  const [showErrorMessages, setShowErrorMessages] = useState(false);

  const messages = instance.messages || {};
  const suggestedPrompts = instance.suggestedPrompts || [];

  const handleSuggestionChange = (index: number, value: string) => {
    const newPrompts = [...suggestedPrompts];
    newPrompts[index] = value;
    updateField('suggestedPrompts', newPrompts);
  };

  const addSuggestion = () => {
    if (suggestedPrompts.length < 4) {
      updateField('suggestedPrompts', [...suggestedPrompts, '']);
    }
  };

  const removeSuggestion = (index: number) => {
    const newPrompts = suggestedPrompts.filter((_, i) => i !== index);
    updateField('suggestedPrompts', newPrompts);
  };

  return (
    <div className="flowchat-tab-content">
      {/* Welcome Screen */}
      <div className="flowchat-section">
        <h2 className="flowchat-section-title">Welcome Screen</h2>

        <div className="flowchat-field">
          <label className="flowchat-checkbox">
            <input
              type="checkbox"
              checked={messages.showWelcomeScreen !== false}
              onChange={(e) => updateField('messages.showWelcomeScreen', e.target.checked)}
            />
            <span>Show welcome screen on first open</span>
          </label>
          <p className="description">
            Display a greeting screen before the chat conversation starts.
          </p>
        </div>

        {messages.showWelcomeScreen !== false && (
          <>
            {/* Chat Title */}
            <div className="flowchat-field">
              <label htmlFor="fc-chat-title">Chat Title</label>
              <input
                type="text"
                id="fc-chat-title"
                value={instance.chatTitle || ''}
                onChange={(e) => updateField('chatTitle', e.target.value)}
                className="regular-text"
                placeholder="e.g., How can we help?"
              />
              <p className="description">
                Title shown at the top of the chat window.
              </p>
            </div>

            {/* Welcome Message */}
            <div className="flowchat-field">
              <label htmlFor="fc-welcome-message">Welcome Message</label>
              <textarea
                id="fc-welcome-message"
                value={instance.welcomeMessage || ''}
                onChange={(e) => updateField('welcomeMessage', e.target.value)}
                rows={3}
                className="large-text"
                placeholder="Hi! 👋 How can I help you today?"
              />
              <p className="description">
                The initial greeting message shown to users.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div className="flowchat-field">
              <label>
                Quick Suggestions
                <span className="flowchat-field-note">(max 4)</span>
              </label>
              <div className="flowchat-suggestions-list">
                {suggestedPrompts.map((suggestion, index) => (
                  <div key={index} className="flowchat-suggestion-item">
                    <input
                      type="text"
                      value={suggestion}
                      onChange={(e) => handleSuggestionChange(index, e.target.value)}
                      className="regular-text"
                      placeholder={`Suggestion ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="button-link flowchat-remove-btn"
                      onClick={() => removeSuggestion(index)}
                      aria-label="Remove suggestion"
                    >
                      <span className="dashicons dashicons-no-alt"></span>
                    </button>
                  </div>
                ))}
                {suggestedPrompts.length < 4 && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={addSuggestion}
                  >
                    <span className="dashicons dashicons-plus-alt2"></span>
                    Add Suggestion
                  </button>
                )}
              </div>
              <p className="description">
                Quick prompts users can click to start a conversation.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Input Placeholder */}
      <div className="flowchat-section">
        <h2 className="flowchat-section-title">Chat Input</h2>

        <div className="flowchat-field">
          <label htmlFor="fc-placeholder">Input Placeholder</label>
          <input
            type="text"
            id="fc-placeholder"
            value={instance.placeholderText || ''}
            onChange={(e) => updateField('placeholderText', e.target.value)}
            className="regular-text"
            placeholder="Type your message..."
          />
          <p className="description">
            Placeholder text shown in the message input field.
          </p>
        </div>
      </div>

      {/* UI Options */}
      <div className="flowchat-section">
        <h2 className="flowchat-section-title">UI Options</h2>

        <div className="flowchat-field">
          <label className="flowchat-checkbox">
            <input
              type="checkbox"
              checked={instance.showHeader !== false}
              onChange={(e) => updateField('showHeader', e.target.checked)}
            />
            <span>Show chat header</span>
          </label>
        </div>

        <div className="flowchat-field">
          <label className="flowchat-checkbox">
            <input
              type="checkbox"
              checked={instance.showTimestamp || false}
              onChange={(e) => updateField('showTimestamp', e.target.checked)}
            />
            <span>Show message timestamps</span>
          </label>
        </div>

        <div className="flowchat-field">
          <label className="flowchat-checkbox">
            <input
              type="checkbox"
              checked={instance.showAvatar !== false}
              onChange={(e) => updateField('showAvatar', e.target.checked)}
            />
            <span>Show bot avatar</span>
          </label>
        </div>

        <div className="flowchat-field">
          <label className="flowchat-checkbox">
            <input
              type="checkbox"
              checked={instance.features?.showTypingIndicator !== false}
              onChange={(e) => updateField('features.showTypingIndicator', e.target.checked)}
            />
            <span>Show typing indicator</span>
          </label>
        </div>
      </div>

      {/* Error Messages */}
      <div className="flowchat-section">
        <button
          type="button"
          className="flowchat-toggle-advanced"
          onClick={() => setShowErrorMessages(!showErrorMessages)}
          aria-expanded={showErrorMessages}
        >
          <span className={`dashicons ${showErrorMessages ? 'dashicons-arrow-down-alt2' : 'dashicons-arrow-right-alt2'}`}></span>
          {showErrorMessages ? 'Hide' : 'Show'} Error Messages
        </button>

        {showErrorMessages && (
          <div className="flowchat-advanced-content">
            <p className="flowchat-section-description">
              Customize the error messages shown to users when something goes wrong.
            </p>

            {/* Connection Error */}
            <div className="flowchat-field">
              <label htmlFor="fc-error-connection">Connection Error</label>
              <textarea
                id="fc-error-connection"
                value={messages.connectionError || ''}
                onChange={(e) => updateField('messages.connectionError', e.target.value)}
                rows={2}
                className="large-text"
                placeholder="Sorry, I'm having trouble connecting. Please try again in a moment."
              />
            </div>

            {/* Timeout Error */}
            <div className="flowchat-field">
              <label htmlFor="fc-error-timeout">Timeout Error</label>
              <textarea
                id="fc-error-timeout"
                value={messages.timeoutError || ''}
                onChange={(e) => updateField('messages.timeoutError', e.target.value)}
                rows={2}
                className="large-text"
                placeholder="The request took too long. Please try again."
              />
            </div>

            {/* Rate Limit Error */}
            <div className="flowchat-field">
              <label htmlFor="fc-error-rate-limit">Rate Limit Error</label>
              <textarea
                id="fc-error-rate-limit"
                value={messages.rateLimitError || ''}
                onChange={(e) => updateField('messages.rateLimitError', e.target.value)}
                rows={2}
                className="large-text"
                placeholder="You're sending messages too quickly. Please wait a moment."
              />
            </div>
          </div>
        )}
      </div>

      {/* Fallback Settings */}
      <div className="flowchat-section">
        <h2 className="flowchat-section-title">Offline Fallback</h2>

        <div className="flowchat-field">
          <label className="flowchat-checkbox">
            <input
              type="checkbox"
              checked={instance.fallback?.enabled !== false}
              onChange={(e) => updateField('fallback.enabled', e.target.checked)}
            />
            <span>Enable fallback contact form</span>
          </label>
          <p className="description">
            Show a contact form when the chat is unavailable.
          </p>
        </div>

        {instance.fallback?.enabled !== false && (
          <>
            <div className="flowchat-field">
              <label htmlFor="fc-fallback-email">Notification Email</label>
              <input
                type="email"
                id="fc-fallback-email"
                value={instance.fallback?.email || ''}
                onChange={(e) => updateField('fallback.email', e.target.value)}
                className="regular-text"
                placeholder="support@example.com"
              />
              <p className="description">
                Email address to receive fallback form submissions.
              </p>
            </div>

            <div className="flowchat-field">
              <label htmlFor="fc-fallback-message">Fallback Message</label>
              <textarea
                id="fc-fallback-message"
                value={instance.fallback?.message || ''}
                onChange={(e) => updateField('fallback.message', e.target.value)}
                rows={2}
                className="large-text"
                placeholder="Our chat is temporarily unavailable. Please leave a message."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
