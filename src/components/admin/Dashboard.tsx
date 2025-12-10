/**
 * Dashboard Component
 *
 * Main dashboard page with welcome banner, stats, quick actions, and bot list.
 */

import React, { useState, useEffect } from 'react';
import type { AdminInstance } from '../../types';

interface DashboardProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

interface DashboardStats {
  totalBots: number;
  activeBots: number;
  totalChats: number;
  todayChats: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [instances, setInstances] = useState<AdminInstance[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBots: 0,
    activeBots: 0,
    totalChats: 0,
    todayChats: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch instances
      const instancesResponse = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/instances`,
        {
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
        }
      );

      if (!instancesResponse.ok) {
        throw new Error('Failed to fetch instances');
      }

      const instancesData = await instancesResponse.json();
      setInstances(instancesData);

      // Calculate stats
      const totalBots = instancesData.length;
      const activeBots = instancesData.filter((i: AdminInstance) => i.isEnabled).length;

      // Try to fetch session stats
      let totalChats = 0;
      let todayChats = 0;

      try {
        const sessionsResponse = await fetch(
          `${(window as any).flowchatAdmin.apiUrl}/sessions?per_page=1`,
          {
            headers: {
              'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
            },
          }
        );

        if (sessionsResponse.ok) {
          const totalHeader = sessionsResponse.headers.get('X-WP-Total');
          totalChats = totalHeader ? parseInt(totalHeader, 10) : 0;
        }
      } catch {
        // Sessions API might not be available yet
      }

      setStats({
        totalBots,
        activeBots,
        totalChats,
        todayChats,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInstance = async (instance: AdminInstance) => {
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
            ...instance,
            isEnabled: !instance.isEnabled,
          }),
        }
      );

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to toggle instance:', err);
    }
  };

  const getStatusLabel = (instance: AdminInstance) => {
    if (!instance.isEnabled) {
      return { label: 'Inactive', className: 'status-inactive' };
    }
    return { label: 'Active', className: 'status-active' };
  };

  const getModeLabel = (instance: AdminInstance) => {
    return instance.bubble?.enabled ? 'Bubble' : 'Inline';
  };

  if (loading) {
    return (
      <div className="flowchat-dashboard">
        <div className="flowchat-loading">
          <div className="flowchat-loading-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flowchat-dashboard">
      {/* Welcome Banner */}
      <div className="flowchat-welcome-banner">
        <div className="flowchat-welcome-content">
          <h1>Welcome to FlowChat</h1>
          <p>
            Connect your WordPress site to n8n AI workflows with beautiful,
            customizable chat widgets.
          </p>
        </div>
        <div className="flowchat-welcome-actions">
          <button
            className="button button-primary button-hero"
            onClick={() => onNavigate('instances', { action: 'new' })}
          >
            <span className="dashicons dashicons-plus-alt2"></span>
            Create Your First Chat Bot
          </button>
          <a
            href="https://docs.flowchat.dev/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-hero"
          >
            <span className="dashicons dashicons-book"></span>
            View Documentation
          </a>
        </div>
      </div>

      {error && (
        <div className="notice notice-error">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="flowchat-stats-grid">
        <div className="flowchat-stat-card">
          <div className="flowchat-stat-icon">
            <span className="dashicons dashicons-format-chat"></span>
          </div>
          <div className="flowchat-stat-content">
            <span className="flowchat-stat-value">{stats.totalBots}</span>
            <span className="flowchat-stat-label">Total Chat Bots</span>
          </div>
        </div>

        <div className="flowchat-stat-card">
          <div className="flowchat-stat-icon flowchat-stat-icon-success">
            <span className="dashicons dashicons-yes-alt"></span>
          </div>
          <div className="flowchat-stat-content">
            <span className="flowchat-stat-value">{stats.activeBots}</span>
            <span className="flowchat-stat-label">Active Bots</span>
          </div>
        </div>

        <div className="flowchat-stat-card">
          <div className="flowchat-stat-icon flowchat-stat-icon-info">
            <span className="dashicons dashicons-admin-comments"></span>
          </div>
          <div className="flowchat-stat-content">
            <span className="flowchat-stat-value">{stats.totalChats}</span>
            <span className="flowchat-stat-label">Total Conversations</span>
          </div>
        </div>

        <div className="flowchat-stat-card">
          <div className="flowchat-stat-icon flowchat-stat-icon-warning">
            <span className="dashicons dashicons-clock"></span>
          </div>
          <div className="flowchat-stat-content">
            <span className="flowchat-stat-value">{stats.todayChats}</span>
            <span className="flowchat-stat-label">Today's Chats</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flowchat-quick-actions">
        <h2>Quick Actions</h2>
        <div className="flowchat-quick-actions-grid">
          <button
            className="flowchat-quick-action"
            onClick={() => onNavigate('instances', { action: 'new' })}
          >
            <span className="dashicons dashicons-plus-alt2"></span>
            <span>New Chat Bot</span>
          </button>
          <button
            className="flowchat-quick-action"
            onClick={() => onNavigate('templates')}
          >
            <span className="dashicons dashicons-layout"></span>
            <span>Browse Templates</span>
          </button>
          <button
            className="flowchat-quick-action"
            onClick={() => onNavigate('settings')}
          >
            <span className="dashicons dashicons-admin-generic"></span>
            <span>Settings</span>
          </button>
          <button
            className="flowchat-quick-action"
            onClick={() => onNavigate('tools')}
          >
            <span className="dashicons dashicons-admin-tools"></span>
            <span>Import / Export</span>
          </button>
        </div>
      </div>

      {/* Chat Bots List */}
      <div className="flowchat-dashboard-bots">
        <div className="flowchat-section-header">
          <h2>Your Chat Bots</h2>
          <button
            className="button"
            onClick={() => onNavigate('instances')}
          >
            View All
          </button>
        </div>

        {instances.length === 0 ? (
          <div className="flowchat-empty-state">
            <span className="dashicons dashicons-format-chat"></span>
            <h3>No chat bots yet</h3>
            <p>Create your first chat bot to get started.</p>
            <button
              className="button button-primary"
              onClick={() => onNavigate('instances', { action: 'new' })}
            >
              Create Chat Bot
            </button>
          </div>
        ) : (
          <div className="flowchat-bots-grid">
            {instances.slice(0, 6).map((instance) => {
              const status = getStatusLabel(instance);
              return (
                <div key={instance.id} className="flowchat-bot-card">
                  <div className="flowchat-bot-card-header">
                    <div
                      className="flowchat-bot-avatar"
                      style={{
                        backgroundColor: instance.primaryColor || '#3b82f6',
                      }}
                    >
                      {instance.avatarUrl ? (
                        <img src={instance.avatarUrl} alt="" />
                      ) : (
                        <span className="dashicons dashicons-format-chat"></span>
                      )}
                    </div>
                    <div className="flowchat-bot-info">
                      <h3>{instance.name}</h3>
                      <span className={`flowchat-bot-status ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <label className="flowchat-toggle">
                      <input
                        type="checkbox"
                        checked={instance.isEnabled}
                        onChange={() => handleToggleInstance(instance)}
                      />
                      <span className="flowchat-toggle-slider"></span>
                    </label>
                  </div>

                  <div className="flowchat-bot-card-meta">
                    <span className="flowchat-bot-meta-item">
                      <span className="dashicons dashicons-visibility"></span>
                      {getModeLabel(instance)}
                    </span>
                    {instance.targeting?.enabled && (
                      <span className="flowchat-bot-meta-item">
                        <span className="dashicons dashicons-filter"></span>
                        Targeted
                      </span>
                    )}
                  </div>

                  <div className="flowchat-bot-card-shortcode">
                    <code>[flowchat id="{instance.id}"]</code>
                  </div>

                  <div className="flowchat-bot-card-actions">
                    <button
                      className="button"
                      onClick={() => onNavigate('instances', { edit: instance.id })}
                    >
                      <span className="dashicons dashicons-edit"></span>
                      Edit
                    </button>
                    <button
                      className="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`[flowchat id="${instance.id}"]`);
                      }}
                    >
                      <span className="dashicons dashicons-clipboard"></span>
                      Copy Shortcode
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Getting Started Guide */}
      {instances.length === 0 && (
        <div className="flowchat-getting-started">
          <h2>Getting Started</h2>
          <div className="flowchat-steps">
            <div className="flowchat-step">
              <div className="flowchat-step-number">1</div>
              <div className="flowchat-step-content">
                <h3>Create a Chat Bot</h3>
                <p>
                  Set up your first chat bot by clicking "Create Your First Chat Bot"
                  above or navigating to Chat Bots → Add New.
                </p>
              </div>
            </div>
            <div className="flowchat-step">
              <div className="flowchat-step-number">2</div>
              <div className="flowchat-step-content">
                <h3>Configure n8n Webhook</h3>
                <p>
                  Enter your n8n webhook URL. Create a workflow in n8n with a
                  Chat Trigger node to handle conversations.
                </p>
              </div>
            </div>
            <div className="flowchat-step">
              <div className="flowchat-step-number">3</div>
              <div className="flowchat-step-content">
                <h3>Add to Your Site</h3>
                <p>
                  Use the shortcode <code>[flowchat]</code> in any page or post,
                  or enable bubble mode for site-wide display.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
