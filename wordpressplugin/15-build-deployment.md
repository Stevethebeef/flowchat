# FlowChat Build & Deployment Specification

## Overview

Complete build process, asset generation, testing, and deployment workflow for the FlowChat WordPress plugin, supporting both WordPress.org distribution and direct sales via CodeCanyon.

## Build System Architecture

### 1. Dual Build System

FlowChat uses two build systems:
- **webpack (via @wordpress/scripts)**: Admin React app and Gutenberg blocks
- **Vite**: Frontend chat widget (optimized for small bundle size)

```
┌─────────────────────────────────────────────────────────────┐
│                      Source Code                             │
│  src/admin-index.ts    src/index.ts    src/blocks/index.ts  │
└─────────────┬──────────────┬──────────────┬─────────────────┘
              │              │              │
              ▼              ▼              ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │ webpack │    │  Vite   │    │ webpack │
        │ (admin) │    │(frontend│    │(blocks) │
        └────┬────┘    └────┬────┘    └────┬────┘
             │              │              │
             ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                      build/ Directory                        │
│  build/admin/      build/frontend/      build/blocks/       │
│  - admin.js        - chat.js            - block.js          │
│  - admin.css       - chat.css           - block.css         │
│  - admin.asset.php                                          │
└─────────────────────────────────────────────────────────────┘
```

### 2. Build Commands

```json
{
  "scripts": {
    "build": "npm run build:admin && npm run build:frontend && npm run build:blocks",
    "build:admin": "wp-scripts build src/admin-index.ts --output-path=build/admin",
    "build:frontend": "vite build",
    "build:blocks": "wp-scripts build src/blocks/index.ts --output-path=build/blocks",
    
    "dev": "concurrently \"npm:dev:*\"",
    "dev:admin": "wp-scripts start src/admin-index.ts --output-path=build/admin",
    "dev:frontend": "vite --mode development",
    
    "watch": "npm run dev",
    
    "clean": "rimraf build/",
    "prebuild": "npm run clean"
  }
}
```

## Vite Configuration (Frontend)

### 3. Production Build Config

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Use automatic JSX runtime
      jsxRuntime: 'automatic',
    }),
    // Bundle analyzer (only in analyze mode)
    mode === 'analyze' && visualizer({
      filename: 'build/stats.html',
      open: true,
      gzipSize: true,
    }),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@runtime': path.resolve(__dirname, './src/runtime'),
    },
  },
  
  build: {
    outDir: 'build/frontend',
    emptyOutDir: true,
    
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'FlowChat',
      formats: ['iife'],
      fileName: () => 'chat.js',
    },
    
    rollupOptions: {
      // External dependencies provided by WordPress
      external: ['react', 'react-dom'],
      
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        
        // Consistent asset naming
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'chat.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
        
        // Single chunk for IIFE
        inlineDynamicImports: true,
      },
    },
    
    // Optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
      mangle: {
        safari10: true,
      },
    },
    
    // Source maps for debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
    
    // Target modern browsers
    target: 'es2020',
    
    // Chunk size warnings
    chunkSizeWarningLimit: 150, // 150kb target
  },
  
  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    devSourcemap: true,
  },
  
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    __DEV__: mode === 'development',
  },
  
  // Development server (for isolated testing)
  server: {
    port: 3000,
    open: '/test.html',
  },
}));
```

### 4. Bundle Optimization

```typescript
// vite.config.ts - Advanced optimization

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Manual chunks for code splitting (if needed)
        manualChunks: (id) => {
          // Keep assistant-ui in main bundle for IIFE
          // This is only useful if switching to ESM format
          if (id.includes('@assistant-ui')) {
            return 'assistant-ui';
          }
        },
      },
      
      // Tree shaking configuration
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: ['@assistant-ui/react'],
    exclude: ['react', 'react-dom'],
  },
});
```

## Webpack Configuration (Admin)

### 5. Admin Build Config

```javascript
// webpack.config.js

const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isProduction = process.env.NODE_ENV === 'production';
const isAnalyze = process.env.ANALYZE === 'true';

