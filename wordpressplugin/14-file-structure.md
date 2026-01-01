# FlowChat File Structure Specification

## Overview

Complete directory structure and file organization for the FlowChat WordPress plugin, designed for maintainability, scalability, and WordPress coding standards compliance.

## Root Directory Structure

```
flowchat/
├── flowchat.php                    # Main plugin file
├── uninstall.php                   # Cleanup on uninstall
├── readme.txt                      # WordPress.org readme
├── README.md                       # GitHub readme
├── CHANGELOG.md                    # Version history
├── LICENSE                         # License file (GPL v2+)
├── composer.json                   # PHP dependencies
├── package.json                    # Node dependencies
├── webpack.config.js               # Webpack configuration (admin)
├── vite.config.ts                  # Vite configuration (frontend)
├── tsconfig.json                   # TypeScript configuration
├── .eslintrc.js                    # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── .phpcs.xml                      # PHP CodeSniffer rules
├── phpunit.xml                     # PHPUnit configuration
├── .gitignore                      # Git ignore rules
├── .distignore                     # Build distribution ignore
│
├── assets/                         # Static assets
├── build/                          # Compiled JS/CSS (gitignored, generated)
├── includes/                       # PHP classes and functions
├── languages/                      # Translation files
├── src/                           # Source TypeScript/React code
├── templates/                      # PHP templates
├── tests/                         # Test files
└── vendor/                        # Composer dependencies (gitignored)
```

## Main Plugin File

```php
<?php
/**
 * Plugin Name: FlowChat
 * Plugin URI: https://flowchat.io
 * Description: Connect AI-powered chat to your WordPress site via n8n automation workflows.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author: FlowChat Team
 * Author URI: https://flowchat.io
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: flowchat
 * Domain Path: /languages
 *
 * @package FlowChat
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('FLOWCHAT_VERSION', '1.0.0');
define('FLOWCHAT_PLUGIN_FILE', __FILE__);
define('FLOWCHAT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FLOWCHAT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('FLOWCHAT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Minimum requirements
define('FLOWCHAT_MIN_WP_VERSION', '6.0');
define('FLOWCHAT_MIN_PHP_VERSION', '8.0');

// Autoloader
require_once FLOWCHAT_PLUGIN_DIR . 'includes/autoload.php';

// Initialize plugin
function flowchat_init(): void {
    // Check requirements
    if (!flowchat_check_requirements()) {
        return;
    }
    
    // Load text domain
    load_plugin_textdomain('flowchat', false, dirname(FLOWCHAT_PLUGIN_BASENAME) . '/languages');
    
    // Initialize main plugin class
    FlowChat\Plugin::get_instance();
}
add_action('plugins_loaded', 'flowchat_init');

// Activation hook
register_activation_hook(__FILE__, 'flowchat_activate');
function flowchat_activate(): void {
    FlowChat\Activator::activate();
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'flowchat_deactivate');
function flowchat_deactivate(): void {
    FlowChat\Deactivator::deactivate();
}

// Requirements check
function flowchat_check_requirements(): bool {
    global $wp_version;
    
    if (version_compare(PHP_VERSION, FLOWCHAT_MIN_PHP_VERSION, '<')) {
        add_action('admin_notices', function() {
            printf(
                '<div class="notice notice-error"><p>%s</p></div>',
                sprintf(
                    __('FlowChat requires PHP %s or higher. You are running PHP %s.', 'flowchat'),
                    FLOWCHAT_MIN_PHP_VERSION,
                    PHP_VERSION
                )
            );
        });
        return false;
    }
    
    if (version_compare($wp_version, FLOWCHAT_MIN_WP_VERSION, '<')) {
        add_action('admin_notices', function() use ($wp_version) {
            printf(
                '<div class="notice notice-error"><p>%s</p></div>',
                sprintf(
                    __('FlowChat requires WordPress %s or higher. You are running WordPress %s.', 'flowchat'),
                    FLOWCHAT_MIN_WP_VERSION,
                    $wp_version
                )
            );
        });
        return false;
    }
    
    return true;
}
```

## Includes Directory

