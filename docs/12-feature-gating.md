# 12. Feature Gating & Licensing System

## Overview

FlowChat uses a tiered licensing model with a free tier and premium features. This specification covers the feature gating implementation, license validation, and update distribution.

---

## License Tiers

### Tier Comparison

| Feature | Free | Premium |
|---------|------|---------|
| Chat Instances | 1 | Unlimited |
| Bubble/Floating Chat | ❌ | ✅ |
| Conversation History | ❌ | ✅ |
| Pre-built Templates | 3 basic | All (20+) |
| Custom Templates | ❌ | ✅ |
| Advanced Styling | Basic colors | Full CSS control |
| Auto-open Triggers | ❌ | ✅ |
| Analytics Dashboard | Basic | Advanced |
| Priority Support | ❌ | ✅ |
| White Label | ❌ | ✅ |
| Multi-site Support | ❌ | ✅ |

### Feature Flags

```typescript
// src/types/features.ts

export enum Feature {
  // Instance features
  MULTIPLE_INSTANCES = 'multiple_instances',
  
  // Display modes
  BUBBLE_CHAT = 'bubble_chat',
  FULLSCREEN_MODE = 'fullscreen_mode',
  
  // Conversation features
  CONVERSATION_HISTORY = 'conversation_history',
  EXPORT_CONVERSATIONS = 'export_conversations',
  
  // Templates
  ALL_TEMPLATES = 'all_templates',
  CUSTOM_TEMPLATES = 'custom_templates',
  TEMPLATE_IMPORT_EXPORT = 'template_import_export',
  
  // Styling
  ADVANCED_STYLING = 'advanced_styling',
  CUSTOM_CSS = 'custom_css',
  WHITE_LABEL = 'white_label',
  
  // Automation
  AUTO_OPEN_TRIGGERS = 'auto_open_triggers',
  CONDITIONAL_DISPLAY = 'conditional_display',
  
  // Analytics
  ADVANCED_ANALYTICS = 'advanced_analytics',
  
  // Infrastructure
  MULTISITE_SUPPORT = 'multisite_support',
  PRIORITY_SUPPORT = 'priority_support',
}

export interface LicenseTier {
  id: 'free' | 'premium';
  name: string;
  features: Feature[];
  limits: {
    instances: number;
    templates: number;
  };
}

export const LICENSE_TIERS: Record<string, LicenseTier> = {
  free: {
    id: 'free',
    name: 'Free',
    features: [],
    limits: {
      instances: 1,
      templates: 3,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    features: Object.values(Feature),
    limits: {
      instances: -1, // unlimited
      templates: -1, // unlimited
    },
  },
};
```

---

## License Management

### License Data Structure

```php
<?php
// Database structure for license

// wp_options: flowchat_license
[
    'key' => 'XXXX-XXXX-XXXX-XXXX',
    'email' => 'customer@example.com',
    'status' => 'active', // active, expired, invalid, deactivated
    'tier' => 'premium',
    'activated_at' => '2025-01-15T10:30:00Z',
    'expires_at' => '2026-01-15T10:30:00Z',
    'site_url' => 'https://example.com',
    'last_check' => '2025-01-20T08:00:00Z',
    'features' => ['bubble_chat', 'conversation_history', ...],
]
```

### License Manager Class

