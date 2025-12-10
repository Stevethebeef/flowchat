# FlowChat: Shortcodes & Gutenberg Blocks Specification

## Overview

FlowChat provides multiple methods for embedding chat instances: WordPress shortcodes for classic editor users and Gutenberg blocks for the block editor. Both methods support the full range of configuration options while providing sensible defaults.

## Shortcode System

### Basic Shortcode

```
[flowchat]
```

Renders the default chat instance with all default settings.

### Full Shortcode Syntax

```
[flowchat 
  id="instance-id"
  mode="inline|bubble|both"
  width="100%"
  height="500px"
  position="bottom-right"
  theme="light|dark|auto"
  welcome="Custom welcome message"
  placeholder="Type your message..."
  class="custom-class"
]
```

### Shortcode Attributes Reference

#### Core Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | string | (first instance) | Instance ID/slug to render |
| `mode` | string | `inline` | Display mode: `inline`, `bubble`, or `both` |
| `disabled` | boolean | `false` | Disable chat (show placeholder) |

#### Dimension Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | string | `100%` | Container width (CSS value) |
| `height` | string | `500px` | Container height (CSS value) |
| `min-height` | string | `300px` | Minimum height |
| `max-height` | string | `800px` | Maximum height |

#### Appearance Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | string | `light` | Color theme: `light`, `dark`, `auto` |
| `template` | string | - | Template slug to apply |
| `primary-color` | string | - | Override primary color (hex) |
| `class` | string | - | Additional CSS classes |
| `style` | string | - | Inline CSS styles |

#### Content Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `welcome` | string | (from config) | Welcome message override |
| `placeholder` | string | (from config) | Input placeholder override |
| `title` | string | (from config) | Chat header title |
| `subtitle` | string | - | Optional subtitle below title |

#### Bubble Attributes (mode="bubble" or "both")

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `position` | string | `bottom-right` | `bottom-right`, `bottom-left`, `custom` |
| `offset-x` | string | `20px` | Horizontal offset from edge |
| `offset-y` | string | `20px` | Vertical offset from edge |
| `bubble-size` | string | `60px` | Trigger button size |
| `auto-open` | boolean | `false` | Open automatically |
| `auto-open-delay` | number | `3000` | Delay before auto-open (ms) |
| `start-open` | boolean | `false` | Start in open state |

#### Behavior Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `show-header` | boolean | `true` | Show chat header |
| `show-timestamp` | boolean | `true` | Show message timestamps |
| `show-avatar` | boolean | `true` | Show avatars |
| `enable-file-upload` | boolean | (from config) | Enable file uploads |
| `enable-voice` | boolean | (from config) | Enable voice input |
| `enable-history` | boolean | (from config) | Enable history feature |

#### Access Control Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `require-login` | boolean | `false` | Require user login |
| `allowed-roles` | string | - | Comma-separated roles |
| `login-message` | string | - | Message for logged-out users |

### Shortcode Examples

#### Basic Inline Chat

```html
<!-- Simple embedding -->
[flowchat id="support"]

<!-- With custom dimensions -->
[flowchat id="support" width="600px" height="400px"]
```

#### Styled Chat

```html
<!-- Dark theme with custom colors -->
[flowchat id="sales" theme="dark" primary-color="#FF6B00"]

<!-- Using a template -->
[flowchat id="faq" template="minimal"]

<!-- With custom CSS class -->
[flowchat id="help" class="my-custom-chat rounded-corners"]
```

#### Bubble Chat

```html
<!-- Bottom-right bubble -->
[flowchat id="support" mode="bubble" position="bottom-right"]

<!-- Auto-opening bubble -->
[flowchat id="sales" mode="bubble" auto-open="true" auto-open-delay="5000"]

<!-- Left-side bubble -->
[flowchat id="help" mode="bubble" position="bottom-left" offset-x="30px"]
```

#### Content Overrides

```html
<!-- Custom welcome and placeholder -->
[flowchat 
  id="product-help" 
  welcome="👋 Need help with this product? Ask away!"
  placeholder="Ask about features, pricing, shipping..."
]

<!-- With title and subtitle -->
[flowchat 
  id="sales"
  title="Sales Assistant"
  subtitle="Available 24/7"
]
```

#### Access Control

```html
<!-- Members only -->
[flowchat id="premium-support" require-login="true"]

<!-- Specific roles -->
[flowchat 
  id="admin-helper" 
  require-login="true" 
  allowed-roles="administrator,editor"
]

<!-- Custom login message -->
[flowchat 
  id="member-chat"
  require-login="true"
  login-message="Please log in to access our AI support."
]
```

#### Combined Examples

