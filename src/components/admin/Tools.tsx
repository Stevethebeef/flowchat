/**
 * Tools Component
 *
 * Import/Export functionality, Debug info, and System report.
 */

import React, { useState, useEffect, useRef } from 'react';

type ToolsTabId = 'import-export' | 'debug' | 'system';

interface SystemInfo {
  php_version: string;
  wp_version: string;
  plugin_version: string;
  active_theme: string;
  active_plugins: string[];
  database_tables: Record<string, { exists: boolean; rows: number }>;
  php_extensions: Record<string, boolean>;
  server_info: string;
  memory_limit: string;
  max_execution_time: string;
  curl_version: string;
  ssl_enabled: boolean;
}

export const Tools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolsTabId>('import-export');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'system') {
      fetchSystemInfo();
    }
  }, [activeTab]);

  const fetchSystemInfo = async () => {
    setLoadingSystem(true);
    try {
      const response = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/system-info`,
        {
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch system info:', err);
    } finally {
      setLoadingSystem(false);
    }
  };

  // Export functions
  const handleExportAll = async () => {
    setExporting(true);
    setError(null);

    try {
      const response = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/export?type=all`,
        {
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      downloadJson(data, 'flowchat-export-all.json');
      setSuccess('Export completed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportInstances = async () => {
    setExporting(true);
    setError(null);

    try {
      const response = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/export?type=instances`,
        {
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      downloadJson(data, 'flowchat-instances.json');
      setSuccess('Instances exported successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSettings = async () => {
    setExporting(true);
    setError(null);

    try {
      const response = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/export?type=settings`,
        {
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      downloadJson(data, 'flowchat-settings.json');
      setSuccess('Settings exported successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import function
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const content = await file.text();
      const data = JSON.parse(content);

      const response = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }

      const result = await response.json();
      setSuccess(`Import completed! ${result.instances_imported || 0} instances imported.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Debug functions
  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setWebhookResult({ success: false, message: 'Please enter a webhook URL' });
      return;
    }

    setTestingWebhook(true);
    setWebhookResult(null);

    try {
      const response = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/test-webhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
          body: JSON.stringify({ url: webhookUrl }),
        }
      );

      const data = await response.json();
      setWebhookResult({
        success: data.success,
        message: data.message || (data.success ? 'Connection successful!' : 'Connection failed'),
      });
    } catch (err) {
      setWebhookResult({
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!systemInfo) return;

    const report = `
FlowChat System Report
Generated: ${new Date().toISOString()}

== Server Environment ==
PHP Version: ${systemInfo.php_version}
WordPress Version: ${systemInfo.wp_version}
FlowChat Version: ${systemInfo.plugin_version}
Server: ${systemInfo.server_info}
Memory Limit: ${systemInfo.memory_limit}
Max Execution Time: ${systemInfo.max_execution_time}
cURL Version: ${systemInfo.curl_version}
SSL Enabled: ${systemInfo.ssl_enabled ? 'Yes' : 'No'}

== PHP Extensions ==
${Object.entries(systemInfo.php_extensions)
  .map(([ext, enabled]) => `${ext}: ${enabled ? 'Enabled' : 'Disabled'}`)
  .join('\n')}

== Database Tables ==
${Object.entries(systemInfo.database_tables)
  .map(([table, info]) => `${table}: ${info.exists ? `OK (${info.rows} rows)` : 'MISSING'}`)
  .join('\n')}

== Active Theme ==
${systemInfo.active_theme}

== Active Plugins ==
${systemInfo.active_plugins.join('\n')}
`.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowchat-system-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copySystemInfo = () => {
    if (!systemInfo) return;
    navigator.clipboard.writeText(JSON.stringify(systemInfo, null, 2));
    setSuccess('System info copied to clipboard!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const renderImportExportTab = () => (
    <div className="flowchat-tools-section">
      <h2>Export</h2>
      <p className="flowchat-tools-description">
        Export your FlowChat configuration to a JSON file for backup or migration.
      </p>

      <div className="flowchat-export-options">
        <div className="flowchat-export-option">
          <h4>Export All</h4>
          <p>Includes all instances, settings, and templates.</p>
          <button
            className="button button-primary"
            onClick={handleExportAll}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export Everything'}
          </button>
        </div>

        <div className="flowchat-export-option">
          <h4>Export Instances Only</h4>
          <p>Export all chat bot configurations.</p>
          <button
            className="button"
            onClick={handleExportInstances}
            disabled={exporting}
          >
            Export Instances
          </button>
        </div>

        <div className="flowchat-export-option">
          <h4>Export Settings Only</h4>
          <p>Export global plugin settings.</p>
          <button
            className="button"
            onClick={handleExportSettings}
            disabled={exporting}
          >
            Export Settings
          </button>
        </div>
      </div>

      <hr />

      <h2>Import</h2>
      <p className="flowchat-tools-description">
        Import a previously exported FlowChat configuration file.
      </p>

      <div className="flowchat-import-section">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />

        <button
          className="button button-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? (
            <>
              <span className="spinner is-active"></span>
              Importing...
            </>
          ) : (
            <>
              <span className="dashicons dashicons-upload"></span>
              Choose File to Import
            </>
          )}
        </button>

        <p className="description">
          Supported formats: FlowChat export files (.json)
        </p>
      </div>

      <div className="flowchat-import-warning">
        <span className="dashicons dashicons-warning"></span>
        <div>
          <strong>Warning:</strong> Importing will merge with existing data.
          Instances with the same ID will be overwritten.
        </div>
      </div>
    </div>
  );

  const renderDebugTab = () => (
    <div className="flowchat-tools-section">
      <h2>Webhook Tester</h2>
      <p className="flowchat-tools-description">
        Test connectivity to an n8n webhook URL.
      </p>

      <div className="flowchat-debug-test">
        <div className="flowchat-field">
          <label htmlFor="fc-test-webhook">Webhook URL</label>
          <div className="flowchat-input-group">
            <input
              type="url"
              id="fc-test-webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="large-text"
              placeholder="https://your-n8n.example.com/webhook/..."
            />
            <button
              className="button button-primary"
              onClick={handleTestWebhook}
              disabled={testingWebhook}
            >
              {testingWebhook ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>

        {webhookResult && (
          <div className={`flowchat-test-result ${webhookResult.success ? 'is-success' : 'is-error'}`}>
            <span className={`dashicons ${webhookResult.success ? 'dashicons-yes-alt' : 'dashicons-warning'}`}></span>
            <span>{webhookResult.message}</span>
          </div>
        )}
      </div>

      <hr />

      <h2>Debug Logs</h2>
      <p className="flowchat-tools-description">
        Recent FlowChat activity logs (requires logging enabled in Settings).
      </p>

      <div className="flowchat-debug-logs">
        {debugLogs.length === 0 ? (
          <div className="flowchat-debug-empty">
            <span className="dashicons dashicons-info"></span>
            <p>No debug logs available. Enable logging in Settings to see activity here.</p>
          </div>
        ) : (
          <pre className="flowchat-log-viewer">
            {debugLogs.join('\n')}
          </pre>
        )}
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="flowchat-tools-section">
      <h2>System Information</h2>
      <p className="flowchat-tools-description">
        Technical details about your WordPress environment.
      </p>

      {loadingSystem ? (
        <div className="flowchat-loading-inline">
          <span className="spinner is-active"></span>
          Loading system information...
        </div>
      ) : systemInfo ? (
        <>
          <div className="flowchat-system-grid">
            <div className="flowchat-system-card">
              <h3>Server Environment</h3>
              <table className="flowchat-system-table">
                <tbody>
                  <tr>
                    <td>PHP Version</td>
                    <td>{systemInfo.php_version}</td>
                  </tr>
                  <tr>
                    <td>WordPress Version</td>
                    <td>{systemInfo.wp_version}</td>
                  </tr>
                  <tr>
                    <td>FlowChat Version</td>
                    <td>{systemInfo.plugin_version}</td>
                  </tr>
                  <tr>
                    <td>Server</td>
                    <td>{systemInfo.server_info}</td>
                  </tr>
                  <tr>
                    <td>Memory Limit</td>
                    <td>{systemInfo.memory_limit}</td>
                  </tr>
                  <tr>
                    <td>Max Execution Time</td>
                    <td>{systemInfo.max_execution_time}s</td>
                  </tr>
                  <tr>
                    <td>cURL Version</td>
                    <td>{systemInfo.curl_version}</td>
                  </tr>
                  <tr>
                    <td>SSL Enabled</td>
                    <td>
                      {systemInfo.ssl_enabled ? (
                        <span className="flowchat-status-ok">Yes</span>
                      ) : (
                        <span className="flowchat-status-warning">No</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flowchat-system-card">
              <h3>PHP Extensions</h3>
              <table className="flowchat-system-table">
                <tbody>
                  {Object.entries(systemInfo.php_extensions).map(([ext, enabled]) => (
                    <tr key={ext}>
                      <td>{ext}</td>
                      <td>
                        {enabled ? (
                          <span className="flowchat-status-ok">
                            <span className="dashicons dashicons-yes"></span>
                          </span>
                        ) : (
                          <span className="flowchat-status-error">
                            <span className="dashicons dashicons-no"></span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flowchat-system-card">
              <h3>Database Tables</h3>
              <table className="flowchat-system-table">
                <tbody>
                  {Object.entries(systemInfo.database_tables).map(([table, info]) => (
                    <tr key={table}>
                      <td>{table}</td>
                      <td>
                        {info.exists ? (
                          <span className="flowchat-status-ok">
                            OK ({info.rows} rows)
                          </span>
                        ) : (
                          <span className="flowchat-status-error">Missing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flowchat-system-card">
              <h3>Active Theme</h3>
              <p>{systemInfo.active_theme}</p>

              <h3 style={{ marginTop: '16px' }}>Active Plugins</h3>
              <ul className="flowchat-plugin-list">
                {systemInfo.active_plugins.slice(0, 10).map((plugin) => (
                  <li key={plugin}>{plugin}</li>
                ))}
                {systemInfo.active_plugins.length > 10 && (
                  <li className="flowchat-plugin-more">
                    +{systemInfo.active_plugins.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="flowchat-system-actions">
            <button className="button" onClick={copySystemInfo}>
              <span className="dashicons dashicons-clipboard"></span>
              Copy to Clipboard
            </button>
            <button className="button" onClick={handleGenerateReport}>
              <span className="dashicons dashicons-download"></span>
              Download Report
            </button>
          </div>
        </>
      ) : (
        <div className="flowchat-debug-empty">
          <span className="dashicons dashicons-warning"></span>
          <p>Failed to load system information.</p>
          <button className="button" onClick={fetchSystemInfo}>
            Retry
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flowchat-tools">
      {/* Header */}
      <div className="flowchat-page-header">
        <h1>Tools</h1>
        <p>Import, export, and debug your FlowChat installation.</p>
      </div>

      {error && (
        <div className="notice notice-error is-dismissible">
          <p>{error}</p>
          <button type="button" className="notice-dismiss" onClick={() => setError(null)}>
            <span className="screen-reader-text">Dismiss</span>
          </button>
        </div>
      )}

      {success && (
        <div className="notice notice-success is-dismissible">
          <p>{success}</p>
          <button type="button" className="notice-dismiss" onClick={() => setSuccess(null)}>
            <span className="screen-reader-text">Dismiss</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flowchat-tools-tabs">
        <button
          className={`flowchat-tools-tab ${activeTab === 'import-export' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('import-export')}
        >
          <span className="dashicons dashicons-upload"></span>
          Import / Export
        </button>
        <button
          className={`flowchat-tools-tab ${activeTab === 'debug' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('debug')}
        >
          <span className="dashicons dashicons-admin-tools"></span>
          Debug
        </button>
        <button
          className={`flowchat-tools-tab ${activeTab === 'system' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <span className="dashicons dashicons-info"></span>
          System Info
        </button>
      </div>

      {/* Content */}
      <div className="flowchat-tools-content">
        {activeTab === 'import-export' && renderImportExportTab()}
        {activeTab === 'debug' && renderDebugTab()}
        {activeTab === 'system' && renderSystemTab()}
      </div>
    </div>
  );
};

export default Tools;
