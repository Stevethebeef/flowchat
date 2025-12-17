/**
 * ConnectionTab Component
 *
 * n8n connection settings tab for the instance editor.
 */

import React, { useState } from 'react';
import type { AdminInstance } from '../../../types';
import { useAdminI18n } from '../../../hooks/useAdminI18n';
import { InfoIcon } from '../shared/InfoIcon';

interface ConnectionTabProps {
  instance: Partial<AdminInstance>;
  updateField: (path: string, value: unknown) => void;
}

interface TestResult {
  success: boolean;
  message: string;
  statusCode?: number;
  responseTime?: number;
}

export const ConnectionTab: React.FC<ConnectionTabProps> = ({
  instance,
  updateField,
}) => {
  const { t } = useAdminI18n();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const connection = instance.connection || {};
  const authType = connection.auth || 'none';

  const handleTestConnection = async () => {
    if (!instance.webhookUrl) {
      setTestResult({
        success: false,
        message: 'Please enter a webhook URL first.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `${(window as any).n8nChatAdmin.apiUrl}/test-webhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
          },
          body: JSON.stringify({
            url: instance.webhookUrl,
            auth: connection.auth,
            username: connection.username,
            password: connection.password,
            bearerToken: connection.bearerToken,
          }),
        }
      );

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.message,
        statusCode: data.status_code,
        responseTime: data.response_time,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="n8n-chat-tab-content">
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">n8n Connection</h2>

        {/* Webhook URL */}
        <div className="n8n-chat-field">
          <label htmlFor="fc-webhook-url">
            {t('webhookUrl', 'n8n Webhook URL')} <span className="required">*</span>
            <InfoIcon tooltip={t('tooltipWebhookUrl', 'Copy this from your n8n Chat Trigger node. Open n8n → Chat Trigger node → Production URL')} />
          </label>
          <input
            type="url"
            id="fc-webhook-url"
            value={instance.webhookUrl || ''}
            onChange={(e) => updateField('webhookUrl', e.target.value)}
            className="large-text code"
            placeholder="https://your-n8n.example.com/webhook/abc123"
          />
          <p className="description">
            {t('webhookUrlDesc', 'The production webhook URL from your n8n Chat Trigger node.')}
          </p>
        </div>

        {/* Authentication */}
        <div className="n8n-chat-field">
          <label>Authentication</label>
          <div className="n8n-chat-radio-group n8n-chat-radio-group-vertical">
            <label className="n8n-chat-radio">
              <input
                type="radio"
                name="auth"
                checked={authType === 'none'}
                onChange={() => updateField('connection.auth', 'none')}
              />
              <span className="n8n-chat-radio-label">None (Public)</span>
            </label>
            <label className="n8n-chat-radio">
              <input
                type="radio"
                name="auth"
                checked={authType === 'basic'}
                onChange={() => updateField('connection.auth', 'basic')}
              />
              <span className="n8n-chat-radio-label">Basic Auth</span>
            </label>
            <label className="n8n-chat-radio">
              <input
                type="radio"
                name="auth"
                checked={authType === 'bearer'}
                onChange={() => updateField('connection.auth', 'bearer')}
              />
              <span className="n8n-chat-radio-label">Bearer Token</span>
            </label>
          </div>
        </div>

        {/* Basic Auth Fields */}
        {authType === 'basic' && (
          <div className="n8n-chat-auth-fields">
            <div className="n8n-chat-field">
              <label htmlFor="fc-auth-username">Username</label>
              <input
                type="text"
                id="fc-auth-username"
                value={connection.username || ''}
                onChange={(e) => updateField('connection.username', e.target.value)}
                className="regular-text"
              />
            </div>
            <div className="n8n-chat-field">
              <label htmlFor="fc-auth-password">Password</label>
              <div className="n8n-chat-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="fc-auth-password"
                  value={connection.password || ''}
                  onChange={(e) => updateField('connection.password', e.target.value)}
                  className="regular-text"
                />
                <button
                  type="button"
                  className="button button-small n8n-chat-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className={`dashicons ${showPassword ? 'dashicons-hidden' : 'dashicons-visibility'}`}></span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bearer Token Field */}
        {authType === 'bearer' && (
          <div className="n8n-chat-auth-fields">
            <div className="n8n-chat-field">
              <label htmlFor="fc-auth-token">Bearer Token</label>
              <div className="n8n-chat-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="fc-auth-token"
                  value={connection.bearerToken || ''}
                  onChange={(e) => updateField('connection.bearerToken', e.target.value)}
                  className="large-text code"
                  placeholder="Enter your bearer token"
                />
                <button
                  type="button"
                  className="button button-small n8n-chat-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide token' : 'Show token'}
                >
                  <span className={`dashicons ${showPassword ? 'dashicons-hidden' : 'dashicons-visibility'}`}></span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Streaming */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">{t('streaming', 'Streaming')}</h2>

        <div className="n8n-chat-field">
          <label className="n8n-chat-checkbox">
            <input
              type="checkbox"
              checked={connection.enableStreaming !== false}
              onChange={(e) => updateField('connection.enableStreaming', e.target.checked)}
            />
            <span>{t('streamResponses', 'Stream responses in real-time')}</span>
            <InfoIcon tooltip={t('tooltipStreaming', 'Enable Server-Sent Events for real-time responses. Your n8n Chat Trigger must also have streaming enabled.')} />
          </label>
          <p className="description">
            {t('streamingDesc', 'Show AI responses word-by-word as they are generated.')}
          </p>
        </div>
      </div>

      {/* Connection Test */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">{t('connectionTest', 'Connection Test')}</h2>

        <div className="n8n-chat-connection-test">
          {testResult && (
            <div className={`n8n-chat-test-result ${testResult.success ? 'is-success' : 'is-error'}`}>
              <div className="n8n-chat-test-status">
                <span className={`dashicons ${testResult.success ? 'dashicons-yes-alt' : 'dashicons-warning'}`}></span>
                <span className="n8n-chat-test-message">
                  {testResult.success ? t('connected', 'Connected') : t('connectionFailed', 'Connection Failed')}
                </span>
              </div>
              <p>{testResult.message}</p>
              {testResult.responseTime && (
                <p className="n8n-chat-test-meta">
                  {t('responseTime', 'Response time')}: {testResult.responseTime}ms
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            className="button"
            onClick={handleTestConnection}
            disabled={testing || !instance.webhookUrl}
          >
            {testing ? (
              <>
                <span className="spinner is-active"></span>
                {t('testing', 'Testing...')}
              </>
            ) : (
              t('testConnectionNow', 'Test Connection Now')
            )}
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="n8n-chat-section">
        <button
          type="button"
          className="n8n-chat-toggle-advanced"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
        >
          <span className={`dashicons ${showAdvanced ? 'dashicons-arrow-down-alt2' : 'dashicons-arrow-right-alt2'}`}></span>
          {showAdvanced ? t('hide', 'Hide') : t('show', 'Show')} {t('advancedConnectionSettings', 'Advanced Connection Settings')}
        </button>

        {showAdvanced && (
          <div className="n8n-chat-advanced-content">
            {/* Timeout */}
            <div className="n8n-chat-field">
              <label htmlFor="fc-timeout">{t('timeout', 'Timeout')} ({t('seconds', 'seconds')})</label>
              <input
                type="number"
                id="fc-timeout"
                value={connection.timeout || 30}
                onChange={(e) => updateField('connection.timeout', parseInt(e.target.value, 10))}
                min={5}
                max={120}
                className="small-text"
              />
              <p className="description">
                {t('timeoutDesc', 'How long to wait for a response before timing out.')}
              </p>
            </div>

            {/* Chat Input Key */}
            <div className="n8n-chat-field">
              <label htmlFor="fc-chat-input-key">
                {t('chatInputKey', 'Chat Input Key')}
                <InfoIcon tooltip={t('tooltipChatInputKey', 'The JSON key n8n expects for the user\'s message. Only change if your n8n workflow uses a different key name.')} />
              </label>
              <input
                type="text"
                id="fc-chat-input-key"
                value={connection.chatInputKey || 'chatInput'}
                onChange={(e) => updateField('connection.chatInputKey', e.target.value)}
                className="regular-text code"
              />
              <p className="description">
                {t('chatInputKeyDesc', 'The key name for the user message in n8n.')} {t('default', 'Default')}: <code>chatInput</code>
              </p>
            </div>

            {/* Session Key */}
            <div className="n8n-chat-field">
              <label htmlFor="fc-session-key">
                {t('sessionKey', 'Session Key')}
                <InfoIcon tooltip={t('tooltipSessionKey', 'The JSON key for session tracking. Enables conversation history in n8n.')} />
              </label>
              <input
                type="text"
                id="fc-session-key"
                value={connection.sessionKey || 'sessionId'}
                onChange={(e) => updateField('connection.sessionKey', e.target.value)}
                className="regular-text code"
              />
              <p className="description">
                {t('sessionKeyDesc', 'The key name for session ID in n8n.')} {t('default', 'Default')}: <code>sessionId</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionTab;
