/**
 * RulesTab Component
 *
 * Page targeting, user roles, device targeting, and schedule settings.
 */

import React, { useState } from 'react';
import type { AdminInstance } from '../../../types';
import { useAdminI18n } from '../../../hooks/useAdminI18n';
import { InfoIcon } from '../shared/InfoIcon';
import { useFeatureFlags } from '../../../context/FeatureFlagsContext';
import { PremiumFeature } from '../shared/PremiumFeature';
import { ProBadge } from '../shared/ProBadge';

interface RulesTabProps {
  instance: Partial<AdminInstance>;
  updateField: (path: string, value: unknown) => void;
}

interface TargetingRule {
  id: string;
  type: string;
  operator: string;
  value: string;
}

const RULE_TYPES = [
  { id: 'url', label: 'URL Contains', placeholder: '/products/' },
  { id: 'url_exact', label: 'URL Exactly', placeholder: 'https://example.com/pricing' },
  { id: 'url_regex', label: 'URL Regex', placeholder: '^/blog/.*' },
  { id: 'post_type', label: 'Post Type', placeholder: 'product' },
  { id: 'page_id', label: 'Page ID', placeholder: '123' },
  { id: 'category', label: 'Category Slug', placeholder: 'news' },
  { id: 'tag', label: 'Tag Slug', placeholder: 'featured' },
  { id: 'template', label: 'Page Template', placeholder: 'template-full-width.php' },
];

const OPERATORS = [
  { id: 'is', label: 'Is' },
  { id: 'is_not', label: 'Is Not' },
  { id: 'contains', label: 'Contains' },
  { id: 'not_contains', label: 'Does Not Contain' },
];

