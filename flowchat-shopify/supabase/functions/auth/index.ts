/**
 * N8.chat Shopify OAuth Handler
 * Handles app installation and OAuth callback
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const SHOPIFY_API_KEY = Deno.env.get('SHOPIFY_API_KEY') || '';
const SHOPIFY_API_SECRET = Deno.env.get('SHOPIFY_API_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const APP_URL = Deno.env.get('APP_URL') || '';

// No scopes needed for Theme App Extension only
const SCOPES = '';

interface ShopifyTokenResponse {
  access_token: string;
  scope: string;
}

/**
 * Verify Shopify HMAC signature
 */
function verifyHmac(query: URLSearchParams): boolean {
  const hmac = query.get('hmac');
  if (!hmac) return false;

  // Create a copy without hmac
  const params = new URLSearchParams(query);
  params.delete('hmac');

  // Sort and create message
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
 * Generate a random nonce for OAuth state
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  // CORS headers for embedded app
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Route: /auth/install - Start OAuth flow
    if (path === 'install' || !path || path === 'auth') {
      const shop = url.searchParams.get('shop');

      if (!shop || !shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
        return new Response('Invalid shop parameter', { status: 400 });
      }

      // Generate nonce for state
      const nonce = generateNonce();

      // Store nonce in Supabase for verification
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from('n8n_chat_oauth_states').upsert({
        shop,
        nonce,
        created_at: new Date().toISOString(),
      });

      // Build OAuth URL
      const redirectUri = `${APP_URL}/functions/v1/auth/callback`;
      const authUrl = `https://${shop}/admin/oauth/authorize?` +
        `client_id=${SHOPIFY_API_KEY}` +
        `&scope=${SCOPES}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${nonce}`;

      return Response.redirect(authUrl, 302);
    }

    // Route: /auth/callback - OAuth callback
    if (path === 'callback') {
      const shop = url.searchParams.get('shop');
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!shop || !code || !state) {
        return new Response('Missing required parameters', { status: 400 });
      }

      // Verify HMAC
      if (!verifyHmac(url.searchParams)) {
        return new Response('Invalid HMAC signature', { status: 401 });
      }

      // Verify state/nonce
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: stateData } = await supabase
        .from('n8n_chat_oauth_states')
        .select('nonce')
        .eq('shop', shop)
        .single();

      if (!stateData || stateData.nonce !== state) {
        return new Response('Invalid state parameter', { status: 401 });
      }

      // Exchange code for access token
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code,
        }),
      });

      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', await tokenResponse.text());
        return new Response('Failed to get access token', { status: 500 });
      }

      const tokenData: ShopifyTokenResponse = await tokenResponse.json();

      // Store installation in database
      await supabase.from('n8n_chat_installations').upsert({
        shop,
        access_token: tokenData.access_token,
        scope: tokenData.scope,
        installed_at: new Date().toISOString(),
        uninstalled_at: null,
      });

      // Clean up OAuth state
      await supabase.from('n8n_chat_oauth_states').delete().eq('shop', shop);

      // Redirect to embedded app
      const embeddedUrl = `https://${shop}/admin/apps/${SHOPIFY_API_KEY}`;
      return Response.redirect(embeddedUrl, 302);
    }

    return new Response('Not found', { status: 404 });

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