module.exports = {
  ...defaultConfig,
  
  entry: {
    admin: path.resolve(__dirname, 'src/admin-index.ts'),
  },
  
  output: {
    path: path.resolve(__dirname, 'build/admin'),
    filename: '[name].js',
    clean: true,
  },
  
  resolve: {
    ...defaultConfig.resolve,
    alias: {
      ...defaultConfig.resolve?.alias,
      '@': path.resolve(__dirname, 'src'),
      '@admin': path.resolve(__dirname, 'src/admin'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  
  module: {
    ...defaultConfig.module,
    rules: [
      ...defaultConfig.module.rules,
      // TypeScript support
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  
  plugins: [
    ...defaultConfig.plugins,
    
    // Bundle analyzer
    isAnalyze && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'admin-stats.html',
      openAnalyzer: true,
    }),
  ].filter(Boolean),
  
  optimization: {
    ...defaultConfig.optimization,
    
    // Split vendor chunks
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'admin-vendor',
          chunks: 'all',
        },
      },
    },
  },
  
  // Performance hints
  performance: {
    hints: isProduction ? 'warning' : false,
    maxAssetSize: 500000,
    maxEntrypointSize: 500000,
  },
};
```

### 6. Gutenberg Block Build

```javascript
// webpack.blocks.config.js

const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
  ...defaultConfig,
  
  entry: {
    'flowchat-block': path.resolve(__dirname, 'src/blocks/index.ts'),
  },
  
  output: {
    path: path.resolve(__dirname, 'build/blocks'),
    filename: '[name].js',
  },
  
  externals: {
    // WordPress dependencies (provided by WordPress)
    '@wordpress/blocks': 'wp.blocks',
    '@wordpress/block-editor': 'wp.blockEditor',
    '@wordpress/components': 'wp.components',
    '@wordpress/element': 'wp.element',
    '@wordpress/i18n': 'wp.i18n',
    '@wordpress/data': 'wp.data',
    'react': 'React',
    'react-dom': 'ReactDOM',
  },
};
```

## Asset Generation

### 7. PHP Asset Manifest

```php
<?php
// Generate asset manifest for WordPress enqueuing

// build/admin/admin.asset.php (auto-generated by wp-scripts)
return array(
    'dependencies' => array(
        'react',
        'react-dom',
        'wp-api-fetch',
        'wp-components',
        'wp-element',
        'wp-i18n',
    ),
    'version' => 'a1b2c3d4e5f6',
);

// For Vite, we need to generate this manually
// scripts/generate-asset-manifest.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateAssetManifest() {
  const buildDir = path.resolve(__dirname, '../build/frontend');
  const jsFile = path.join(buildDir, 'chat.js');
  
  if (!fs.existsSync(jsFile)) {
    console.error('Build files not found. Run build first.');
    process.exit(1);
  }
  
  const content = fs.readFileSync(jsFile);
  const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 12);
  
  const manifest = `<?php
return array(
    'dependencies' => array('react', 'react-dom'),
    'version' => '${hash}',
);
`;
  
  fs.writeFileSync(path.join(buildDir, 'chat.asset.php'), manifest);
  console.log('Asset manifest generated:', hash);
}

generateAssetManifest();
```

### 8. CSS Variable Generation

```javascript
// scripts/generate-css-variables.js

const fs = require('fs');
const path = require('path');

const stylePresets = require('../src/types/style-presets.json');