const USER_ROLES = [
  { id: 'administrator', label: 'Administrator' },
  { id: 'editor', label: 'Editor' },
  { id: 'author', label: 'Author' },
  { id: 'contributor', label: 'Contributor' },
  { id: 'subscriber', label: 'Subscriber' },
  { id: 'customer', label: 'Customer (WooCommerce)' },
  { id: 'shop_manager', label: 'Shop Manager (WooCommerce)' },
];

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export const RulesTab: React.FC<RulesTabProps> = ({
  instance,
  updateField,
}) => {
  const { t } = useAdminI18n();
  const { hasFeature } = useFeatureFlags();

  const targeting = instance.targeting || {};
  const access = instance.access || {};
  const schedule = instance.schedule || {};
  const devices = instance.devices || { desktop: true, tablet: true, mobile: true };
  const rules = targeting.rules || [];

  // Premium feature checks
  const hasAdvancedTargeting = hasFeature('advancedTargeting');
  const hasSchedule = hasFeature('schedule');

  const addRule = () => {
    const newRule: TargetingRule = {
      id: `rule_${Date.now()}`,
      type: 'url',
      operator: 'contains',
      value: '',
    };
    updateField('targeting.rules', [...rules, newRule]);
  };

  const updateRule = (id: string, field: keyof TargetingRule, value: string) => {
    const updatedRules = rules.map((rule: TargetingRule) =>
      rule.id === id ? { ...rule, [field]: value } : rule
    );
    updateField('targeting.rules', updatedRules);
  };

  const removeRule = (id: string) => {
    updateField('targeting.rules', rules.filter((rule: TargetingRule) => rule.id !== id));
  };

  const handleDayToggle = (dayId: string) => {
    const currentDays = schedule.days || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter((d: string) => d !== dayId)
      : [...currentDays, dayId];
    updateField('schedule.days', newDays);
  };

  const handleRoleToggle = (roleId: string) => {
    const currentRoles = access.allowedRoles || [];
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter((r: string) => r !== roleId)
      : [...currentRoles, roleId];
    updateField('access.allowedRoles', newRoles);
  };

  return (
    <div className="n8n-chat-tab-content">
      {/* Page Targeting */}
      <PremiumFeature feature="advancedTargeting" featureName="Advanced Page Targeting">
        <div className="n8n-chat-section">
          <h2 className="n8n-chat-section-title">
            {t('pageTargeting', 'Page Targeting')}
            {!hasAdvancedTargeting && <ProBadge variant="inline" />}
          </h2>

          <div className="n8n-chat-field">
            <label className="n8n-chat-checkbox">
              <input
                type="checkbox"
                checked={targeting.enabled || false}
                onChange={(e) => hasAdvancedTargeting && updateField('targeting.enabled', e.target.checked)}
                disabled={!hasAdvancedTargeting}
              />
              <span>{t('enablePageTargeting', 'Enable page targeting rules')}</span>
            </label>
            <p className="description">
              {t('pageTargetingDesc', 'Show this chat only on specific pages or sections of your site.')}
            </p>
          </div>

        {targeting.enabled && (
          <>
            {/* Targeting Mode */}
            <div className="n8n-chat-field">
              <label>{t('displayMode', 'Display Mode')}</label>
              <div className="n8n-chat-radio-group">
                <label className="n8n-chat-radio">
                  <input
                    type="radio"
                    name="targetingMode"
                    checked={targeting.mode === 'all'}
                    onChange={() => updateField('targeting.mode', 'all')}
                  />
                  <span className="n8n-chat-radio-label">{t('showOnAllPages', 'Show on all pages (default)')}</span>
                </label>
                <label className="n8n-chat-radio">
                  <input
                    type="radio"
                    name="targetingMode"
                    checked={targeting.mode === 'include'}
                    onChange={() => updateField('targeting.mode', 'include')}
                  />
                  <span className="n8n-chat-radio-label">{t('showOnlyMatching', 'Show only on matching pages')}</span>
                </label>
                <label className="n8n-chat-radio">
                  <input
                    type="radio"
                    name="targetingMode"
                    checked={targeting.mode === 'exclude'}
                    onChange={() => updateField('targeting.mode', 'exclude')}
                  />
                  <span className="n8n-chat-radio-label">{t('hideOnMatching', 'Hide on matching pages')}</span>
                </label>
              </div>
            </div>

            {/* Rules */}
            {(targeting.mode === 'include' || targeting.mode === 'exclude') && (
              <div className="n8n-chat-field">
                <label>
                  {t('targetingRules', 'Targeting Rules')}
                  <InfoIcon tooltip={t('tooltipUrlPattern', 'Examples: /products/* (wildcard), /blog (exact), product (contains). Uses simple pattern matching, not regex.')} />
                </label>
                <div className="n8n-chat-rules-list">
                  {rules.map((rule: TargetingRule, index: number) => (
                    <div key={rule.id} className="n8n-chat-rule-row">
                      {index > 0 && (
                        <span className="n8n-chat-rule-connector">OR</span>
                      )}
                      <select
                        value={rule.type}
                        onChange={(e) => updateRule(rule.id, 'type', e.target.value)}
                        className="n8n-chat-rule-type"
                      >
                        {RULE_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                        className="n8n-chat-rule-operator"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                        placeholder={RULE_TYPES.find((t) => t.id === rule.type)?.placeholder}
                        className="n8n-chat-rule-value"
                      />
                      <button
                        type="button"
                        className="button-link n8n-chat-remove-btn"
                        onClick={() => removeRule(rule.id)}
                        aria-label="Remove rule"
                      >
                        <span className="dashicons dashicons-no-alt"></span>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={addRule}
                  >
                    <span className="dashicons dashicons-plus-alt2"></span>
                    {t('addRule', 'Add Rule')}
                  </button>
                </div>
              </div>
            )}

            {/* Priority */}
            <div className="n8n-chat-field">
              <label htmlFor="fc-priority">
                {t('priority', 'Priority')}
                <InfoIcon tooltip={t('tooltipPriority', 'Higher number = higher priority. If a page matches multiple chat instances, the highest priority wins.')} />
              </label>
              <input
                type="number"
                id="fc-priority"
                value={targeting.priority || 0}
                onChange={(e) => updateField('targeting.priority', parseInt(e.target.value, 10))}
                min={0}
                max={100}
                className="small-text"
              />
              <p className="description">
                {t('priorityDesc', 'When multiple chat bots match a page, the one with higher priority wins.')}
              </p>
            </div>
          </>
        )}
        </div>
      </PremiumFeature>

      {/* User Access */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">{t('userAccess', 'User Access')}</h2>

        <div className="n8n-chat-field">
          <label className="n8n-chat-checkbox">
            <input
              type="checkbox"
              checked={access.requireLogin || false}
              onChange={(e) => updateField('access.requireLogin', e.target.checked)}
            />
            <span>{t('requireLogin', 'Require user to be logged in')}</span>
          </label>
        </div>

        {access.requireLogin && (
          <>
            {/* Role Restriction */}
            <div className="n8n-chat-field">
              <label>{t('restrictToRoles', 'Restrict to specific roles (leave empty for all logged-in users)')}</label>
              <div className="n8n-chat-roles-grid">
                {USER_ROLES.map((role) => (
                  <label key={role.id} className="n8n-chat-checkbox">
                    <input
                      type="checkbox"
                      checked={(access.allowedRoles || []).includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                    />
                    <span>{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Denied Message */}
            <div className="n8n-chat-field">
              <label htmlFor="fc-denied-message">{t('accessDeniedMessage', 'Access Denied Message')}</label>
              <textarea
                id="fc-denied-message"
                value={access.deniedMessage || ''}
                onChange={(e) => updateField('access.deniedMessage', e.target.value)}
                rows={2}
                className="large-text"
                placeholder={t('accessDeniedPlaceholder', 'Please log in to use this chat.')}
              />
            </div>
          </>
        )}
      </div>

      {/* Device Targeting */}
      <div className="n8n-chat-section">
        <h2 className="n8n-chat-section-title">{t('deviceTargeting', 'Device Targeting')}</h2>

        <div className="n8n-chat-devices-grid">
          <label className="n8n-chat-device-option">
            <input
              type="checkbox"
              checked={devices.desktop !== false}
              onChange={(e) => updateField('devices.desktop', e.target.checked)}
            />
            <span className="n8n-chat-device-icon">
              <span className="dashicons dashicons-desktop"></span>
            </span>
            <span className="n8n-chat-device-label">{t('desktop', 'Desktop')}</span>
          </label>

          <label className="n8n-chat-device-option">
            <input
              type="checkbox"
              checked={devices.tablet !== false}
              onChange={(e) => updateField('devices.tablet', e.target.checked)}
            />
            <span className="n8n-chat-device-icon">
              <span className="dashicons dashicons-tablet"></span>
            </span>
            <span className="n8n-chat-device-label">{t('tablet', 'Tablet')}</span>
          </label>

          <label className="n8n-chat-device-option">
            <input
              type="checkbox"
              checked={devices.mobile !== false}
              onChange={(e) => updateField('devices.mobile', e.target.checked)}
            />
            <span className="n8n-chat-device-icon">
              <span className="dashicons dashicons-smartphone"></span>
            </span>
            <span className="n8n-chat-device-label">{t('mobile', 'Mobile')}</span>
          </label>
        </div>
      </div>

      {/* Schedule */}
      <PremiumFeature feature="schedule" featureName="Schedule Rules">
        <div className="n8n-chat-section">
          <h2 className="n8n-chat-section-title">
            {t('schedule', 'Schedule')}
            {!hasSchedule && <ProBadge variant="inline" />}
          </h2>

          <div className="n8n-chat-field">
            <label className="n8n-chat-checkbox">
              <input
                type="checkbox"
                checked={schedule.enabled || false}
                onChange={(e) => hasSchedule && updateField('schedule.enabled', e.target.checked)}
                disabled={!hasSchedule}
              />
              <span>{t('enableSchedule', 'Enable scheduled availability')}</span>
            </label>
            <p className="description">
              {t('scheduleDesc', 'Only show the chat during specific hours/days.')}
            </p>
          </div>

        {schedule.enabled && (
          <>
            {/* Time Range */}
            <div className="n8n-chat-field-row">
              <div className="n8n-chat-field">
                <label htmlFor="fc-schedule-start">{t('startTime', 'Start Time')}</label>
                <input
                  type="time"
                  id="fc-schedule-start"
                  value={schedule.startTime || '09:00'}
                  onChange={(e) => updateField('schedule.startTime', e.target.value)}
                />
              </div>
              <div className="n8n-chat-field">
                <label htmlFor="fc-schedule-end">{t('endTime', 'End Time')}</label>
                <input
                  type="time"
                  id="fc-schedule-end"
                  value={schedule.endTime || '17:00'}
                  onChange={(e) => updateField('schedule.endTime', e.target.value)}
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="n8n-chat-field">
              <label htmlFor="fc-schedule-timezone">{t('timezone', 'Timezone')}</label>
              <select
                id="fc-schedule-timezone"
                value={schedule.timezone || 'site'}
                onChange={(e) => updateField('schedule.timezone', e.target.value)}
                className="regular-text"
              >
                <option value="site">{t('siteTimezone', 'Site Timezone')}</option>
                <option value="visitor">{t('visitorTimezone', "Visitor's Timezone")}</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            {/* Days */}
            <div className="n8n-chat-field">
              <label>{t('activeDays', 'Active Days')}</label>
              <div className="n8n-chat-days-selector">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    className={`n8n-chat-day-btn ${
                      (schedule.days || []).includes(day.id) ? 'is-active' : ''
                    }`}
                    onClick={() => handleDayToggle(day.id)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Outside Hours Message */}
            <div className="n8n-chat-field">
              <label htmlFor="fc-outside-hours-msg">{t('outsideHoursMessage', 'Outside Hours Message')}</label>
              <textarea
                id="fc-outside-hours-msg"
                value={schedule.outsideHoursMessage || ''}
                onChange={(e) => updateField('schedule.outsideHoursMessage', e.target.value)}
                rows={2}
                className="large-text"
                placeholder={t('outsideHoursPlaceholder', "We're currently offline. Leave a message and we'll respond when we're back online.")}
              />
              <p className="description">
                {t('outsideHoursDesc', 'Message shown when the chat is accessed outside scheduled hours.')}
              </p>
            </div>
          </>
        )}
        </div>
      </PremiumFeature>
    </div>
  );
};

export default RulesTab;
