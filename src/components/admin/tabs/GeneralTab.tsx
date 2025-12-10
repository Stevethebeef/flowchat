/**
 * GeneralTab Component
 *
 * General settings tab for the instance editor.
 */

import React, { useState } from 'react';
import type { AdminInstance } from '../../../types';

interface GeneralTabProps {
  instance: Partial<AdminInstance>;
  updateField: (path: string, value: unknown) => void;
  instanceId: string | null;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  instance,
  updateField,
  instanceId,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const shortcode = instanceId ? `[flowchat id="${instanceId}"]` : '[flowchat]';
  const phpFunction = instanceId
    ? `<?php flowchat_render('${instanceId}'); ?>`
    : '<?php flowchat_render(); ?>';

  return (
    <div className="flowchat-tab-content">
      <div className="flowchat-section">
        <h2 className="flowchat-section-title">General Settings</h2>

        {/* Name */}
        <div className="flowchat-field">
          <label htmlFor="fc-name">
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="fc-name"
            value={instance.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            className="regular-text"
            placeholder="e.g., Support Bot"
          />
          <p className="description">
            Internal name for organization. This won't be visible to visitors.
          </p>
        </div>

        {/* Status */}
        <div className="flowchat-field">
          <label>Status</label>
          <div className="flowchat-radio-group">
            <label className="flowchat-radio">
              <input
                type="radio"
                name="status"
                checked={instance.isEnabled === true}
                onChange={() => updateField('isEnabled', true)}
              />
              <span className="flowchat-radio-label">
                <span className="flowchat-status-dot flowchat-status-active"></span>
                Active
              </span>
            </label>
            <label className="flowchat-radio">
              <input
                type="radio"
                name="status"
                checked={instance.isEnabled === false}
                onChange={() => updateField('isEnabled', false)}
              />
              <span className="flowchat-radio-label">
                <span className="flowchat-status-dot flowchat-status-inactive"></span>
                Inactive
              </span>
            </label>
          </div>
          <p className="description">
            When inactive, the chat will not appear on your site.
          </p>
        </div>

        {/* Default Instance */}
        <div className="flowchat-field">
          <label className="flowchat-checkbox">
            <input
              type="checkbox"
              checked={instance.isDefault || false}
              onChange={(e) => updateField('isDefault', e.target.checked)}
            />
            <span>Set as default instance</span>
          </label>
          <p className="description">
            The default instance is used when no specific ID is provided in the shortcode.
          </p>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="flowchat-section">
        <button
          type="button"
          className="flowchat-toggle-advanced"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
        >
          <span className={`dashicons ${showAdvanced ? 'dashicons-arrow-down-alt2' : 'dashicons-arrow-right-alt2'}`}></span>
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="flowchat-advanced-content">
            {/* Slug */}
            <div className="flowchat-field">
              <label htmlFor="fc-slug">Slug</label>
              <input
                type="text"
                id="fc-slug"
                value={instanceId || 'Auto-generated on save'}
                readOnly
                className="regular-text code"
                disabled
              />
              <p className="description">
                URL-friendly identifier (auto-generated from name).
              </p>
            </div>

            {/* Shortcode */}
            <div className="flowchat-field">
              <label>Shortcode</label>
              <div className="flowchat-copy-field">
                <code className="flowchat-code-display">{shortcode}</code>
                <button
                  type="button"
                  className="button button-small"
                  onClick={() => copyToClipboard(shortcode, 'shortcode')}
                >
                  {copied === 'shortcode' ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <p className="description">
                Add this to any page or post to display the chat.
              </p>
            </div>

            {/* PHP Function */}
            <div className="flowchat-field">
              <label>PHP Function</label>
              <div className="flowchat-copy-field">
                <code className="flowchat-code-display">{phpFunction}</code>
                <button
                  type="button"
                  className="button button-small"
                  onClick={() => copyToClipboard(phpFunction, 'php')}
                >
                  {copied === 'php' ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <p className="description">
                Use in theme templates to render the chat programmatically.
              </p>
            </div>

            {/* System Prompt */}
            <div className="flowchat-field">
              <label htmlFor="fc-system-prompt">System Prompt (Meta-Prompt)</label>
              <textarea
                id="fc-system-prompt"
                value={instance.systemPrompt || ''}
                onChange={(e) => updateField('systemPrompt', e.target.value)}
                rows={4}
                className="large-text"
                placeholder="Additional context sent with every message to n8n..."
              />
              <p className="description">
                This text is sent to n8n with each request. Use dynamic tags like{' '}
                <code>{'{site_name}'}</code>, <code>{'{user_name}'}</code>,{' '}
                <code>{'{current_page_title}'}</code>.
              </p>
            </div>

            {/* Available Dynamic Tags */}
            <div className="flowchat-field">
              <label>Available Dynamic Tags</label>
              <div className="flowchat-tags-list">
                <span className="flowchat-tag" onClick={() => copyToClipboard('{site_name}', 'tag1')}>
                  {'{site_name}'}
                </span>
                <span className="flowchat-tag" onClick={() => copyToClipboard('{site_url}', 'tag2')}>
                  {'{site_url}'}
                </span>
                <span className="flowchat-tag" onClick={() => copyToClipboard('{user_name}', 'tag3')}>
                  {'{user_name}'}
                </span>
                <span className="flowchat-tag" onClick={() => copyToClipboard('{user_email}', 'tag4')}>
                  {'{user_email}'}
                </span>
                <span className="flowchat-tag" onClick={() => copyToClipboard('{user_role}', 'tag5')}>
                  {'{user_role}'}
                </span>
                <span className="flowchat-tag" onClick={() => copyToClipboard('{current_page_title}', 'tag6')}>
                  {'{current_page_title}'}
                </span>
                <span className="flowchat-tag" onClick={() => copyToClipboard('{current_page_url}', 'tag7')}>
                  {'{current_page_url}'}
                </span>
                <span className="flowchat-tag" onClick={() => copyToClipboard('{current_date}', 'tag8')}>
                  {'{current_date}'}
                </span>
                <span className="flowchat-tag" onClick={() => copyToClipboard('{current_time}', 'tag9')}>
                  {'{current_time}'}
                </span>
              </div>
              <p className="description">
                Click a tag to copy it. Tags are replaced with actual values when sent to n8n.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralTab;
