# N8.chat Deployment Guide

Complete step-by-step guide to deploy N8.chat to the Shopify App Store.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed (`npm install -g supabase`)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) installed (`npm install -g @shopify/cli`)
- A [Supabase](https://supabase.com) account (free tier works)
- A [Shopify Partner](https://partners.shopify.com) account

---

## Part 1: Supabase Setup

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name:** `n8-chat` (or your preference)
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
4. Click **"Create new project"**
5. Wait for project to be ready (1-2 minutes)

### Step 1.2: Note Your Supabase Credentials

From your Supabase dashboard, go to **Settings** → **API**:

| Credential | Location | Usage |
|------------|----------|-------|
| **Project URL** | `https://xxxxx.supabase.co` | APP_URL, SUPABASE_URL |
| **anon public** | Under "Project API keys" | SUPABASE_ANON_KEY |
| **service_role** | Under "Project API keys" (click reveal) | SUPABASE_SERVICE_ROLE_KEY |

Your **Project ID** is the `xxxxx` part of your URL.

### Step 1.3: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **"Run"**
6. You should see "Success. No rows returned"

### Step 1.4: Deploy Edge Functions

Open a terminal in your project directory:

```bash
cd C:/dev/flowchat/n8nchatshopify/flowchat-shopify

# Login to Supabase
npx supabase login

# Link to your project (replace xxxxx with your project ID)
npx supabase link --project-ref xxxxx

# Deploy all functions
npx supabase functions deploy auth
npx supabase functions deploy app
npx supabase functions deploy gdpr-webhooks
```

### Step 1.5: Set Function Secrets

```bash
# Set Shopify credentials (you'll get these in Part 2)
npx supabase secrets set SHOPIFY_API_KEY=your_client_id_here
npx supabase secrets set SHOPIFY_API_SECRET=your_client_secret_here

# Set Supabase credentials
npx supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
npx supabase secrets set APP_URL=https://xxxxx.supabase.co
```

---

## Part 2: Shopify Partner Dashboard Setup

### Step 2.1: Create App in Partner Dashboard

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Click **Apps** in the left sidebar
3. Click **"Create app"**
4. Click **"Create app manually"** (NOT the CLI template option)
5. Enter:
   - **App name:** `N8.chat`
6. Click **"Create"**

### Step 2.2: Note Your Credentials

On the app's **Overview** page, you'll see:

| Field | What to Copy |
|-------|--------------|
| **Client ID** | Long string like `abc123...` |
| **Client secret** | Click "Show" to reveal, copy it |

**Save these securely!** You'll need them for:
- Supabase secrets (Step 1.5)
- shopify.app.toml

### Step 2.3: Configure App URLs

Go to the **Configuration** tab and fill in:

| Field | Value |
|-------|-------|
| **App URL** | `https://xxxxx.supabase.co/functions/v1/app` |
| **Allowed redirection URL(s)** | `https://xxxxx.supabase.co/functions/v1/auth/callback` |
| **Preferences URL** | Leave empty |

Replace `xxxxx` with your Supabase project ID.

Click **"Save"**.

### Step 2.4: Configure GDPR Webhooks

Scroll down to **Compliance webhooks** section:

| Webhook | URL |
|---------|-----|
| **Customer data request** | `https://xxxxx.supabase.co/functions/v1/gdpr-webhooks` |
| **Customer data erasure** | `https://xxxxx.supabase.co/functions/v1/gdpr-webhooks` |
| **Shop data erasure** | `https://xxxxx.supabase.co/functions/v1/gdpr-webhooks` |

Click **"Save"**.

---

## Part 3: Update Local Configuration

### Step 3.1: Update shopify.app.toml

Edit `shopify.app.toml` and replace placeholders:

```toml
client_id = "YOUR_ACTUAL_CLIENT_ID"
application_url = "https://xxxxx.supabase.co/functions/v1/app"

[auth]
redirect_urls = ["https://xxxxx.supabase.co/functions/v1/auth/callback"]

# Update all webhook URLs
uri = "https://xxxxx.supabase.co/functions/v1/gdpr-webhooks"
```

### Step 3.2: Create .env File

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
SHOPIFY_API_KEY=your_client_id
SHOPIFY_API_SECRET=your_client_secret
APP_URL=https://xxxxx.supabase.co
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Part 4: Deploy Theme App Extension

### Step 4.1: Login to Shopify CLI

```bash
npx shopify auth login
```

This opens a browser for authentication.

### Step 4.2: Build the Widget

```bash
npm run build:widget
```

### Step 4.3: Deploy to Shopify

```bash
npx shopify app deploy
```

When prompted:
- Select your app from the list
- Confirm the deployment

---

## Part 5: Create Development Store

### Step 5.1: Create Store

1. In Partner Dashboard, go to **Stores**
2. Click **"Add store"**
3. Select **"Development store"**
4. Choose **"Create a store to test and build"**
5. Fill in:
   - **Store name:** `n8chat-test` (or your preference)
   - **Store URL:** Will be auto-generated
   - **Build for:** Select your region
6. Click **"Save"**

### Step 5.2: Install Your App

1. In Partner Dashboard, go to **Apps** → **N8.chat**
2. Click **"Select store"** (or go to Overview)
3. Click **"Test on development store"**
4. Select your development store
5. Click **"Install app"**

---

## Part 6: Test Your App

### Step 6.1: Verify Embedded App

After installation, you should see the N8.chat admin page inside Shopify Admin with:
- Welcome message
- Setup instructions
- "Open Theme Editor" button

### Step 6.2: Configure Widget

1. Click **"Open Theme Editor"**
2. In Theme Editor, go to **App embeds** (left sidebar, gear icon)
3. Enable **"N8.chat Widget"**
4. Configure:
   - **n8n Webhook URL:** Your n8n webhook endpoint
   - **Primary Color:** Your brand color
   - Other settings as desired
5. Click **"Save"**

### Step 6.3: Test on Storefront

1. Visit your development store's storefront
2. You should see the chat bubble in the corner
3. Click to open and test the chat

---

## Part 7: Prepare for App Store Submission

### Step 7.1: Required App Listing Details

In Partner Dashboard → **App setup** → **App listing**:

| Field | Suggestion |
|-------|------------|
| **App name** | N8.chat |
| **Tagline** | AI chat widget powered by n8n |
| **Description** | (See below) |
| **App icon** | 1200x1200px PNG/JPG |
| **Screenshots** | At least 3 screenshots |
| **Demo video** | Optional but recommended |
| **Category** | Sales and conversion |
| **Pricing** | Configure your pricing |

**Description example:**
```
Add an AI-powered chat widget to your Shopify store in minutes.

N8.chat connects your store to your n8n workflows, enabling intelligent
customer conversations that understand your products, cart, and customer context.

Features:
• Easy setup via Theme Editor - no coding required
• 20+ languages supported
• Privacy Mode for GDPR compliance
• Customizable appearance and messaging
• Proactive triggers (exit intent, scroll depth, idle time)
• Voice input and file upload support

Works with any n8n workflow - use your own AI models and logic.
```

### Step 7.2: Privacy Policy & Terms

Make sure these are accessible:
- **Privacy Policy URL:** Host at `https://n8.chat/privacy`
- **Terms of Service URL:** Host at `https://n8.chat/terms`

The content is in `docs/PRIVACY-POLICY.md` and `docs/TERMS-OF-SERVICE.md`.

### Step 7.3: Support Information

| Field | Value |
|-------|-------|
| **Support email** | support@n8.chat |
| **Support URL** | https://docs.n8.chat |
| **FAQ URL** | https://docs.n8.chat/faq |

### Step 7.4: Submit for Review

1. Go to **App setup** → **Distribution**
2. Select **"Public distribution"**
3. Click **"Submit for review"**
4. Complete any remaining requirements

---

## Troubleshooting

### OAuth Not Working

- Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are set in Supabase secrets
- Check that redirect URL matches exactly in Partner Dashboard
- Check Supabase function logs: `npx supabase functions logs auth`

### Widget Not Showing

- Ensure Theme App Extension is deployed: `npx shopify app deploy`
- Check that widget is enabled in Theme Editor → App embeds
- Verify webhook URL is configured

### GDPR Webhooks Failing

- Check Supabase function logs: `npx supabase functions logs gdpr-webhooks`
- Verify HMAC secret matches `SHOPIFY_API_SECRET`
- Test with Shopify's webhook tester in Partner Dashboard

### Database Errors

- Ensure SQL migration ran successfully
- Check RLS policies allow service_role access
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

---

## Quick Reference

### Supabase Functions URLs

```
Auth:     https://xxxxx.supabase.co/functions/v1/auth
App:      https://xxxxx.supabase.co/functions/v1/app
Webhooks: https://xxxxx.supabase.co/functions/v1/gdpr-webhooks
```

### CLI Commands

```bash
# Deploy functions
npx supabase functions deploy auth
npx supabase functions deploy app
npx supabase functions deploy gdpr-webhooks

# View logs
npx supabase functions logs auth --tail
npx supabase functions logs app --tail
npx supabase functions logs gdpr-webhooks --tail

# Deploy Shopify app
npx shopify app deploy

# Build widget
npm run build:widget
```

### Environment Variables (Supabase Secrets)

```bash
SHOPIFY_API_KEY      # From Partner Dashboard (Client ID)
SHOPIFY_API_SECRET   # From Partner Dashboard (Client secret)
SUPABASE_URL         # Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY  # From Supabase dashboard
APP_URL              # Same as SUPABASE_URL
```

---

## Next Steps

After App Store approval:
1. Set up production monitoring (Sentry, etc.)
2. Configure analytics (PostHog, etc.)
3. Create documentation website
4. Set up customer support system
5. Plan marketing and launch
