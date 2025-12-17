/**
 * Dashboard Component
 *
 * Main dashboard page with welcome banner, stats, quick actions, and bot list.
 */

import React, { useState, useEffect } from 'react';
import type { AdminInstance } from '../../types';
import { useAdminI18n } from '../../hooks/useAdminI18n';

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
  const { t } = useAdminI18n();
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
        `${(window as any).n8nChatAdmin.apiUrl}/instances`,
        {
          headers: {
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
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
          `${(window as any).n8nChatAdmin.apiUrl}/sessions?per_page=1`,
          {
            headers: {
              'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
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

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to toggle instance:', err);
    }
  };

  const getStatusLabel = (instance: AdminInstance) => {
    if (!instance.isEnabled) {
      return { label: t('inactive', 'Inactive'), className: 'status-inactive' };
    }
    return { label: t('active', 'Active'), className: 'status-active' };
  };

  const getModeLabel = (instance: AdminInstance) => {
    return instance.bubble?.enabled ? t('bubble', 'Bubble') : t('inline', 'Inline');
  };

  if (loading) {
    return (
      <div className="n8n-chat-dashboard">
        <div className="n8n-chat-loading">
          <div className="n8n-chat-loading-spinner" />
          <p>{t('loadingDashboard', 'Loading dashboard...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="n8n-chat-dashboard">
      {/* Welcome Banner */}
      <div className="n8n-chat-welcome-banner">
        <div className="n8n-chat-welcome-content">
          <h1>{t('welcomeToN8nChat', 'Welcome to n8n Chat')}</h1>
          <p>
            Connect your WordPress site to n8n AI workflows with beautiful,
            customizable chat widgets.
          </p>
        </div>
        <div className="n8n-chat-welcome-actions">
          <button
            className="button button-primary button-hero"
            onClick={() => onNavigate('instances', { action: 'new' })}
          >
            <span className="dashicons dashicons-plus-alt2"></span>
            {t('createFirstInstance', 'Create Your First Chat Bot')}
          </button>
          <a
            href="https://docs.n8n-chat.dev/getting-started"
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
      <div className="n8n-chat-stats-grid">
        <div className="n8n-chat-stat-card">
          <div className="n8n-chat-stat-icon">
            <span className="dashicons dashicons-format-chat"></span>
          </div>
          <div className="n8n-chat-stat-content">
            <span className="n8n-chat-stat-value">{stats.totalBots}</span>
            <span className="n8n-chat-stat-label">{t('totalChatBots', 'Total Chat Bots')}</span>
          </div>
        </div>

        <div className="n8n-chat-stat-card">
          <div className="n8n-chat-stat-icon n8n-chat-stat-icon-success">
            <span className="dashicons dashicons-yes-alt"></span>
          </div>
          <div className="n8n-chat-stat-content">
            <span className="n8n-chat-stat-value">{stats.activeBots}</span>
            <span className="n8n-chat-stat-label">{t('activeBots', 'Active Bots')}</span>
          </div>
        </div>

        <div className="n8n-chat-stat-card">
          <div className="n8n-chat-stat-icon n8n-chat-stat-icon-info">
            <span className="dashicons dashicons-admin-comments"></span>
          </div>
          <div className="n8n-chat-stat-content">
            <span className="n8n-chat-stat-value">{stats.totalChats}</span>
            <span className="n8n-chat-stat-label">{t('totalConversations', 'Total Conversations')}</span>
          </div>
        </div>

        <div className="n8n-chat-stat-card">
          <div className="n8n-chat-stat-icon n8n-chat-stat-icon-warning">
            <span className="dashicons dashicons-clock"></span>
          </div>
          <div className="n8n-chat-stat-content">
            <span className="n8n-chat-stat-value">{stats.todayChats}</span>
            <span className="n8n-chat-stat-label">{t('todaysChats', "Today's Chats")}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="n8n-chat-quick-actions">
        <h2>{t('quickActions', 'Quick Actions')}</h2>
        <div className="n8n-chat-quick-actions-grid">
          <button
            className="n8n-chat-quick-action"
            onClick={() => onNavigate('instances', { action: 'new' })}
          >
            <span className="dashicons dashicons-plus-alt2"></span>
            <span>{t('newInstance', 'New Chat Bot')}</span>
          </button>
          <button
            className="n8n-chat-quick-action"
            onClick={() => onNavigate('templates')}
          >
            <span className="dashicons dashicons-layout"></span>
            <span>Browse Templates</span>
          </button>
          <button
            className="n8n-chat-quick-action"
            onClick={() => onNavigate('settings')}
          >
            <span className="dashicons dashicons-admin-generic"></span>
            <span>Settings</span>
          </button>
          <button
            className="n8n-chat-quick-action"
            onClick={() => onNavigate('tools')}
          >
            <span className="dashicons dashicons-admin-tools"></span>
            <span>Import / Export</span>
          </button>
        </div>
      </div>

      {/* Chat Bots List */}
      <div className="n8n-chat-dashboard-bots">
        <div className="n8n-chat-section-header">
          <h2>{t('chatBots', 'Your Chat Bots')}</h2>
          <button
            className="button"
            onClick={() => onNavigate('instances')}
          >
            {t('viewAll', 'View All')}
          </button>
        </div>

        {instances.length === 0 ? (
          <div className="n8n-chat-empty-state">
            <span className="dashicons dashicons-format-chat"></span>
            <h3>{t('noChatBotsYet', 'No chat bots yet')}</h3>
            <p>{t('createYourFirstBot', 'Create your first chat bot to get started.')}</p>
            <button
              className="button button-primary"
              onClick={() => onNavigate('instances', { action: 'new' })}
            >
              {t('create', 'Create Chat Bot')}
            </button>
          </div>
        ) : (
          <div className="n8n-chat-bots-grid">
            {instances.slice(0, 6).map((instance) => {
              const status = getStatusLabel(instance);
              return (
                <div key={instance.id} className="n8n-chat-bot-card">
                  <div className="n8n-chat-bot-card-header">
                    <div
                      className="n8n-chat-bot-avatar"
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
                    <div className="n8n-chat-bot-info">
                      <h3>{instance.name}</h3>
                      <span className={`n8n-chat-bot-status ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <label className="n8n-chat-toggle">
                      <input
                        type="checkbox"
                        checked={instance.isEnabled}
                        onChange={() => handleToggleInstance(instance)}
                      />
                      <span className="n8n-chat-toggle-slider"></span>
                    </label>
                  </div>

                  <div className="n8n-chat-bot-card-meta">
                    <span className="n8n-chat-bot-meta-item">
                      <span className="dashicons dashicons-visibility"></span>
                      {getModeLabel(instance)}
                    </span>
                    {instance.targeting?.enabled && (
                      <span className="n8n-chat-bot-meta-item">
                        <span className="dashicons dashicons-filter"></span>
                        Targeted
                      </span>
                    )}
                  </div>

                  <div className="n8n-chat-bot-card-shortcode">
                    <code>[n8n-chat id="{instance.id}"]</code>
                  </div>

                  <div className="n8n-chat-bot-card-actions">
                    <button
                      className="button"
                      onClick={() => onNavigate('instances', { edit: instance.id })}
                    >
                      <span className="dashicons dashicons-edit"></span>
                      {t('edit', 'Edit')}
                    </button>
                    <button
                      className="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`[n8n-chat id="${instance.id}"]`);
                      }}
                    >
                      <span className="dashicons dashicons-clipboard"></span>
                      {t('copy', 'Copy')} {t('shortcode', 'Shortcode')}
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
        <div className="n8n-chat-getting-started">
          <h2>{t('gettingStarted', 'Getting Started')}</h2>
          <div className="n8n-chat-steps">
            <div className="n8n-chat-step">
              <div className="n8n-chat-step-number">1</div>
              <div className="n8n-chat-step-content">
                <h3>Create a Chat Bot</h3>
                <p>
                  Set up your first chat bot by clicking "Create Your First Chat Bot"
                  above or navigating to Chat Bots → Add New.
                </p>
              </div>
            </div>
            <div className="n8n-chat-step">
              <div className="n8n-chat-step-number">2</div>
              <div className="n8n-chat-step-content">
                <h3>Configure n8n Webhook</h3>
                <p>
                  Enter your n8n webhook URL. Create a workflow in n8n with a
                  Chat Trigger node to handle conversations.
                </p>
              </div>
            </div>
            <div className="n8n-chat-step">
              <div className="n8n-chat-step-number">3</div>
              <div className="n8n-chat-step-content">
                <h3>Add to Your Site</h3>
                <p>
                  Use the shortcode <code>[n8n-chat]</code> in any page or post,
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
