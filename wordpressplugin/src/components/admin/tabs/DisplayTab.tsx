/**
 * DisplayTab Component
 *
 * Display mode and behavior settings tab for the instance editor.
 */

import React, { useState } from 'react';
import type { AdminInstance } from '../../../types';

interface DisplayTabProps {
  instance: Partial<AdminInstance>;
  updateField: (path: string, value: unknown) => void;
}

const BUBBLE_ICONS = [
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'robot', icon: '🤖', label: 'Robot' },
  { id: 'help', icon: '❓', label: 'Help' },
  { id: 'support', icon: '🎧', label: 'Support' },
  { id: 'sparkle', icon: '✨', label: 'Sparkle' },
  { id: 'custom', icon: '📷', label: 'Custom' },
];

const POSITION_OPTIONS = [
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'top-left', label: 'Top Left' },
];

const SIZE_OPTIONS = [
  { id: 'small', label: 'Small', px: '48px' },
  { id: 'medium', label: 'Medium', px: '56px' },
  { id: 'large', label: 'Large', px: '64px' },
];

export const DisplayTab: React.FC<DisplayTabProps> = ({
  instance,
  updateField,
}) => {
  const [showBehaviorAdvanced, setShowBehaviorAdvanced] = useState(false);

  const bubble = instance.bubble || {};
  const autoOpen = instance.autoOpen || {};
  const windowSettings = instance.window || {};
  const displayMode = bubble.enabled ? 'bubble' : 'inline';

  const handleModeChange = (mode: string) => {
    if (mode === 'bubble') {
      updateField('bubble.enabled', true);
      // Default to showing on all pages when bubble mode is first enabled
      if (!bubble.showOnAllPages) {
        updateField('bubble.showOnAllPages', true);
      }
    } else {
      updateField('bubble.enabled', false);
    }
  };

  return (
    <div className="n8n-chat-tab-content">
      {/* Display Mode */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">Display Mode</h2>

        <div className="n8n-chat-mode-selector">
          {/* Bubble Mode */}
          <div
            className={`n8n-chat-mode-card ${displayMode === 'bubble' ? 'is-selected' : ''}`}
            onClick={() => handleModeChange('bubble')}
          >
            <div className="n8n-chat-mode-preview">
              <div className="n8n-chat-mode-preview-bubble">
                <span>💬</span>
              </div>
            </div>
            <div className="n8n-chat-mode-info">
              <h4>Floating Bubble</h4>
              <p>Shows as a floating button that expands into a chat window.</p>
            </div>
            <div className="n8n-chat-mode-check">
              <span className="dashicons dashicons-yes"></span>
            </div>
          </div>

          {/* Inline Mode */}
          <div
            className={`n8n-chat-mode-card ${displayMode === 'inline' ? 'is-selected' : ''}`}
            onClick={() => handleModeChange('inline')}
          >
            <div className="n8n-chat-mode-preview">
              <div className="n8n-chat-mode-preview-inline">
                <div className="n8n-chat-mode-preview-header"></div>
                <div className="n8n-chat-mode-preview-messages">
                  <div className="n8n-chat-mode-preview-msg"></div>
                  <div className="n8n-chat-mode-preview-msg user"></div>
                </div>
              </div>
            </div>
            <div className="n8n-chat-mode-info">
              <h4>Inline Widget</h4>
              <p>Embeds directly in page content using shortcode placement.</p>
            </div>
            <div className="n8n-chat-mode-check">
              <span className="dashicons dashicons-yes"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bubble Settings - only show if bubble mode */}
      {displayMode === 'bubble' && (
        <div className="n8n-chat-section">
          <h2 className="n8n-chat-section-title">Bubble Settings</h2>

          {/* Show on All Pages - Site-wide toggle */}
          <div className="n8n-chat-field n8n-chat-toggle-field n8n-chat-highlight-field">
            <label className="n8n-chat-toggle">
              <input
                type="checkbox"
                checked={bubble.showOnAllPages === true}
                onChange={(e) => updateField('bubble.showOnAllPages', e.target.checked)}
              />
              <span className="n8n-chat-toggle-slider"></span>
              <span className="n8n-chat-toggle-label">
                <strong>Show on all pages</strong>
                <span className="n8n-chat-toggle-description">
                  Enable this to display the chat bubble on every page of your site automatically.
                  No shortcode needed!
                </span>
              </span>
            </label>
          </div>

          {/* Position */}
          <div className="n8n-chat-field">
            <label>Position</label>
            <div className="n8n-chat-position-selector">
              {POSITION_OPTIONS.map((pos) => (
                <label key={pos.id} className="n8n-chat-position-option">
                  <input
                    type="radio"
                    name="position"
                    checked={bubble.position === pos.id}
                    onChange={() => updateField('bubble.position', pos.id)}
                  />
                  <span className={`n8n-chat-position-preview ${pos.id}`}>
                    <span className="n8n-chat-position-dot"></span>
                  </span>
                  <span className="n8n-chat-position-label">{pos.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="n8n-chat-field">
            <label>Bubble Icon</label>
            <div className="n8n-chat-icon-selector">
              {BUBBLE_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  className={`n8n-chat-icon-option ${bubble.icon === icon.id ? 'is-selected' : ''}`}
                  onClick={() => updateField('bubble.icon', icon.id)}
                  title={icon.label}
                >
                  <span className="n8n-chat-icon-preview">{icon.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Icon URL */}
          {bubble.icon === 'custom' && (
            <div className="n8n-chat-field">
              <label htmlFor="fc-custom-icon">Custom Icon URL</label>
              <input
                type="url"
                id="fc-custom-icon"
                value={bubble.customIconUrl || ''}
                onChange={(e) => updateField('bubble.customIconUrl', e.target.value)}
                className="large-text"
                placeholder="https://example.com/icon.png"
              />
            </div>
          )}

          {/* Size */}
          <div className="n8n-chat-field">
            <label>Bubble Size</label>
            <div className="n8n-chat-size-selector">
              {SIZE_OPTIONS.map((size) => (
                <label key={size.id} className="n8n-chat-size-option">
                  <input
                    type="radio"
                    name="size"
                    checked={bubble.size === size.id}
                    onChange={() => updateField('bubble.size', size.id)}
                  />
                  <span className="n8n-chat-size-preview">
                    <span className={`n8n-chat-size-circle ${size.id}`}></span>
                    <span>{size.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Bubble Text */}
          <div className="n8n-chat-field">
            <label htmlFor="fc-bubble-text">Bubble Text (Optional)</label>
            <input
              type="text"
              id="fc-bubble-text"
              value={bubble.text || ''}
              onChange={(e) => updateField('bubble.text', e.target.value)}
              className="regular-text"
              placeholder="e.g., Chat with us!"
            />
            <p className="description">
              Text shown next to the bubble. Leave empty for icon only.
            </p>
          </div>

          {/* Bubble Options */}
          <div className="n8n-chat-field">
            <label className="n8n-chat-checkbox">
              <input
                type="checkbox"
                checked={bubble.pulseAnimation !== false}
                onChange={(e) => updateField('bubble.pulseAnimation', e.target.checked)}
              />
              <span>Pulse animation to attract attention</span>
            </label>
          </div>

          <div className="n8n-chat-field">
            <label className="n8n-chat-checkbox">
              <input
                type="checkbox"
                checked={bubble.showUnreadBadge !== false}
                onChange={(e) => updateField('bubble.showUnreadBadge', e.target.checked)}
              />
              <span>Show unread message badge</span>
            </label>
          </div>

          {/* Offset */}
          <div className="n8n-chat-field-row">
            <div className="n8n-chat-field">
              <label htmlFor="fc-offset-x">Horizontal Offset</label>
              <div className="n8n-chat-slider-field">
                <input
                  type="range"
                  id="fc-offset-x"
                  min={0}
                  max={100}
                  value={bubble.offsetX || 24}
                  onChange={(e) => updateField('bubble.offsetX', parseInt(e.target.value, 10))}
                />
                <span className="n8n-chat-slider-value">{bubble.offsetX || 24}px</span>
              </div>
            </div>
            <div className="n8n-chat-field">
              <label htmlFor="fc-offset-y">Vertical Offset</label>
              <div className="n8n-chat-slider-field">
                <input
                  type="range"
                  id="fc-offset-y"
                  min={0}
                  max={100}
                  value={bubble.offsetY || 24}
                  onChange={(e) => updateField('bubble.offsetY', parseInt(e.target.value, 10))}
                />
                <span className="n8n-chat-slider-value">{bubble.offsetY || 24}px</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Window Size */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">Chat Window Size</h2>

        <div className="n8n-chat-field-row">
          <div className="n8n-chat-field">
            <label htmlFor="fc-window-width">Width</label>
            <div className="n8n-chat-slider-field">
              <input
                type="range"
                id="fc-window-width"
                min={300}
                max={600}
                step={10}
                value={windowSettings.width || 400}
                onChange={(e) => updateField('window.width', parseInt(e.target.value, 10))}
              />
              <span className="n8n-chat-slider-value">{windowSettings.width || 400}px</span>
            </div>
          </div>
          <div className="n8n-chat-field">
            <label htmlFor="fc-window-height">Height</label>
            <div className="n8n-chat-slider-field">
              <input
                type="range"
                id="fc-window-height"
                min={400}
                max={800}
                step={10}
                value={windowSettings.height || 600}
                onChange={(e) => updateField('window.height', parseInt(e.target.value, 10))}
              />
              <span className="n8n-chat-slider-value">{windowSettings.height || 600}px</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Open Behavior */}
      {displayMode === 'bubble' && (
        <div className="n8n-chat-section">
          <h2 className="n8n-chat-section-title">Auto-Open Behavior</h2>

          <div className="n8n-chat-field">
            <label className="n8n-chat-checkbox">
              <input
                type="checkbox"
                checked={autoOpen.enabled || false}
                onChange={(e) => updateField('autoOpen.enabled', e.target.checked)}
              />
              <span>Automatically open chat window</span>
            </label>
          </div>

          {autoOpen.enabled && (
            <>
              {/* Trigger Type */}
              <div className="n8n-chat-field">
                <label>Trigger</label>
                <div className="n8n-chat-radio-group">
                  <label className="n8n-chat-radio">
                    <input
                      type="radio"
                      name="autoOpenTrigger"
                      checked={autoOpen.trigger === 'delay'}
                      onChange={() => updateField('autoOpen.trigger', 'delay')}
                    />
                    <span className="n8n-chat-radio-label">Time Delay</span>
                  </label>
                  <label className="n8n-chat-radio">
                    <input
                      type="radio"
                      name="autoOpenTrigger"
                      checked={autoOpen.trigger === 'scroll'}
                      onChange={() => updateField('autoOpen.trigger', 'scroll')}
                    />
                    <span className="n8n-chat-radio-label">Scroll Position</span>
                  </label>
                  <label className="n8n-chat-radio">
                    <input
                      type="radio"
                      name="autoOpenTrigger"
                      checked={autoOpen.trigger === 'idle'}
                      onChange={() => updateField('autoOpen.trigger', 'idle')}
                    />
                    <span className="n8n-chat-radio-label">User Idle</span>
                  </label>
                </div>
              </div>

              {/* Delay (ms) */}
              {autoOpen.trigger === 'delay' && (
                <div className="n8n-chat-field">
                  <label htmlFor="fc-auto-delay">Delay (seconds)</label>
                  <input
                    type="number"
                    id="fc-auto-delay"
                    value={Math.round((autoOpen.delay || 5000) / 1000)}
                    onChange={(e) => updateField('autoOpen.delay', parseInt(e.target.value, 10) * 1000)}
                    min={1}
                    max={60}
                    className="small-text"
                  />
                </div>
              )}

              {/* Scroll Percentage */}
              {autoOpen.trigger === 'scroll' && (
                <div className="n8n-chat-field">
                  <label htmlFor="fc-auto-scroll">Scroll Percentage</label>
                  <div className="n8n-chat-slider-field">
                    <input
                      type="range"
                      id="fc-auto-scroll"
                      min={10}
                      max={90}
                      step={5}
                      value={autoOpen.scrollPercentage || 50}
                      onChange={(e) => updateField('autoOpen.scrollPercentage', parseInt(e.target.value, 10))}
                    />
                    <span className="n8n-chat-slider-value">{autoOpen.scrollPercentage || 50}%</span>
                  </div>
                </div>
              )}

              {/* Idle Time */}
              {autoOpen.trigger === 'idle' && (
                <div className="n8n-chat-field">
                  <label htmlFor="fc-auto-idle">Idle Time (seconds)</label>
                  <input
                    type="number"
                    id="fc-auto-idle"
                    value={Math.round((autoOpen.idleTime || 30000) / 1000)}
                    onChange={(e) => updateField('autoOpen.idleTime', parseInt(e.target.value, 10) * 1000)}
                    min={5}
                    max={300}
                    className="small-text"
                  />
                </div>
              )}

              {/* Advanced Conditions */}
              <button
                type="button"
                className="n8n-chat-toggle-advanced"
                onClick={() => setShowBehaviorAdvanced(!showBehaviorAdvanced)}
                aria-expanded={showBehaviorAdvanced}
              >
                <span className={`dashicons ${showBehaviorAdvanced ? 'dashicons-arrow-down-alt2' : 'dashicons-arrow-right-alt2'}`}></span>
                {showBehaviorAdvanced ? 'Hide' : 'Show'} Advanced Conditions
              </button>

              {showBehaviorAdvanced && (
                <div className="n8n-chat-advanced-content">
                  <div className="n8n-chat-field">
                    <label className="n8n-chat-checkbox">
                      <input
                        type="checkbox"
                        checked={autoOpen.conditions?.oncePerSession !== false}
                        onChange={(e) => updateField('autoOpen.conditions.oncePerSession', e.target.checked)}
                      />
                      <span>Once per session only</span>
                    </label>
                  </div>

                  <div className="n8n-chat-field">
                    <label className="n8n-chat-checkbox">
                      <input
                        type="checkbox"
                        checked={autoOpen.conditions?.oncePerDay || false}
                        onChange={(e) => updateField('autoOpen.conditions.oncePerDay', e.target.checked)}
                      />
                      <span>Once per day only</span>
                    </label>
                  </div>

                  <div className="n8n-chat-field">
                    <label className="n8n-chat-checkbox">
                      <input
                        type="checkbox"
                        checked={autoOpen.conditions?.skipIfInteracted !== false}
                        onChange={(e) => updateField('autoOpen.conditions.skipIfInteracted', e.target.checked)}
                      />
                      <span>Skip if user already interacted</span>
                    </label>
                  </div>

                  <div className="n8n-chat-field">
                    <label className="n8n-chat-checkbox">
                      <input
                        type="checkbox"
                        checked={autoOpen.conditions?.excludeMobile || false}
                        onChange={(e) => updateField('autoOpen.conditions.excludeMobile', e.target.checked)}
                      />
                      <span>Disable on mobile devices</span>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DisplayTab;
