/**
 * MessageFeedback Component
 *
 * Thumbs up/down feedback buttons for assistant messages.
 * Per 00-overview.md: "Typing indicators and status feedback"
 * Allows users to rate AI responses for quality tracking.
 */

import React, { useState, useCallback } from 'react';

export type FeedbackType = 'positive' | 'negative' | null;

export interface MessageFeedbackProps {
  /** Message ID for tracking */
  messageId: string;
  /** Session ID for API calls */
  sessionId?: string;
  /** Current feedback state */
  feedback?: FeedbackType;
  /** Callback when feedback is submitted */
  onFeedback?: (messageId: string, feedback: FeedbackType) => void;
  /** Show feedback only on hover */
  showOnHover?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Hook for managing message feedback state
 */
export function useMessageFeedback(
  onSubmit?: (messageId: string, feedback: FeedbackType) => Promise<void>
) {
  const [feedbackState, setFeedbackState] = useState<Record<string, FeedbackType>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const submitFeedback = useCallback(async (messageId: string, feedback: FeedbackType) => {
    setSubmitting(prev => ({ ...prev, [messageId]: true }));

    try {
      if (onSubmit) {
        await onSubmit(messageId, feedback);
      }
      setFeedbackState(prev => ({ ...prev, [messageId]: feedback }));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmitting(prev => ({ ...prev, [messageId]: false }));
    }
  }, [onSubmit]);

  const getFeedback = useCallback((messageId: string) => {
    return feedbackState[messageId] ?? null;
  }, [feedbackState]);

  const isSubmitting = useCallback((messageId: string) => {
    return submitting[messageId] ?? false;
  }, [submitting]);

  return {
    submitFeedback,
    getFeedback,
    isSubmitting,
    feedbackState,
  };
}

/**
 * MessageFeedback component for rating AI responses
 */
export function MessageFeedback({
  messageId,
  sessionId,
  feedback: initialFeedback,
  onFeedback,
  showOnHover = true,
  disabled = false,
  className = '',
}: MessageFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackType>(initialFeedback ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: FeedbackType) => {
    if (disabled || isSubmitting) return;

    // Toggle off if clicking the same feedback
    const newFeedback = feedback === type ? null : type;

    setIsSubmitting(true);
    setFeedback(newFeedback);

    try {
      if (onFeedback) {
        onFeedback(messageId, newFeedback);
      }

      // Send to API if sessionId is provided
      if (sessionId && window.n8nChatConfig?.apiBase) {
        await fetch(`${window.n8nChatConfig.apiBase}/n8n-chat/v1/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.n8nChatConfig?.nonce || '',
          },
          body: JSON.stringify({
            session_id: sessionId,
            message_id: messageId,
            feedback: newFeedback,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Revert on error
      setFeedback(initialFeedback ?? null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const classes = [
    'n8n-chat-message-feedback',
    showOnHover ? 'n8n-chat-feedback-hover' : '',
    disabled ? 'n8n-chat-feedback-disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <button
        type="button"
        className={`n8n-chat-feedback-button n8n-chat-feedback-positive ${feedback === 'positive' ? 'n8n-chat-feedback-active' : ''}`}
        onClick={() => handleFeedback('positive')}
        disabled={disabled || isSubmitting}
        aria-label="Helpful response"
        title="This response was helpful"
      >
        <ThumbsUpIcon />
      </button>
      <button
        type="button"
        className={`n8n-chat-feedback-button n8n-chat-feedback-negative ${feedback === 'negative' ? 'n8n-chat-feedback-active' : ''}`}
        onClick={() => handleFeedback('negative')}
        disabled={disabled || isSubmitting}
        aria-label="Unhelpful response"
        title="This response was not helpful"
      >
        <ThumbsDownIcon />
      </button>
    </div>
  );
}

/**
 * Thumbs Up Icon
 */
function ThumbsUpIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

/**
 * Thumbs Down Icon
 */
function ThumbsDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

export default MessageFeedback;