```php
<?php
// includes/class-license-manager.php

namespace FlowChat;

class License_Manager {
    
    private static $instance = null;
    private $license_data = null;
    private $api_url = 'https://api.flowchat.dev/v1/license';
    
    // Cache duration for license checks
    const CHECK_INTERVAL = DAY_IN_SECONDS;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->license_data = get_option('flowchat_license', null);
        
        // Schedule periodic license check
        if (!wp_next_scheduled('flowchat_license_check')) {
            wp_schedule_event(time(), 'daily', 'flowchat_license_check');
        }
        
        add_action('flowchat_license_check', [$this, 'periodic_check']);
    }
    
    /**
     * Get current license status
     */
    public function get_status(): array {
        if (!$this->license_data) {
            return [
                'is_valid' => false,
                'tier' => 'free',
                'status' => 'none',
                'message' => __('No license activated', 'flowchat'),
            ];
        }
        
        // Check if expired
        if ($this->is_expired()) {
            return [
                'is_valid' => false,
                'tier' => 'free',
                'status' => 'expired',
                'expires_at' => $this->license_data['expires_at'],
                'message' => __('License has expired', 'flowchat'),
            ];
        }
        
        // Check if needs revalidation
        if ($this->needs_revalidation()) {
            $this->validate_license();
        }
        
        return [
            'is_valid' => $this->license_data['status'] === 'active',
            'tier' => $this->license_data['tier'],
            'status' => $this->license_data['status'],
            'expires_at' => $this->license_data['expires_at'],
            'features' => $this->license_data['features'] ?? [],
        ];
    }
    
    /**
     * Activate a license key
     */
    public function activate(string $license_key, string $email): array {
        // Validate format
        if (!$this->validate_key_format($license_key)) {
            return [
                'success' => false,
                'error' => __('Invalid license key format', 'flowchat'),
            ];
        }
        
        // Call license API
        $response = $this->api_request('activate', [
            'license_key' => $license_key,
            'email' => $email,
            'site_url' => home_url(),
            'site_name' => get_bloginfo('name'),
            'wp_version' => get_bloginfo('version'),
            'plugin_version' => FLOWCHAT_VERSION,
        ]);
        
        if (is_wp_error($response)) {
            return [
                'success' => false,
                'error' => $response->get_error_message(),
            ];
        }
        
        if (!$response['success']) {
            return [
                'success' => false,
                'error' => $response['error'] ?? __('Activation failed', 'flowchat'),
            ];
        }
        
        // Store license data
        $this->license_data = [
            'key' => $license_key,
            'email' => $email,
            'status' => 'active',
            'tier' => $response['tier'],
            'activated_at' => current_time('c'),
            'expires_at' => $response['expires_at'],
            'site_url' => home_url(),
            'last_check' => current_time('c'),
            'features' => $response['features'] ?? [],
        ];
        
        update_option('flowchat_license', $this->license_data, false);
        
        // Clear any cached feature checks
        delete_transient('flowchat_features');
        
        do_action('flowchat_license_activated', $this->license_data);
        
        return [
            'success' => true,
            'tier' => $response['tier'],
            'expires_at' => $response['expires_at'],
            'message' => __('License activated successfully', 'flowchat'),
        ];
    }
    
    /**
     * Deactivate the current license
     */
    public function deactivate(): array {
        if (!$this->license_data || !isset($this->license_data['key'])) {
            return [
                'success' => false,
                'error' => __('No license to deactivate', 'flowchat'),
            ];
        }
        
        // Call license API
        $response = $this->api_request('deactivate', [
            'license_key' => $this->license_data['key'],
            'site_url' => home_url(),
        ]);
        
        // Clear local license data regardless of API response
        delete_option('flowchat_license');
        delete_transient('flowchat_features');
        $this->license_data = null;
        
        do_action('flowchat_license_deactivated');
        
        return [
            'success' => true,
            'message' => __('License deactivated', 'flowchat'),
        ];
    }
    
    /**
     * Validate license with API
     */
    public function validate_license(): bool {
        if (!$this->license_data || !isset($this->license_data['key'])) {
            return false;
        }
        
        $response = $this->api_request('validate', [
            'license_key' => $this->license_data['key'],
            'site_url' => home_url(),
        ]);
        
        if (is_wp_error($response) || !$response['valid']) {
            $this->license_data['status'] = 'invalid';
            update_option('flowchat_license', $this->license_data, false);
            return false;
        }
        
        // Update license data
        $this->license_data['status'] = $response['status'];
        $this->license_data['tier'] = $response['tier'];
        $this->license_data['expires_at'] = $response['expires_at'];
        $this->license_data['features'] = $response['features'] ?? [];
        $this->license_data['last_check'] = current_time('c');
        
        update_option('flowchat_license', $this->license_data, false);
        delete_transient('flowchat_features');
        
        return $response['status'] === 'active';
    }
    
    /**
     * Periodic license check (cron)
     */
    public function periodic_check(): void {
        if ($this->license_data) {
            $this->validate_license();
        }
    }
    
    /**
     * Check if license is expired
     */
    private function is_expired(): bool {
        if (!isset($this->license_data['expires_at'])) {
            return false;
        }
        
        return strtotime($this->license_data['expires_at']) < time();
    }
    
    /**
     * Check if license needs revalidation
     */
    private function needs_revalidation(): bool {
        if (!isset($this->license_data['last_check'])) {
            return true;
        }
        
        $last_check = strtotime($this->license_data['last_check']);
        return (time() - $last_check) > self::CHECK_INTERVAL;
    }
    
    /**
     * Validate license key format
     */
    private function validate_key_format(string $key): bool {
        // Format: XXXX-XXXX-XXXX-XXXX (alphanumeric)
        return (bool) preg_match('/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/', strtoupper($key));
    }
    
    /**
     * Make API request
     */
    private function api_request(string $action, array $data): array|\WP_Error {
        $url = trailingslashit($this->api_url) . $action;
        
        $response = wp_remote_post($url, [
            'timeout' => 15,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-FlowChat-Version' => FLOWCHAT_VERSION,
            ],
            'body' => wp_json_encode($data),
        ]);
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        if ($code !== 200) {
            return new \WP_Error(
                'license_api_error',
                __('License server error', 'flowchat')
            );
        }
        
        return json_decode($body, true) ?: [
            'success' => false,
            'error' => __('Invalid response from license server', 'flowchat'),
        ];
    }
    
    /**
     * Get obfuscated license key for display
     */
    public function get_display_key(): string {
        if (!$this->license_data || !isset($this->license_data['key'])) {
            return '';
        }
        
        $key = $this->license_data['key'];
        return substr($key, 0, 4) . '-****-****-' . substr($key, -4);
    }
    
    /**
     * Check if current tier is premium
     */
    public function is_premium(): bool {
        $status = $this->get_status();
        return $status['is_valid'] && $status['tier'] === 'premium';
    }
}
```