```html
<!-- Full-featured inline chat -->
[flowchat 
  id="main-support"
  mode="inline"
  width="100%"
  height="600px"
  theme="auto"
  template="modern"
  title="Customer Support"
  welcome="Hello! How can we help you today?"
  placeholder="Describe your issue..."
  show-header="true"
  show-timestamp="true"
  enable-file-upload="true"
  class="support-chat-main"
]

<!-- Minimal floating bubble -->
[flowchat 
  id="quick-help"
  mode="bubble"
  position="bottom-right"
  bubble-size="50px"
  theme="light"
  show-header="false"
  auto-open="true"
  auto-open-delay="10000"
]
```

### Shortcode PHP Implementation

```php
<?php
// includes/shortcodes/class-flowchat-shortcode.php

namespace FlowChat\Shortcodes;

class FlowChat_Shortcode {
    
    /**
     * Default attribute values
     */
    private const DEFAULTS = [
        'id'              => '',
        'mode'            => 'inline',
        'disabled'        => 'false',
        'width'           => '100%',
        'height'          => '500px',
        'min-height'      => '300px',
        'max-height'      => '800px',
        'theme'           => 'light',
        'template'        => '',
        'primary-color'   => '',
        'class'           => '',
        'style'           => '',
        'welcome'         => '',
        'placeholder'     => '',
        'title'           => '',
        'subtitle'        => '',
        'position'        => 'bottom-right',
        'offset-x'        => '20px',
        'offset-y'        => '20px',
        'bubble-size'     => '60px',
        'auto-open'       => 'false',
        'auto-open-delay' => '3000',
        'start-open'      => 'false',
        'show-header'     => 'true',
        'show-timestamp'  => 'true',
        'show-avatar'     => 'true',
        'enable-file-upload' => '',
        'enable-voice'    => '',
        'enable-history'  => '',
        'require-login'   => 'false',
        'allowed-roles'   => '',
        'login-message'   => '',
    ];
    
    /**
     * Register shortcode
     */
    public static function register(): void {
        add_shortcode('flowchat', [self::class, 'render']);
    }
    
    /**
     * Render shortcode
     */
    public static function render(array $atts = [], ?string $content = null): string {
        // Parse attributes
        $atts = shortcode_atts(self::DEFAULTS, $atts, 'flowchat');
        
        // Get instance configuration
        $instance_id = self::resolve_instance_id($atts['id']);
        if (!$instance_id) {
            return self::render_error('No chat instance configured.');
        }
        
        $instance = FlowChat_Instances::get($instance_id);
        if (!$instance) {
            return self::render_error('Chat instance not found.');
        }
        
        // Check access
        $access_check = self::check_access($atts, $instance);
        if ($access_check !== true) {
            return $access_check; // Returns login message HTML
        }
        
        // Check if disabled
        if (self::parse_bool($atts['disabled'])) {
            return self::render_disabled($instance);
        }
        
        // Merge shortcode attributes with instance config
        $config = self::merge_config($instance, $atts);
        
        // Generate unique container ID
        $container_id = 'flowchat-' . wp_unique_id();
        
        // Enqueue assets
        self::enqueue_assets($container_id, $config);
        
        // Render container
        return self::render_container($container_id, $config, $atts);
    }
    
    /**
     * Resolve instance ID
     */
    private static function resolve_instance_id(string $id): ?string {
        if (!empty($id)) {
            return sanitize_key($id);
        }
        
        // Get first/default instance
        $instances = FlowChat_Instances::get_all();
        return !empty($instances) ? $instances[0]['id'] : null;
    }
    
    /**
     * Check user access
     */
    private static function check_access(array $atts, array $instance): bool|string {
        $require_login = self::parse_bool($atts['require-login']) 
                      || ($instance['access']['requireLogin'] ?? false);
        
        if ($require_login && !is_user_logged_in()) {
            $message = !empty($atts['login-message']) 
                     ? $atts['login-message'] 
                     : ($instance['access']['loginMessage'] ?? __('Please log in to use chat.', 'flowchat'));
            
            return self::render_login_required($message);
        }
        
        // Check role restrictions
        $allowed_roles = !empty($atts['allowed-roles'])
                       ? array_map('trim', explode(',', $atts['allowed-roles']))
                       : ($instance['access']['allowedRoles'] ?? []);
        
        if (!empty($allowed_roles) && is_user_logged_in()) {
            $user = wp_get_current_user();
            $has_role = array_intersect($allowed_roles, $user->roles);
            
            if (empty($has_role)) {
                return self::render_access_denied();
            }
        }
        
        return true;
    }
    
    /**
     * Merge shortcode attributes with instance config
     */
    private static function merge_config(array $instance, array $atts): array {
        $config = $instance;
        
        // Override with shortcode values if provided
        $overrides = [
            'appearance' => [
                'theme' => $atts['theme'] ?: null,
                'template' => $atts['template'] ?: null,
                'primaryColor' => $atts['primary-color'] ?: null,
            ],
            'behavior' => [
                'welcomeMessage' => $atts['welcome'] ?: null,
                'inputPlaceholder' => $atts['placeholder'] ?: null,
            ],
            'display' => [
                'mode' => $atts['mode'],
                'inline' => [
                    'width' => $atts['width'],
                    'height' => $atts['height'],
                    'minHeight' => $atts['min-height'],
                    'maxHeight' => $atts['max-height'],
                ],
                'bubble' => [
                    'position' => $atts['position'],
                    'offsetX' => $atts['offset-x'],
                    'offsetY' => $atts['offset-y'],
                    'triggerSize' => $atts['bubble-size'],
                    'autoOpen' => self::parse_bool($atts['auto-open']),
                    'autoOpenDelay' => (int) $atts['auto-open-delay'],
                    'startOpen' => self::parse_bool($atts['start-open']),
                ],
            ],
            'ui' => [
                'showHeader' => self::parse_bool($atts['show-header']),
                'showTimestamp' => self::parse_bool($atts['show-timestamp']),
                'showAvatar' => self::parse_bool($atts['show-avatar']),
                'title' => $atts['title'] ?: null,
                'subtitle' => $atts['subtitle'] ?: null,
            ],
        ];
        
        // Deep merge, skipping null values
        return self::deep_merge_non_null($config, $overrides);
    }
    
    /**
     * Enqueue necessary assets
     */
    private static function enqueue_assets(string $container_id, array $config): void {
        // Enqueue main FlowChat script
        wp_enqueue_script('flowchat-frontend');
        wp_enqueue_style('flowchat-frontend');
        
        // Add instance configuration
        wp_add_inline_script(
            'flowchat-frontend',
            sprintf(
                'window.FlowChatInstances = window.FlowChatInstances || {}; window.FlowChatInstances[%s] = %s;',
                wp_json_encode($container_id),
                wp_json_encode($config)
            ),
            'before'
        );
    }
    
    /**
     * Render container HTML
     */
    private static function render_container(string $container_id, array $config, array $atts): string {
        $classes = ['flowchat-container'];
        $classes[] = 'flowchat-mode-' . esc_attr($config['display']['mode']);
        $classes[] = 'flowchat-theme-' . esc_attr($config['appearance']['theme'] ?? 'light');
        
        if (!empty($atts['class'])) {
            $classes[] = esc_attr($atts['class']);
        }
        
        $style = '';
        if (!empty($atts['style'])) {
            $style = esc_attr($atts['style']);
        }
        
        $data_attrs = [
            'data-flowchat-container' => $container_id,
            'data-flowchat-instance' => esc_attr($config['id']),
            'data-flowchat-mode' => esc_attr($config['display']['mode']),
        ];
        
        $data_string = '';
        foreach ($data_attrs as $key => $value) {
            $data_string .= sprintf(' %s="%s"', $key, $value);
        }
        
        return sprintf(
            '<div id="%s" class="%s" style="%s"%s></div>',
            esc_attr($container_id),
            esc_attr(implode(' ', $classes)),
            $style,
            $data_string
        );
    }
    
    /**
     * Render error message
     */
    private static function render_error(string $message): string {
        if (current_user_can('manage_options')) {
            return sprintf(
                '<div class="flowchat-error flowchat-admin-notice">%s</div>',
                esc_html($message)
            );
        }
        return ''; // Silent for non-admins
    }
    
    /**
     * Render login required message
     */
    private static function render_login_required(string $message): string {
        return sprintf(
            '<div class="flowchat-login-required">
                <p>%s</p>
                <a href="%s" class="flowchat-login-link">%s</a>
            </div>',
            esc_html($message),
            esc_url(wp_login_url(get_permalink())),
            esc_html__('Log In', 'flowchat')
        );
    }
    
    /**
     * Render access denied message
     */
    private static function render_access_denied(): string {
        return sprintf(
            '<div class="flowchat-access-denied">
                <p>%s</p>
            </div>',
            esc_html__('You do not have permission to access this chat.', 'flowchat')
        );
    }
    
    /**
     * Render disabled placeholder
     */
    private static function render_disabled(array $instance): string {
        return sprintf(
            '<div class="flowchat-disabled">
                <p>%s</p>
            </div>',
            esc_html($instance['errors']['unavailableMessage'] ?? __('Chat is currently unavailable.', 'flowchat'))
        );
    }
    
    /**
     * Parse boolean attribute
     */
    private static function parse_bool(string $value): bool {
        return in_array(strtolower($value), ['true', '1', 'yes', 'on'], true);
    }
    
    /**
     * Deep merge arrays, skipping null values
     */
    private static function deep_merge_non_null(array $base, array $override): array {
        foreach ($override as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
                $base[$key] = self::deep_merge_non_null($base[$key], $value);
            } elseif ($value !== null && $value !== '') {
                $base[$key] = $value;
            }
        }
        return $base;
    }
}
```

