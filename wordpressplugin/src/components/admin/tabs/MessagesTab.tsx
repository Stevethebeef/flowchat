/**
 * MessagesTab Component
 *
 * Welcome screen, placeholder, and error message settings.
 */

import React, { useState } from 'react';
import type { AdminInstance } from '../../../types';
import { useAdminI18n } from '../../../hooks/useAdminI18n';
import { InfoIcon } from '../shared/InfoIcon';
import { useFeatureFlags } from '../../../context/FeatureFlagsContext';
import { PremiumFeature } from '../shared/PremiumFeature';
import { ProBadge } from '../shared/ProBadge';

/**
 * Format bytes to human-readable file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / 1048576)} MB`;
}

interface MessagesTabProps {
  instance: Partial<AdminInstance>;
  updateField: (path: string, value: unknown) => void;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  instance,
  updateField,
}) => {
  const { t } = useAdminI18n();
  const { hasFeature } = useFeatureFlags();
  const [showErrorMessages, setShowErrorMessages] = useState(false);

  const messages = instance.messages || {};
  const suggestedPrompts = instance.suggestedPrompts || [];

  // Premium feature checks
  const hasFileUpload = hasFeature('fileUpload');
  const hasVoiceInput = hasFeature('voiceInput');

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
    <div className="n8n-chat-tab-content">
      {/* Welcome Screen */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">Welcome Screen</h2>

        <div className="n8n-chat-field">
          <label className="n8n-chat-checkbox">
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
            <div className="n8n-chat-field">
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
            <div className="n8n-chat-field">
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
            <div className="n8n-chat-field">
              <label>
                Quick Suggestions
                <span className="n8n-chat-field-note">(max 4)</span>
              </label>
              <div className="n8n-chat-suggestions-list">
                {suggestedPrompts.map((suggestion, index) => (
                  <div key={index} className="n8n-chat-suggestion-item">
                    <input
                      type="text"
                      value={suggestion}
                      onChange={(e) => handleSuggestionChange(index, e.target.value)}
                      className="regular-text"
                      placeholder={`Suggestion ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="button-link n8n-chat-remove-btn"
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
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">Chat Input</h2>

        <div className="n8n-chat-field">
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
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">UI Options</h2>

        <div className="n8n-chat-field">
          <label className="n8n-chat-checkbox">
            <input
              type="checkbox"
              checked={instance.showHeader !== false}
              onChange={(e) => updateField('showHeader', e.target.checked)}
            />
            <span>Show chat header</span>
          </label>
        </div>

        <div className="n8n-chat-field">
          <label className="n8n-chat-checkbox">
            <input
              type="checkbox"
              checked={instance.showTimestamp || false}
              onChange={(e) => updateField('showTimestamp', e.target.checked)}
            />
            <span>Show message timestamps</span>
          </label>
        </div>

        <div className="n8n-chat-field">
          <label className="n8n-chat-checkbox">
            <input
              type="checkbox"
              checked={instance.showAvatar !== false}
              onChange={(e) => updateField('showAvatar', e.target.checked)}
            />
            <span>Show bot avatar</span>
          </label>
        </div>

        <div className="n8n-chat-field">
          <label className="n8n-chat-checkbox">
            <input
              type="checkbox"
              checked={instance.features?.showTypingIndicator !== false}
              onChange={(e) => updateField('features.showTypingIndicator', e.target.checked)}
            />
            <span>Show typing indicator</span>
          </label>
        </div>
      </div>

      {/* Input Features */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">{t('inputFeatures', 'Input Features')}</h2>

        {/* Voice Input */}
        <PremiumFeature feature="voiceInput" featureName="Voice Input" mode="disabled">
          <div className="n8n-chat-field">
            <label className="n8n-chat-checkbox">
              <input
                type="checkbox"
                checked={instance.features?.voiceInput !== false}
                onChange={(e) => hasVoiceInput && updateField('features.voiceInput', e.target.checked)}
                disabled={!hasVoiceInput}
              />
              <span>
                {t('enableVoiceInput', 'Enable voice input')}
                {!hasVoiceInput && <ProBadge variant="inline" />}
              </span>
              <InfoIcon tooltip={t('tooltipVoiceInput', 'Uses Web Speech API. Supported in Chrome, Edge, and Safari. Firefox has limited support.')} />
            </label>
            <p className="description">
              {t('voiceInputDesc', 'Allow users to dictate messages using their microphone.')}
            </p>
          </div>
        </PremiumFeature>

        {/* File Upload */}
        <PremiumFeature feature="fileUpload" featureName="File Uploads" mode="disabled">
          <div className="n8n-chat-field">
            <label className="n8n-chat-checkbox">
              <input
                type="checkbox"
                checked={instance.features?.fileUpload || false}
                onChange={(e) => hasFileUpload && updateField('features.fileUpload', e.target.checked)}
                disabled={!hasFileUpload}
              />
              <span>
                {t('enableFileUploads', 'Enable file uploads')}
                {!hasFileUpload && <ProBadge variant="inline" />}
              </span>
              <InfoIcon tooltip={t('tooltipFileUpload', 'Files are uploaded to wp-content/uploads/n8n-chat/temp/ and auto-deleted after 24 hours.')} />
            </label>
            <p className="description">
              {t('fileUploadsDesc', 'Allow users to attach files and images to their messages.')}
            </p>
          </div>
        </PremiumFeature>

        {instance.features?.fileUpload && hasFileUpload && (
          <div className="n8n-chat-subsection">
            {/* Allowed File Types */}
            <div className="n8n-chat-field">
              <label>Allowed File Types</label>
              <div className="n8n-chat-file-types-grid">
                <label className="n8n-chat-checkbox">
                  <input
                    type="checkbox"
                    checked={instance.features?.fileTypes?.includes('image/jpeg') || false}
                    onChange={(e) => {
                      const types = instance.features?.fileTypes || [];
                      if (e.target.checked) {
                        updateField('features.fileTypes', [...types, 'image/jpeg']);
                      } else {
                        updateField('features.fileTypes', types.filter((t: string) => t !== 'image/jpeg'));
                      }
                    }}
                  />
                  <span>JPEG Images</span>
                </label>
                <label className="n8n-chat-checkbox">
                  <input
                    type="checkbox"
                    checked={instance.features?.fileTypes?.includes('image/png') || false}
                    onChange={(e) => {
                      const types = instance.features?.fileTypes || [];
                      if (e.target.checked) {
                        updateField('features.fileTypes', [...types, 'image/png']);
                      } else {
                        updateField('features.fileTypes', types.filter((t: string) => t !== 'image/png'));
                      }
                    }}
                  />
                  <span>PNG Images</span>
                </label>
                <label className="n8n-chat-checkbox">
                  <input
                    type="checkbox"
                    checked={instance.features?.fileTypes?.includes('image/gif') || false}
                    onChange={(e) => {
                      const types = instance.features?.fileTypes || [];
                      if (e.target.checked) {
                        updateField('features.fileTypes', [...types, 'image/gif']);
                      } else {
                        updateField('features.fileTypes', types.filter((t: string) => t !== 'image/gif'));
                      }
                    }}
                  />
                  <span>GIF Images</span>
                </label>
                <label className="n8n-chat-checkbox">
                  <input
                    type="checkbox"
                    checked={instance.features?.fileTypes?.includes('image/webp') || false}
                    onChange={(e) => {
                      const types = instance.features?.fileTypes || [];
                      if (e.target.checked) {
                        updateField('features.fileTypes', [...types, 'image/webp']);
                      } else {
                        updateField('features.fileTypes', types.filter((t: string) => t !== 'image/webp'));
                      }
                    }}
                  />
                  <span>WebP Images</span>
                </label>
                <label className="n8n-chat-checkbox">
                  <input
                    type="checkbox"
                    checked={instance.features?.fileTypes?.includes('application/pdf') || false}
                    onChange={(e) => {
                      const types = instance.features?.fileTypes || [];
                      if (e.target.checked) {
                        updateField('features.fileTypes', [...types, 'application/pdf']);
                      } else {
                        updateField('features.fileTypes', types.filter((t: string) => t !== 'application/pdf'));
                      }
                    }}
                  />
                  <span>PDF Documents</span>
                </label>
                <label className="n8n-chat-checkbox">
                  <input
                    type="checkbox"
                    checked={instance.features?.fileTypes?.includes('text/plain') || false}
                    onChange={(e) => {
                      const types = instance.features?.fileTypes || [];
                      if (e.target.checked) {
                        updateField('features.fileTypes', [...types, 'text/plain']);
                      } else {
                        updateField('features.fileTypes', types.filter((t: string) => t !== 'text/plain'));
                      }
                    }}
                  />
                  <span>Text Files</span>
                </label>
              </div>
            </div>

            {/* Max File Size */}
            <div className="n8n-chat-field">
              <label htmlFor="fc-max-file-size">
                Maximum File Size
                <span className="n8n-chat-field-value">
                  {formatFileSize(instance.features?.maxFileSize || 10485760)}
                </span>
              </label>
              <input
                type="range"
                id="fc-max-file-size"
                min={1048576}
                max={52428800}
                step={1048576}
                value={instance.features?.maxFileSize || 10485760}
                onChange={(e) => updateField('features.maxFileSize', parseInt(e.target.value, 10))}
                className="n8n-chat-slider"
              />
              <div className="n8n-chat-slider-labels">
                <span>1 MB</span>
                <span>50 MB</span>
              </div>
              <p className="description">
                Maximum size for uploaded files. Larger files will be rejected.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      <div className="n8n-chat-section">
        <button
          type="button"
          className="n8n-chat-toggle-advanced"
          onClick={() => setShowErrorMessages(!showErrorMessages)}
          aria-expanded={showErrorMessages}
        >
          <span className={`dashicons ${showErrorMessages ? 'dashicons-arrow-down-alt2' : 'dashicons-arrow-right-alt2'}`}></span>
          {showErrorMessages ? 'Hide' : 'Show'} Error Messages
        </button>

        {showErrorMessages && (
          <div className="n8n-chat-advanced-content">
            <p className="n8n-chat-section-description">
              Customize the error messages shown to users when something goes wrong.
            </p>

            {/* Connection Error */}
            <div className="n8n-chat-field">
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
            <div className="n8n-chat-field">
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
            <div className="n8n-chat-field">
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
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">Offline Fallback</h2>

        <div className="n8n-chat-field">
          <label className="n8n-chat-checkbox">
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
            <div className="n8n-chat-field">
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

            <div className="n8n-chat-field">
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
