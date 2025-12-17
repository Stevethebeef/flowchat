/**
 * GlobalSettings Component
 *
 * Global plugin settings with 4 tabs: General, Performance, Privacy, Advanced.
 */

import React, { useState, useEffect } from 'react';

type SettingsTabId = 'general' | 'performance' | 'privacy' | 'advanced';

interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: string;
}

const SETTINGS_TABS: SettingsTab[] = [
  { id: 'general', label: 'General', icon: 'admin-generic' },
  { id: 'performance', label: 'Performance', icon: 'performance' },
  { id: 'privacy', label: 'Privacy', icon: 'shield' },
  { id: 'advanced', label: 'Advanced', icon: 'admin-tools' },
];

interface Settings {
  // General
  n8nBaseUrl: string;
  defaultTimeout: number;
  enableLogging: boolean;
  // Context/Metadata
  includeUserName: boolean;
  includeUserEmail: boolean;
  includeUserRole: boolean;
  includePageTitle: boolean;
  includePageUrl: boolean;
  includeSiteName: boolean;
  includeDateTime: boolean;
  // Performance
  lazyLoadWidget: boolean;
  preconnectWebhook: boolean;
  cacheResponses: boolean;
  cacheDuration: number;
  // Privacy
  historyStorage: 'none' | 'session' | 'local' | 'database';
  historyRetention: number;
  anonymizeData: boolean;
  respectDnt: boolean;
  cookieConsent: boolean;
  // Advanced
  debugMode: boolean;
  customHeaders: string;
  webhookRetries: number;
  retryDelay: number;
  enableFallback: boolean;
  fallbackEmail: string;
  deleteDataOnUninstall: boolean;
}

const defaultSettings: Settings = {
  n8nBaseUrl: '',
  defaultTimeout: 30,
  enableLogging: false,
  includeUserName: true,
  includeUserEmail: false,
  includeUserRole: true,
  includePageTitle: true,
  includePageUrl: true,
  includeSiteName: true,
  includeDateTime: true,
  lazyLoadWidget: true,
  preconnectWebhook: true,
  cacheResponses: false,
  cacheDuration: 300,
  historyStorage: 'session',
  historyRetention: 30,
  anonymizeData: false,
  respectDnt: true,
  cookieConsent: false,
  debugMode: false,
  customHeaders: '',
  webhookRetries: 3,
  retryDelay: 1000,
  enableFallback: true,
  fallbackEmail: '',
  deleteDataOnUninstall: false,
};