---

## Gutenberg Block

### Block Registration

```json
// blocks/flowchat/block.json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "flowchat/chat",
    "version": "1.0.0",
    "title": "FlowChat",
    "category": "widgets",
    "icon": "format-chat",
    "description": "Embed an AI chat widget powered by n8n.",
    "keywords": ["chat", "ai", "n8n", "assistant", "support"],
    "textdomain": "flowchat",
    "attributes": {
        "instanceId": {
            "type": "string",
            "default": ""
        },
        "mode": {
            "type": "string",
            "default": "inline",
            "enum": ["inline", "bubble", "both"]
        },
        "width": {
            "type": "string",
            "default": "100%"
        },
        "height": {
            "type": "string",
            "default": "500px"
        },
        "theme": {
            "type": "string",
            "default": "light",
            "enum": ["light", "dark", "auto"]
        },
        "template": {
            "type": "string",
            "default": ""
        },
        "primaryColor": {
            "type": "string",
            "default": ""
        },
        "welcomeMessage": {
            "type": "string",
            "default": ""
        },
        "placeholder": {
            "type": "string",
            "default": ""
        },
        "title": {
            "type": "string",
            "default": ""
        },
        "subtitle": {
            "type": "string",
            "default": ""
        },
        "bubblePosition": {
            "type": "string",
            "default": "bottom-right",
            "enum": ["bottom-right", "bottom-left"]
        },
        "bubbleOffsetX": {
            "type": "string",
            "default": "20px"
        },
        "bubbleOffsetY": {
            "type": "string",
            "default": "20px"
        },
        "bubbleSize": {
            "type": "string",
            "default": "60px"
        },
        "autoOpen": {
            "type": "boolean",
            "default": false
        },
        "autoOpenDelay": {
            "type": "number",
            "default": 3000
        },
        "startOpen": {
            "type": "boolean",
            "default": false
        },
        "showHeader": {
            "type": "boolean",
            "default": true
        },
        "showTimestamp": {
            "type": "boolean",
            "default": true
        },
        "showAvatar": {
            "type": "boolean",
            "default": true
        },
        "requireLogin": {
            "type": "boolean",
            "default": false
        },
        "allowedRoles": {
            "type": "array",
            "default": [],
            "items": {
                "type": "string"
            }
        },
        "customClass": {
            "type": "string",
            "default": ""
        }
    },
    "supports": {
        "html": false,
        "align": ["wide", "full"],
        "className": true,
        "anchor": true,
        "spacing": {
            "margin": true,
            "padding": true
        }
    },
    "editorScript": "file:./index.js",
    "editorStyle": "file:./index.css",
    "style": "file:./style-index.css",
    "render": "file:./render.php"
}
```

