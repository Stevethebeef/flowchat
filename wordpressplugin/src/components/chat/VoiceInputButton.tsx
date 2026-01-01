/**
 * VoiceInputButton Component
 *
 * Button for voice input with visual feedback.
 */

import React from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useFrontendI18n } from '../../hooks/useFrontendI18n';

export interface VoiceInputButtonProps {
  /** Callback when final transcript is ready */
  onTranscript: (text: string) => void;
  /** Language for speech recognition */
  language?: string;
  /** Whether voice input is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Voice input button with microphone icon
 */
export function VoiceInputButton({
  onTranscript,
  language,
  disabled = false,
  className = '',
}: VoiceInputButtonProps) {
  const { t } = useFrontendI18n();
  const {
    isSupported,
    isListening,
    transcript,
    error,
    toggleListening,
    clearTranscript,
  } = useVoiceInput({
    language,
    continuous: false,
    interimResults: true,
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        onTranscript(text.trim());
        clearTranscript();
      }
    },
  });

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (!disabled) {
      toggleListening();
    }
  };

  const buttonClasses = [
    'n8n-chat-voice-button',
    isListening ? 'n8n-chat-voice-listening' : '',
    disabled ? 'n8n-chat-voice-disabled' : '',
    error ? 'n8n-chat-voice-error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="n8n-chat-voice-input">
      <button
        type="button"
        className={buttonClasses}
        onClick={handleClick}
        disabled={disabled}
        aria-label={isListening ? t('voiceStopListening', 'Stop listening') : t('voiceStartInput', 'Start voice input')}
        title={error || (isListening ? t('voiceListening', 'Listening... Click to stop') : t('voiceClickToSpeak', 'Click to speak'))}
      >
        {isListening ? (
          // Listening icon (animated)
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="n8n-chat-voice-icon n8n-chat-voice-icon-listening"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
            {/* Animated waves */}
            <circle cx="12" cy="12" r="10" className="n8n-chat-voice-wave" />
          </svg>
        ) : (
          // Microphone icon
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
            className="n8n-chat-voice-icon"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
          </svg>
        )}
      </button>

      {/* Interim transcript display */}
      {isListening && transcript && (
        <div className="n8n-chat-voice-transcript" aria-live="polite">
          {transcript}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="n8n-chat-voice-error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default VoiceInputButton;