---

## Feature Gating Implementation

### Feature Checker Class

```php
<?php
// includes/class-feature-checker.php

namespace FlowChat;

class Feature_Checker {
    
    private static $instance = null;
    private $features_cache = null;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Check if a feature is available
     */
    public function has_feature(string $feature): bool {
        $features = $this->get_available_features();
        return in_array($feature, $features, true);
    }
    
    /**
     * Check multiple features at once
     */
    public function has_features(array $features): array {
        $available = $this->get_available_features();
        $result = [];
        
        foreach ($features as $feature) {
            $result[$feature] = in_array($feature, $available, true);
        }
        
        return $result;
    }
    
    /**
     * Get all available features for current license
     */
    public function get_available_features(): array {
        // Check cache first
        if ($this->features_cache !== null) {
            return $this->features_cache;
        }
        
        $cached = get_transient('flowchat_features');
        if ($cached !== false) {
            $this->features_cache = $cached;
            return $cached;
        }
        
        $license = License_Manager::instance();
        $status = $license->get_status();
        
        // Free tier features (always available)
        $features = [
            'basic_chat',
            'inline_mode',
            'basic_styling',
        ];
        
        // Add premium features if licensed
        if ($status['is_valid'] && $status['tier'] === 'premium') {
            $features = array_merge($features, $status['features'] ?? [
                'multiple_instances',
                'bubble_chat',
                'fullscreen_mode',
                'conversation_history',
                'export_conversations',
                'all_templates',
                'custom_templates',
                'template_import_export',
                'advanced_styling',
                'custom_css',
                'white_label',
                'auto_open_triggers',
                'conditional_display',
                'advanced_analytics',
                'multisite_support',
                'priority_support',
            ]);
        }
        
        // Allow filtering (for add-ons or special conditions)
        $features = apply_filters('flowchat_available_features', $features, $status);
        
        // Cache for 1 hour
        set_transient('flowchat_features', $features, HOUR_IN_SECONDS);
        $this->features_cache = $features;
        
        return $features;
    }
    
    /**
     * Get feature limit
     */
    public function get_limit(string $limit_type): int {
        $license = License_Manager::instance();
        $status = $license->get_status();
        
        $limits = [
            'free' => [
                'instances' => 1,
                'templates' => 3,
                'history_days' => 0,
            ],
            'premium' => [
                'instances' => -1, // unlimited
                'templates' => -1,
                'history_days' => 90,
            ],
        ];
        
        $tier = $status['is_valid'] ? $status['tier'] : 'free';
        
        return $limits[$tier][$limit_type] ?? 0;
    }
    
    /**
     * Check if limit is reached
     */
    public function is_limit_reached(string $limit_type): bool {
        $limit = $this->get_limit($limit_type);
        
        if ($limit === -1) {
            return false; // unlimited
        }
        
        switch ($limit_type) {
            case 'instances':
                $current = Instance_Manager::instance()->count_instances();
                return $current >= $limit;
            
            case 'templates':
                $current = count(get_option('flowchat_custom_templates', []));
                return $current >= $limit;
            
            default:
                return false;
        }
    }
    
    /**
     * Get features for frontend
     */
    public function get_frontend_features(): array {
        return [
            'available' => $this->get_available_features(),
            'limits' => [
                'instances' => $this->get_limit('instances'),
                'templates' => $this->get_limit('templates'),
            ],
            'tier' => License_Manager::instance()->is_premium() ? 'premium' : 'free',
        ];
    }
    
    /**
     * Clear feature cache
     */
    public function clear_cache(): void {
        $this->features_cache = null;
        delete_transient('flowchat_features');
    }
}

// Helper function
function flowchat_has_feature(string $feature): bool {
    return Feature_Checker::instance()->has_feature($feature);
}
```

### TypeScript Feature Checker

