=== n8n Chat – Beautiful Chat Widget ===
Contributors: n8chat
Tags: n8n, n8n chat, n8n chatbot, chat widget, chatbot, automation, workflow, webhook, ai chat
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Beautiful, customizable chat widget for n8n workflows. Streaming responses, file uploads, voice input, templates gallery, and full design control.

== Description ==

**n8n Chat** brings the power of n8n automation to your WordPress site with a beautiful, fully customizable chat frontend.

Connect your WordPress site to n8n workflows and provide an interactive chat experience for your visitors. Whether you're building an AI chatbot, customer support system, or lead capture tool – n8n Chat makes it simple and beautiful.

= n8n Chat Frontend for WordPress =

The most feature-rich chat widget for n8n workflows. Designed for developers and non-developers alike who want to embed powerful n8n-powered chat experiences on their WordPress sites.

= Key Features =

* **Easy n8n Integration** – Paste your n8n webhook URL and you're ready to go
* **Streaming Responses** – Real-time message streaming for a natural chat experience using Server-Sent Events (SSE)
* **20+ Style Templates** – Beautiful pre-designed themes including ChatGPT, Claude, Linear, Notion styles
* **Customizable Design** – Match your brand with custom colors, fonts, border radius, and shadows
* **Multiple Display Modes** – Floating bubble widget or inline embedded chat
* **Voice Input** – Let users speak their messages using Web Speech API
* **File Uploads** – Accept images and documents in conversations with secure handling
* **Mobile Responsive** – Works beautifully on all devices
* **Page Targeting** – Show different chat bots on different pages using URL patterns
* **Gutenberg Block** – Native WordPress block editor support
* **Shortcode Support** – Simple `[n8n_chat]` shortcode for classic editor
* **WPML Compatible** – Full internationalization support
* **Access Control** – Restrict chat to logged-in users or specific WordPress roles
* **Auto-Open Triggers** – Open chat based on time delay, scroll position, or exit intent
* **Chat History** – Optional conversation persistence
* **Debug Mode** – Built-in diagnostics for troubleshooting

= n8n Chat Use Cases =

* AI-powered customer support chatbots
* Lead generation and qualification bots
* FAQ automation with smart responses
* Appointment booking assistants
* Product recommendation engines
* Internal team help desks
* Website visitor engagement
* Sales qualification workflows

= How It Works =

1. Create a chat workflow in n8n using the Chat Trigger node
2. Install n8n Chat on your WordPress site
3. Create a new chat instance and paste your n8n webhook URL
4. Customize the appearance to match your brand
5. Add the shortcode or enable floating bubble – done!

= Why n8n Chat? =

Unlike other chat plugins, n8n Chat connects directly to your n8n workflows, giving you complete control over the chat logic without any third-party services. Your data stays yours, and you can build any chat experience you can imagine.

* **No monthly fees** – One-time install, no SaaS subscriptions
* **Full data control** – Your conversations, your servers
* **Unlimited customization** – Build any chat flow with n8n
* **Open source** – Transparent, trustworthy code

= SEO Keywords =

n8n chat, n8n chat widget, n8n chat plugin, n8n chat plugin wordpress, embed n8n chat, n8n chatbot, n8n chatbot wordpress, connect wordpress to n8n, n8n wordpress integration, chat widget for n8n, n8n frontend, n8n chat frontend

= Requirements =

* WordPress 6.0 or higher
* PHP 7.4 or higher
* n8n instance (cloud or self-hosted) with Chat Trigger workflow

= Disclaimer =

n8n is a trademark of n8n GmbH. n8n Chat is an independent project developed by n8.chat and is not affiliated with or endorsed by n8n GmbH.

== Installation ==

= Automatic Installation =

1. Go to Plugins → Add New in your WordPress admin
2. Search for "n8n Chat"
3. Click "Install Now" and then "Activate"
4. Go to n8n Chat → Chat Bots to create your first chat instance

= Manual Installation =

1. Download the plugin zip file
2. Go to Plugins → Add New → Upload Plugin
3. Upload the zip file and click "Install Now"
4. Activate the plugin

= Setup Guide =

1. In n8n, create a workflow with a Chat Trigger node
2. Get the Production URL from your Chat Trigger node
3. In WordPress, go to n8n Chat → Chat Bots → Add New
4. Paste your webhook URL in the Connection tab
5. Configure appearance and display settings
6. Enable the instance and add the shortcode to any page

= Using the Shortcode =

Basic usage:
`[n8n_chat]`

With specific instance:
`[n8n_chat id="your-instance-id"]`

Full options:
`[n8n_chat id="support" mode="bubble" position="bottom-right" theme="dark"]`

== Frequently Asked Questions ==

= Do I need an n8n account? =

Yes, you need access to an n8n instance (cloud or self-hosted) to create the chat workflow that this plugin connects to. n8n offers a free tier for cloud users.

= Is n8n Chat affiliated with n8n? =

No. n8n is a trademark of n8n GmbH. n8n Chat is an independent project and is not affiliated with or endorsed by n8n.

= Is my webhook URL secure? =

Yes. The webhook URL is never exposed in the HTML source code. It's delivered only to authenticated sessions via the WordPress REST API with proper security measures.

= Can I have multiple chat instances? =

Yes! Create as many chat instances as you need, each with different configurations, webhook URLs, and styling. Perfect for different departments, languages, or page types.

= Does it support streaming responses? =

Yes. n8n Chat supports Server-Sent Events (SSE) for real-time streaming responses. Enable streaming in both the plugin settings and your n8n Chat Trigger node.

= Can I customize the appearance? =

Absolutely. Choose from 20+ pre-designed templates or fully customize colors, fonts, border radius, shadows, and more. You can also add custom CSS.

= Does it work with page builders? =

Yes. n8n Chat works with Gutenberg (native block), Elementor (widget included), and any page builder that supports shortcodes.

= Can I restrict chat access? =

Yes. You can restrict chat to logged-in users only, specific WordPress user roles, or use page targeting rules to show chat only on specific URLs.

= How does file upload work? =

Files are securely uploaded to your WordPress media library (wp-content/uploads/n8n-chat/temp/) and automatically cleaned up after 24 hours.

= Is it translation-ready? =

Yes. n8n Chat is fully internationalized and WPML compatible. All strings can be translated using standard WordPress translation tools.

== Screenshots ==

1. Chat widget embedded on a WordPress page with real-time streaming
2. Chat bot configuration dashboard with live preview
3. Appearance customization with 20+ style templates
4. Connection settings with n8n webhook URL configuration
5. Mobile responsive floating bubble widget
6. Page targeting rules for showing different bots on different pages

== Changelog ==

= 1.0.0 =
* Initial release
* n8n webhook integration with streaming support
* 20+ style templates (ChatGPT, Claude, Linear, Notion, and more)
* Floating bubble and inline display modes
* Voice input via Web Speech API
* File upload support with secure handling
* Gutenberg block and shortcode support
* Page targeting with URL patterns
* Access control by user role
* Auto-open triggers (time, scroll, exit intent)
* Full internationalization support
* Debug mode with diagnostics
* Import/export functionality

== Upgrade Notice ==

= 1.0.0 =
Initial release of n8n Chat – Beautiful Chat Widget.

== Additional Info ==

= Support =

For support, feature requests, and bug reports, please visit:
* [Documentation](https://n8.chat/docs)
* [GitHub Issues](https://github.com/n8chat/n8n-chat/issues)

= Contributing =

n8n Chat is open source. Contributions are welcome on GitHub.

= Credits =

Developed by [n8.chat](https://n8.chat)
