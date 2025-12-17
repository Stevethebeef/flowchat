/**
 * Fallback Contact Form Component for n8n Chat
 *
 * Displayed when n8n webhook is unavailable.
 */

import React, { useState } from 'react';

interface FallbackFormConfig {
  title: string;
  message: string;
  fields: string[];
  requireEmail: boolean;
  successMessage: string;
}

interface FallbackFormProps {
  config: FallbackFormConfig;
  instanceId: number;
  onSubmit: (data: FormData) => Promise<{ success: boolean; message?: string; error?: string }>;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export const FallbackForm: React.FC<FallbackFormProps> = ({
  config,
  instanceId,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const result = await onSubmit(formData);

      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to send message. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  const showField = (field: string): boolean => config.fields.includes(field);

  if (status === 'success') {
    return (
      <div className={`n8n-chat-fallback-form n8n-chat-fallback-form--success ${className}`}>
        <div className="n8n-chat-fallback-form__success">
          <div className="n8n-chat-fallback-form__success-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="n8n-chat-fallback-form__success-title">Message Sent!</h3>
          <p className="n8n-chat-fallback-form__success-message">{config.successMessage}</p>
          {onCancel && (
            <button
              className="n8n-chat-fallback-form__button n8n-chat-fallback-form__button--text"
              onClick={onCancel}
              type="button"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`n8n-chat-fallback-form ${className}`}>
      <div className="n8n-chat-fallback-form__header">
        <h3 className="n8n-chat-fallback-form__title">{config.title}</h3>
        <p className="n8n-chat-fallback-form__message">{config.message}</p>
      </div>

      <form className="n8n-chat-fallback-form__form" onSubmit={handleSubmit}>
        {showField('name') && (
          <div className="n8n-chat-fallback-form__field">
            <label htmlFor={`n8n-chat-fallback-name-${instanceId}`}>Name</label>
            <input
              type="text"
              id={`n8n-chat-fallback-name-${instanceId}`}
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              disabled={status === 'submitting'}
            />
          </div>
        )}

        {showField('email') && (
          <div className="n8n-chat-fallback-form__field">
            <label htmlFor={`n8n-chat-fallback-email-${instanceId}`}>
              Email {config.requireEmail && <span className="required">*</span>}
            </label>
            <input
              type="email"
              id={`n8n-chat-fallback-email-${instanceId}`}
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required={config.requireEmail}
              disabled={status === 'submitting'}
            />
          </div>
        )}

        {showField('phone') && (
          <div className="n8n-chat-fallback-form__field">
            <label htmlFor={`n8n-chat-fallback-phone-${instanceId}`}>Phone</label>
            <input
              type="tel"
              id={`n8n-chat-fallback-phone-${instanceId}`}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Your phone number"
              disabled={status === 'submitting'}
            />
          </div>
        )}

        <div className="n8n-chat-fallback-form__field">
          <label htmlFor={`n8n-chat-fallback-message-${instanceId}`}>
            Message <span className="required">*</span>
          </label>
          <textarea
            id={`n8n-chat-fallback-message-${instanceId}`}
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="How can we help you?"
            rows={4}
            required
            disabled={status === 'submitting'}
          />
        </div>

        {status === 'error' && (
          <div className="n8n-chat-fallback-form__error" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="n8n-chat-fallback-form__actions">
          <button
            type="submit"
            className="n8n-chat-fallback-form__button n8n-chat-fallback-form__button--primary"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <LoadingSpinner />
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              className="n8n-chat-fallback-form__button n8n-chat-fallback-form__button--text"
              onClick={onCancel}
              disabled={status === 'submitting'}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <svg
    className="n8n-chat-fallback-form__spinner"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
  </svg>
);

export default FallbackForm;