### Block Edit Component

```jsx
// blocks/flowchat/edit.js

import { __ } from '@wordpress/i18n';
import { 
    useBlockProps,
    InspectorControls,
} from '@wordpress/block-editor';
import {
    PanelBody,
    PanelRow,
    SelectControl,
    TextControl,
    ToggleControl,
    RangeControl,
    ColorPicker,
    Placeholder,
    Spinner,
    Notice,
    __experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { chat as chatIcon } from '@wordpress/icons';

export default function Edit({ attributes, setAttributes }) {
    const {
        instanceId,
        mode,
        width,
        height,
        theme,
        template,
        primaryColor,
        welcomeMessage,
        placeholder,
        title,
        subtitle,
        bubblePosition,
        bubbleOffsetX,
        bubbleOffsetY,
        bubbleSize,
        autoOpen,
        autoOpenDelay,
        startOpen,
        showHeader,
        showTimestamp,
        showAvatar,
        requireLogin,
        allowedRoles,
        customClass,
    } = attributes;
    
    const blockProps = useBlockProps({
        className: `flowchat-block flowchat-mode-${mode}`,
    });
    
    // Fetch available instances
    const { instances, templates, isLoading, error } = useSelect((select) => {
        const store = select('flowchat/settings');
        return {
            instances: store?.getInstances() ?? [],
            templates: store?.getTemplates() ?? [],
            isLoading: store?.isLoading() ?? false,
            error: store?.getError() ?? null,
        };
    }, []);
    
    // Available WordPress roles
    const { roles } = useSelect((select) => {
        return {
            roles: select('core')?.getEntityRecords('root', '__experimental', {
                context: 'edit',
            })?.roles ?? [],
        };
    }, []);
    
    // Instance options for select
    const instanceOptions = [
        { label: __('Select Instance...', 'flowchat'), value: '' },
        ...instances.map(inst => ({
            label: inst.name,
            value: inst.id,
        })),
    ];
    
    // Template options
    const templateOptions = [
        { label: __('Default', 'flowchat'), value: '' },
        ...templates.map(tpl => ({
            label: tpl.name,
            value: tpl.slug,
        })),
    ];
    
    // Selected instance data
    const selectedInstance = instances.find(i => i.id === instanceId);
    
    if (isLoading) {
        return (
            <div {...blockProps}>
                <Placeholder icon={chatIcon} label={__('FlowChat', 'flowchat')}>
                    <Spinner />
                </Placeholder>
            </div>
        );
    }
    
    if (error) {
        return (
            <div {...blockProps}>
                <Placeholder icon={chatIcon} label={__('FlowChat', 'flowchat')}>
                    <Notice status="error" isDismissible={false}>
                        {error}
                    </Notice>
                </Placeholder>
            </div>
        );
    }
    
    if (instances.length === 0) {
        return (
            <div {...blockProps}>
                <Placeholder
                    icon={chatIcon}
                    label={__('FlowChat', 'flowchat')}
                    instructions={__('No chat instances configured. Create one in FlowChat settings.', 'flowchat')}
                >
                    <a 
                        href={flowchatBlockData.settingsUrl} 
                        className="components-button is-primary"
                    >
                        {__('Configure FlowChat', 'flowchat')}
                    </a>
                </Placeholder>
            </div>
        );
    }
    
    return (
        <>
            <InspectorControls>
                {/* Instance Selection */}
                <PanelBody title={__('Chat Instance', 'flowchat')} initialOpen={true}>
                    <SelectControl
                        label={__('Instance', 'flowchat')}
                        value={instanceId}
                        options={instanceOptions}
                        onChange={(value) => setAttributes({ instanceId: value })}
                        help={__('Select which chat instance to display.', 'flowchat')}
                    />
                    
                    <SelectControl
                        label={__('Display Mode', 'flowchat')}
                        value={mode}
                        options={[
                            { label: __('Inline', 'flowchat'), value: 'inline' },
                            { label: __('Floating Bubble', 'flowchat'), value: 'bubble' },
                            { label: __('Both', 'flowchat'), value: 'both' },
                        ]}
                        onChange={(value) => setAttributes({ mode: value })}
                    />
                </PanelBody>
                
                {/* Dimensions (for inline mode) */}
                {(mode === 'inline' || mode === 'both') && (
                    <PanelBody title={__('Dimensions', 'flowchat')} initialOpen={false}>
                        <UnitControl
                            label={__('Width', 'flowchat')}
                            value={width}
                            onChange={(value) => setAttributes({ width: value })}
                            units={[
                                { value: '%', label: '%' },
                                { value: 'px', label: 'px' },
                                { value: 'vw', label: 'vw' },
                            ]}
                        />
                        
                        <UnitControl
                            label={__('Height', 'flowchat')}
                            value={height}
                            onChange={(value) => setAttributes({ height: value })}
                            units={[
                                { value: 'px', label: 'px' },
                                { value: 'vh', label: 'vh' },
                            ]}
                        />
                    </PanelBody>
                )}
                
                {/* Bubble Settings */}
                {(mode === 'bubble' || mode === 'both') && (
                    <PanelBody title={__('Bubble Settings', 'flowchat')} initialOpen={false}>
                        <SelectControl
                            label={__('Position', 'flowchat')}
                            value={bubblePosition}
                            options={[
                                { label: __('Bottom Right', 'flowchat'), value: 'bottom-right' },
                                { label: __('Bottom Left', 'flowchat'), value: 'bottom-left' },
                            ]}
                            onChange={(value) => setAttributes({ bubblePosition: value })}
                        />
                        
                        <UnitControl
                            label={__('Horizontal Offset', 'flowchat')}
                            value={bubbleOffsetX}
                            onChange={(value) => setAttributes({ bubbleOffsetX: value })}
                        />
                        
                        <UnitControl
                            label={__('Vertical Offset', 'flowchat')}
                            value={bubbleOffsetY}
                            onChange={(value) => setAttributes({ bubbleOffsetY: value })}
                        />
                        
                        <UnitControl
                            label={__('Button Size', 'flowchat')}
                            value={bubbleSize}
                            onChange={(value) => setAttributes({ bubbleSize: value })}
                        />
                        
                        <ToggleControl
                            label={__('Start Open', 'flowchat')}
                            checked={startOpen}
                            onChange={(value) => setAttributes({ startOpen: value })}
                        />
                        
                        <ToggleControl
                            label={__('Auto Open', 'flowchat')}
                            checked={autoOpen}
                            onChange={(value) => setAttributes({ autoOpen: value })}
                        />
                        
                        {autoOpen && (
                            <RangeControl
                                label={__('Auto Open Delay (ms)', 'flowchat')}
                                value={autoOpenDelay}
                                onChange={(value) => setAttributes({ autoOpenDelay: value })}
                                min={1000}
                                max={30000}
                                step={500}
                            />
                        )}
                    </PanelBody>
                )}
                
                {/* Appearance */}
                <PanelBody title={__('Appearance', 'flowchat')} initialOpen={false}>
                    <SelectControl
                        label={__('Theme', 'flowchat')}
                        value={theme}
                        options={[
                            { label: __('Light', 'flowchat'), value: 'light' },
                            { label: __('Dark', 'flowchat'), value: 'dark' },
                            { label: __('Auto (System)', 'flowchat'), value: 'auto' },
                        ]}
                        onChange={(value) => setAttributes({ theme: value })}
                    />
                    
                    {templateOptions.length > 1 && (
                        <SelectControl
                            label={__('Template', 'flowchat')}
                            value={template}
                            options={templateOptions}
                            onChange={(value) => setAttributes({ template: value })}
                        />
                    )}
                    
                    <PanelRow>
                        <fieldset>
                            <legend>{__('Primary Color', 'flowchat')}</legend>
                            <ColorPicker
                                color={primaryColor}
                                onChange={(value) => setAttributes({ primaryColor: value })}
                                enableAlpha={false}
                            />
                        </fieldset>
                    </PanelRow>
                </PanelBody>
                
                {/* Content */}
                <PanelBody title={__('Content', 'flowchat')} initialOpen={false}>
                    <TextControl
                        label={__('Title', 'flowchat')}
                        value={title}
                        onChange={(value) => setAttributes({ title: value })}
                        placeholder={selectedInstance?.name ?? __('Chat', 'flowchat')}
                    />
                    
                    <TextControl
                        label={__('Subtitle', 'flowchat')}
                        value={subtitle}
                        onChange={(value) => setAttributes({ subtitle: value })}
                    />
                    
                    <TextControl
                        label={__('Welcome Message', 'flowchat')}
                        value={welcomeMessage}
                        onChange={(value) => setAttributes({ welcomeMessage: value })}
                        placeholder={selectedInstance?.behavior?.welcomeMessage ?? ''}
                    />
                    
                    <TextControl
                        label={__('Input Placeholder', 'flowchat')}
                        value={placeholder}
                        onChange={(value) => setAttributes({ placeholder: value })}
                        placeholder={selectedInstance?.behavior?.inputPlaceholder ?? ''}
                    />
                </PanelBody>
                
                {/* UI Options */}
                <PanelBody title={__('UI Options', 'flowchat')} initialOpen={false}>
                    <ToggleControl
                        label={__('Show Header', 'flowchat')}
                        checked={showHeader}
                        onChange={(value) => setAttributes({ showHeader: value })}
                    />
                    
                    <ToggleControl
                        label={__('Show Timestamps', 'flowchat')}
                        checked={showTimestamp}
                        onChange={(value) => setAttributes({ showTimestamp: value })}
                    />
                    
                    <ToggleControl
                        label={__('Show Avatars', 'flowchat')}
                        checked={showAvatar}
                        onChange={(value) => setAttributes({ showAvatar: value })}
                    />
                </PanelBody>
                
                {/* Access Control */}
                <PanelBody title={__('Access Control', 'flowchat')} initialOpen={false}>
                    <ToggleControl
                        label={__('Require Login', 'flowchat')}
                        checked={requireLogin}
                        onChange={(value) => setAttributes({ requireLogin: value })}
                    />
                    
                    {requireLogin && roles.length > 0 && (
                        <SelectControl
                            multiple
                            label={__('Allowed Roles', 'flowchat')}
                            value={allowedRoles}
                            options={Object.entries(roles).map(([slug, role]) => ({
                                label: role.name,
                                value: slug,
                            }))}
                            onChange={(value) => setAttributes({ allowedRoles: value })}
                            help={__('Leave empty to allow all logged-in users.', 'flowchat')}
                        />
                    )}
                </PanelBody>
                
                {/* Advanced */}
                <PanelBody title={__('Advanced', 'flowchat')} initialOpen={false}>
                    <TextControl
                        label={__('Custom CSS Class', 'flowchat')}
                        value={customClass}
                        onChange={(value) => setAttributes({ customClass: value })}
                    />
                </PanelBody>
            </InspectorControls>
            
            {/* Block Preview */}
            <div {...blockProps}>
                {!instanceId ? (
                    <Placeholder
                        icon={chatIcon}
                        label={__('FlowChat', 'flowchat')}
                        instructions={__('Select a chat instance from the sidebar.', 'flowchat')}
                    >
                        <SelectControl
                            value={instanceId}
                            options={instanceOptions}
                            onChange={(value) => setAttributes({ instanceId: value })}
                        />
                    </Placeholder>
                ) : (
                    <div className="flowchat-block-preview">
                        <div 
                            className="flowchat-preview-container"
                            style={{
                                width: mode === 'inline' ? width : '400px',
                                height: mode === 'inline' ? height : '500px',
                                maxHeight: '500px',
                            }}
                        >
                            <div className="flowchat-preview-header">
                                {showHeader && (
                                    <>
                                        <span className="flowchat-preview-title">
                                            {title || selectedInstance?.name || __('Chat', 'flowchat')}
                                        </span>
                                        {subtitle && (
                                            <span className="flowchat-preview-subtitle">{subtitle}</span>
                                        )}
                                    </>
                                )}
                            </div>
                            
                            <div className="flowchat-preview-messages">
                                <div className="flowchat-preview-welcome">
                                    {welcomeMessage || selectedInstance?.behavior?.welcomeMessage || __('Hello! How can I help you?', 'flowchat')}
                                </div>
                            </div>
                            
                            <div className="flowchat-preview-composer">
                                <input 
                                    type="text" 
                                    placeholder={placeholder || selectedInstance?.behavior?.inputPlaceholder || __('Type a message...', 'flowchat')}
                                    disabled
                                />
                                <button disabled>{__('Send', 'flowchat')}</button>
                            </div>
                        </div>
                        
                        {mode === 'bubble' && (
                            <div className="flowchat-preview-bubble-note">
                                {__('Bubble will appear floating on the page.', 'flowchat')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
```