```
includes/
├── autoload.php                    # PSR-4 autoloader
├── class-plugin.php                # Main plugin class
├── class-activator.php             # Activation handler
├── class-deactivator.php           # Deactivation handler
├── class-loader.php                # Hook loader
├── class-i18n.php                  # Internationalization
│
├── admin/                          # Admin-specific classes
│   ├── class-admin.php             # Main admin class
│   ├── class-settings-page.php     # Settings page
│   ├── class-instances-page.php    # Instance management page
│   ├── class-templates-page.php    # Templates page
│   ├── class-tools-page.php        # Import/Export tools
│   ├── class-error-config.php      # Error message configuration
│   └── class-menu.php              # Admin menu registration
│
├── api/                            # REST API classes
│   ├── class-rest-controller.php   # Base REST controller
│   ├── class-instance-endpoints.php # Instance CRUD endpoints
│   ├── class-chat-endpoints.php    # Chat/message endpoints
│   ├── class-settings-endpoints.php # Settings endpoints
│   ├── class-template-endpoints.php # Template endpoints
│   └── class-health-endpoints.php  # Health check endpoints
│
├── core/                           # Core functionality
│   ├── class-instance-manager.php  # Instance management
│   ├── class-template-manager.php  # Template management
│   ├── class-session-manager.php   # Chat session management
│   ├── class-history-manager.php   # Chat history management
│   ├── class-import-export.php     # Import/Export handler
│   └── class-license-manager.php   # License verification
│
├── frontend/                       # Frontend classes
│   ├── class-frontend.php          # Main frontend class
│   ├── class-shortcode.php         # Shortcode handler
│   ├── class-widget.php            # WordPress widget
│   ├── class-assets.php            # Asset enqueuing
│   └── class-block.php             # Gutenberg block registration
│
├── n8n/                           # n8n integration
│   ├── class-webhook-handler.php   # Webhook processing
│   ├── class-payload-builder.php   # Request payload construction
│   └── class-response-parser.php   # Response parsing
│
├── security/                       # Security classes
│   ├── class-auth.php              # Authentication
│   ├── class-nonce-manager.php     # Nonce handling
│   ├── class-rate-limiter.php      # Rate limiting
│   ├── class-sanitizer.php         # Input sanitization
│   └── class-cors.php              # CORS handling
│
├── database/                       # Database classes
│   ├── class-schema.php            # Database schema
│   ├── class-migrator.php          # Database migrations
│   ├── class-instances-table.php   # Instances table operations
│   ├── class-sessions-table.php    # Sessions table operations
│   └── class-history-table.php     # History table operations
│
├── utilities/                      # Utility classes
│   ├── class-error-handler.php     # Error handling
│   ├── class-logger.php            # Logging
│   ├── class-cache.php             # Caching utilities
│   └── class-helpers.php           # Helper functions
│
└── traits/                         # PHP traits
    ├── trait-singleton.php         # Singleton pattern
    └── trait-hooks.php             # Hook management
```

## Source Directory (TypeScript/React)

