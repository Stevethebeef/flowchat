/**
 * TemplatesGallery Component
 *
 * Browse and apply pre-built chat bot templates.
 */

import React, { useState, useEffect } from 'react';

interface TemplatesGalleryProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  config: Record<string, unknown>;
  tags: string[];
  isBuiltIn: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: '📋' },
  { id: 'customer_support', label: 'Customer Support', icon: '🎧' },
  { id: 'sales', label: 'Sales', icon: '💰' },
  { id: 'lead_generation', label: 'Lead Generation', icon: '📊' },
  { id: 'faq', label: 'FAQ & Knowledge', icon: '❓' },
  { id: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { id: 'custom', label: 'My Templates', icon: '⭐' },
];

// Default category icons
const CATEGORY_ICONS: Record<string, string> = {
  customer_support: '🎧',
  sales: '💰',
  lead_generation: '📊',
  faq: '❓',
  ecommerce: '🛒',
  technical_support: '🔧',
  hr_assistant: '👥',
  booking: '📅',
  feedback: '📝',
  onboarding: '🚀',
  custom: '⭐',
};

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({ onNavigate }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${(window as any).n8nChatAdmin.publicApiUrl}/templates`,
        {
          headers: {
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();

      // API returns { success: true, templates: [...] }
      if (data.success && Array.isArray(data.templates)) {
        // Transform backend format to frontend format
        const transformedTemplates = data.templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          category: t.category || 'custom',
          thumbnail: t.thumbnail,
          config: t.config || {},
          tags: t.tags || [],
          isBuiltIn: !t.custom,
        }));
        setTemplates(transformedTemplates);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      // Create a new instance with template config
      const response = await fetch(
        `${(window as any).n8nChatAdmin.apiUrl}/instances`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
          },
          body: JSON.stringify({
            ...template.config,
            name: `${template.name} (Copy)`,
            isEnabled: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create instance from template');
      }

      const newInstance = await response.json();
      onNavigate('instances', { edit: newInstance.id });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to use template');
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      template.category === selectedCategory ||
      (selectedCategory === 'custom' && !template.isBuiltIn);

    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="n8n-chat-templates">
        <div className="n8n-chat-loading">
          <div className="n8n-chat-loading-spinner" />
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="n8n-chat-templates">
      {/* Header */}
      <div className="n8n-chat-page-header">
        <div className="n8n-chat-page-header-content">
          <h1>Template Gallery</h1>
          <p>
            Choose a pre-built template to quickly create a new chat bot.
            Customize it after to match your needs.
          </p>
        </div>
      </div>

      {error && (
        <div className="notice notice-error">
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="n8n-chat-templates-filters">
        <div className="n8n-chat-templates-search">
          <span className="dashicons dashicons-search"></span>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="n8n-chat-templates-categories">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`n8n-chat-category-btn ${
                selectedCategory === category.id ? 'is-active' : ''
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="n8n-chat-empty-state">
          <span className="dashicons dashicons-layout"></span>
          <h3>No templates found</h3>
          <p>
            {searchQuery
              ? 'Try a different search term.'
              : 'No templates in this category.'}
          </p>
        </div>
      ) : (
        <div className="n8n-chat-templates-grid">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="n8n-chat-template-card">
              <div className="n8n-chat-template-preview">
                {template.thumbnail ? (
                  <img src={template.thumbnail} alt={template.name} />
                ) : (
                  <div className="n8n-chat-template-preview-placeholder">
                    <span className="n8n-chat-template-icon">
                      {CATEGORY_ICONS[template.category] || '💬'}
                    </span>
                  </div>
                )}
                {!template.isBuiltIn && (
                  <span className="n8n-chat-template-badge">Custom</span>
                )}
              </div>

              <div className="n8n-chat-template-info">
                <h3>{template.name}</h3>
                <p>{template.description}</p>

                {template.tags.length > 0 && (
                  <div className="n8n-chat-template-tags">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="n8n-chat-template-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="n8n-chat-template-actions">
                <button
                  className="button"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <span className="dashicons dashicons-visibility"></span>
                  Preview
                </button>
                <button
                  className="button button-primary"
                  onClick={() => handleUseTemplate(template)}
                >
                  <span className="dashicons dashicons-plus-alt2"></span>
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="n8n-chat-modal-overlay"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="n8n-chat-modal n8n-chat-template-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="n8n-chat-modal-header">
              <h2>{previewTemplate.name}</h2>
              <button
                className="n8n-chat-modal-close"
                onClick={() => setPreviewTemplate(null)}
              >
                <span className="dashicons dashicons-no-alt"></span>
              </button>
            </div>

            <div className="n8n-chat-modal-body">
              <div className="n8n-chat-template-detail">
                <div className="n8n-chat-template-detail-preview">
                  {previewTemplate.thumbnail ? (
                    <img src={previewTemplate.thumbnail} alt="" />
                  ) : (
                    <div className="n8n-chat-template-preview-placeholder large">
                      <span className="n8n-chat-template-icon">
                        {CATEGORY_ICONS[previewTemplate.category] || '💬'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="n8n-chat-template-detail-info">
                  <p className="n8n-chat-template-detail-description">
                    {previewTemplate.description}
                  </p>

                  <div className="n8n-chat-template-detail-meta">
                    <div className="n8n-chat-template-meta-item">
                      <strong>Category:</strong>
                      <span>
                        {CATEGORIES.find((c) => c.id === previewTemplate.category)
                          ?.label || previewTemplate.category}
                      </span>
                    </div>

                    <div className="n8n-chat-template-meta-item">
                      <strong>Type:</strong>
                      <span>
                        {previewTemplate.isBuiltIn ? 'Built-in' : 'Custom'}
                      </span>
                    </div>
                  </div>

                  {previewTemplate.tags.length > 0 && (
                    <div className="n8n-chat-template-detail-tags">
                      <strong>Tags:</strong>
                      <div className="n8n-chat-template-tags">
                        {previewTemplate.tags.map((tag) => (
                          <span key={tag} className="n8n-chat-template-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <h4>Includes:</h4>
                  <ul className="n8n-chat-template-features">
                    <li>
                      <span className="dashicons dashicons-yes"></span>
                      Pre-configured welcome message
                    </li>
                    <li>
                      <span className="dashicons dashicons-yes"></span>
                      Suggested prompts for common questions
                    </li>
                    <li>
                      <span className="dashicons dashicons-yes"></span>
                      Optimized styling and colors
                    </li>
                    <li>
                      <span className="dashicons dashicons-yes"></span>
                      System prompt template
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="n8n-chat-modal-footer">
              <button
                className="button"
                onClick={() => setPreviewTemplate(null)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
              >
                <span className="dashicons dashicons-plus-alt2"></span>
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesGallery;