### Block Render (PHP)

```php
<?php
// blocks/flowchat/render.php

/**
 * Server-side rendering for FlowChat block
 *
 * @param array    $attributes Block attributes
 * @param string   $content    Block content (empty)
 * @param WP_Block $block      Block instance
 */

defined('ABSPATH') || exit;

// Build shortcode attributes from block attributes
$shortcode_atts = [];

// Map block attributes to shortcode attributes
$mapping = [
    'instanceId'      => 'id',
    'mode'            => 'mode',
    'width'           => 'width',
    'height'          => 'height',
    'theme'           => 'theme',
    'template'        => 'template',
    'primaryColor'    => 'primary-color',
    'welcomeMessage'  => 'welcome',
    'placeholder'     => 'placeholder',
    'title'           => 'title',
    'subtitle'        => 'subtitle',
    'bubblePosition'  => 'position',
    'bubbleOffsetX'   => 'offset-x',
    'bubbleOffsetY'   => 'offset-y',
    'bubbleSize'      => 'bubble-size',
    'autoOpen'        => 'auto-open',
    'autoOpenDelay'   => 'auto-open-delay',
    'startOpen'       => 'start-open',
    'showHeader'      => 'show-header',
    'showTimestamp'   => 'show-timestamp',
    'showAvatar'      => 'show-avatar',
    'requireLogin'    => 'require-login',
    'customClass'     => 'class',
];

foreach ($mapping as $blockAttr => $shortcodeAttr) {
    if (isset($attributes[$blockAttr]) && $attributes[$blockAttr] !== '') {
        $value = $attributes[$blockAttr];
        
        // Convert booleans to string
        if (is_bool($value)) {
            $value = $value ? 'true' : 'false';
        }
        
        $shortcode_atts[] = sprintf('%s="%s"', $shortcodeAttr, esc_attr($value));
    }
}

// Handle allowed roles array
if (!empty($attributes['allowedRoles']) && is_array($attributes['allowedRoles'])) {
    $shortcode_atts[] = sprintf('allowed-roles="%s"', esc_attr(implode(',', $attributes['allowedRoles'])));
}

// Add block alignment class
$wrapper_attributes = get_block_wrapper_attributes([
    'class' => isset($attributes['align']) ? 'align' . $attributes['align'] : '',
]);

// Build and execute shortcode
$shortcode = '[flowchat ' . implode(' ', $shortcode_atts) . ']';

echo '<div ' . $wrapper_attributes . '>';
echo do_shortcode($shortcode);
echo '</div>';
```

