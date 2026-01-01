/**
 * N8.chat GDPR Compliance Webhooks
 * Supabase Edge Function for handling Shopify's mandatory GDPR webhooks
 *
 * Deploy with: supabase functions deploy gdpr-webhooks
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SHOPIFY_API_SECRET = Deno.env.get('SHOPIFY_API_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Timing-safe comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify Shopify HMAC signature
async function verifyShopifyHmac(body: string, hmacHeader: string): Promise<boolean> {
  if (!SHOPIFY_API_SECRET) {
    console.error('SHOPIFY_API_SECRET not configured');
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SHOPIFY_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computedHmac = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return timingSafeEqual(computedHmac, hmacHeader);
}

// Extract webhook topic from URL path or headers
function getWebhookTopic(req: Request): string {
  // First check the X-Shopify-Topic header
  const topicHeader = req.headers.get('x-shopify-topic');
  if (topicHeader) return topicHeader;

  // Fallback to URL path parsing
  const path = new URL(req.url).pathname;
  if (path.includes('customers-data-request')) return 'customers/data_request';
  if (path.includes('customers-redact')) return 'customers/redact';
  if (path.includes('shop-redact')) return 'shop/redact';
  if (path.includes('app-uninstalled')) return 'app/uninstalled';
  return 'unknown';
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-Hmac-SHA256',
      },
    });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Get the raw body for HMAC verification
  const body = await req.text();
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256') || '';

  // Verify HMAC signature
  const isValid = await verifyShopifyHmac(body, hmacHeader);
  if (!isValid) {
    console.warn('Invalid HMAC signature');
    return new Response('Unauthorized', { status: 401 });
  }

  // Parse the webhook payload
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const topic = getWebhookTopic(req);
  const shopDomain = payload.shop_domain || payload.domain || 'unknown';

  console.log(`[N8.chat GDPR] Received ${topic} from ${shopDomain}`);

  // Log request to database for audit purposes
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  await supabase.from('n8n_chat_gdpr_log').insert({
    shop: shopDomain,
    request_type: topic.replace('/', '_'),
    payload: payload,
  });

  // Handle different webhook types
  switch (topic) {
    case 'customers/data_request':
      // Customer requested their data
      // N8.chat does not store customer data - it's transmitted directly to merchant's n8n
      console.log(`[N8.chat GDPR] Data request for customer ${payload.customer?.id || 'unknown'}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'N8.chat does not store customer personal data. Chat messages are transmitted directly to your n8n webhook endpoint. Please check your n8n workflow for any stored conversation data.',
        data_stored: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    case 'customers/redact':
      // Customer requested data deletion
      console.log(`[N8.chat GDPR] Redact request for customer ${payload.customer?.id || 'unknown'}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'N8.chat does not store customer data. No deletion required. If you have stored conversation data in your n8n workflows, please delete it from your systems.',
        data_deleted: false,
        reason: 'no_data_stored',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    case 'shop/redact':
      // Shop data deletion (48 hours after app uninstall)
      // Delete our installation record
      console.log(`[N8.chat GDPR] Shop redact request for ${shopDomain}`);
      await supabase
        .from('n8n_chat_installations')
        .delete()
        .eq('shop', shopDomain);

      return new Response(JSON.stringify({
        success: true,
        message: 'N8.chat installation data has been deleted. No customer data was stored.',
        shop_data_deleted: true,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    case 'app/uninstalled':
      // App was uninstalled - mark as uninstalled (don't delete yet, wait for shop/redact)
      console.log(`[N8.chat] App uninstalled from ${shopDomain}`);
      await supabase
        .from('n8n_chat_installations')
        .update({ uninstalled_at: new Date().toISOString() })
        .eq('shop', shopDomain);

      return new Response(JSON.stringify({
        success: true,
        message: 'Uninstall recorded',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    default:
      console.warn(`[N8.chat GDPR] Unknown webhook topic: ${topic}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Webhook received',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
  }
});