```typescript
// src/lib/feature-checker.ts

import { Feature } from '../types/features';

interface FeatureConfig {
  available: string[];
  limits: {
    instances: number;
    templates: number;
  };
  tier: 'free' | 'premium';
}

class FeatureChecker {
  private static instance: FeatureChecker;
  private config: FeatureConfig;
  
  private constructor() {
    this.config = window.flowchatConfig?.features || {
      available: [],
      limits: { instances: 1, templates: 3 },
      tier: 'free',
    };
  }
  
  static getInstance(): FeatureChecker {
    if (!FeatureChecker.instance) {
      FeatureChecker.instance = new FeatureChecker();
    }
    return FeatureChecker.instance;
  }
  
  /**
   * Check if feature is available
   */
  hasFeature(feature: Feature | string): boolean {
    return this.config.available.includes(feature);
  }
  
  /**
   * Check multiple features
   */
  hasFeatures(features: Feature[]): Record<Feature, boolean> {
    return features.reduce((acc, feature) => {
      acc[feature] = this.hasFeature(feature);
      return acc;
    }, {} as Record<Feature, boolean>);
  }
  
  /**
   * Get feature limit
   */
  getLimit(limitType: 'instances' | 'templates'): number {
    return this.config.limits[limitType];
  }
  
  /**
   * Check if premium tier
   */
  isPremium(): boolean {
    return this.config.tier === 'premium';
  }
  
  /**
   * Get current tier
   */
  getTier(): 'free' | 'premium' {
    return this.config.tier;
  }
  
  /**
   * Get all available features
   */
  getAvailableFeatures(): string[] {
    return this.config.available;
  }
}

export const featureChecker = FeatureChecker.getInstance();

// React hook
export function useFeature(feature: Feature): boolean {
  return featureChecker.hasFeature(feature);
}

export function useFeatures(features: Feature[]): Record<Feature, boolean> {
  return featureChecker.hasFeatures(features);
}

export function usePremium(): boolean {
  return featureChecker.isPremium();
}
```

---

## UI Feature Gating

### Premium Feature Gate Component

```tsx
// src/components/PremiumGate/PremiumGate.tsx

import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { Feature } from '../../types/features';
import { useFeature, usePremium } from '../../lib/feature-checker';
import './PremiumGate.css';

interface PremiumGateProps {
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  children,
  fallback,
  showUpgrade = true,
}) => {
  const hasFeature = useFeature(feature);
  const isPremium = usePremium();
  
  if (hasFeature) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showUpgrade) {
    return null;
  }
  
  return (
    <div className="flowchat-premium-gate">
      <div className="flowchat-premium-gate-content">
        <Lock className="flowchat-premium-gate-icon" />
        <div className="flowchat-premium-gate-text">
          <h4>Premium Feature</h4>
          <p>Upgrade to unlock this feature</p>
        </div>
        <a 
          href={window.flowchatConfig?.upgradeUrl || 'https://flowchat.dev/pricing'}
          target="_blank"
          rel="noopener noreferrer"
          className="flowchat-premium-gate-cta"
        >
          <Crown size={16} />
          Upgrade
        </a>
      </div>
    </div>
  );
};

// HOC version
export function withPremiumFeature<P extends object>(
  Component: React.ComponentType<P>,
  feature: Feature,
  Fallback?: React.ComponentType
): React.FC<P> {
  return function PremiumWrapped(props: P) {
    const hasFeature = useFeature(feature);
    
    if (hasFeature) {
      return <Component {...props} />;
    }
    
    if (Fallback) {
      return <Fallback />;
    }
    
    return null;
  };
}
```

### Instance Limit Gate

```tsx
// src/admin/components/InstanceLimitGate/InstanceLimitGate.tsx

import React from 'react';
import { Plus, Crown } from 'lucide-react';
import { featureChecker } from '../../../lib/feature-checker';

interface InstanceLimitGateProps {
  currentCount: number;
  onAdd: () => void;
}

export const InstanceLimitGate: React.FC<InstanceLimitGateProps> = ({
  currentCount,
  onAdd,
}) => {
  const limit = featureChecker.getLimit('instances');
  const isPremium = featureChecker.isPremium();
  const canAdd = limit === -1 || currentCount < limit;
  
  if (canAdd) {
    return (
      <button onClick={onAdd} className="button button-primary">
        <Plus size={16} />
        Add Instance
      </button>
    );
  }
  
  return (
    <div className="flowchat-limit-reached">
      <p>
        You've reached the limit of {limit} instance{limit !== 1 ? 's' : ''} on the free plan.
      </p>
      <a 
        href={window.flowchatConfig?.upgradeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="button button-primary"
      >
        <Crown size={16} />
        Upgrade for Unlimited
      </a>
    </div>
  );
};
```

### Admin Feature Toggles

