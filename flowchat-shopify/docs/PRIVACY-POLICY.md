# N8.chat Privacy Policy

**Last Updated:** January 2025

## 1. Introduction

This Privacy Policy describes how N8.chat ("we", "us", or "our") handles information in connection with our Shopify chat widget application ("Service").

## 2. Our Role

- **N8.chat** acts as a **data processor** for configuration data stored within Shopify
- **You (the Merchant)** are the **data controller** for any customer data processed through the chat widget
- **Customer conversation data** is transmitted directly to your configured webhook endpoint (n8n or similar) and is **NOT stored by N8.chat**

## 3. Information We Process

### 3.1 Configuration Data (Stored by Shopify)

We store the following configuration within your Shopify store:
- Widget appearance settings (colors, position, theme)
- Chat messages and prompts
- n8n webhook URL
- Feature toggles (voice, file upload, privacy mode)

This data is stored within Shopify's infrastructure and is subject to [Shopify's Privacy Policy](https://www.shopify.com/legal/privacy).

### 3.2 Data Transmitted to Your Webhook

When Privacy Mode is **ENABLED** (default), the following anonymous data is sent:
- Page type and URL
- Product/collection details (if viewing a product/collection page)
- Cart summary (item count, total, currency)
- Customer logged-in status (boolean only - no identity)
- Locale and language preferences
- Chat messages entered by the customer

When Privacy Mode is **DISABLED**, additional data may include:
- Customer name
- Customer email
- Customer ID
- Order history summary

**Important:** This data is transmitted directly to YOUR webhook endpoint. N8.chat does not store, process, or have access to this data.

### 3.3 Data We Do NOT Collect

- We do NOT store customer personal information
- We do NOT store chat conversation history
- We do NOT use cookies for tracking
- We do NOT share data with third parties
- We do NOT use data for advertising

## 4. Data Flow

```
Customer → Chat Widget → Your n8n Webhook → Your AI/Backend
                ↑
           (Direct transmission, no N8.chat storage)
```

## 5. Your Responsibilities as Merchant

By using N8.chat, you acknowledge responsibility for:

1. **Data Collection Consent**: Informing your customers that chat data may be collected
2. **Privacy Mode Configuration**: Deciding whether to enable or disable Privacy Mode
3. **n8n Workflow Compliance**: Ensuring your n8n workflows handle data appropriately
4. **Data Retention**: Configuring appropriate data retention in your external systems
5. **Data Subject Requests**: Responding to customer requests for data access or deletion
6. **Privacy Policy Updates**: Updating your store's privacy policy to reflect chat data collection

## 6. GDPR Compliance

### 6.1 Data Subject Rights

When we receive a data deletion request from Shopify, we:
1. Confirm that we have no stored customer data
2. Log the request for audit purposes
3. Respond to Shopify acknowledging the request

**You must separately** delete customer data from:
- Your n8n instance and workflows
- Any connected databases or CRMs
- Backup systems that may contain chat data

### 6.2 Legal Basis for Processing

- **Configuration Data**: Necessary for contract performance (providing the Service)
- **Customer Data**: Processed based on your legal basis as data controller

### 6.3 International Transfers

If your n8n instance is hosted outside the EEA, you are responsible for ensuring appropriate safeguards (Standard Contractual Clauses, etc.).

## 7. CCPA Compliance

N8.chat:
- Does NOT sell personal information
- Does NOT share personal information for cross-context behavioral advertising
- Does NOT retain customer personal information

## 8. Data Security

We implement the following security measures:
- All data transmission uses HTTPS/TLS encryption
- Webhook URLs are stored securely within Shopify
- No customer data is logged or stored by our systems
- HMAC signature verification on all webhooks

## 9. Data Retention

- **Configuration Data**: Retained until you uninstall the app or delete settings
- **Customer Data**: We do not retain any customer data

## 10. Children's Privacy

N8.chat is not intended for use by children under 16. We do not knowingly collect data from children.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any material changes by:
- Updating the "Last Updated" date
- Posting a notice in the app settings (for significant changes)

## 12. Contact Us

For privacy-related questions or concerns:

- **Email**: privacy@n8.chat
- **Address**: [Your Business Address]

## 13. Shopify Data Protection

For information about how Shopify handles data, please refer to:
- [Shopify Privacy Policy](https://www.shopify.com/legal/privacy)
- [Shopify Data Processing Addendum](https://www.shopify.com/legal/dpa)