```
src/
├── index.ts                        # Main frontend entry
├── admin-index.ts                  # Admin entry point
├── types.ts                        # Global type definitions
│
├── components/                     # React components
│   ├── index.ts                    # Component exports
│   │
│   ├── chat/                       # Chat components
│   │   ├── ChatContainer.tsx       # Main chat container
│   │   ├── ChatHeader.tsx          # Chat header
│   │   ├── ChatMessages.tsx        # Message list
│   │   ├── ChatInput.tsx           # Message input
│   │   ├── ChatMessage.tsx         # Single message
│   │   ├── TypingIndicator.tsx     # Typing animation
│   │   ├── WelcomeScreen.tsx       # Initial welcome
│   │   ├── SuggestedPrompts.tsx    # Quick prompts
│   │   └── index.ts                # Chat exports
│   │
│   ├── bubble/                     # Bubble components
│   │   ├── BubbleRoot.tsx          # Bubble container
│   │   ├── BubbleTrigger.tsx       # Trigger button
│   │   ├── BubblePanel.tsx         # Chat panel
│   │   ├── InstanceSwitcher.tsx    # Multi-instance tabs
│   │   └── index.ts                # Bubble exports
│   │
│   ├── ui/                         # UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Tooltip.tsx
│   │   └── index.ts
│   │
│   ├── errors/                     # Error components
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorDisplay.tsx
│   │   ├── InlineError.tsx
│   │   └── index.ts
│   │
│   └── shared/                     # Shared components
│       ├── MarkdownRenderer.tsx
│       ├── CodeBlock.tsx
│       └── index.ts
│
├── admin/                          # Admin React components
│   ├── App.tsx                     # Admin app root
│   ├── routes.tsx                  # Admin routing
│   │
│   ├── pages/                      # Admin pages
│   │   ├── Dashboard.tsx
│   │   ├── Instances.tsx
│   │   ├── InstanceEditor.tsx
│   │   ├── Templates.tsx
│   │   ├── Settings.tsx
│   │   ├── Tools.tsx
│   │   └── index.ts
│   │
│   ├── components/                 # Admin components
│   │   ├── InstanceList.tsx
│   │   ├── InstanceCard.tsx
│   │   ├── InstanceForm.tsx
│   │   ├── TemplateBrowser.tsx
│   │   ├── StylePresetPicker.tsx
│   │   ├── ColorPicker.tsx
│   │   ├── WebhookTester.tsx
│   │   ├── PreviewPane.tsx
│   │   ├── ImportExport.tsx
│   │   └── index.ts
│   │
│   └── hooks/                      # Admin hooks
│       ├── useInstances.ts
│       ├── useTemplates.ts
│       ├── useSettings.ts
│       └── index.ts
│
├── runtime/                        # n8n Runtime Adapter
│   ├── N8nRuntimeAdapter.ts        # Main adapter class
│   ├── StreamHandler.ts            # SSE stream handling
│   ├── ConnectionManager.ts        # Connection management
│   └── index.ts
│
├── hooks/                          # React hooks
│   ├── useChat.ts                  # Chat state management
│   ├── useBubble.ts                # Bubble state
│   ├── useError.ts                 # Error handling
│   ├── useAutoOpen.ts              # Auto-open logic
│   ├── useNetworkStatus.ts         # Network monitoring
│   ├── useLocalStorage.ts          # Local storage
│   └── index.ts
│
├── context/                        # React contexts
│   ├── ChatContext.tsx             # Chat state context
│   ├── BubbleContext.tsx           # Bubble state context
│   ├── ConfigContext.tsx           # Configuration context
│   └── index.ts
│
├── services/                       # API services
│   ├── api.ts                      # API client
│   ├── chat-service.ts             # Chat operations
│   ├── instance-service.ts         # Instance operations
│   ├── template-service.ts         # Template operations
│   └── index.ts
│
├── utils/                          # Utilities
│   ├── helpers.ts                  # Helper functions
│   ├── validators.ts               # Validation functions
│   ├── formatters.ts               # Formatting utilities
│   ├── storage.ts                  # Storage utilities
│   ├── network-monitor.ts          # Network monitoring
│   ├── offline-queue.ts            # Offline message queue
│   └── index.ts
│
├── errors/                         # Error handling
│   ├── error-codes.ts              # Error code registry
│   ├── error-factory.ts            # Error creation
│   ├── error-logger.ts             # Error logging
│   └── index.ts
│
├── types/                          # TypeScript types
│   ├── instance.ts                 # Instance types
│   ├── message.ts                  # Message types
│   ├── config.ts                   # Configuration types
│   ├── templates.ts                # Template types
│   ├── style-presets.ts            # Style preset types
│   ├── errors.ts                   # Error types
│   ├── api.ts                      # API types
│   └── index.ts
│
└── styles/                         # CSS/SCSS styles
    ├── index.css                   # Main styles entry
    ├── variables.css               # CSS variables
    ├── reset.css                   # CSS reset
    │
    ├── components/                 # Component styles
    │   ├── chat.css
    │   ├── bubble.css
    │   ├── messages.css
    │   ├── input.css
    │   └── header.css
    │
    ├── admin/                      # Admin styles
    │   ├── admin.css
    │   ├── forms.css
    │   ├── tables.css
    │   └── templates.css
    │
    ├── themes/                     # Theme variations
    │   ├── light.css
    │   ├── dark.css
    │   └── auto.css
    │
    └── utilities/                  # Utility classes
        ├── spacing.css
        ├── typography.css
        └── animations.css
```

## Assets Directory

```
assets/
├── images/                         # Static images
│   ├── logo.svg                    # Plugin logo
│   ├── icon-128.png                # Plugin icon (128x128)
│   ├── icon-256.png                # Plugin icon (256x256)
│   ├── banner-772x250.png          # WordPress.org banner
│   ├── banner-1544x500.png         # HiDPI banner
│   └── screenshots/                # Plugin screenshots
│       ├── screenshot-1.png
│       ├── screenshot-2.png
│       └── ...
│
├── icons/                          # UI icons
│   ├── chat.svg
│   ├── send.svg
│   ├── close.svg
│   ├── minimize.svg
│   ├── maximize.svg
│   ├── settings.svg
│   └── ...
│
├── templates/                      # Template JSON files
│   ├── customer-support.json
│   ├── sales-assistant.json
│   ├── lead-generation.json
│   ├── faq-bot.json
│   └── ...
│
├── presets/                        # Preset JSON files
│   ├── styles.json                 # Style presets
│   └── content.json                # Content presets
│
└── n8n/                           # n8n workflow templates
    ├── basic-ai-chat.json
    ├── customer-support-kb.json
    └── ...
```