```tsx
// src/admin/components/FeatureSettings/FeatureSettings.tsx

import React from 'react';
import { Crown, Check, X } from 'lucide-react';
import { Feature } from '../../../types/features';
import { featureChecker } from '../../../lib/feature-checker';

const featureList: Array<{
  feature: Feature;
  label: string;
  description: string;
}> = [
  {
    feature: Feature.BUBBLE_CHAT,
    label: 'Floating Bubble Chat',
    description: 'Show chat as a floating bubble on your site',
  },
  {
    feature: Feature.CONVERSATION_HISTORY,
    label: 'Conversation History',
    description: 'Save and restore chat conversations',
  },
  {
    feature: Feature.AUTO_OPEN_TRIGGERS,
    label: 'Auto-open Triggers',
    description: 'Automatically open chat based on user behavior',
  },
  {
    feature: Feature.CUSTOM_CSS,
    label: 'Custom CSS',
    description: 'Add custom styles to your chat widget',
  },
  {
    feature: Feature.WHITE_LABEL,
    label: 'White Label',
    description: 'Remove FlowChat branding',
  },
  {
    feature: Feature.ADVANCED_ANALYTICS,
    label: 'Advanced Analytics',
    description: 'Detailed chat analytics and insights',
  },
];

export const FeatureSettings: React.FC = () => {
  const isPremium = featureChecker.isPremium();
  
  return (
    <div className="flowchat-feature-settings">
      <h3>Features</h3>
      
      <div className="flowchat-feature-list">
        {featureList.map(({ feature, label, description }) => {
          const hasFeature = featureChecker.hasFeature(feature);
          
          return (
            <div 
              key={feature} 
              className={`flowchat-feature-item ${hasFeature ? 'available' : 'locked'}`}
            >
              <div className="flowchat-feature-status">
                {hasFeature ? (
                  <Check className="icon-check" size={20} />
                ) : (
                  <Crown className="icon-premium" size={20} />
                )}
              </div>
              <div className="flowchat-feature-info">
                <h4>{label}</h4>
                <p>{description}</p>
              </div>
              {!hasFeature && (
                <span className="flowchat-feature-badge">Premium</span>
              )}
            </div>
          );
        })}
      </div>
      
      {!isPremium && (
        <div className="flowchat-upgrade-cta">
          <h4>Unlock All Features</h4>
          <p>Upgrade to Premium for unlimited instances, conversation history, and more.</p>
          <a 
            href={window.flowchatConfig?.upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-primary"
          >
            Upgrade Now
          </a>
        </div>
      )}
    </div>
  );
};
```

---

## License Activation UI

### Admin License Page

```tsx
// src/admin/pages/LicensePage/LicensePage.tsx

import React, { useState } from 'react';
import { Key, Check, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { useLicense } from '../../hooks/useLicense';
import './LicensePage.css';

export const LicensePage: React.FC = () => {
  const { 
    status, 
    activate, 
    deactivate, 
    revalidate,
    isLoading, 
    error 
  } = useLicense();
  
  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');
  
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    await activate(licenseKey, email);
  };
  
  const handleDeactivate = async () => {
    if (confirm('Are you sure you want to deactivate your license?')) {
      await deactivate();
    }
  };
  
  return (
    <div className="wrap flowchat-license-page">
      <h1>License</h1>
      
      {status.is_valid ? (
        <div className="flowchat-license-active">
          <div className="flowchat-license-status success">
            <Check size={24} />
            <div>
              <h3>License Active</h3>
              <p>Your {status.tier} license is active</p>
            </div>
          </div>
          
          <table className="form-table">
            <tbody>
              <tr>
                <th>License Key</th>
                <td><code>{status.display_key}</code></td>
              </tr>
              <tr>
                <th>Plan</th>
                <td>{status.tier === 'premium' ? 'Premium' : 'Free'}</td>
              </tr>
              <tr>
                <th>Expires</th>
                <td>{new Date(status.expires_at).toLocaleDateString()}</td>
              </tr>
              <tr>
                <th>Last Verified</th>
                <td>{new Date(status.last_check).toLocaleDateString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="flowchat-license-actions">
            <button 
              type="button"
              className="button"
              onClick={revalidate}
              disabled={isLoading}
            >
              <RefreshCw size={16} />
              Revalidate
            </button>
            <button 
              type="button"
              className="button button-link-delete"
              onClick={handleDeactivate}
              disabled={isLoading}
            >
              <Trash2 size={16} />
              Deactivate
            </button>
          </div>
        </div>
      ) : (
        <div className="flowchat-license-activate">
          {status.status === 'expired' && (
            <div className="flowchat-license-status warning">
              <AlertCircle size={24} />
              <div>
                <h3>License Expired</h3>
                <p>Your license expired on {new Date(status.expires_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          
          <div className="flowchat-license-form-card">
            <h3>
              <Key size={20} />
              Activate License
            </h3>
            
            <form onSubmit={handleActivate}>
              <table className="form-table">
                <tbody>
                  <tr>
                    <th>
                      <label htmlFor="license-key">License Key</label>
                    </th>
                    <td>
                      <input
                        type="text"
                        id="license-key"
                        className="regular-text"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        pattern="[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}"
                        required
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>
                      <label htmlFor="license-email">Email</label>
                    </th>
                    <td>
                      <input
                        type="email"
                        id="license-email"
                        className="regular-text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                      <p className="description">
                        The email used to purchase your license
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {error && (
                <div className="flowchat-license-error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              <p className="submit">
                <button 
                  type="submit" 
                  className="button button-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Activating...' : 'Activate License'}
                </button>
              </p>
            </form>
          </div>
          
          <div className="flowchat-license-help">
            <h4>Don't have a license?</h4>
            <p>
              <a 
                href="https://flowchat.dev/pricing"
                target="_blank"
                rel="noopener noreferrer"
              >
                Purchase a premium license
              </a>
              {' '}to unlock all features including unlimited chat instances,
              floating bubble chat, conversation history, and more.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
```

