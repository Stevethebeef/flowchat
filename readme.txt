=== FlowChat - AI Chat for WordPress ===
Contributors: flowchat
Tags: chat, ai, chatbot, n8n, automation, assistant
Requires at least: 6.0
Tested up to: 6.4
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Connect AI-powered chat widgets to n8n automation workflows. Stream responses directly from your n8n webhook.

== Description ==

FlowChat is a WordPress plugin that connects AI-powered chat widgets to n8n automation workflows. It provides a seamless way to add intelligent chat functionality to your WordPress site.

= Key Features =

* **Direct Streaming** - Browser connects directly to n8n for real-time streaming responses
* **Multiple Instances** - Create different chat configurations for different pages
* **Floating Bubble** - Optional floating bubble widget that expands to full chat
* **Auto-Open** - Trigger chat to open based on time, scroll, exit intent, or idle time
* **File Uploads** - Allow users to upload files through the chat
* **URL Targeting** - Automatically show specific chat instances on matching URLs
* **Access Control** - Restrict chat to logged-in users or specific roles
* **Chat History** - Optionally save conversation history
* **Customizable** - Themes, colors, messages, and more

= How It Works =

1. Create a chat instance in WordPress admin
2. Configure your n8n webhook URL
3. Add the shortcode `[flowchat]` to any page
4. Users chat directly with your n8n workflow

= Requirements =

* WordPress 6.0 or higher
* PHP 8.0 or higher
* n8n instance with Chat Trigger node

== Installation ==

1. Upload the `flowchat` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu
3. Go to FlowChat > Instances to create your first chat
4. Configure your n8n webhook URL
5. Add `[flowchat]` shortcode to any page

== Frequently Asked Questions ==

= Do I need an n8n account? =

Yes, FlowChat connects to n8n webhooks to process chat messages. You'll need an n8n instance (self-hosted or cloud) with a Chat Trigger workflow.

= Is the webhook URL secure? =

The webhook URL is never exposed in the HTML source. It's only delivered to authenticated users via the WordPress REST API.

= Can I have multiple chat instances? =

Yes! Create as many instances as you need, each with different configurations and webhook URLs.

= Does it support streaming? =

Yes, FlowChat supports Server-Sent Events (SSE) for real-time streaming responses from n8n.

== Screenshots ==

1. Chat widget in action
2. Admin dashboard
3. Instance editor
4. Floating bubble widget

== Changelog ==

= 1.0.0 =
* Initial release

== Upgrade Notice ==

= 1.0.0 =
Initial release of FlowChat.