## Build Directory

```
build/                              # Generated files (gitignored)
├── admin/                          # Admin build
│   ├── admin.js                    # Admin bundle
│   ├── admin.js.map                # Source map
│   ├── admin.css                   # Admin styles
│   └── admin.asset.php             # WordPress asset file
│
├── frontend/                       # Frontend build
│   ├── chat.js                     # Chat bundle
│   ├── chat.js.map                 # Source map
│   ├── chat.css                    # Chat styles
│   ├── bubble.js                   # Bubble bundle (if separate)
│   └── chat.asset.php              # Asset metadata
│
├── blocks/                         # Gutenberg block build
│   ├── block.js
│   └── block.css
│
└── vendor/                         # Vendored libraries
    └── assistant-ui.js             # Bundled assistant-ui
```

## Templates Directory

```
templates/                          # PHP templates
├── admin/                          # Admin templates
│   ├── settings-page.php
│   ├── instances-page.php
│   ├── templates-page.php
│   └── tools-page.php
│
├── frontend/                       # Frontend templates
│   ├── chat-container.php          # Chat container HTML
│   ├── bubble-container.php        # Bubble container HTML
│   └── shortcode-output.php        # Shortcode output
│
├── emails/                         # Email templates
│   └── notification.php
│
└── partials/                       # Reusable partials
    ├── admin-header.php
    ├── admin-footer.php
    └── notice.php
```

## Tests Directory

```
tests/
├── bootstrap.php                   # Test bootstrap
├── phpunit.xml                     # PHPUnit config
│
├── php/                            # PHP tests
│   ├── unit/                       # Unit tests
│   │   ├── InstanceManagerTest.php
│   │   ├── TemplateManagerTest.php
│   │   ├── SanitizerTest.php
│   │   └── ...
│   │
│   ├── integration/                # Integration tests
│   │   ├── ApiEndpointsTest.php
│   │   ├── DatabaseTest.php
│   │   └── ...
│   │
│   └── fixtures/                   # Test fixtures
│       ├── instances.json
│       └── templates.json
│
├── js/                             # JavaScript tests
│   ├── setup.ts                    # Test setup
│   │
│   ├── unit/                       # Unit tests
│   │   ├── components/
│   │   │   ├── ChatContainer.test.tsx
│   │   │   ├── BubbleRoot.test.tsx
│   │   │   └── ...
│   │   │
│   │   ├── hooks/
│   │   │   ├── useChat.test.ts
│   │   │   └── ...
│   │   │
│   │   └── utils/
│   │       ├── helpers.test.ts
│   │       └── ...
│   │
│   └── integration/                # Integration tests
│       ├── chat-flow.test.ts
│       └── ...
│
└── e2e/                           # End-to-end tests
    ├── playwright.config.ts
    ├── specs/
    │   ├── admin-flow.spec.ts
    │   ├── chat-flow.spec.ts
    │   └── bubble.spec.ts
    │
    └── fixtures/
        └── test-site/
```

## Languages Directory

```
languages/
├── flowchat.pot                    # Translation template
├── flowchat-de_DE.po              # German translation
├── flowchat-de_DE.mo              # German compiled
├── flowchat-es_ES.po              # Spanish translation
├── flowchat-es_ES.mo              # Spanish compiled
├── flowchat-fr_FR.po              # French translation
├── flowchat-fr_FR.mo              # French compiled
└── ...
```

## Configuration Files

### package.json

```json
{
  "name": "flowchat",
  "version": "1.0.0",
  "description": "AI Chat for WordPress via n8n",
  "private": true,
  "scripts": {
    "build": "npm run build:admin && npm run build:frontend",
    "build:admin": "wp-scripts build src/admin-index.ts --output-path=build/admin",
    "build:frontend": "vite build",
    "build:blocks": "wp-scripts build src/blocks/index.ts --output-path=build/blocks",
    "dev": "npm run dev:admin & npm run dev:frontend",
    "dev:admin": "wp-scripts start src/admin-index.ts --output-path=build/admin",
    "dev:frontend": "vite",
    "lint": "npm run lint:js && npm run lint:css",
    "lint:js": "wp-scripts lint-js src/",
    "lint:css": "wp-scripts lint-style src/**/*.css",
    "format": "wp-scripts format src/",
    "test": "wp-scripts test-unit-js",
    "test:e2e": "playwright test",
    "i18n:make-pot": "wp i18n make-pot . languages/flowchat.pot",
    "i18n:make-json": "wp i18n make-json languages",
    "plugin-zip": "wp-scripts plugin-zip"
  },
  "dependencies": {
    "@assistant-ui/react": "^0.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@wordpress/scripts": "^26.0.0",
    "@wordpress/i18n": "^4.0.0",
    "@wordpress/components": "^25.0.0",
    "@wordpress/element": "^5.0.0",
    "@wordpress/api-fetch": "^6.0.0",
    "@wordpress/data": "^9.0.0",
    "@playwright/test": "^1.40.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  },
  "browserslist": [
    "defaults",
    "not IE 11"
  ]
}
```