### License Hook

```typescript
// src/admin/hooks/useLicense.ts

import { useState, useEffect, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';

interface LicenseStatus {
  is_valid: boolean;
  tier: 'free' | 'premium';
  status: 'none' | 'active' | 'expired' | 'invalid';
  expires_at?: string;
  last_check?: string;
  display_key?: string;
  features?: string[];
}

export function useLicense() {
  const [status, setStatus] = useState<LicenseStatus>({
    is_valid: false,
    tier: 'free',
    status: 'none',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch current status
  useEffect(() => {
    fetchStatus();
  }, []);
  
  const fetchStatus = async () => {
    try {
      const response = await apiFetch<{ data: LicenseStatus }>({
        path: '/flowchat/v1/license/status',
      });
      setStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch license status:', err);
    }
  };
  
  const activate = useCallback(async (key: string, email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch<{ success: boolean; error?: string; data?: LicenseStatus }>({
        path: '/flowchat/v1/license/activate',
        method: 'POST',
        data: { license_key: key, email },
      });
      
      if (response.success && response.data) {
        setStatus(response.data);
        return true;
      } else {
        setError(response.error || 'Activation failed');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Activation failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const deactivate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiFetch({
        path: '/flowchat/v1/license/deactivate',
        method: 'POST',
      });
      
      setStatus({
        is_valid: false,
        tier: 'free',
        status: 'none',
      });
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Deactivation failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const revalidate = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await apiFetch<{ success: boolean; data?: LicenseStatus }>({
        path: '/flowchat/v1/license/validate',
        method: 'POST',
      });
      
      if (response.data) {
        setStatus(response.data);
      }
    } catch (err) {
      console.error('Revalidation failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    status,
    activate,
    deactivate,
    revalidate,
    isLoading,
    error,
  };
}
```

---

## Update System

### Update Checker

