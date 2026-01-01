/**
 * InstanceList Component
 *
 * Displays list of chat instances with actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminInstance } from '../../types';
import { useAdminI18n } from '../../hooks/useAdminI18n';

interface InstanceListProps {
  onEdit: (instanceId: string) => void;
  onCreate: () => void;
}

export const InstanceList: React.FC<InstanceListProps> = ({ onEdit, onCreate }) => {
  const { t } = useAdminI18n();
  const [instances, setInstances] = useState<AdminInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch instances
  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${(window as any).n8nChatAdmin.apiUrl}/instances`,
        {
          headers: {
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch instances');
      }

      const data = await response.json();
      setInstances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Delete instance
  const handleDelete = async (instanceId: string, instanceName: string) => {
    const i18n = (window as any).n8nChatAdmin.i18n;

    if (!confirm(`${i18n.confirmDelete}\n\n${i18n.confirmDeleteMessage}`)) {
      return;
    }

    try {
      const response = await fetch(
        `${(window as any).n8nChatAdmin.apiUrl}/instances/${instanceId}`,
        {
          method: 'DELETE',
          headers: {
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete instance');
      }

      // Refresh list
      fetchInstances();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  // Duplicate instance
  const handleDuplicate = async (instanceId: string) => {
    try {
      const response = await fetch(
        `${(window as any).n8nChatAdmin.apiUrl}/instances/${instanceId}/duplicate`,
        {
          method: 'POST',
          headers: {
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to duplicate instance');
      }

      // Refresh list
      fetchInstances();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate');
    }
  };

  // Toggle enabled status
  const handleToggleEnabled = async (instance: AdminInstance) => {
    try {
      const response = await fetch(
        `${(window as any).n8nChatAdmin.apiUrl}/instances/${instance.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
          },
          body: JSON.stringify({
            ...instance,
            isEnabled: !instance.isEnabled,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update instance');
      }

      // Refresh list
      fetchInstances();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="n8n-chat-instance-list">
        <div className="n8n-chat-loading">{t('loadingInstances', 'Loading instances...')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="n8n-chat-instance-list">
        <div className="n8n-chat-error">{error}</div>
        <button className="button" onClick={fetchInstances}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="n8n-chat-instance-list">
      <div className="n8n-chat-instance-header">
        <h1>{t('chatInstances', 'Chat Instances')}</h1>
        <button className="button button-primary" onClick={onCreate}>
          {t('addNewInstance', 'Add New Instance')}
        </button>
      </div>

      {instances.length === 0 ? (
        <div className="n8n-chat-empty-state">
          <p>{t('noInstancesYet', 'No chat instances yet.')}</p>
          <button className="button button-primary" onClick={onCreate}>
            {t('createFirstInstance', 'Create Your First Instance')}
          </button>
        </div>
      ) : (
        <table className="wp-list-table widefat fixed striped">
          <thead>
            <tr>
              <th>{t('name', 'Name')}</th>
              <th>{t('status', 'Status')}</th>
              <th>{t('webhookUrl', 'Webhook URL')}</th>
              <th>{t('sessions', 'Sessions')}</th>
              <th>{t('shortcode', 'Shortcode')}</th>
              <th>{t('actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((instance) => (
              <tr key={instance.id}>
                <td>
                  <strong>
                    <a href="#" onClick={(e) => { e.preventDefault(); onEdit(instance.id); }}>
                      {instance.name}
                    </a>
                  </strong>
                  {instance.isDefault && (
                    <span className="n8n-chat-badge n8n-chat-badge-default">Default</span>
                  )}
                </td>
                <td>
                  <button
                    className={`n8n-chat-toggle ${instance.isEnabled ? 'n8n-chat-toggle-on' : ''}`}
                    onClick={() => handleToggleEnabled(instance)}
                    title={instance.isEnabled ? t('disabled', 'Click to disable') : t('enabled', 'Click to enable')}
                  >
                    <span className="n8n-chat-toggle-slider" />
                    <span className="screen-reader-text">
                      {instance.isEnabled ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                    </span>
                  </button>
                </td>
                <td>
                  {instance.webhookUrl ? (
                    <code className="n8n-chat-webhook-url">
                      {instance.webhookUrl.substring(0, 40)}...
                    </code>
                  ) : (
                    <span className="n8n-chat-warning">Not configured</span>
                  )}
                </td>
                <td>{instance.sessionCount ?? 0}</td>
                <td>
                  <code>[n8n-chat id="{instance.id}"]</code>
                </td>
                <td>
                  <div className="n8n-chat-actions">
                    <button
                      className="button button-small"
                      onClick={() => onEdit(instance.id)}
                    >
                      {t('edit', 'Edit')}
                    </button>
                    <button
                      className="button button-small"
                      onClick={() => handleDuplicate(instance.id)}
                    >
                      {t('duplicate', 'Duplicate')}
                    </button>
                    <button
                      className="button button-small button-link-delete"
                      onClick={() => handleDelete(instance.id, instance.name)}
                    >
                      {t('delete', 'Delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InstanceList;