### composer.json

```json
{
  "name": "flowchat/flowchat",
  "description": "AI Chat for WordPress via n8n",
  "type": "wordpress-plugin",
  "license": "GPL-2.0-or-later",
  "require": {
    "php": ">=8.0"
  },
  "require-dev": {
    "phpunit/phpunit": "^9.0",
    "wp-coding-standards/wpcs": "^3.0",
    "phpstan/phpstan": "^1.0",
    "dealerdirect/phpcodesniffer-composer-installer": "^1.0"
  },
  "autoload": {
    "psr-4": {
      "FlowChat\\": "includes/"
    }
  },
  "autoload-dev": {
    "psr-4": {
      "FlowChat\\Tests\\": "tests/php/"
    }
  },
  "scripts": {
    "phpcs": "phpcs",
    "phpcbf": "phpcbf",
    "phpstan": "phpstan analyse",
    "test": "phpunit"
  },
  "config": {
    "allow-plugins": {
      "dealerdirect/phpcodesniffer-composer-installer": true
    }
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@admin/*": ["src/admin/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  
  build: {
    outDir: 'build/frontend',
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'FlowChat',
      formats: ['iife'],
      fileName: () => 'chat.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'chat.css';
          }
          return assetInfo.name || '';
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
});
```

### webpack.config.js

```javascript
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
  ...defaultConfig,
  
  entry: {
    admin: path.resolve(__dirname, 'src/admin-index.ts'),
    blocks: path.resolve(__dirname, 'src/blocks/index.ts'),
  },
  
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name]/[name].js',
  },
  
  resolve: {
    ...defaultConfig.resolve,
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@admin': path.resolve(__dirname, 'src/admin'),
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },
};
```

## PHP Autoloader

```php
<?php
// includes/autoload.php

spl_autoload_register(function ($class) {
    // Only autoload FlowChat classes
    $prefix = 'FlowChat\\';
    $base_dir = FLOWCHAT_PLUGIN_DIR . 'includes/';
    
    // Check if class uses the namespace prefix
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    // Get relative class name
    $relative_class = substr($class, $len);
    
    // Convert namespace separators to directory separators
    // Convert CamelCase to kebab-case for file names
    $relative_path = str_replace('\\', '/', $relative_class);
    $parts = explode('/', $relative_path);
    $filename = array_pop($parts);
    
    // Convert ClassName to class-classname.php
    $filename = 'class-' . strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', $filename)) . '.php';
    
    // Build directory path (lowercase)
    $directory = implode('/', array_map('strtolower', $parts));
    
    // Build full file path
    $file = $base_dir;
    if ($directory) {
        $file .= $directory . '/';
    }
    $file .= $filename;
    
    // Load file if it exists
    if (file_exists($file)) {
        require $file;
    }
});
```

## .gitignore

```gitignore
# Dependencies
/node_modules/
/vendor/

# Build output
/build/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
/coverage/

# Environment
.env
.env.local
.env.*.local

# WordPress
/wp-content/
*.sql

# Distribution
*.zip
/dist/

# Composer
composer.lock

# Misc
.phpunit.result.cache
.eslintcache
```

## .distignore

```distignore
# Development files
.git
.gitignore
.gitattributes
.github
node_modules
src
tests
.eslintrc.js
.prettierrc
.phpcs.xml
phpunit.xml
tsconfig.json
tsconfig.node.json
vite.config.ts
webpack.config.js
package.json
package-lock.json
composer.json
composer.lock

# Documentation
*.md
!readme.txt
docs

# Development directories
/coverage
/.idea
/.vscode

# Build tools
Makefile
Gruntfile.js
gulpfile.js

# Test files
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
__tests__
__mocks__
jest.config.js
playwright.config.ts

# Other
.DS_Store
Thumbs.db
*.log
.env*
```

This completes the file structure specification. Creating the final build and deployment specification...
