/**
 * AppearanceTab Component
 *
 * Theme, colors, typography, and styling settings.
 */

import React, { useState, useEffect } from 'react';
import type { AdminInstance } from '../../../types';
import { useAdminI18n } from '../../../hooks/useAdminI18n';
import { InfoIcon } from '../shared/InfoIcon';
import { useFeatureFlags } from '../../../context/FeatureFlagsContext';
import { PremiumFeature } from '../shared/PremiumFeature';
import { ProBadge } from '../shared/ProBadge';

interface AppearanceTabProps {
  instance: Partial<AdminInstance>;
  updateField: (path: string, value: unknown) => void;
}

interface StylePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    userBubble: string;
    botBubble: string;
    background: string;
    text: string;
    header: string;
  };
  borderRadius: number;
  fontFamily: string;
}

const FONT_FAMILIES = [
  { id: 'system', label: 'System Default' },
  { id: 'inter', label: 'Inter' },
  { id: 'roboto', label: 'Roboto' },
  { id: 'open-sans', label: 'Open Sans' },
  { id: 'lato', label: 'Lato' },
  { id: 'poppins', label: 'Poppins' },
];

const FONT_SIZES = [
  { id: 'small', label: 'Small (14px)' },
  { id: 'medium', label: 'Medium (16px)' },
  { id: 'large', label: 'Large (18px)' },
];