function generateCSSVariables(preset) {
  return `
/* FlowChat Style Preset: ${preset.name} */
.flowchat-container[data-preset="${preset.id}"] {
  /* Colors */
  --flowchat-primary: ${preset.colors.primary};
  --flowchat-primary-hover: ${preset.colors.primaryHover};
  --flowchat-secondary: ${preset.colors.secondary};
  --flowchat-background: ${preset.colors.background};
  --flowchat-surface: ${preset.colors.surface};
  --flowchat-text: ${preset.colors.text};
  --flowchat-text-muted: ${preset.colors.textMuted};
  --flowchat-border: ${preset.colors.border};
  --flowchat-user-message: ${preset.colors.userMessage};
  --flowchat-user-message-text: ${preset.colors.userMessageText};
  --flowchat-assistant-message: ${preset.colors.assistantMessage};
  --flowchat-assistant-message-text: ${preset.colors.assistantMessageText};
  --flowchat-error: ${preset.colors.error};
  --flowchat-success: ${preset.colors.success};
  
  /* Typography */
  --flowchat-font-family: ${preset.typography.fontFamily};
  --flowchat-font-size-small: ${preset.typography.fontSize.small};
  --flowchat-font-size-base: ${preset.typography.fontSize.base};
  --flowchat-font-size-large: ${preset.typography.fontSize.large};
  --flowchat-line-height: ${preset.typography.lineHeight};
  
  /* Spacing */
  --flowchat-spacing-xs: ${preset.spacing.xs};
  --flowchat-spacing-sm: ${preset.spacing.sm};
  --flowchat-spacing-md: ${preset.spacing.md};
  --flowchat-spacing-lg: ${preset.spacing.lg};
  --flowchat-spacing-xl: ${preset.spacing.xl};
  
  /* Border Radius */
  --flowchat-radius-small: ${preset.borderRadius.small};
  --flowchat-radius-medium: ${preset.borderRadius.medium};
  --flowchat-radius-large: ${preset.borderRadius.large};
  --flowchat-radius-full: ${preset.borderRadius.full};
  
  /* Shadows */
  --flowchat-shadow-small: ${preset.shadows.small};
  --flowchat-shadow-medium: ${preset.shadows.medium};
  --flowchat-shadow-large: ${preset.shadows.large};
}
`;
}

function generateAllPresets() {
  const output = Object.values(stylePresets)
    .map(generateCSSVariables)
    .join('\n');
  
  const outputPath = path.resolve(__dirname, '../src/styles/presets-generated.css');
  fs.writeFileSync(outputPath, output);
  console.log('CSS variables generated');
}

generateAllPresets();
```

## Testing Pipeline

### 9. Test Configuration

```javascript
// jest.config.js

