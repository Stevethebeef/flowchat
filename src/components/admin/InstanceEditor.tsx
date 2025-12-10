/**
 * InstanceEditor Component
 *
 * Tabbed form for creating/editing chat instances with live preview.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminInstance } from '../../types';
import { GeneralTab } from './tabs/GeneralTab';
import { ConnectionTab } from './tabs/ConnectionTab';
import { DisplayTab } from './tabs/DisplayTab';
import { MessagesTab } from './tabs/MessagesTab';
import { AppearanceTab } from './tabs/AppearanceTab';
import { RulesTab } from './tabs/RulesTab';
import { LivePreview } from './LivePreview';

interface InstanceEditorProps {
  instanceId: string | null;
  onBack: () => void;
  onSaved: () => void;
}

type TabId = 'general' | 'connection' | 'display' | 'messages' | 'appearance' | 'rules';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'connection', label: 'Connection', icon: '🔗' },
  { id: 'display', label: 'Display', icon: '📱' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'rules', label: 'Rules', icon: '📋' },
];

// Default instance configuration
export const defaultInstance: Partial<AdminInstance> = {
  name: 'New Chat',
  webhookUrl: '',
  isEnabled: false,
  isDefault: false,
  theme: 'light',
  colorSource: 'custom',
  primaryColor: '#3b82f6',
  stylePreset: '',
  customCss: '',
  welcomeMessage: 'Hi! 👋 How can I help you today?',
  placeholderText: 'Type your message...',
  chatTitle: 'Chat',
  systemPrompt: '',
  suggestedPrompts: [],
  showHeader: true,
  showTimestamp: false,
  showAvatar: true,
  avatarUrl: '',
  bubble: {
    enabled: false,
    icon: 'chat',
    customIconUrl: '',
    text: '',
    position: 'bottom-right',
    offsetX: 24,
    offsetY: 24,
    size: 'medium',
    showUnreadBadge: true,
    pulseAnimation: true,
  },
  window: {
    width: 400,
    height: 600,
  },
  autoOpen: {
    enabled: false,
    trigger: 'delay',
    delay: 5000,
    scrollPercentage: 50,
    idleTime: 30000,
    conditions: {
      oncePerSession: true,
      oncePerDay: false,
      skipIfInteracted: true,
      loggedInOnly: false,
      guestOnly: false,
      excludeMobile: false,
    },
  },
  targeting: {
    enabled: false,
    mode: 'all',
    priority: 0,
    rules: [],
  },
  access: {
    requireLogin: false,
    allowedRoles: [],
    deniedMessage: 'Please log in to use this chat.',
  },
  features: {
    fileUpload: false,
    fileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFileSize: 10485760,
    showTypingIndicator: true,
    enableHistory: true,
    enableFeedback: false,
  },
  fallback: {
    enabled: true,
    email: '',
    message: 'Our chat is temporarily unavailable. Please leave a message.',
  },
  connection: {
    auth: 'none',
    username: '',
    password: '',
    bearerToken: '',
    enableStreaming: true,
    timeout: 30,
    chatInputKey: 'chatInput',
    sessionKey: 'sessionId',
  },
  messages: {
    showWelcomeScreen: true,
    connectionError: 'Sorry, I\'m having trouble connecting. Please try again in a moment.',
    timeoutError: 'The request took too long. Please try again.',
    rateLimitError: 'You\'re sending messages too quickly. Please wait a moment.',
  },
  appearance: {
    userBubbleColor: '#3b82f6',
    botBubbleColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    headerBackground: '#3b82f6',
    fontFamily: 'system',
    fontSize: 'medium',
    borderRadius: 12,
  },
  schedule: {
    enabled: false,
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'site',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    outsideHoursMessage: 'We\'re currently offline. Leave a message and we\'ll respond when we\'re back online.',
  },
  devices: {
    desktop: true,
    tablet: true,
    mobile: true,
  },
};

export const InstanceEditor: React.FC<InstanceEditorProps> = ({
  instanceId,
  onBack,
  onSaved,
}) => {
  const [instance, setInstance] = useState<Partial<AdminInstance>>(defaultInstance);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [loading, setLoading] = useState(!!instanceId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const isEditing = !!instanceId;

  // Fetch instance if editing
  useEffect(() => {
    if (instanceId) {
      fetchInstance(instanceId);
    }
  }, [instanceId]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchInstance = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${(window as any).flowchatAdmin.apiUrl}/instances/${id}`,
        {
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch instance');
      }

      const data = await response.json();
      // Merge with defaults to ensure all fields exist
      setInstance({ ...defaultInstance, ...data });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update field with dot notation support
  const updateField = useCallback((path: string, value: unknown) => {
    setInstance((prev) => {
      const newInstance = JSON.parse(JSON.stringify(prev)); // Deep clone
      const parts = path.split('.');
      let current: Record<string, unknown> = newInstance;

      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }

      current[parts[parts.length - 1]] = value;
      return newInstance;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Save instance
  const handleSave = async (activate = false) => {
    setSaving(true);
    setError(null);

    try {
      const dataToSave = { ...instance };
      if (activate) {
        dataToSave.isEnabled = true;
      }

      const url = isEditing
        ? `${(window as any).flowchatAdmin.apiUrl}/instances/${instanceId}`
        : `${(window as any).flowchatAdmin.apiUrl}/instances`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save');
      }

      setHasUnsavedChanges(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Handle back with unsaved changes check
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  // Render active tab content
  const renderTabContent = () => {
    const tabProps = { instance, updateField };

    switch (activeTab) {
      case 'general':
        return <GeneralTab {...tabProps} instanceId={instanceId} />;
      case 'connection':
        return <ConnectionTab {...tabProps} />;
      case 'display':
        return <DisplayTab {...tabProps} />;
      case 'messages':
        return <MessagesTab {...tabProps} />;
      case 'appearance':
        return <AppearanceTab {...tabProps} />;
      case 'rules':
        return <RulesTab {...tabProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flowchat-instance-editor">
        <div className="flowchat-loading">
          <div className="flowchat-loading-spinner" />
          <p>Loading instance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flowchat-instance-editor">
      {/* Header */}
      <div className="flowchat-editor-header">
        <button className="button flowchat-back-button" onClick={handleBack}>
          <span className="dashicons dashicons-arrow-left-alt"></span>
          Back to Chat Bots
        </button>
        <div className="flowchat-editor-title">
          <h1>{isEditing ? `Edit: ${instance.name}` : 'Create New Chat Bot'}</h1>
          {hasUnsavedChanges && (
            <span className="flowchat-unsaved-badge">Unsaved changes</span>
          )}
        </div>
      </div>

      {error && (
        <div className="notice notice-error is-dismissible">
          <p>{error}</p>
          <button type="button" className="notice-dismiss" onClick={() => setError(null)}>
            <span className="screen-reader-text">Dismiss</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flowchat-editor-layout">
        {/* Left: Form */}
        <div className="flowchat-editor-form">
          {/* Tabs */}
          <div className="flowchat-editor-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                className={`flowchat-editor-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="flowchat-tab-icon">{tab.icon}</span>
                <span className="flowchat-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div
            className="flowchat-editor-panel"
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={activeTab}
          >
            {renderTabContent()}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flowchat-editor-preview">
          <div className="flowchat-preview-header">
            <h3>Live Preview</h3>
            <div className="flowchat-preview-toggle">
              <button
                className={`flowchat-preview-btn ${previewMode === 'desktop' ? 'is-active' : ''}`}
                onClick={() => setPreviewMode('desktop')}
                title="Desktop preview"
              >
                <span className="dashicons dashicons-desktop"></span>
              </button>
              <button
                className={`flowchat-preview-btn ${previewMode === 'mobile' ? 'is-active' : ''}`}
                onClick={() => setPreviewMode('mobile')}
                title="Mobile preview"
              >
                <span className="dashicons dashicons-smartphone"></span>
              </button>
            </div>
          </div>
          <LivePreview instance={instance} mode={previewMode} />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flowchat-editor-footer">
        <div className="flowchat-footer-left">
          {instanceId && (
            <code className="flowchat-shortcode-display">
              [flowchat id="{instanceId}"]
            </code>
          )}
        </div>
        <div className="flowchat-footer-right">
          <button className="button" onClick={handleBack} disabled={saving}>
            Cancel
          </button>
          <button
            className="button"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            className="button button-primary"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Save & Update' : 'Save & Activate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstanceEditor;
