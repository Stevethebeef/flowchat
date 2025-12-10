/**
 * ConnectionTab Component
 *
 * n8n connection settings tab for the instance editor.
 */

import React, { useState } from 'react';
import type { AdminInstance } from '../../../types';

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
        `${(window as any).flowchatAdmin.apiUrl}/test-webhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
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
    <div className="flowchat-tab-content">
      <div className="flowchat-section">
        <h2 className="flowchat-section-title">n8n Connection</h2>

        {/* Webhook URL */}
        <div className="flowchat-field">
          <label htmlFor="fc-webhook-url">
            n8n Webhook URL <span className="required">*</span>
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
            The production webhook URL from your n8n Chat Trigger node.
          </p>
        </div>

        {/* Authentication */}
        <div className="flowchat-field">
          <label>Authentication</label>
          <div className="flowchat-radio-group flowchat-radio-group-vertical">
            <label className="flowchat-radio">
              <input
                type="radio"
                name="auth"
                checked={authType === 'none'}
                onChange={() => updateField('connection.auth', 'none')}
              />
              <span className="flowchat-radio-label">None (Public)</span>
            </label>
            <label className="flowchat-radio">
              <input
                type="radio"
                name="auth"
                checked={authType === 'basic'}
                onChange={() => updateField('connection.auth', 'basic')}
              />
              <span className="flowchat-radio-label">Basic Auth</span>
            </label>
            <label className="flowchat-radio">
              <input
                type="radio"
                name="auth"
                checked={authType === 'bearer'}
                onChange={() => updateField('connection.auth', 'bearer')}
              />
              <span className="flowchat-radio-label">Bearer Token</span>
            </label>
          </div>
        </div>

        {/* Basic Auth Fields */}
        {authType === 'basic' && (
          <div className="flowchat-auth-fields">
            <div className="flowchat-field">
              <label htmlFor="fc-auth-username">Username</label>
              <input
                type="text"
                id="fc-auth-username"
                value={connection.username || ''}
                onChange={(e) => updateField('connection.username', e.target.value)}
                className="regular-text"
              />
            </div>
            <div className="flowchat-field">
              <label htmlFor="fc-auth-password">Password</label>
              <div className="flowchat-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="fc-auth-password"
                  value={connection.password || ''}
                  onChange={(e) => updateField('connection.password', e.target.value)}
                  className="regular-text"
                />
                <button
                  type="button"
                  className="button button-small flowchat-toggle-password"
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
          <div className="flowchat-auth-fields">
            <div className="flowchat-field">
              <label htmlFor="fc-auth-token">Bearer Token</label>
              <div className="flowchat-password-field">
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
                  className="button button-small flowchat-toggle-password"
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
      <div className="flowchat-section">
        <h2 className="flowchat-section-title">Streaming</h2>

        <div className="flowchat-field">
          <label className="flowchat-checkbox">
            <input
              type="checkbox"
              checked={connection.enableStreaming !== false}
              onChange={(e) => updateField('connection.enableStreaming', e.target.checked)}
            />
            <span>Stream responses in real-time</span>
          </label>
          <p className="description">
            Show AI responses word-by-word as they are generated.
            <br />
            <span className="flowchat-info-badge">
              <span className="dashicons dashicons-info"></span>
              Requires streaming enabled in your n8n Chat Trigger.
            </span>
          </p>
        </div>
      </div>

      {/* Connection Test */}
      <div className="flowchat-section">
        <h2 className="flowchat-section-title">Connection Test</h2>

        <div className="flowchat-connection-test">
          {testResult && (
            <div className={`flowchat-test-result ${testResult.success ? 'is-success' : 'is-error'}`}>
              <div className="flowchat-test-status">
                <span className={`dashicons ${testResult.success ? 'dashicons-yes-alt' : 'dashicons-warning'}`}></span>
                <span className="flowchat-test-message">
                  {testResult.success ? 'Connected' : 'Connection Failed'}
                </span>
              </div>
              <p>{testResult.message}</p>
              {testResult.responseTime && (
                <p className="flowchat-test-meta">
                  Response time: {testResult.responseTime}ms
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
                Testing...
              </>
            ) : (
              'Test Connection Now'
            )}
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="flowchat-section">
        <button
          type="button"
          className="flowchat-toggle-advanced"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
        >
          <span className={`dashicons ${showAdvanced ? 'dashicons-arrow-down-alt2' : 'dashicons-arrow-right-alt2'}`}></span>
          {showAdvanced ? 'Hide' : 'Show'} Advanced Connection Settings
        </button>

        {showAdvanced && (
          <div className="flowchat-advanced-content">
            {/* Timeout */}
            <div className="flowchat-field">
              <label htmlFor="fc-timeout">Timeout (seconds)</label>
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
                How long to wait for a response before timing out.
              </p>
            </div>

            {/* Chat Input Key */}
            <div className="flowchat-field">
              <label htmlFor="fc-chat-input-key">Chat Input Key</label>
              <input
                type="text"
                id="fc-chat-input-key"
                value={connection.chatInputKey || 'chatInput'}
                onChange={(e) => updateField('connection.chatInputKey', e.target.value)}
                className="regular-text code"
              />
              <p className="description">
                The key name for the user message in n8n. Default: <code>chatInput</code>
              </p>
            </div>

            {/* Session Key */}
            <div className="flowchat-field">
              <label htmlFor="fc-session-key">Session Key</label>
              <input
                type="text"
                id="fc-session-key"
                value={connection.sessionKey || 'sessionId'}
                onChange={(e) => updateField('connection.sessionKey', e.target.value)}
                className="regular-text code"
              />
              <p className="description">
                The key name for session ID in n8n. Default: <code>sessionId</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionTab;