module.exports = {
  preset: '@wordpress/jest-preset-default',
  
  testEnvironment: 'jsdom',
  
  setupFilesAfterEnv: [
    '<rootDir>/tests/js/setup.ts',
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  testMatch: [
    '<rootDir>/tests/js/**/*.test.(ts|tsx)',
    '<rootDir>/src/**/*.test.(ts|tsx)',
  ],
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### 10. E2E Test Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'tests/e2e/report' }],
    ['junit', { outputFile: 'tests/e2e/results.xml' }],
  ],
  
  use: {
    baseURL: process.env.WP_TEST_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  
  webServer: {
    command: 'npm run wp-env start',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 11. PHPUnit Configuration

```xml
<!-- phpunit.xml -->
<?xml version="1.0"?>
<phpunit
    bootstrap="tests/php/bootstrap.php"
    backupGlobals="false"
    colors="true"
    convertErrorsToExceptions="true"
    convertNoticesToExceptions="true"
    convertWarningsToExceptions="true"
>
    <testsuites>
        <testsuite name="Unit">
            <directory suffix="Test.php">./tests/php/unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory suffix="Test.php">./tests/php/integration</directory>
        </testsuite>
    </testsuites>
    
    <coverage processUncoveredFiles="true">
        <include>
            <directory suffix=".php">./includes</directory>
        </include>
        <exclude>
            <directory>./includes/vendor</directory>
        </exclude>
        <report>
            <html outputDirectory="coverage/php"/>
            <clover outputFile="coverage/php/clover.xml"/>
        </report>
    </coverage>
    
    <php>
        <const name="WP_TESTS_DOMAIN" value="example.org"/>
        <const name="WP_TESTS_EMAIL" value="admin@example.org"/>
        <const name="WP_TESTS_TITLE" value="Test Blog"/>
        <const name="WP_PHP_BINARY" value="php"/>
    </php>
</phpunit>
```

## CI/CD Pipeline

### 12. GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # PHP Linting and Testing
  php:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        php: ['8.0', '8.1', '8.2']
        wp: ['6.0', '6.4', 'latest']
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: mbstring, intl, mysql
          coverage: xdebug
      
      - name: Cache Composer dependencies
        uses: actions/cache@v3
        with:
          path: vendor
          key: composer-${{ hashFiles('composer.lock') }}
      
      - name: Install Composer dependencies
        run: composer install --no-progress --prefer-dist
      
      - name: Run PHPCS
        run: composer phpcs
      
      - name: Run PHPStan
        run: composer phpstan
      
      - name: Setup WordPress test environment
        run: |
          bash bin/install-wp-tests.sh wordpress_test root '' localhost ${{ matrix.wp }}
      
      - name: Run PHPUnit
        run: composer test -- --coverage-clover coverage.xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: coverage.xml
          flags: php
  
  # JavaScript Linting and Testing
  js:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint:js
      
      - name: Run Stylelint
        run: npm run lint:css
      
      - name: Run TypeScript check
        run: npx tsc --noEmit
      
      - name: Run Jest tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: coverage/lcov.info
          flags: javascript
  
  # Build verification
  build:
    runs-on: ubuntu-latest
    needs: [php, js]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build plugin
        run: npm run build
      
      - name: Check build output
        run: |
          test -f build/admin/admin.js
          test -f build/admin/admin.css
          test -f build/frontend/chat.js
          test -f build/frontend/chat.css
          test -f build/blocks/flowchat-block.js
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: build/
  
  # E2E Tests
  e2e:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: build
          path: build/
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start WordPress environment
        run: npm run wp-env start
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload E2E report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-report
          path: tests/e2e/report/
```

### 13. Release Workflow

```yaml
# .github/workflows/release.yml

name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          composer install --no-dev --prefer-dist
          npm ci
      
      - name: Build plugin
        run: npm run build
      
      - name: Generate translations
        run: |
          npm run i18n:make-pot
          npm run i18n:make-json
      
      - name: Create plugin ZIP
        run: |
          npm run plugin-zip
          mv flowchat.zip flowchat-${{ github.ref_name }}.zip
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: flowchat-${{ github.ref_name }}.zip
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      # WordPress.org deployment (optional)
      - name: Deploy to WordPress.org
        if: ${{ !contains(github.ref, 'beta') && !contains(github.ref, 'rc') }}
        env:
          SVN_USERNAME: ${{ secrets.WP_ORG_USERNAME }}
          SVN_PASSWORD: ${{ secrets.WP_ORG_PASSWORD }}
        run: |
          bash bin/deploy-wp-org.sh
```

## Build Scripts

### 14. Plugin ZIP Creation

```javascript
// scripts/create-zip.js

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

const PLUGIN_SLUG = 'flowchat';
const DIST_DIR = path.resolve(__dirname, '../dist');
const BUILD_DIR = path.resolve(__dirname, '../build');

// Files/directories to include
const INCLUDE = [
  'flowchat.php',
  'uninstall.php',
  'readme.txt',
  'includes/**',
  'build/**',
  'assets/images/**',
  'assets/icons/**',
  'assets/templates/**',
  'assets/presets/**',
  'templates/**',
  'languages/**',
  'vendor/**', // Only production dependencies
];

// Files/directories to exclude
const EXCLUDE = [
  '**/*.map',
  '**/.gitkeep',
  '**/node_modules/**',
  '**/tests/**',
  '**/*.test.*',
];

async function createZip() {
  console.log('Creating plugin ZIP...');
  
  // Clean dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  
  // Verify build exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('Build directory not found. Run npm run build first.');
    process.exit(1);
  }
  
  // Get version from main plugin file
  const pluginFile = fs.readFileSync(
    path.resolve(__dirname, '../flowchat.php'),
    'utf8'
  );
  const versionMatch = pluginFile.match(/Version:\s*(\d+\.\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : 'unknown';
  
  const zipPath = path.join(DIST_DIR, `${PLUGIN_SLUG}-${version}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    const sizeKB = (archive.pointer() / 1024).toFixed(2);
    console.log(`✓ Created ${zipPath} (${sizeKB} KB)`);
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  
  // Add files
  for (const pattern of INCLUDE) {
    if (pattern.includes('**')) {
      const base = pattern.split('**')[0].replace(/\/$/, '');
      archive.directory(
        path.resolve(__dirname, '..', base),
        `${PLUGIN_SLUG}/${base}`
      );
    } else {
      archive.file(
        path.resolve(__dirname, '..', pattern),
        { name: `${PLUGIN_SLUG}/${pattern}` }
      );
    }
  }
  
  await archive.finalize();
}

createZip().catch(console.error);
```

### 15. WordPress.org Deploy Script

```bash
#!/bin/bash
# bin/deploy-wp-org.sh

set -e

PLUGIN_SLUG="flowchat"
SVN_REPO="https://plugins.svn.wordpress.org/${PLUGIN_SLUG}"
SVN_DIR="/tmp/${PLUGIN_SLUG}-svn"
PLUGIN_DIR=$(pwd)

# Get version from main plugin file
VERSION=$(grep -i "Version:" ${PLUGIN_DIR}/flowchat.php | awk -F' ' '{print $NF}')

echo "Deploying version ${VERSION} to WordPress.org..."

# Checkout SVN repo
echo "Checking out SVN repository..."
svn checkout --depth immediates "${SVN_REPO}" "${SVN_DIR}"
cd "${SVN_DIR}"
svn update --set-depth infinity trunk
svn update --set-depth infinity assets

# Clear trunk
rm -rf trunk/*

# Copy plugin files to trunk
echo "Copying files to trunk..."
rsync -av --exclude-from="${PLUGIN_DIR}/.distignore" "${PLUGIN_DIR}/" trunk/

# Copy assets
echo "Copying assets..."
cp -r "${PLUGIN_DIR}/assets/wp-org/"* assets/ 2>/dev/null || true

# Add new files to SVN
svn add --force trunk/*
svn add --force assets/* 2>/dev/null || true

# Remove deleted files
svn status | grep '^!' | awk '{print $2}' | xargs -I {} svn delete {} 2>/dev/null || true

# Create tag
echo "Creating tag ${VERSION}..."
svn copy trunk "tags/${VERSION}"

# Commit
echo "Committing to WordPress.org..."
svn commit -m "Release version ${VERSION}" --username "${SVN_USERNAME}" --password "${SVN_PASSWORD}"

echo "✓ Successfully deployed version ${VERSION} to WordPress.org"
```

## Environment Setup

### 16. Local Development Environment

```javascript
// .wp-env.json

{
  "core": "WordPress/WordPress#6.4",
  "phpVersion": "8.2",
  
  "plugins": [
    "."
  ],
  
  "themes": [],
  
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "WP_DEBUG_DISPLAY": false,
    "SCRIPT_DEBUG": true,
    "SAVEQUERIES": true
  },
  
  "mappings": {
    "wp-content/uploads": "./uploads",
    "wp-content/debug.log": "./debug.log"
  },
  
  "lifecycleScripts": {
    "afterStart": "npm run setup:dev"
  }
}
```

### 17. Development Setup Script

```bash
#!/bin/bash
# bin/setup-dev.sh

set -e

echo "Setting up FlowChat development environment..."

# Install dependencies
echo "Installing dependencies..."
composer install
npm install

# Build assets
echo "Building assets..."
npm run build

# Start WordPress environment
echo "Starting WordPress environment..."
npm run wp-env start

# Activate plugin
echo "Activating plugin..."
npm run wp-env run cli wp plugin activate flowchat

# Create test data
echo "Creating test data..."
npm run wp-env run cli wp flowchat create-test-data

# Display info
echo ""
echo "✓ Development environment ready!"
echo ""
echo "WordPress: http://localhost:8080"
echo "Admin: http://localhost:8080/wp-admin"
echo "Username: admin"
echo "Password: password"
echo ""
echo "Run 'npm run dev' to start watching for changes"
```

## Production Checklist

### 18. Pre-Release Checklist

```markdown
# FlowChat Release Checklist

## Version Bump
- [ ] Update version in `flowchat.php` (Plugin header)
- [ ] Update version in `package.json`
- [ ] Update version in `readme.txt` (Stable tag)
- [ ] Update `CHANGELOG.md`

## Code Quality
- [ ] All tests passing (PHP + JS)
- [ ] ESLint passing with no errors
- [ ] PHPCS passing with no errors
- [ ] TypeScript compiling without errors
- [ ] No console.log statements in production code

## Build Verification
- [ ] Production build completes successfully
- [ ] Bundle sizes within limits
  - [ ] Frontend JS < 150KB gzipped
  - [ ] Admin JS < 300KB gzipped
  - [ ] CSS < 50KB gzipped
- [ ] Source maps generated
- [ ] Asset manifests correct

## Functionality Testing
- [ ] Fresh installation works
- [ ] Upgrade from previous version works
- [ ] All admin pages load correctly
- [ ] Chat widget renders correctly
- [ ] Bubble mode works
- [ ] n8n webhook communication works
- [ ] All shortcode attributes work
- [ ] Gutenberg block works
- [ ] Widget works
- [ ] Import/Export works
- [ ] Templates load and apply

## Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iOS Safari
- [ ] Android Chrome

## WordPress Compatibility
- [ ] WP 6.0 minimum
- [ ] WP latest
- [ ] PHP 8.0 minimum
- [ ] PHP 8.2 latest

## Security Review
- [ ] All inputs sanitized
- [ ] All outputs escaped
- [ ] Nonces verified
- [ ] Capabilities checked
- [ ] No sensitive data exposed
- [ ] Rate limiting working

## Documentation
- [ ] readme.txt updated
- [ ] Changelog complete
- [ ] Screenshots current
- [ ] FAQ updated

## Final Steps
- [ ] Create release tag
- [ ] Build final ZIP
- [ ] Test ZIP installation
- [ ] Upload to distribution channels
```

### 19. Bundle Size Budget

```javascript
// scripts/check-bundle-size.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUDGETS = {
  'build/frontend/chat.js': 150 * 1024,    // 150KB
  'build/frontend/chat.css': 30 * 1024,    // 30KB
  'build/admin/admin.js': 300 * 1024,      // 300KB
  'build/admin/admin.css': 50 * 1024,      // 50KB
  'build/blocks/flowchat-block.js': 50 * 1024, // 50KB
};

function getGzipSize(filepath) {
  const content = fs.readFileSync(filepath);
  return zlib.gzipSync(content).length;
}

function checkBudgets() {
  console.log('Checking bundle sizes...\n');
  
  let failed = false;
  
  for (const [file, budget] of Object.entries(BUDGETS)) {
    const filepath = path.resolve(__dirname, '..', file);
    
    if (!fs.existsSync(filepath)) {
      console.log(`⚠ ${file}: Not found`);
      continue;
    }
    
    const size = getGzipSize(filepath);
    const sizeKB = (size / 1024).toFixed(2);
    const budgetKB = (budget / 1024).toFixed(0);
    const percent = ((size / budget) * 100).toFixed(1);
    
    if (size > budget) {
      console.log(`✗ ${file}: ${sizeKB}KB / ${budgetKB}KB (${percent}%) - OVER BUDGET`);
      failed = true;
    } else {
      console.log(`✓ ${file}: ${sizeKB}KB / ${budgetKB}KB (${percent}%)`);
    }
  }
  
  console.log('');
  
  if (failed) {
    console.log('Bundle size check FAILED');
    process.exit(1);
  } else {
    console.log('Bundle size check PASSED');
  }
}

checkBudgets();
```

## Deployment Targets

### 20. Deployment Configuration

```yaml
# deployment.yml

targets:
  # WordPress.org (free version)
  wordpress-org:
    type: svn
    url: https://plugins.svn.wordpress.org/flowchat
    include:
      - flowchat.php
      - uninstall.php
      - readme.txt
      - includes/
      - build/
      - assets/images/
      - assets/icons/
      - assets/templates/
      - templates/
      - languages/
    exclude:
      - "**/*.map"
      - "**/tests/"
      - premium/
    hooks:
      pre-deploy:
        - npm run build
        - npm run i18n:make-pot
      post-deploy:
        - notify:slack
  
  # CodeCanyon (premium version)
  codecanyon:
    type: zip
    filename: flowchat-pro-{version}.zip
    include:
      - flowchat.php
      - uninstall.php
      - readme.txt
      - includes/
      - build/
      - assets/
      - templates/
      - languages/
      - premium/
      - documentation/
    exclude:
      - "**/*.map"
      - "**/tests/"
    hooks:
      pre-deploy:
        - npm run build
        - npm run build:docs
  
  # GitHub Releases
  github:
    type: release
    repo: flowchat/flowchat
    assets:
      - flowchat-{version}.zip
      - flowchat-pro-{version}.zip
    changelog: CHANGELOG.md
```

This completes the build and deployment specification and the entire FlowChat specification suite!
