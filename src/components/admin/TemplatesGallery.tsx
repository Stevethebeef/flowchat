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
  { id: 'all', label: 'All Templates' },
  { id: 'customer_support', label: 'Customer Support' },
  { id: 'sales', label: 'Sales' },
  { id: 'lead_generation', label: 'Lead Generation' },
  { id: 'faq', label: 'FAQ Bots' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'custom', label: 'My Templates' },
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
        `${(window as any).flowchatAdmin.apiUrl}/templates`,
        {
          headers: {
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data);
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
        `${(window as any).flowchatAdmin.apiUrl}/instances`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': (window as any).flowchatAdmin.nonce,
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
      <div className="flowchat-templates">
        <div className="flowchat-loading">
          <div className="flowchat-loading-spinner" />
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flowchat-templates">
      {/* Header */}
      <div className="flowchat-page-header">
        <div className="flowchat-page-header-content">
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
      <div className="flowchat-templates-filters">
        <div className="flowchat-templates-search">
          <span className="dashicons dashicons-search"></span>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flowchat-templates-categories">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`flowchat-category-btn ${
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
        <div className="flowchat-empty-state">
          <span className="dashicons dashicons-layout"></span>
          <h3>No templates found</h3>
          <p>
            {searchQuery
              ? 'Try a different search term.'
              : 'No templates in this category.'}
          </p>
        </div>
      ) : (
        <div className="flowchat-templates-grid">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="flowchat-template-card">
              <div className="flowchat-template-preview">
                {template.thumbnail ? (
                  <img src={template.thumbnail} alt={template.name} />
                ) : (
                  <div className="flowchat-template-preview-placeholder">
                    <span className="flowchat-template-icon">
                      {CATEGORY_ICONS[template.category] || '💬'}
                    </span>
                  </div>
                )}
                {!template.isBuiltIn && (
                  <span className="flowchat-template-badge">Custom</span>
                )}
              </div>

              <div className="flowchat-template-info">
                <h3>{template.name}</h3>
                <p>{template.description}</p>

                {template.tags.length > 0 && (
                  <div className="flowchat-template-tags">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="flowchat-template-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flowchat-template-actions">
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
          className="flowchat-modal-overlay"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="flowchat-modal flowchat-template-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flowchat-modal-header">
              <h2>{previewTemplate.name}</h2>
              <button
                className="flowchat-modal-close"
                onClick={() => setPreviewTemplate(null)}
              >
                <span className="dashicons dashicons-no-alt"></span>
              </button>
            </div>

            <div className="flowchat-modal-body">
              <div className="flowchat-template-detail">
                <div className="flowchat-template-detail-preview">
                  {previewTemplate.thumbnail ? (
                    <img src={previewTemplate.thumbnail} alt="" />
                  ) : (
                    <div className="flowchat-template-preview-placeholder large">
                      <span className="flowchat-template-icon">
                        {CATEGORY_ICONS[previewTemplate.category] || '💬'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flowchat-template-detail-info">
                  <p className="flowchat-template-detail-description">
                    {previewTemplate.description}
                  </p>

                  <div className="flowchat-template-detail-meta">
                    <div className="flowchat-template-meta-item">
                      <strong>Category:</strong>
                      <span>
                        {CATEGORIES.find((c) => c.id === previewTemplate.category)
                          ?.label || previewTemplate.category}
                      </span>
                    </div>

                    <div className="flowchat-template-meta-item">
                      <strong>Type:</strong>
                      <span>
                        {previewTemplate.isBuiltIn ? 'Built-in' : 'Custom'}
                      </span>
                    </div>
                  </div>

                  {previewTemplate.tags.length > 0 && (
                    <div className="flowchat-template-detail-tags">
                      <strong>Tags:</strong>
                      <div className="flowchat-template-tags">
                        {previewTemplate.tags.map((tag) => (
                          <span key={tag} className="flowchat-template-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <h4>Includes:</h4>
                  <ul className="flowchat-template-features">
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

            <div className="flowchat-modal-footer">
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