---

## Widget Support

### Classic Widget (for legacy sidebar support)

```php
<?php
// includes/widgets/class-flowchat-widget.php

namespace FlowChat\Widgets;

class FlowChat_Widget extends \WP_Widget {
    
    public function __construct() {
        parent::__construct(
            'flowchat_widget',
            __('FlowChat', 'flowchat'),
            [
                'description' => __('Display an AI chat widget.', 'flowchat'),
                'classname'   => 'widget-flowchat',
            ]
        );
    }
    
    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }
        
        // Build shortcode
        $shortcode_atts = [
            'id'     => $instance['instance_id'] ?? '',
            'mode'   => 'inline',
            'height' => $instance['height'] ?? '400px',
            'theme'  => $instance['theme'] ?? 'light',
        ];
        
        $atts_string = '';
        foreach ($shortcode_atts as $key => $value) {
            if (!empty($value)) {
                $atts_string .= sprintf(' %s="%s"', $key, esc_attr($value));
            }
        }
        
        echo do_shortcode('[flowchat' . $atts_string . ']');
        
        echo $args['after_widget'];
    }
    
    public function form($instance) {
        $title = $instance['title'] ?? '';
        $instance_id = $instance['instance_id'] ?? '';
        $height = $instance['height'] ?? '400px';
        $theme = $instance['theme'] ?? 'light';
        
        // Get available instances
        $instances = \FlowChat\FlowChat_Instances::get_all();
        
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>">
                <?php esc_html_e('Title:', 'flowchat'); ?>
            </label>
            <input 
                class="widefat" 
                id="<?php echo esc_attr($this->get_field_id('title')); ?>"
                name="<?php echo esc_attr($this->get_field_name('title')); ?>"
                type="text"
                value="<?php echo esc_attr($title); ?>"
            />
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('instance_id')); ?>">
                <?php esc_html_e('Chat Instance:', 'flowchat'); ?>
            </label>
            <select
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('instance_id')); ?>"
                name="<?php echo esc_attr($this->get_field_name('instance_id')); ?>"
            >
                <?php foreach ($instances as $inst) : ?>
                    <option 
                        value="<?php echo esc_attr($inst['id']); ?>"
                        <?php selected($instance_id, $inst['id']); ?>
                    >
                        <?php echo esc_html($inst['name']); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('height')); ?>">
                <?php esc_html_e('Height:', 'flowchat'); ?>
            </label>
            <input 
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('height')); ?>"
                name="<?php echo esc_attr($this->get_field_name('height')); ?>"
                type="text"
                value="<?php echo esc_attr($height); ?>"
            />
        </p>
        
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('theme')); ?>">
                <?php esc_html_e('Theme:', 'flowchat'); ?>
            </label>
            <select
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('theme')); ?>"
                name="<?php echo esc_attr($this->get_field_name('theme')); ?>"
            >
                <option value="light" <?php selected($theme, 'light'); ?>>
                    <?php esc_html_e('Light', 'flowchat'); ?>
                </option>
                <option value="dark" <?php selected($theme, 'dark'); ?>>
                    <?php esc_html_e('Dark', 'flowchat'); ?>
                </option>
                <option value="auto" <?php selected($theme, 'auto'); ?>>
                    <?php esc_html_e('Auto', 'flowchat'); ?>
                </option>
            </select>
        </p>
        <?php
    }
    
    public function update($new_instance, $old_instance) {
        $instance = [];
        $instance['title'] = sanitize_text_field($new_instance['title'] ?? '');
        $instance['instance_id'] = sanitize_key($new_instance['instance_id'] ?? '');
        $instance['height'] = sanitize_text_field($new_instance['height'] ?? '400px');
        $instance['theme'] = sanitize_key($new_instance['theme'] ?? 'light');
        
        return $instance;
    }
}
```

