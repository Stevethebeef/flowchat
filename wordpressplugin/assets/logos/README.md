# N8.Chat Logo Assets

This directory contains all official N8.Chat logo assets in various formats and configurations.

## Brand Colors

| Color        | Hex       | Usage                           |
|--------------|-----------|----------------------------------|
| Brand        | `#FF6B2C` | Primary brand orange             |
| Brand Light  | `#FF8F5C` | Gradient end, hover states       |
| Brand Dark   | `#E55A1F` | Dark variant                     |
| Background   | `#0A0A0B` | Dark theme background            |
| Foreground   | `#FAFAFA` | Light text on dark backgrounds   |

## SVG Files

### Icons (Square)

| File                      | Description                                   |
|---------------------------|-----------------------------------------------|
| `n8chat-icon.svg`         | Main icon with gradient and shadow effects    |
| `n8chat-icon-simple.svg`  | Flat icon without effects (good for small sizes) |
| `n8chat-icon-rounded.svg` | Circular icon for social media avatars        |
| `favicon.svg`             | Optimized favicon (32x32 viewBox)             |

### Horizontal Logos (Icon + Text)

| File                              | Description                        |
|-----------------------------------|------------------------------------|
| `n8chat-logo-horizontal.svg`      | Standard horizontal (white text)   |
| `n8chat-logo-horizontal-white.svg`| For dark backgrounds               |
| `n8chat-logo-horizontal-dark.svg` | For light backgrounds              |

### Stacked Logo

| File                     | Description                           |
|--------------------------|---------------------------------------|
| `n8chat-logo-stacked.svg`| Icon on top, text below               |

### Wordmarks (Text Only)

| File                       | Description                      |
|----------------------------|----------------------------------|
| `n8chat-wordmark.svg`      | Gradient text "N8.Chat"          |
| `n8chat-wordmark-white.svg`| White text for dark backgrounds  |
| `n8chat-wordmark-dark.svg` | Dark text for light backgrounds  |

### Social Media Cards

| File                     | Size     | Description                       |
|--------------------------|----------|-----------------------------------|
| `n8chat-social-dark.svg` | 1200x630 | OG image with dark background     |
| `n8chat-social-light.svg`| 1200x630 | OG image with light background    |

## Generating PNG Files

Run the generation script to create PNG exports at various sizes:

```bash
# Install sharp if not already installed
npm install sharp --save-dev

# Generate PNG files
node scripts/generate-logos.mjs
```

This will create a `png/` subdirectory with:
- Icon sizes: 16, 32, 48, 64, 128, 256, 512, 1024px
- Horizontal logo widths: 200, 400, 800, 1600px
- Social cards: 1200x630, 600x315px
- Favicon sizes: apple-touch-icon, android-chrome icons

## Web Manifest

The `site.webmanifest` file is pre-configured for PWA support. After generating PNGs, the manifest will reference:
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

## Usage in HTML/Next.js

The logo metadata is already configured in `src/app/layout.tsx`:

```tsx
icons: {
  icon: [
    { url: "/logos/favicon.svg", type: "image/svg+xml" },
    { url: "/logos/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/logos/favicon-16x16.png", sizes: "16x16", type: "image/png" },
  ],
  apple: [{ url: "/logos/apple-touch-icon.png", sizes: "180x180" }],
},
manifest: "/logos/site.webmanifest",
```

## Logo Guidelines

1. **Minimum Size**: Icon should not be smaller than 16px
2. **Clear Space**: Maintain padding equal to the icon's border radius
3. **Background Contrast**: Use white text on dark backgrounds, dark text on light backgrounds
4. **Do Not**: Rotate, stretch, or alter the gradient colors
