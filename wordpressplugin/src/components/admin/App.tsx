/**
 * Admin App Component
 *
 * Main admin application shell with routing to all pages.
 */

import React, { useState, useEffect } from 'react';
import { InstanceList } from './InstanceList';
import { InstanceEditor } from './InstanceEditor';
import { Dashboard } from './Dashboard';
import { TemplatesGallery } from './TemplatesGallery';
import { GlobalSettings } from './GlobalSettings';
import { Tools } from './Tools';

interface AdminAppProps {
  initialPage: string;
}

type Page = 'dashboard' | 'instances' | 'templates' | 'settings' | 'tools';
type View = 'list' | 'edit' | 'create';

export const AdminApp: React.FC<AdminAppProps> = ({ initialPage }) => {
  const [page, setPage] = useState<Page>(initialPage as Page);
  const [view, setView] = useState<View>('list');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle URL params for direct linking
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const instanceId = urlParams.get('id');
    const edit = urlParams.get('edit');

    if (action === 'edit' && instanceId) {
      setView('edit');
      setSelectedInstanceId(instanceId);
    } else if (edit) {
      setView('edit');
      setSelectedInstanceId(edit);
    } else if (action === 'create' || action === 'new') {
      setView('create');
      setSelectedInstanceId(null);
    }
  }, []);

  // Navigate to a page
  const handleNavigate = (newPage: string, params?: Record<string, string>) => {
    // Handle WordPress admin page navigation
    const wpPageMap: Record<string, string> = {
      dashboard: 'n8n-chat',
      instances: 'n8n-chat-instances',
      templates: 'n8n-chat-templates',
      settings: 'n8n-chat-settings',
      tools: 'n8n-chat-tools',
    };

    const wpPage = wpPageMap[newPage] || wpPageMap.dashboard;
    const url = new URL(window.location.href);
    url.searchParams.set('page', wpPage);

    // Clear existing params
    url.searchParams.delete('action');
    url.searchParams.delete('id');
    url.searchParams.delete('edit');

    // Add new params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (key === 'edit') {
          url.searchParams.set('edit', value);
        } else {
          url.searchParams.set(key, value);
        }
      });
    }

    // Navigate
    window.location.href = url.toString();
  };

  // Edit instance
  const handleEditInstance = (instanceId: string) => {
    setSelectedInstanceId(instanceId);
    setView('edit');
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('action', 'edit');
    url.searchParams.set('id', instanceId);
    window.history.pushState({}, '', url.toString());
  };

  // Create new instance
  const handleCreateInstance = () => {
    setSelectedInstanceId(null);
    setView('create');
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('action', 'create');
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.toString());
  };

  // Back to list
  const handleBackToList = () => {
    setView('list');
    setSelectedInstanceId(null);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.delete('action');
    url.searchParams.delete('id');
    url.searchParams.delete('edit');
    window.history.pushState({}, '', url.toString());
  };

  // Render page content
  const renderContent = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;

      case 'instances':
        if (view === 'edit' || view === 'create') {
          return (
            <InstanceEditor
              instanceId={selectedInstanceId}
              onBack={handleBackToList}
              onSaved={handleBackToList}
            />
          );
        }
        return (
          <InstanceList
            onEdit={handleEditInstance}
            onCreate={handleCreateInstance}
          />
        );

      case 'templates':
        return <TemplatesGallery onNavigate={handleNavigate} />;

      case 'settings':
        return <GlobalSettings />;

      case 'tools':
        return <Tools />;

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="n8n-chat-admin">
      {error && (
        <div className="notice notice-error is-dismissible">
          <p>{error}</p>
          <button
            type="button"
            className="notice-dismiss"
            onClick={() => setError(null)}
          >
            <span className="screen-reader-text">Dismiss</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="n8n-chat-admin-loading">
          <div className="n8n-chat-loading-spinner" />
        </div>
      )}

      <div className="n8n-chat-admin-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminApp;