```php
<?php
// includes/class-update-checker.php

namespace FlowChat;

class Update_Checker {
    
    private $api_url = 'https://api.flowchat.dev/v1/updates';
    private $plugin_slug = 'flowchat/flowchat.php';
    
    public function __construct() {
        // Hook into WordPress update system
        add_filter('pre_set_site_transient_update_plugins', [$this, 'check_update']);
        add_filter('plugins_api', [$this, 'plugin_info'], 10, 3);
        add_action('in_plugin_update_message-' . $this->plugin_slug, [$this, 'update_message'], 10, 2);
    }
    
    /**
     * Check for plugin updates
     */
    public function check_update($transient) {
        if (empty($transient->checked)) {
            return $transient;
        }
        
        $remote = $this->get_remote_info();
        
        if (
            $remote && 
            version_compare(FLOWCHAT_VERSION, $remote->version, '<')
        ) {
            $res = new \stdClass();
            $res->slug = 'flowchat';
            $res->plugin = $this->plugin_slug;
            $res->new_version = $remote->version;
            $res->tested = $remote->tested;
            $res->package = $this->get_download_url($remote);
            $res->icons = [
                '1x' => $remote->icons['1x'] ?? '',
                '2x' => $remote->icons['2x'] ?? '',
            ];
            $res->banners = [
                'low' => $remote->banners['low'] ?? '',
                'high' => $remote->banners['high'] ?? '',
            ];
            
            $transient->response[$this->plugin_slug] = $res;
        }
        
        return $transient;
    }
    
    /**
     * Get plugin information for WordPress popup
     */
    public function plugin_info($result, $action, $args) {
        if ($action !== 'plugin_information' || $args->slug !== 'flowchat') {
            return $result;
        }
        
        $remote = $this->get_remote_info();
        
        if (!$remote) {
            return $result;
        }
        
        $info = new \stdClass();
        $info->name = $remote->name;
        $info->slug = 'flowchat';
        $info->version = $remote->version;
        $info->tested = $remote->tested;
        $info->requires = $remote->requires;
        $info->requires_php = $remote->requires_php;
        $info->author = $remote->author;
        $info->author_profile = $remote->author_profile;
        $info->download_link = $this->get_download_url($remote);
        $info->trunk = $this->get_download_url($remote);
        $info->last_updated = $remote->last_updated;
        $info->sections = [
            'description' => $remote->sections['description'] ?? '',
            'installation' => $remote->sections['installation'] ?? '',
            'changelog' => $remote->sections['changelog'] ?? '',
        ];
        $info->banners = [
            'low' => $remote->banners['low'] ?? '',
            'high' => $remote->banners['high'] ?? '',
        ];
        
        return $info;
    }
    
    /**
     * Show custom message in update notice
     */
    public function update_message($plugin_data, $response) {
        $license = License_Manager::instance();
        
        if (!$license->is_premium()) {
            echo '<br><strong>' . esc_html__('Note:', 'flowchat') . '</strong> ';
            echo esc_html__('Premium features require an active license.', 'flowchat');
            echo ' <a href="https://flowchat.dev/pricing" target="_blank">';
            echo esc_html__('Get Premium', 'flowchat');
            echo '</a>';
        }
    }
    
    /**
     * Get remote plugin info from API
     */
    private function get_remote_info() {
        $cache_key = 'flowchat_update_info';
        $cached = get_transient($cache_key);
        
        if ($cached !== false) {
            return $cached;
        }
        
        $response = wp_remote_get($this->api_url . '/info', [
            'timeout' => 10,
            'headers' => [
                'X-FlowChat-Version' => FLOWCHAT_VERSION,
            ],
        ]);
        
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return null;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body);
        
        if (!$data) {
            return null;
        }
        
        // Cache for 6 hours
        set_transient($cache_key, $data, 6 * HOUR_IN_SECONDS);
        
        return $data;
    }
    
    /**
     * Get download URL (includes license key for premium)
     */
    private function get_download_url($remote): string {
        $url = $remote->download_url ?? '';
        
        // For premium users, append license key
        $license = License_Manager::instance();
        $status = $license->get_status();
        
        if ($status['is_valid'] && isset($status['key'])) {
            $url = add_query_arg([
                'license_key' => $status['key'],
                'site_url' => urlencode(home_url()),
            ], $url);
        }
        
        return $url;
    }
}
```

---

## CodeCanyon Distribution

### CodeCanyon-specific Handling

```php
<?php
// includes/class-codecanyon-updater.php

namespace FlowChat;

class CodeCanyon_Updater {
    
    private $item_id; // Envato item ID
    private $api_url = 'https://api.flowchat.dev/v1/envato';
    
    public function __construct() {
        // Only active if this is CodeCanyon version
        if (!defined('FLOWCHAT_CODECANYON')) {
            return;
        }
        
        $this->item_id = FLOWCHAT_CODECANYON_ITEM_ID;
        
        add_filter('pre_set_site_transient_update_plugins', [$this, 'check_update']);
    }
    
    /**
     * Check for updates using purchase code
     */
    public function check_update($transient) {
        $purchase_code = get_option('flowchat_purchase_code');
        
        if (!$purchase_code) {
            return $transient;
        }
        
        $response = wp_remote_post($this->api_url . '/verify-update', [
            'body' => [
                'purchase_code' => $purchase_code,
                'item_id' => $this->item_id,
                'current_version' => FLOWCHAT_VERSION,
                'site_url' => home_url(),
            ],
        ]);
        
        if (is_wp_error($response)) {
            return $transient;
        }
        
        $data = json_decode(wp_remote_retrieve_body($response), true);
        
        if (!empty($data['update_available'])) {
            $plugin_slug = 'flowchat/flowchat.php';
            
            $transient->response[$plugin_slug] = (object) [
                'slug' => 'flowchat',
                'plugin' => $plugin_slug,
                'new_version' => $data['version'],
                'package' => $data['download_url'],
                'tested' => $data['tested'],
            ];
        }
        
        return $transient;
    }
}
```

### Purchase Code Verification UI

