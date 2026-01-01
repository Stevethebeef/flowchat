# N8.chat GDPR Webhooks - Supabase Edge Function

This Supabase Edge Function handles Shopify's mandatory GDPR compliance webhooks.

## Deployment

### Prerequisites

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link to your project: `supabase link --project-ref YOUR_PROJECT_REF`

### Set Environment Variables

```bash
supabase secrets set SHOPIFY_API_SECRET=your_shopify_api_secret
```

### Deploy

```bash
supabase functions deploy gdpr-webhooks
```

## Webhook Endpoints

After deployment, your webhooks will be available at:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/gdpr-webhooks/customers-data-request
https://YOUR_PROJECT_REF.supabase.co/functions/v1/gdpr-webhooks/customers-redact
https://YOUR_PROJECT_REF.supabase.co/functions/v1/gdpr-webhooks/shop-redact
```

## Configure in Shopify

Add these URLs to your `shopify.app.toml`:

```toml
[webhooks]
api_version = "2024-10"

[[webhooks.subscriptions]]
compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
uri = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/gdpr-webhooks"
```

## What This Function Does

N8.chat does NOT store customer data. This function:

1. **Validates** the HMAC signature from Shopify
2. **Acknowledges** the webhook with a 200 response
3. **Logs** the request for audit purposes
4. **Returns** a message explaining that no customer data is stored

The merchant is responsible for:
- Managing data in their own n8n workflows
- Deleting conversation data from their external systems
- Complying with their customers' data requests
