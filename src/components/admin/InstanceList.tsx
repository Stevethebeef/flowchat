/**
 * InstanceList Component
 *
 * Displays list of chat instances with actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminInstance } from '../../types';

interface InstanceListProps {
  onEdit: (instanceId: string) => void;
  onCreate: () => void;
}

export const InstanceList: React.FC<InstanceListProps> = ({ onEdit, onCreate }) => {
  const [instances, setInstances] = useState<AdminInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch instances
  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/instances`,
        {
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
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
    const i18n = (window as any).flowchatAdmin.i18n;

    if (!confirm(`${i18n.confirmDelete}\n\n${i18n.confirmDeleteMessage}`)) {
      return;
    }

    try {
      const response = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/instances/${instanceId}`,
        {
          method: 'DELETE',
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
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
        `${(window as any).flowchatAdmin.apiUrl}/instances/${instanceId}/duplicate`,
        {
          method: 'POST',
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
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
        `${(window as any).flowchatAdmin.apiUrl}/instances/${instance.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
          body: JSON.stringify({
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
      <div className="flowchat-instance-list">
        <div className="flowchat-loading">Loading instances...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flowchat-instance-list">
        <div className="flowchat-error">{error}</div>
        <button className="button" onClick={fetchInstances}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flowchat-instance-list">
      <div className="flowchat-instance-header">
        <h1>Chat Instances</h1>
        <button className="button button-primary" onClick={onCreate}>
          Add New Instance
        </button>
      </div>

      {instances.length === 0 ? (
        <div className="flowchat-empty-state">
          <p>No chat instances yet.</p>
          <button className="button button-primary" onClick={onCreate}>
            Create Your First Instance
          </button>
        </div>
      ) : (
        <table className="wp-list-table widefat fixed striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Webhook URL</th>
              <th>Sessions</th>
              <th>Shortcode</th>
              <th>Actions</th>
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
                    <span className="flowchat-badge flowchat-badge-default">Default</span>
                  )}
                </td>
                <td>
                  <button
                    className={`flowchat-toggle ${instance.isEnabled ? 'flowchat-toggle-on' : ''}`}
                    onClick={() => handleToggleEnabled(instance)}
                    title={instance.isEnabled ? 'Click to disable' : 'Click to enable'}
                  >
                    <span className="flowchat-toggle-slider" />
                    <span className="screen-reader-text">
                      {instance.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                </td>
                <td>
                  {instance.webhookUrl ? (
                    <code className="flowchat-webhook-url">
                      {instance.webhookUrl.substring(0, 40)}...
                    </code>
                  ) : (
                    <span className="flowchat-warning">Not configured</span>
                  )}
                </td>
                <td>{instance.sessionCount ?? 0}</td>
                <td>
                  <code>[flowchat id="{instance.id}"]</code>
                </td>
                <td>
                  <div className="flowchat-actions">
                    <button
                      className="button button-small"
                      onClick={() => onEdit(instance.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="button button-small"
                      onClick={() => handleDuplicate(instance.id)}
                    >
                      Duplicate
                    </button>
                    <button
                      className="button button-small button-link-delete"
                      onClick={() => handleDelete(instance.id, instance.name)}
                    >
                      Delete
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