```tsx
// src/admin/components/EnvatoPurchaseCode/EnvatoPurchaseCode.tsx

import React, { useState } from 'react';
import { Key, Check, AlertCircle } from 'lucide-react';

export const EnvatoPurchaseCode: React.FC = () => {
  const [purchaseCode, setPurchaseCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/wp-json/flowchat/v1/envato/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.flowchatConfig?.nonce,
        },
        body: JSON.stringify({ purchase_code: purchaseCode }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsVerified(true);
      } else {
        setError(data.error || 'Invalid purchase code');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flowchat-envato-verify">
      <h3>
        <Key size={20} />
        CodeCanyon Purchase Code
      </h3>
      
      {isVerified ? (
        <div className="flowchat-envato-verified">
          <Check size={20} />
          <span>Purchase verified - updates enabled</span>
        </div>
      ) : (
        <form onSubmit={handleVerify}>
          <p>Enter your CodeCanyon purchase code to enable automatic updates.</p>
          
          <input
            type="text"
            value={purchaseCode}
            onChange={(e) => setPurchaseCode(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="regular-text"
            required
          />
          
          {error && (
            <div className="flowchat-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="button button-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Purchase'}
          </button>
          
          <p className="description">
            <a 
              href="https://help.market.envato.com/hc/en-us/articles/202822600"
              target="_blank"
              rel="noopener noreferrer"
            >
              Where to find your purchase code
            </a>
          </p>
        </form>
      )}
    </div>
  );
};
```

---

## Server-Side Gating Examples

### Instance Creation Gate

```php
<?php
// In Instance_Manager class

public function create_instance(array $data): int|\WP_Error {
    $feature_checker = Feature_Checker::instance();
    
    // Check instance limit
    if ($feature_checker->is_limit_reached('instances')) {
        return new \WP_Error(
            'instance_limit',
            __('Instance limit reached. Upgrade to premium for unlimited instances.', 'flowchat'),
            ['status' => 403]
        );
    }
    
    // Check premium features in config
    if (!empty($data['bubble_enabled']) && !$feature_checker->has_feature('bubble_chat')) {
        return new \WP_Error(
            'premium_feature',
            __('Bubble chat requires a premium license.', 'flowchat'),
            ['status' => 403]
        );
    }
    
    // Continue with instance creation...
}
```

### REST API Feature Gate

```php
<?php
// includes/rest/class-feature-gate-middleware.php

namespace FlowChat\REST;

class Feature_Gate_Middleware {
    
    /**
     * Gate endpoints by feature
     */
    public static function check_feature(string $feature): callable {
        return function() use ($feature) {
            $checker = \FlowChat\Feature_Checker::instance();
            
            if (!$checker->has_feature($feature)) {
                return new \WP_Error(
                    'premium_required',
                    sprintf(
                        __('This feature requires a premium license: %s', 'flowchat'),
                        $feature
                    ),
                    ['status' => 403]
                );
            }
            
            return true;
        };
    }
}

// Usage in route registration:
register_rest_route('flowchat/v1', '/history', [
    'methods' => 'GET',
    'callback' => [$this, 'get_history'],
    'permission_callback' => Feature_Gate_Middleware::check_feature('conversation_history'),
]);
```

---

## CSS Styles

```css
/* src/styles/premium-gate.css */

.flowchat-premium-gate {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  text-align: center;
}

.flowchat-premium-gate-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.flowchat-premium-gate-icon {
  color: #6c757d;
}

.flowchat-premium-gate-text h4 {
  margin: 0;
  font-size: 16px;
  color: #495057;
}

.flowchat-premium-gate-text p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #6c757d;
}

.flowchat-premium-gate-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  color: #212529;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: transform 0.15s, box-shadow 0.15s;
}

.flowchat-premium-gate-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
  color: #212529;
}

/* Feature list */
.flowchat-feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
}

.flowchat-feature-item.available {
  background: #f8fff8;
  border-color: #28a745;
}

.flowchat-feature-item.locked {
  background: #f8f9fa;
  opacity: 0.8;
}

.flowchat-feature-status .icon-check {
  color: #28a745;
}

.flowchat-feature-status .icon-premium {
  color: #ffc107;
}

.flowchat-feature-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: #ffc107;
  color: #212529;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

/* License page */
.flowchat-license-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.flowchat-license-status.success {
  background: #d4edda;
  color: #155724;
}

.flowchat-license-status.warning {
  background: #fff3cd;
  color: #856404;
}

.flowchat-license-status h3 {
  margin: 0;
  font-size: 18px;
}

.flowchat-license-status p {
  margin: 4px 0 0;
}

.flowchat-license-form-card {
  max-width: 600px;
  padding: 24px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.flowchat-license-form-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
}

.flowchat-license-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  margin-bottom: 16px;
}

.flowchat-license-help {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.flowchat-limit-reached {
  padding: 16px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  text-align: center;
}

.flowchat-limit-reached p {
  margin: 0 0 12px;
}
```

---

This completes the feature gating and licensing specification with comprehensive coverage of tier management, license validation, feature checking, and update distribution.
