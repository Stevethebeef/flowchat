/**
 * FeatureFlagsContext
 *
 * Provides feature flags and premium feature access control.
 * Reads license data from window.n8nChatAdmin.license (localized from PHP).
 */

import React, { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';

/**
 * Feature flags from license/config
 */
export interface FeatureFlags {
  /** Multi-instance support */
  multiInstance: boolean;

  /** Bubble mode support */
  bubble: boolean;

  /** Chat history persistence */
  history: boolean;

  /** Analytics dashboard */
  analytics: boolean;

  /** White-label (remove branding) */
  whiteLabel: boolean;

  /** File upload support */
  fileUpload: boolean;

  /** Voice input support */
  voiceInput: boolean;

  /** Custom templates */
  customTemplates: boolean;

  /** API access */
  apiAccess: boolean;

  /** Advanced targeting rules */
  advancedTargeting: boolean;

  /** Custom CSS */
  customCss: boolean;

  /** Priority support */
  prioritySupport: boolean;

  /** Auto-open triggers */
  autoOpen: boolean;

  /** Schedule rules */
  schedule: boolean;

  /** Export data */
  exportData: boolean;
}

/**
 * License tier
 */
export type LicenseTier = 'free' | 'pro';

/**
 * Feature limits based on tier
 */
export interface FeatureLimits {
  maxInstances: number | null;
  maxTemplates: number | null;
  maxHistoryDays: number | null;
  maxFileSize: number;
}

/**
 * License data from backend
 */
export interface LicenseData {
  tier: LicenseTier;
  isPremium: boolean;
  isGrace: boolean;
  daysLeft: number | null;
  upgradeUrl: string;
}

interface FeatureFlagsContextValue {
  /** Current license tier */
  tier: LicenseTier;

  /** Whether premium is active */
  isPremium: boolean;

  /** Whether in grace period */
  isGrace: boolean;

  /** Days left until expiry (null if not applicable) */
  daysLeft: number | null;

  /** Feature flags */
  features: FeatureFlags;

  /** Feature limits */
  limits: FeatureLimits;

  /** Upgrade URL */
  upgradeUrl: string;

  /** Check if a specific feature is enabled */
  hasFeature: (feature: keyof FeatureFlags) => boolean;

  /** Check if within limit */
  withinLimit: (limitType: keyof FeatureLimits, current: number) => boolean;

  /** Loading state */
  isLoading: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

/**
 * Default feature flags for free tier
 * Bubble mode is FREE - allows basic floating chat
 */
const FREE_FEATURES: FeatureFlags = {
  multiInstance: false,
  bubble: true, // Bubble mode is FREE
  history: false,
  analytics: false,
  whiteLabel: false,
  fileUpload: false,
  voiceInput: false,
  customTemplates: false,
  apiAccess: true, // Basic API access is free
  advancedTargeting: false,
  customCss: false,
  prioritySupport: false,
  autoOpen: false, // Pro feature
  schedule: false,
  exportData: false,
};

/**
 * Default feature flags for pro tier (all features enabled)
 */
const PRO_FEATURES: FeatureFlags = {
  multiInstance: true,
  bubble: true,
  history: true,
  analytics: true,
  whiteLabel: true, // Pro includes white label
  fileUpload: true,
  voiceInput: true,
  customTemplates: true,
  apiAccess: true,
  advancedTargeting: true,
  customCss: true,
  prioritySupport: true,
  autoOpen: true,
  schedule: true,
  exportData: true,
};

/**
 * Default limits by tier
 */
const LIMITS: Record<LicenseTier, FeatureLimits> = {
  free: {
    maxInstances: 1,
    maxTemplates: 3,
    maxHistoryDays: null,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  pro: {
    maxInstances: null, // Unlimited
    maxTemplates: null, // Unlimited
    maxHistoryDays: null, // Unlimited
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
};

/**
 * Get license data from window object (localized from PHP)
 */
function getLicenseFromWindow(): LicenseData {
  const adminData = (window as any).n8nChatAdmin;
  const license = adminData?.license;

  if (!license) {
    return {
      tier: 'free',
      isPremium: false,
      isGrace: false,
      daysLeft: null,
      upgradeUrl: 'https://n8.chat/#pricing',
    };
  }

  return {
    tier: license.tier || 'free',
    isPremium: license.isPremium || false,
    isGrace: license.isGrace || false,
    daysLeft: license.daysLeft ?? null,
    upgradeUrl: license.upgradeUrl || 'https://n8.chat/pricing',
  };
}

interface FeatureFlagsProviderProps {
  children: ReactNode;
  /** Override tier (useful for testing) */
  tier?: LicenseTier;
  /** Override features */
  features?: Partial<FeatureFlags>;
  /** Override limits */
  limits?: Partial<FeatureLimits>;
}

/**
 * Provider for feature flags
 * Reads license status from window.n8nChatAdmin.license
 */
export function FeatureFlagsProvider({
  children,
  tier: overrideTier,
  features: overrideFeatures,
  limits: overrideLimits,
}: FeatureFlagsProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [licenseData, setLicenseData] = useState<LicenseData>(getLicenseFromWindow());

  // Check for license data on mount
  useEffect(() => {
    // Get license from window
    const license = getLicenseFromWindow();
    setLicenseData(license);
    setIsLoading(false);
  }, []);

  const value = useMemo(() => {
    // Use override tier if provided, otherwise use license tier
    // Normalize any 'enterprise' tier to 'pro' (enterprise removed)
    let tier = overrideTier || licenseData.tier;
    if (tier === 'enterprise') tier = 'pro';

    // Get base features for tier
    const baseFeatures = tier === 'pro' ? PRO_FEATURES : FREE_FEATURES;

    // Merge with overrides
    const features: FeatureFlags = {
      ...baseFeatures,
      ...overrideFeatures,
    };

    // Get base limits for tier (normalize to valid tier)
    const baseLimits = LIMITS[tier as 'free' | 'pro'] || LIMITS.free;

    // Merge with overrides
    const limits: FeatureLimits = {
      ...baseLimits,
      ...overrideLimits,
    };

    const hasFeature = (feature: keyof FeatureFlags): boolean => {
      return features[feature] === true;
    };

    const withinLimit = (limitType: keyof FeatureLimits, current: number): boolean => {
      const limit = limits[limitType];
      if (limit === null) return true; // No limit
      return current < limit;
    };

    return {
      tier,
      isPremium: tier !== 'free',
      isGrace: licenseData.isGrace,
      daysLeft: licenseData.daysLeft,
      features,
      limits,
      upgradeUrl: licenseData.upgradeUrl,
      hasFeature,
      withinLimit,
      isLoading,
    };
  }, [overrideTier, licenseData, overrideFeatures, overrideLimits, isLoading]);

  return (
    <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>
  );
}

/**
 * Hook to access feature flags
 */
export function useFeatureFlags(): FeatureFlagsContextValue {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    // Return a safe default if used outside provider
    return {
      tier: 'free',
      isPremium: false,
      isGrace: false,
      daysLeft: null,
      features: FREE_FEATURES,
      limits: LIMITS.free,
      upgradeUrl: 'https://n8.chat/#pricing',
      hasFeature: () => false,
      withinLimit: () => false,
      isLoading: false,
    };
  }
  return context;
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeature(feature: keyof FeatureFlags): boolean {
  const { hasFeature } = useFeatureFlags();
  return hasFeature(feature);
}

/**
 * Hook to check if premium is active
 */
export function usePremium(): boolean {
  const { isPremium } = useFeatureFlags();
  return isPremium;
}

/**
 * Hook to get current tier
 */
export function useTier(): LicenseTier {
  const { tier } = useFeatureFlags();
  return tier;
}

/**
 * Hook to get feature limits
 */
export function useFeatureLimits(): FeatureLimits {
  const { limits } = useFeatureFlags();
  return limits;
}

/**
 * Hook to get upgrade URL with UTM params
 */
export function useUpgradeUrl(campaign?: string): string {
  const { upgradeUrl } = useFeatureFlags();
  if (!campaign) return upgradeUrl;

  const separator = upgradeUrl.includes('?') ? '&' : '?';
  return `${upgradeUrl}${separator}utm_source=plugin&utm_medium=admin&utm_campaign=${campaign}`;
}

export default FeatureFlagsContext;
