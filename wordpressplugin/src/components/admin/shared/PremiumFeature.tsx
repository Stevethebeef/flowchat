/**
 * PremiumFeature Component
 *
 * Wraps premium features with license check and shows upgrade CTA when locked.
 * Used throughout admin UI to gate premium-only features.
 */

import React, { type ReactNode } from 'react';
import { useFeatureFlags, type FeatureFlags } from '../../../context/FeatureFlagsContext';
import { ProBadge } from './ProBadge';

export type PremiumFeatureName = keyof FeatureFlags;

interface PremiumFeatureProps {
  /** The feature key to check */
  feature: PremiumFeatureName;
  /** Content to show when feature is available */
  children: ReactNode;
  /**
   * How to handle locked features:
   * - 'disabled': Show content but disable interactions
   * - 'hidden': Don't render anything
   * - 'overlay': Show content with lock overlay
   */
  mode?: 'disabled' | 'hidden' | 'overlay';
  /** Custom fallback content when locked */
  fallback?: ReactNode;
  /** Show PRO badge on the feature label */
  showBadge?: boolean;
  /** Additional class name */
  className?: string;
  /** Feature display name for upgrade message */
  featureName?: string;
}

/**
 * Wrapper component that gates premium features
 */
export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  feature,
  children,
  mode = 'overlay',
  fallback,
  showBadge = true,
  className = '',
  featureName,
}) => {
  const { hasFeature, isPremium } = useFeatureFlags();
  const isAvailable = hasFeature(feature);

  // Feature is available - render normally
  if (isAvailable) {
    return <>{children}</>;
  }

  // Hidden mode - render nothing
  if (mode === 'hidden') {
    return null;
  }

  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Disabled mode - render with disabled state
  if (mode === 'disabled') {
    return (
      <div className={`n8n-chat-premium-feature n8n-chat-premium-disabled ${className}`}>
        {showBadge && <ProBadge />}
        <div className="n8n-chat-premium-content n8n-chat-premium-content-disabled">
          {children}
        </div>
      </div>
    );
  }

  // Overlay mode (default) - show with lock overlay
  return (
    <div className={`n8n-chat-premium-feature n8n-chat-premium-locked ${className}`}>
      <div className="n8n-chat-premium-content">
        {children}
      </div>
      <div className="n8n-chat-premium-overlay">
        <div className="n8n-chat-premium-lock">
          <span className="dashicons dashicons-lock"></span>
          <span className="n8n-chat-premium-lock-text">
            {featureName || formatFeatureName(feature)} requires Pro
          </span>
          <a
            href={getUpgradeUrl(feature)}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-primary n8n-chat-upgrade-btn"
          >
            Upgrade to Pro
          </a>
        </div>
      </div>
    </div>
  );
};

/**
 * Simple wrapper that just shows PRO badge next to locked features
 */
export const PremiumLabel: React.FC<{
  feature: PremiumFeatureName;
  children: ReactNode;
}> = ({ feature, children }) => {
  const { hasFeature } = useFeatureFlags();
  const isAvailable = hasFeature(feature);

  return (
    <span className="n8n-chat-premium-label">
      {children}
      {!isAvailable && <ProBadge />}
    </span>
  );
};

/**
 * Hook to check if a feature is available
 */
export const usePremiumFeature = (feature: PremiumFeatureName): {
  isAvailable: boolean;
  isPremium: boolean;
  showUpgrade: () => void;
} => {
  const { hasFeature, isPremium } = useFeatureFlags();

  return {
    isAvailable: hasFeature(feature),
    isPremium,
    showUpgrade: () => {
      window.open(getUpgradeUrl(feature), '_blank');
    },
  };
};

/**
 * Format feature key to display name
 */
function formatFeatureName(feature: PremiumFeatureName): string {
  const names: Record<PremiumFeatureName, string> = {
    multiInstance: 'Multiple Instances',
    bubble: 'Bubble Mode',
    history: 'Chat History',
    analytics: 'Analytics',
    whiteLabel: 'White Label',
    fileUpload: 'File Uploads',
    voiceInput: 'Voice Input',
    customTemplates: 'Custom Templates',
    apiAccess: 'API Access',
    advancedTargeting: 'Advanced Targeting',
    customCss: 'Custom CSS',
    prioritySupport: 'Priority Support',
    autoOpen: 'Auto-Open Triggers',
    schedule: 'Schedule Rules',
    exportData: 'Data Export',
  };
  return names[feature] || feature;
}

/**
 * Get upgrade URL with feature-specific UTM
 */
function getUpgradeUrl(feature: PremiumFeatureName): string {
  const baseUrl = (window as any).n8nChatAdmin?.license?.upgradeUrl || 'https://n8.chat/#pricing';
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}utm_source=plugin&utm_medium=feature_gate&utm_campaign=${feature}`;
}

export default PremiumFeature;
