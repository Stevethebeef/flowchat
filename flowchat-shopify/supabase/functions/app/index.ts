/**
 * N8.chat Embedded App Page
 * Minimal admin interface for Shopify Admin
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const SHOPIFY_API_KEY = Deno.env.get('SHOPIFY_API_KEY') || '';
const SHOPIFY_API_SECRET = Deno.env.get('SHOPIFY_API_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const APP_URL = Deno.env.get('APP_URL') || '';

/**
 * Verify Shopify session token or HMAC
 */
function verifyRequest(req: Request, url: URL): boolean {
  // For embedded apps, verify the HMAC from query params
  const hmac = url.searchParams.get('hmac');
  if (!hmac) return false;

  const params = new URLSearchParams(url.searchParams);
  params.delete('hmac');

  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const hash = createHmac('sha256', SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');

  return hash === hmac;
}

/**
 * Generate the embedded app HTML
 */
function generateAppHTML(shop: string, apiKey: string): string {
  const shopDomain = shop.replace('.myshopify.com', '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>N8.chat</title>
  <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f6f6f7;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 24px;
      margin-bottom: 20px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 20px;
    }

    h1 {
      font-size: 24px;
      color: #1a1a1a;
      margin: 0;
    }

    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-top: 4px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #dcfce7;
      color: #166534;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
    }

    h2 {
      font-size: 16px;
      color: #1a1a1a;
      margin-bottom: 16px;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .step {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .step-number {
      width: 28px;
      height: 28px;
      background: #667eea;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .step-content h3 {
      font-size: 14px;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .step-content p {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }

    .button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
    }

    .button:hover {
      background: #5a67d8;
    }

    .button-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .button-secondary:hover {
      background: #f9fafb;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .info-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }

    .info-box h4 {
      font-size: 14px;
      color: #1e40af;
      margin-bottom: 8px;
    }

    .info-box p {
      font-size: 13px;
      color: #3b82f6;
      line-height: 1.5;
    }

    .info-box a {
      color: #1e40af;
    }

    .footer {
      text-align: center;
      padding: 20px;
      color: #9ca3af;
      font-size: 12px;
    }

    .footer a {
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">N8</div>
        <div>
          <h1>N8.chat</h1>
          <div class="subtitle">AI Chat Widget powered by n8n</div>
        </div>
        <div style="margin-left: auto;">
          <span class="status-badge">
            <span class="status-dot"></span>
            Installed
          </span>
        </div>
      </div>

      <h2>Quick Setup Guide</h2>

      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Configure your n8n webhook</h3>
            <p>Create an n8n workflow with a Webhook trigger. Copy the webhook URL - you'll need it in step 2.</p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Open Theme Editor</h3>
            <p>Click the button below to open your theme editor. Navigate to <strong>App embeds</strong> and enable <strong>N8.chat Widget</strong>.</p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Paste your webhook URL</h3>
            <p>In the widget settings, paste your n8n webhook URL. Customize colors, messages, and position as needed.</p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>Save and publish</h3>
            <p>Click Save in the theme editor. Your chat widget is now live on your store!</p>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="button" id="openThemeEditor">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Open Theme Editor
        </button>
        <a href="https://docs.n8.chat" target="_blank" class="button button-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Documentation
        </a>
      </div>

      <div class="info-box">
        <h4>Need an n8n workflow?</h4>
        <p>
          Check out our <a href="https://docs.n8.chat/templates" target="_blank">workflow templates</a> to get started quickly.
          We have templates for customer support, product recommendations, order tracking, and more.
        </p>
      </div>
    </div>

    <div class="footer">
      <p>N8.chat v6.0.0 &bull; <a href="https://n8.chat/privacy" target="_blank">Privacy Policy</a> &bull; <a href="https://n8.chat/terms" target="_blank">Terms of Service</a></p>
    </div>
  </div>

  <script>
    // Initialize Shopify App Bridge
    const AppBridge = window['app-bridge'];
    const createApp = AppBridge.default;

    const app = createApp({
      apiKey: '${apiKey}',
      host: new URLSearchParams(location.search).get('host'),
    });

    // Open Theme Editor with deep link
    document.getElementById('openThemeEditor').addEventListener('click', function() {
      const themeEditorUrl = 'https://${shop}/admin/themes/current/editor?context=apps';

      // Use App Bridge to navigate
      const Redirect = AppBridge.actions.Redirect;
      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.REMOTE, themeEditorUrl);
    });
  </script>
</body>
</html>`;
}

serve(async (req: Request) => {
  const url = new URL(req.url);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shop = url.searchParams.get('shop');
    const host = url.searchParams.get('host');

    // If no shop, redirect to install
    if (!shop) {
      return new Response('Missing shop parameter. Please install the app from the Shopify App Store.', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Verify the request is from Shopify
    if (!verifyRequest(req, url)) {
      // For initial loads, Shopify might not include HMAC
      // Check if shop is installed
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: installation } = await supabase
        .from('n8n_chat_installations')
        .select('shop')
        .eq('shop', shop)
        .is('uninstalled_at', null)
        .single();

      if (!installation) {
        // Not installed, redirect to OAuth
        return Response.redirect(`${APP_URL}/functions/v1/auth?shop=${shop}`, 302);
      }
    }

    // Generate and return the app HTML
    const html = generateAppHTML(shop, SHOPIFY_API_KEY);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Security-Policy': `frame-ancestors https://${shop} https://admin.shopify.com;`,
      },
    });

  } catch (error) {
    console.error('App error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
