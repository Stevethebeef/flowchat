/**
 * FeatureFlagsContext
 *
 * Provides feature flags and premium feature access control.
 * Per 05-frontend-components.md and 12-feature-gating.md specs.
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

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
}

/**
 * License tier
 */
export type LicenseTier = 'free' | 'pro' | 'enterprise';

/**
 * Feature limits based on tier
 */
export interface FeatureLimits {
  maxInstances: number | null;
  maxTemplates: number | null;
  maxHistoryDays: number | null;
  maxFileSize: number;
}

interface FeatureFlagsContextValue {
  /** Current license tier */
  tier: LicenseTier;

  /** Whether premium is active */
  isPremium: boolean;

  /** Feature flags */
  features: FeatureFlags;

  /** Feature limits */
  limits: FeatureLimits;

  /** Check if a specific feature is enabled */
  hasFeature: (feature: keyof FeatureFlags) => boolean;

  /** Check if within limit */
  withinLimit: (limitType: keyof FeatureLimits, current: number) => boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

/**
 * Default feature flags for free tier
 */
const FREE_FEATURES: FeatureFlags = {
  multiInstance: false,
  bubble: true,
  history: false,
  analytics: false,
  whiteLabel: false,
  fileUpload: false,
  voiceInput: false,
  customTemplates: false,
  apiAccess: true,
  advancedTargeting: false,
  customCss: false,
  prioritySupport: false,
};

/**
 * Default feature flags for pro tier
 */
const PRO_FEATURES: FeatureFlags = {
  multiInstance: true,
  bubble: true,
  history: true,
  analytics: true,
  whiteLabel: false,
  fileUpload: true,
  voiceInput: true,
  customTemplates: true,
  apiAccess: true,
  advancedTargeting: true,
  customCss: true,
  prioritySupport: true,
};

/**
 * Default feature flags for enterprise tier
 */
const ENTERPRISE_FEATURES: FeatureFlags = {
  multiInstance: true,
  bubble: true,
  history: true,
  analytics: true,
  whiteLabel: true,
  fileUpload: true,
  voiceInput: true,
  customTemplates: true,
  apiAccess: true,
  advancedTargeting: true,
  customCss: true,
  prioritySupport: true,
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
    maxInstances: 10,
    maxTemplates: null,
    maxHistoryDays: 90,
    maxFileSize: 25 * 1024 * 1024, // 25MB
  },
  enterprise: {
    maxInstances: null,
    maxTemplates: null,
    maxHistoryDays: null,
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
};

interface FeatureFlagsProviderProps {
  children: ReactNode;
  tier?: LicenseTier;
  features?: Partial<FeatureFlags>;
  limits?: Partial<FeatureLimits>;
}

/**
 * Provider for feature flags
 */
export function FeatureFlagsProvider({
  children,
  tier = 'free',
  features: overrideFeatures,
  limits: overrideLimits,
}: FeatureFlagsProviderProps) {
  const value = useMemo(() => {
    // Get base features for tier
    const baseFeatures =
      tier === 'enterprise'
        ? ENTERPRISE_FEATURES
        : tier === 'pro'
          ? PRO_FEATURES
          : FREE_FEATURES;

    // Merge with overrides
    const features: FeatureFlags = {
      ...baseFeatures,
      ...overrideFeatures,
    };

    // Get base limits for tier
    const baseLimits = LIMITS[tier];

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
      features,
      limits,
      hasFeature,
      withinLimit,
    };
  }, [tier, overrideFeatures, overrideLimits]);

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
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
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

export default FeatureFlagsContext;
