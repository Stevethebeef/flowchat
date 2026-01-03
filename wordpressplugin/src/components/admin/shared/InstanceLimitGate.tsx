/**
 * InstanceLimitGate Component
 *
 * Gates instance creation based on license tier limits.
 * Shows upgrade prompt when user has reached their instance limit.
 */

import React from 'react';
import { useFeatureFlags } from '../../../context/FeatureFlagsContext';
import { ProBadge, CrownIcon } from './ProBadge';

interface InstanceLimitGateProps {
  /** Current number of instances */
  currentCount: number;
  /** Callback when user can add instance */
  onAdd: () => void;
  /** Button text */
  buttonText?: string;
  /** Show count badge */
  showCount?: boolean;
}

/**
 * Instance limit gate - shows add button or upgrade prompt
 */
export const InstanceLimitGate: React.FC<InstanceLimitGateProps> = ({
  currentCount,
  onAdd,
  buttonText = 'Add New Instance',
  showCount = true,
}) => {
  const { limits, tier, isPremium } = useFeatureFlags();
  const maxInstances = limits.maxInstances;
  const canAdd = maxInstances === null || currentCount < maxInstances;
  const isAtLimit = maxInstances !== null && currentCount >= maxInstances;

  // User can add more instances
  if (canAdd) {
    return (
      <div className="n8n-chat-instance-limit-gate">
        <button className="button button-primary" onClick={onAdd}>
          <span className="dashicons dashicons-plus-alt2"></span>
          {buttonText}
        </button>
        {showCount && maxInstances !== null && (
          <span className="n8n-chat-instance-count">
            {currentCount}/{maxInstances} instances
          </span>
        )}
      </div>
    );
  }

  // User is at limit - show upgrade prompt
  return (
    <div className="n8n-chat-instance-limit-gate n8n-chat-instance-limit-reached">
      <div className="n8n-chat-limit-message">
        <div className="n8n-chat-limit-icon">
          <CrownIcon size={24} />
        </div>
        <div className="n8n-chat-limit-content">
          <h4>Instance Limit Reached</h4>
          <p>
            You've reached the limit of {maxInstances} instance{maxInstances !== 1 ? 's' : ''} on the{' '}
            <strong>{tier}</strong> plan.
          </p>
          {tier === 'free' && (
            <p className="n8n-chat-limit-upgrade-text">
              Upgrade to <strong>Pro</strong> for unlimited instances and more premium features.
            </p>
          )}
        </div>
      </div>
      <div className="n8n-chat-limit-actions">
        <a
          href={getUpgradeUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="button button-primary"
        >
          <CrownIcon size={14} />
          Upgrade Now
        </a>
        <button className="button" disabled title="Instance limit reached">
          <span className="dashicons dashicons-lock"></span>
          {buttonText}
        </button>
      </div>
      {showCount && (
        <span className="n8n-chat-instance-count n8n-chat-instance-count-full">
          {currentCount}/{maxInstances} instances (limit reached)
        </span>
      )}
    </div>
  );
};

/**
 * Simple count badge showing current/max instances
 */
export const InstanceCountBadge: React.FC<{ currentCount: number }> = ({
  currentCount,
}) => {
  const { limits, tier } = useFeatureFlags();
  const maxInstances = limits.maxInstances;

  if (maxInstances === null) {
    return (
      <span className="n8n-chat-instance-badge n8n-chat-instance-badge-unlimited">
        {currentCount} instances
      </span>
    );
  }

  const isAtLimit = currentCount >= maxInstances;
  const isNearLimit = currentCount >= maxInstances - 1;

  return (
    <span
      className={`n8n-chat-instance-badge ${
        isAtLimit
          ? 'n8n-chat-instance-badge-full'
          : isNearLimit
            ? 'n8n-chat-instance-badge-warning'
            : ''
      }`}
    >
      {currentCount}/{maxInstances}
      {isAtLimit && <span className="dashicons dashicons-warning"></span>}
    </span>
  );
};

/**
 * Get upgrade URL
 */
function getUpgradeUrl(): string {
  const baseUrl = (window as any).n8nChatAdmin?.license?.upgradeUrl || 'https://n8.chat/#pricing';
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}utm_source=plugin&utm_medium=instance_limit&utm_campaign=upgrade`;
}

export default InstanceLimitGate;