const COLOR_SOURCES = [
  { id: 'custom', label: 'Custom Colors', description: 'Set your own colors' },
  { id: 'theme', label: 'Theme Colors', description: 'Match your WordPress theme' },
  { id: 'preset', label: 'Style Preset', description: 'Use a pre-designed style' },
];

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  instance,
  updateField,
}) => {
  const { t } = useAdminI18n();
  const { hasFeature } = useFeatureFlags();
  const [stylePresets, setStylePresets] = useState<StylePreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [showCustomCss, setShowCustomCss] = useState(false);

  const appearance = instance.appearance || {};
  const colorSource = instance.colorSource || 'custom';

  // Premium feature check
  const hasCustomCssFeature = hasFeature('customCss');

  // Fetch style presets
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch(
          `${(window as any).n8nChatAdmin.apiUrl}/style-presets`,
          {
            headers: {
              'X-WP-Nonce': (window as any).n8nChatAdmin.nonce,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setStylePresets(data);
        }
      } catch (err) {
        console.error('Failed to fetch style presets:', err);
      } finally {
        setLoadingPresets(false);
      }
    };

    fetchPresets();
  }, []);

  const applyPreset = (preset: StylePreset) => {
    updateField('stylePreset', preset.id);
    updateField('appearance.userBubbleColor', preset.colors.userBubble);
    updateField('appearance.botBubbleColor', preset.colors.botBubble);
    updateField('appearance.backgroundColor', preset.colors.background);
    updateField('appearance.textColor', preset.colors.text);
    updateField('appearance.headerBackground', preset.colors.header);
    updateField('appearance.borderRadius', preset.borderRadius);
    updateField('appearance.fontFamily', preset.fontFamily);
    updateField('primaryColor', preset.colors.primary);
  };

  return (
    <div className="n8n-chat-tab-content">
      {/* Color Source */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">{t('colorScheme', 'Color Scheme')}</h2>

        <div className="n8n-chat-color-source-selector">
          {COLOR_SOURCES.map((source) => (
            <label key={source.id} className="n8n-chat-color-source-option">
              <input
                type="radio"
                name="colorSource"
                checked={colorSource === source.id}
                onChange={() => updateField('colorSource', source.id)}
              />
              <div className="n8n-chat-color-source-content">
                <span className="n8n-chat-color-source-label">{t(`colorSource_${source.id}`, source.label)}</span>
                <span className="n8n-chat-color-source-desc">{t(`colorSourceDesc_${source.id}`, source.description)}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Style Presets - only show if preset selected */}
      {colorSource === 'preset' && (
        <div className="n8n-chat-section">
          <h2 className="n8n-chat-section-title">{t('stylePresets', 'Style Presets')}</h2>

          {loadingPresets ? (
            <div className="n8n-chat-loading-inline">
              <span className="spinner is-active"></span>
              {t('loadingPresets', 'Loading presets...')}
            </div>
          ) : (
            <div className="n8n-chat-presets-grid">
              {stylePresets.map((preset) => (
                <div
                  key={preset.id}
                  className={`n8n-chat-preset-card ${instance.stylePreset === preset.id ? 'is-selected' : ''}`}
                  onClick={() => applyPreset(preset)}
                >
                  <div
                    className="n8n-chat-preset-preview"
                    style={{
                      backgroundColor: preset.colors.background,
                      borderRadius: `${preset.borderRadius}px`,
                    }}
                  >
                    <div
                      className="n8n-chat-preset-header"
                      style={{ backgroundColor: preset.colors.header }}
                    />
                    <div className="n8n-chat-preset-messages">
                      <div
                        className="n8n-chat-preset-msg bot"
                        style={{ backgroundColor: preset.colors.botBubble }}
                      />
                      <div
                        className="n8n-chat-preset-msg user"
                        style={{ backgroundColor: preset.colors.userBubble }}
                      />
                    </div>
                  </div>
                  <div className="n8n-chat-preset-info">
                    <h4>{preset.name}</h4>
                    <p>{preset.description}</p>
                  </div>
                  {instance.stylePreset === preset.id && (
                    <div className="n8n-chat-preset-check">
                      <span className="dashicons dashicons-yes"></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Colors */}
      {colorSource === 'custom' && (
        <div className="n8n-chat-section">
          <h2 className="n8n-chat-section-title">{t('customColors', 'Custom Colors')}</h2>

          <div className="n8n-chat-color-grid">
            {/* Primary Color */}
            <div className="n8n-chat-color-field">
              <label htmlFor="fc-color-primary">{t('primaryColor', 'Primary Color')}</label>
              <div className="n8n-chat-color-input">
                <input
                  type="color"
                  id="fc-color-primary"
                  value={instance.primaryColor || '#3b82f6'}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                />
                <input
                  type="text"
                  value={instance.primaryColor || '#3b82f6'}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="small-text code"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            {/* User Bubble Color */}
            <div className="n8n-chat-color-field">
              <label htmlFor="fc-color-user-bubble">{t('userBubble', 'User Bubble')}</label>
              <div className="n8n-chat-color-input">
                <input
                  type="color"
                  id="fc-color-user-bubble"
                  value={appearance.userBubbleColor || '#3b82f6'}
                  onChange={(e) => updateField('appearance.userBubbleColor', e.target.value)}
                />
                <input
                  type="text"
                  value={appearance.userBubbleColor || '#3b82f6'}
                  onChange={(e) => updateField('appearance.userBubbleColor', e.target.value)}
                  className="small-text code"
                />
              </div>
            </div>

            {/* Bot Bubble Color */}
            <div className="n8n-chat-color-field">
              <label htmlFor="fc-color-bot-bubble">{t('botBubble', 'Bot Bubble')}</label>
              <div className="n8n-chat-color-input">
                <input
                  type="color"
                  id="fc-color-bot-bubble"
                  value={appearance.botBubbleColor || '#f3f4f6'}
                  onChange={(e) => updateField('appearance.botBubbleColor', e.target.value)}
                />
                <input
                  type="text"
                  value={appearance.botBubbleColor || '#f3f4f6'}
                  onChange={(e) => updateField('appearance.botBubbleColor', e.target.value)}
                  className="small-text code"
                />
              </div>
            </div>

            {/* Background Color */}
            <div className="n8n-chat-color-field">
              <label htmlFor="fc-color-background">{t('background', 'Background')}</label>
              <div className="n8n-chat-color-input">
                <input
                  type="color"
                  id="fc-color-background"
                  value={appearance.backgroundColor || '#ffffff'}
                  onChange={(e) => updateField('appearance.backgroundColor', e.target.value)}
                />
                <input
                  type="text"
                  value={appearance.backgroundColor || '#ffffff'}
                  onChange={(e) => updateField('appearance.backgroundColor', e.target.value)}
                  className="small-text code"
                />
              </div>
            </div>

            {/* Text Color */}
            <div className="n8n-chat-color-field">
              <label htmlFor="fc-color-text">{t('textColor', 'Text Color')}</label>
              <div className="n8n-chat-color-input">
                <input
                  type="color"
                  id="fc-color-text"
                  value={appearance.textColor || '#1f2937'}
                  onChange={(e) => updateField('appearance.textColor', e.target.value)}
                />
                <input
                  type="text"
                  value={appearance.textColor || '#1f2937'}
                  onChange={(e) => updateField('appearance.textColor', e.target.value)}
                  className="small-text code"
                />
              </div>
            </div>

            {/* Header Background */}
            <div className="n8n-chat-color-field">
              <label htmlFor="fc-color-header">{t('header', 'Header')}</label>
              <div className="n8n-chat-color-input">
                <input
                  type="color"
                  id="fc-color-header"
                  value={appearance.headerBackground || '#3b82f6'}
                  onChange={(e) => updateField('appearance.headerBackground', e.target.value)}
                />
                <input
                  type="text"
                  value={appearance.headerBackground || '#3b82f6'}
                  onChange={(e) => updateField('appearance.headerBackground', e.target.value)}
                  className="small-text code"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Colors Info */}
      {colorSource === 'theme' && (
        <div className="n8n-chat-section">
          <div className="n8n-chat-info-box">
            <span className="dashicons dashicons-info"></span>
            <div>
              <p>
                <strong>{t('themeIntegrationActive', 'Theme Integration Active')}</strong>
              </p>
              <p>
                {t('themeColorsDesc', 'Colors will be automatically extracted from your WordPress theme. This includes colors from theme.json, customizer settings, and CSS variables.')}
                <InfoIcon tooltip={t('tooltipThemeColors', 'Extracts colors from theme.json (block themes), Customizer settings, or CSS variables like --wp--preset--color--primary.')} />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Typography */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">{t('typography', 'Typography')}</h2>

        <div className="n8n-chat-field-row">
          {/* Font Family */}
          <div className="n8n-chat-field">
            <label htmlFor="fc-font-family">{t('fontFamily', 'Font Family')}</label>
            <select
              id="fc-font-family"
              value={appearance.fontFamily || 'system'}
              onChange={(e) => updateField('appearance.fontFamily', e.target.value)}
              className="regular-text"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="n8n-chat-field">
            <label htmlFor="fc-font-size">{t('fontSize', 'Font Size')}</label>
            <select
              id="fc-font-size"
              value={appearance.fontSize || 'medium'}
              onChange={(e) => updateField('appearance.fontSize', e.target.value)}
              className="regular-text"
            >
              {FONT_SIZES.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Border Radius */}
        <div className="n8n-chat-field">
          <label htmlFor="fc-border-radius">{t('borderRadius', 'Border Radius')}</label>
          <div className="n8n-chat-slider-field">
            <input
              type="range"
              id="fc-border-radius"
              min={0}
              max={24}
              value={appearance.borderRadius || 12}
              onChange={(e) => updateField('appearance.borderRadius', parseInt(e.target.value, 10))}
            />
            <span className="n8n-chat-slider-value">{appearance.borderRadius || 12}px</span>
          </div>
        </div>
      </div>

      {/* Bot Avatar */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">{t('botAvatar', 'Bot Avatar')}</h2>

        <div className="n8n-chat-field">
          <label htmlFor="fc-avatar-url">{t('avatarImageUrl', 'Avatar Image URL')}</label>
          <div className="n8n-chat-media-field">
            <input
              type="url"
              id="fc-avatar-url"
              value={instance.avatarUrl || ''}
              onChange={(e) => updateField('avatarUrl', e.target.value)}
              className="large-text"
              placeholder="https://example.com/avatar.png"
            />
            <button
              type="button"
              className="button"
              onClick={() => {
                // WordPress media library integration
                const frame = (window as any).wp?.media?.({
                  title: t('selectBotAvatar', 'Select Bot Avatar'),
                  button: { text: t('useAsAvatar', 'Use as Avatar') },
                  multiple: false,
                  library: { type: 'image' },
                });

                frame?.on('select', () => {
                  const attachment = frame.state().get('selection').first().toJSON();
                  updateField('avatarUrl', attachment.url);
                });

                frame?.open();
              }}
            >
              <span className="dashicons dashicons-format-image"></span>
              {t('chooseImage', 'Choose Image')}
            </button>
          </div>
          <p className="description">
            {t('avatarDesc', 'Leave empty to use the default bot icon. Recommended size: 80x80px.')}
          </p>
        </div>

        {instance.avatarUrl && (
          <div className="n8n-chat-avatar-preview">
            <img src={instance.avatarUrl} alt={t('botAvatarPreview', 'Bot avatar preview')} />
            <button
              type="button"
              className="button-link n8n-chat-remove-btn"
              onClick={() => updateField('avatarUrl', '')}
            >
              {t('remove', 'Remove')}
            </button>
          </div>
        )}
      </div>

      {/* Custom CSS */}
      <PremiumFeature feature="customCss" featureName="Custom CSS">
        <div className="n8n-chat-section">
          <button
            type="button"
            className="n8n-chat-toggle-advanced"
            onClick={() => hasCustomCssFeature && setShowCustomCss(!showCustomCss)}
            aria-expanded={showCustomCss}
            disabled={!hasCustomCssFeature}
          >
            <span className={`dashicons ${showCustomCss ? 'dashicons-arrow-down-alt2' : 'dashicons-arrow-right-alt2'}`}></span>
            {showCustomCss ? t('hide', 'Hide') : t('show', 'Show')} {t('customCss', 'Custom CSS')}
            {!hasCustomCssFeature && <ProBadge variant="inline" />}
          </button>

          {showCustomCss && hasCustomCssFeature && (
            <div className="n8n-chat-advanced-content">
              <div className="n8n-chat-field">
                <label htmlFor="fc-custom-css">{t('customCss', 'Custom CSS')}</label>
                <textarea
                  id="fc-custom-css"
                  value={instance.customCss || ''}
                  onChange={(e) => updateField('customCss', e.target.value)}
                  rows={10}
                  className="large-text code"
                  placeholder={`.n8n-chat-widget {\n  /* Your custom styles */\n}`}
                />
                <p className="description">
                  {t('customCssDesc', 'Add custom CSS to further customize the chat appearance. All styles are scoped to')} <code>.n8n-chat-widget</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      </PremiumFeature>
    </div>
  );
};

export default AppearanceTab;