export const GlobalSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${(window as any).n8nChatAdmin.apiUrl}/settings`,
        {
          headers: {
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings({ ...defaultSettings, ...data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch(
        `${(window as any).n8nChatAdmin.apiUrl}/settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
          },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const renderGeneralTab = () => (
    <div className="n8n-chat-settings-section">
      <h2>n8n Configuration</h2>

      <div className="n8n-chat-field">
        <label htmlFor="fc-n8n-base-url">n8n Base URL (Optional)</label>
        <input
          type="url"
          id="fc-n8n-base-url"
          value={settings.n8nBaseUrl}
          onChange={(e) => updateSetting('n8nBaseUrl', e.target.value)}
          className="large-text"
          placeholder="https://your-n8n-instance.com"
        />
        <p className="description">
          If all your webhooks share the same base URL, set it here.
          Instance webhook URLs can be relative paths.
        </p>
      </div>

      <div className="n8n-chat-field">
        <label htmlFor="fc-default-timeout">Default Timeout (seconds)</label>
        <input
          type="number"
          id="fc-default-timeout"
          value={settings.defaultTimeout}
          onChange={(e) => updateSetting('defaultTimeout', parseInt(e.target.value, 10))}
          min={5}
          max={120}
          className="small-text"
        />
        <p className="description">
          Default timeout for webhook requests. Can be overridden per instance.
        </p>
      </div>

      <h2>Context Data (Sent to n8n)</h2>
      <p className="n8n-chat-settings-description">
        Choose what information is automatically included with each chat message.
      </p>

      <div className="n8n-chat-checkbox-grid">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.includeSiteName}
            onChange={(e) => updateSetting('includeSiteName', e.target.checked)}
          />
          <span>Site Name</span>
        </label>

        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.includePageTitle}
            onChange={(e) => updateSetting('includePageTitle', e.target.checked)}
          />
          <span>Page Title</span>
        </label>

        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.includePageUrl}
            onChange={(e) => updateSetting('includePageUrl', e.target.checked)}
          />
          <span>Page URL</span>
        </label>

        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.includeDateTime}
            onChange={(e) => updateSetting('includeDateTime', e.target.checked)}
          />
          <span>Date/Time</span>
        </label>

        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.includeUserName}
            onChange={(e) => updateSetting('includeUserName', e.target.checked)}
          />
          <span>User Name (if logged in)</span>
        </label>

        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.includeUserEmail}
            onChange={(e) => updateSetting('includeUserEmail', e.target.checked)}
          />
          <span>User Email (if logged in)</span>
        </label>

        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.includeUserRole}
            onChange={(e) => updateSetting('includeUserRole', e.target.checked)}
          />
          <span>User Role (if logged in)</span>
        </label>
      </div>

      <h2>Logging</h2>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.enableLogging}
            onChange={(e) => updateSetting('enableLogging', e.target.checked)}
          />
          <span>Enable activity logging</span>
        </label>
        <p className="description">
          Log chat events and errors to WordPress debug.log file.
        </p>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="n8n-chat-settings-section">
      <h2>Widget Loading</h2>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.lazyLoadWidget}
            onChange={(e) => updateSetting('lazyLoadWidget', e.target.checked)}
          />
          <span>Lazy load chat widget</span>
        </label>
        <p className="description">
          Only load the chat widget when the user scrolls near it or clicks the bubble.
        </p>
      </div>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.preconnectWebhook}
            onChange={(e) => updateSetting('preconnectWebhook', e.target.checked)}
          />
          <span>Preconnect to webhook URL</span>
        </label>
        <p className="description">
          Add preconnect hint to speed up the first webhook request.
        </p>
      </div>

      <h2>Response Caching</h2>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.cacheResponses}
            onChange={(e) => updateSetting('cacheResponses', e.target.checked)}
          />
          <span>Cache identical responses</span>
        </label>
        <p className="description">
          Cache responses for identical messages to reduce API calls.
          Only enable for FAQ-style bots.
        </p>
      </div>

      {settings.cacheResponses && (
        <div className="n8n-chat-field">
          <label htmlFor="fc-cache-duration">Cache Duration (seconds)</label>
          <input
            type="number"
            id="fc-cache-duration"
            value={settings.cacheDuration}
            onChange={(e) => updateSetting('cacheDuration', parseInt(e.target.value, 10))}
            min={60}
            max={86400}
            className="small-text"
          />
        </div>
      )}
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="n8n-chat-settings-section">
      <h2>Chat History Storage</h2>

      <div className="n8n-chat-field">
        <label>Where to store chat history</label>
        <div className="n8n-chat-radio-group n8n-chat-radio-group-vertical">
          <label className="n8n-chat-radio">
            <input
              type="radio"
              name="historyStorage"
              checked={settings.historyStorage === 'none'}
              onChange={() => updateSetting('historyStorage', 'none')}
            />
            <div className="n8n-chat-radio-content">
              <span className="n8n-chat-radio-label">None</span>
              <span className="n8n-chat-radio-desc">
                No history saved. Chat resets on each visit.
              </span>
            </div>
          </label>

          <label className="n8n-chat-radio">
            <input
              type="radio"
              name="historyStorage"
              checked={settings.historyStorage === 'session'}
              onChange={() => updateSetting('historyStorage', 'session')}
            />
            <div className="n8n-chat-radio-content">
              <span className="n8n-chat-radio-label">Session Storage</span>
              <span className="n8n-chat-radio-desc">
                History kept until browser tab closes.
              </span>
            </div>
          </label>

          <label className="n8n-chat-radio">
            <input
              type="radio"
              name="historyStorage"
              checked={settings.historyStorage === 'local'}
              onChange={() => updateSetting('historyStorage', 'local')}
            />
            <div className="n8n-chat-radio-content">
              <span className="n8n-chat-radio-label">Local Storage</span>
              <span className="n8n-chat-radio-desc">
                History persists across visits (browser only).
              </span>
            </div>
          </label>

          <label className="n8n-chat-radio">
            <input
              type="radio"
              name="historyStorage"
              checked={settings.historyStorage === 'database'}
              onChange={() => updateSetting('historyStorage', 'database')}
            />
            <div className="n8n-chat-radio-content">
              <span className="n8n-chat-radio-label">Database</span>
              <span className="n8n-chat-radio-desc">
                History saved server-side. Enables analytics and export.
              </span>
            </div>
          </label>
        </div>
      </div>

      {settings.historyStorage === 'database' && (
        <div className="n8n-chat-field">
          <label htmlFor="fc-retention">Data Retention (days)</label>
          <input
            type="number"
            id="fc-retention"
            value={settings.historyRetention}
            onChange={(e) => updateSetting('historyRetention', parseInt(e.target.value, 10))}
            min={1}
            max={365}
            className="small-text"
          />
          <p className="description">
            Automatically delete chat history older than this many days.
          </p>
        </div>
      )}

      <h2>Privacy Options</h2>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.anonymizeData}
            onChange={(e) => updateSetting('anonymizeData', e.target.checked)}
          />
          <span>Anonymize user data in stored history</span>
        </label>
        <p className="description">
          Remove personally identifiable information when storing chat history.
        </p>
      </div>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.respectDnt}
            onChange={(e) => updateSetting('respectDnt', e.target.checked)}
          />
          <span>Respect Do Not Track browser setting</span>
        </label>
        <p className="description">
          Disable history storage for users with DNT enabled.
        </p>
      </div>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.cookieConsent}
            onChange={(e) => updateSetting('cookieConsent', e.target.checked)}
          />
          <span>Require cookie consent before storing data</span>
        </label>
        <p className="description">
          Integrates with popular cookie consent plugins.
        </p>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="n8n-chat-settings-section">
      <h2>Debug Mode</h2>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.debugMode}
            onChange={(e) => updateSetting('debugMode', e.target.checked)}
          />
          <span>Enable debug mode</span>
        </label>
        <p className="description">
          Shows additional debugging information in browser console.
          Disable in production.
        </p>
      </div>

      <h2>Webhook Settings</h2>

      <div className="n8n-chat-field">
        <label htmlFor="fc-retries">Retry Attempts</label>
        <input
          type="number"
          id="fc-retries"
          value={settings.webhookRetries}
          onChange={(e) => updateSetting('webhookRetries', parseInt(e.target.value, 10))}
          min={0}
          max={5}
          className="small-text"
        />
        <p className="description">
          Number of times to retry failed webhook requests.
        </p>
      </div>

      <div className="n8n-chat-field">
        <label htmlFor="fc-retry-delay">Retry Delay (ms)</label>
        <input
          type="number"
          id="fc-retry-delay"
          value={settings.retryDelay}
          onChange={(e) => updateSetting('retryDelay', parseInt(e.target.value, 10))}
          min={100}
          max={10000}
          step={100}
          className="small-text"
        />
        <p className="description">
          Initial delay between retries. Uses exponential backoff.
        </p>
      </div>

      <div className="n8n-chat-field">
        <label htmlFor="fc-custom-headers">Custom Headers (JSON)</label>
        <textarea
          id="fc-custom-headers"
          value={settings.customHeaders}
          onChange={(e) => updateSetting('customHeaders', e.target.value)}
          rows={4}
          className="large-text code"
          placeholder='{"X-Custom-Header": "value"}'
        />
        <p className="description">
          Additional headers to send with webhook requests.
        </p>
      </div>

      <h2>Fallback Settings</h2>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox">
          <input
            type="checkbox"
            checked={settings.enableFallback}
            onChange={(e) => updateSetting('enableFallback', e.target.checked)}
          />
          <span>Enable global fallback form</span>
        </label>
        <p className="description">
          Show a contact form when webhook is unavailable.
        </p>
      </div>

      {settings.enableFallback && (
        <div className="n8n-chat-field">
          <label htmlFor="fc-fallback-email">Fallback Notification Email</label>
          <input
            type="email"
            id="fc-fallback-email"
            value={settings.fallbackEmail}
            onChange={(e) => updateSetting('fallbackEmail', e.target.value)}
            className="regular-text"
            placeholder="admin@example.com"
          />
        </div>
      )}

      <h2>Data Management</h2>

      <div className="n8n-chat-field">
        <label className="n8n-chat-checkbox n8n-chat-checkbox-danger">
          <input
            type="checkbox"
            checked={settings.deleteDataOnUninstall}
            onChange={(e) => updateSetting('deleteDataOnUninstall', e.target.checked)}
          />
          <span>Delete all data when plugin is uninstalled</span>
        </label>
        <p className="description n8n-chat-warning">
          This will permanently delete all chat instances, history, and settings.
        </p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'performance':
        return renderPerformanceTab();
      case 'privacy':
        return renderPrivacyTab();
      case 'advanced':
        return renderAdvancedTab();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="n8n-chat-settings">
        <div className="n8n-chat-loading">
          <div className="n8n-chat-loading-spinner" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="n8n-chat-settings">
      {/* Header */}
      <div className="n8n-chat-page-header">
        <h1>Settings</h1>
        <p>Configure global n8n Chat settings.</p>
      </div>

      {error && (
        <div className="notice notice-error">
          <p>{error}</p>
        </div>
      )}

      {saved && (
        <div className="notice notice-success is-dismissible">
          <p>Settings saved successfully!</p>
        </div>
      )}

      <div className="n8n-chat-settings-layout">
        {/* Tabs */}
        <div className="n8n-chat-settings-tabs">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`n8n-chat-settings-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={`dashicons dashicons-${tab.icon}`}></span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="n8n-chat-settings-content">
          {renderTabContent()}

          <div className="n8n-chat-settings-footer">
            <button
              className="button button-primary button-large"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;