---

## Template Tag

### PHP Function for Theme Developers

```php
<?php
// includes/template-tags.php

/**
 * Render FlowChat instance
 *
 * @param string $instance_id Instance ID
 * @param array  $args        Optional arguments
 * @return void
 */
function flowchat_render(string $instance_id = '', array $args = []): void {
    echo flowchat_get_rendered($instance_id, $args);
}

/**
 * Get rendered FlowChat instance
 *
 * @param string $instance_id Instance ID
 * @param array  $args        Optional arguments
 * @return string
 */
function flowchat_get_rendered(string $instance_id = '', array $args = []): string {
    // Build shortcode attributes
    $atts = array_merge(['id' => $instance_id], $args);
    
    $atts_string = '';
    foreach ($atts as $key => $value) {
        if ($value !== '' && $value !== null) {
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            $atts_string .= sprintf(' %s="%s"', esc_attr($key), esc_attr($value));
        }
    }
    
    return do_shortcode('[flowchat' . $atts_string . ']');
}

/**
 * Check if FlowChat is available
 *
 * @return bool
 */
function flowchat_is_available(): bool {
    return class_exists('\FlowChat\FlowChat_Instances') 
        && count(\FlowChat\FlowChat_Instances::get_all()) > 0;
}

/**
 * Get all FlowChat instances
 *
 * @return array
 */
function flowchat_get_instances(): array {
    if (!class_exists('\FlowChat\FlowChat_Instances')) {
        return [];
    }
    
    return \FlowChat\FlowChat_Instances::get_all();
}
```

### Usage Examples

```php
// In theme template file

// Simple render
<?php if (flowchat_is_available()): ?>
    <?php flowchat_render('support'); ?>
<?php endif; ?>

// With options
<?php 
flowchat_render('sales', [
    'mode' => 'inline',
    'height' => '600px',
    'theme' => 'dark',
    'welcome' => 'Welcome! How can we help?',
]);
?>

// Get rendered HTML
<?php $chat_html = flowchat_get_rendered('faq', ['mode' => 'bubble']); ?>
```

---

## Related Documentation

- [03-admin-ui-spec.md](./03-admin-ui-spec.md) - Instance configuration UI
- [04-chat-instances-config.md](./04-chat-instances-config.md) - Instance configuration schema
- [05-frontend-components.md](./05-frontend-components.md) - React components
- [14-file-structure.md](./14-file-structure.md) - File organization
