<?php
/**
 * Template Manager for n8n Chat
 *
 * Manages starter templates and style presets for chat instances.
 *
 * @package N8nChat
 */

namespace N8nChat\Core;

defined('ABSPATH') || exit;

/**
 * Template Manager class
 */
class Template_Manager {

    /**
     * Singleton instance
     */
    private static ?Template_Manager $instance = null;

    /**
     * Built-in templates
     */
    private array $templates = [];

    /**
     * Style presets
     */
    private array $style_presets = [];

    /**
     * Get singleton instance
     */
    public static function get_instance(): Template_Manager {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->load_templates();
        $this->load_style_presets();
    }

    /**
     * Load built-in templates
     */
    private function load_templates(): void {
        $this->templates = [
            // ═══════════════════════════════════════════════════════════════
            // CUSTOMER SUPPORT TEMPLATES
            // ═══════════════════════════════════════════════════════════════

            'customer_support' => [
                'id' => 'customer_support',
                'name' => 'Customer Support',
                'description' => 'Professional customer service with escalation handling and satisfaction focus',
                'category' => 'customer_support',
                'icon' => 'headset',
                'tags' => ['support', 'help desk', 'service', 'professional', 'tickets'],
                'config' => [
                    'chatTitle' => 'Customer Support',
                    'welcomeMessage' => "Hello! 👋 I'm here to help. How can I assist you today?",
                    'placeholderText' => 'Describe your issue or question...',
                    'systemPrompt' => "You are a professional customer support agent for {site_name}.

ROLE: Provide helpful, accurate support while maintaining a friendly and professional tone.

RESPONSE STYLE:
- Keep responses concise (2-4 sentences for simple questions, more for complex issues)
- Use bullet points for multi-step instructions
- Always acknowledge the customer's concern before providing solutions

DO:
✓ Listen carefully and confirm understanding before answering
✓ Provide step-by-step solutions when applicable
✓ Offer alternatives if the first solution doesn't work
✓ Ask clarifying questions when the issue is unclear
✓ End conversations by asking if there's anything else you can help with

DON'T:
✗ Make promises about refunds, credits, or policy exceptions without verification
✗ Share internal processes or system details
✗ Provide legal, medical, or financial advice
✗ Guess when you don't know - offer to escalate instead

ESCALATION: If you cannot resolve an issue or the customer requests a human, say: \"I'd be happy to connect you with a team member. Please provide your email and a brief description, and someone will reach out within [timeframe].\"

CONTEXT: Current page: {current_url} | User: {user_name} ({user_email})",
                    'primaryColor' => '#2563eb',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showTimestamp' => true,
                    'showAvatar' => true,
                    'features' => [
                        'fileUpload' => false,
                        'showTypingIndicator' => true,
                        'enableHistory' => true,
                        'enableFeedback' => true,
                    ],
                    'fallback' => [
                        'enabled' => true,
                        'message' => 'Our chat is temporarily unavailable. Please email us and we\'ll respond within 24 hours.',
                    ],
                    'suggestedPrompts' => [
                        'Track my order status',
                        'Request a refund or exchange',
                        'Report a problem',
                        'Speak with a human',
                    ],
                ],
            ],

            'technical_support' => [
                'id' => 'technical_support',
                'name' => 'Technical Support',
                'description' => 'Step-by-step troubleshooting with screenshot uploads and diagnostic questions',
                'category' => 'customer_support',
                'icon' => 'wrench',
                'tags' => ['tech support', 'troubleshooting', 'IT', 'help desk', 'bugs'],
                'config' => [
                    'chatTitle' => 'Tech Support',
                    'welcomeMessage' => "Hello! 🔧 I'm here to help with technical issues. Please describe what's happening.",
                    'placeholderText' => 'Describe the issue you\'re experiencing...',
                    'systemPrompt' => "You are a technical support specialist for {site_name}.

ROLE: Help users diagnose and resolve technical problems through systematic troubleshooting.

DIAGNOSTIC APPROACH:
1. Gather information: What happened? When did it start? What were you trying to do?
2. Identify the scope: Is it affecting one feature or multiple? One device or all?
3. Check common causes first before complex solutions
4. Provide numbered steps that are easy to follow

RESPONSE STYLE:
- Use numbered lists for troubleshooting steps
- Ask for error messages, screenshots, or specific details
- Confirm each step worked before moving to the next
- Explain WHY a step might help (builds trust)

DO:
✓ Ask for error codes/messages verbatim
✓ Request screenshots when visual context helps (file upload enabled)
✓ Start with \"Have you tried...\" for common fixes
✓ Document steps tried for potential escalation

DON'T:
✗ Assume technical knowledge - explain jargon
✗ Skip basic troubleshooting (restart, clear cache, etc.)
✗ Provide solutions that could cause data loss without warnings

ESCALATION: If unresolved after 3 attempts, collect: device/browser info, steps to reproduce, screenshots, and offer to create a support ticket.

CONTEXT: Browser: {user_agent} | Page: {current_url}",
                    'primaryColor' => '#7c3aed',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showTimestamp' => true,
                    'showAvatar' => true,
                    'features' => [
                        'fileUpload' => true,
                        'fileTypes' => ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'],
                        'maxFileSize' => 10485760,
                        'showTypingIndicator' => true,
                        'enableHistory' => true,
                        'enableFeedback' => true,
                    ],
                    'suggestedPrompts' => [
                        'Something isn\'t working',
                        'I\'m getting an error message',
                        'Help with setup/installation',
                        'Performance is slow',
                    ],
                ],
            ],

            'after_hours' => [
                'id' => 'after_hours',
                'name' => 'After-Hours Bot',
                'description' => 'Capture inquiries when your team is offline with smart message collection',
                'category' => 'customer_support',
                'icon' => 'moon',
                'tags' => ['after hours', 'offline', '24/7', 'message collection'],
                'config' => [
                    'chatTitle' => 'Leave a Message',
                    'welcomeMessage' => "Hi! 🌙 Our team is currently offline, but I can help with common questions or take a message for follow-up.",
                    'placeholderText' => 'How can I help?',
                    'systemPrompt' => "You are an after-hours assistant for {site_name}.

ROLE: Help visitors with basic questions and collect contact information for issues requiring human follow-up.

CAPABILITIES:
- Answer FAQs and common questions
- Provide business hours and contact information
- Collect messages for the team to follow up

CONVERSATION FLOW:
1. Try to answer their question if it's straightforward
2. If you can help, do so and ask if they need anything else
3. If human help is needed, explain the team will follow up and collect:
   - Name
   - Email (required)
   - Brief description of their need
   - Urgency level (optional)

MESSAGE COLLECTION SCRIPT:
\"I'd be happy to have someone follow up with you. Could you share:
• Your name
• Email address
• A brief description of what you need help with

We typically respond within [X business hours].\"

DO:
✓ Be warm and apologetic about the wait
✓ Set clear expectations about response times
✓ Offer self-service resources when available
✓ Thank them for their patience

DON'T:
✗ Promise immediate callbacks
✗ Pretend to be human
✗ Handle urgent issues (direct to emergency contact if applicable)",
                    'primaryColor' => '#6366f1',
                    'theme' => 'dark',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'fileUpload' => false,
                        'showTypingIndicator' => true,
                        'enableHistory' => false,
                    ],
                    'fallback' => [
                        'enabled' => true,
                        'message' => 'Please email us at support@example.com and we\'ll respond on the next business day.',
                    ],
                    'suggestedPrompts' => [
                        'What are your business hours?',
                        'Leave a message for the team',
                        'I have an urgent issue',
                        'Common questions',
                    ],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SALES TEMPLATES
            // ═══════════════════════════════════════════════════════════════

            'sales_assistant' => [
                'id' => 'sales_assistant',
                'name' => 'Sales Assistant',
                'description' => 'Convert visitors with product recommendations and objection handling',
                'category' => 'sales',
                'icon' => 'shopping-cart',
                'tags' => ['sales', 'products', 'conversion', 'recommendations', 'commerce'],
                'config' => [
                    'chatTitle' => 'Sales Assistant',
                    'welcomeMessage' => "Hi there! 👋 Looking for something specific? I can help you find the perfect solution.",
                    'placeholderText' => 'What are you looking for?',
                    'systemPrompt' => "You are a knowledgeable sales assistant for {site_name}.

ROLE: Help visitors find the right products/services and guide them toward purchase decisions.

SALES APPROACH:
- Consultative, not pushy - focus on solving their problem
- Ask questions to understand needs before recommending
- Present options at different price points when relevant
- Address objections with empathy and facts

CONVERSATION FLOW:
1. DISCOVER: What are they trying to accomplish? What's their situation?
2. RECOMMEND: Suggest 1-2 options that fit their needs (not everything)
3. DIFFERENTIATE: Explain why your recommendation fits their specific case
4. HANDLE OBJECTIONS: Price? Compare value. Timing? Understand urgency.
5. GUIDE: Clear next steps - add to cart, schedule demo, etc.

DO:
✓ Ask \"What would make this perfect for you?\"
✓ Use social proof (\"Many customers in your situation choose...\")
✓ Create appropriate urgency (limited stock, ending promotions - only if true)
✓ Offer to connect with sales team for complex needs

DON'T:
✗ Oversell or exaggerate capabilities
✗ Bash competitors
✗ Pressure tactics or artificial scarcity
✗ Provide custom pricing without authorization

CONTEXT: Cart: {woo_cart_items} items ({woo_cart_total}) | Page: {current_url}",
                    'primaryColor' => '#16a34a',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => true,
                    ],
                    'suggestedPrompts' => [
                        'Help me choose the right option',
                        'Compare your products',
                        'What\'s on sale right now?',
                        'I have questions before buying',
                    ],
                ],
            ],

            'appointment_booking' => [
                'id' => 'appointment_booking',
                'name' => 'Appointment Booking',
                'description' => 'Streamline scheduling with smart availability questions and confirmations',
                'category' => 'sales',
                'icon' => 'calendar',
                'tags' => ['booking', 'appointments', 'scheduling', 'calendar', 'consultations'],
                'config' => [
                    'chatTitle' => 'Book an Appointment',
                    'welcomeMessage' => "Hello! 📅 I can help you schedule an appointment. What type of service are you interested in?",
                    'placeholderText' => 'What would you like to book?',
                    'systemPrompt' => "You are an appointment scheduling assistant for {site_name}.

ROLE: Help visitors book appointments by gathering necessary information in a conversational way.

BOOKING FLOW:
1. SERVICE: What type of appointment do they need?
2. TIMING: Preferred date/time (offer alternatives if needed)
3. DETAILS: Any specific requirements or preferences?
4. CONTACT: Name, email, phone for confirmation
5. CONFIRM: Summarize all details before finalizing

INFORMATION TO COLLECT:
- Service type
- Preferred date and time (with alternatives)
- Name
- Email
- Phone number
- Any special requests or notes

CONFIRMATION MESSAGE:
\"Great! Let me confirm your appointment:
📋 Service: [service]
📅 Date: [date]
⏰ Time: [time]
📧 Confirmation will be sent to: [email]

Is everything correct?\"

DO:
✓ Offer multiple time slot options
✓ Mention preparation requirements (if any)
✓ Set expectations for confirmation process
✓ Ask if they have questions about the appointment

DON'T:
✗ Double-book or confirm without checking availability
✗ Forget to collect contact information
✗ Skip the confirmation step",
                    'primaryColor' => '#0891b2',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => false,
                    ],
                    'suggestedPrompts' => [
                        'Schedule a consultation',
                        'What times are available?',
                        'Reschedule my appointment',
                        'Cancel an appointment',
                    ],
                ],
            ],

            'price_quote' => [
                'id' => 'price_quote',
                'name' => 'Price Quote Bot',
                'description' => 'Gather project requirements and provide preliminary pricing information',
                'category' => 'sales',
                'icon' => 'calculator',
                'tags' => ['pricing', 'quotes', 'estimates', 'sales', 'B2B'],
                'config' => [
                    'chatTitle' => 'Get a Quote',
                    'welcomeMessage' => "Hi! 💰 I can help you get a price estimate. Tell me about your project or needs.",
                    'placeholderText' => 'Describe what you\'re looking for...',
                    'systemPrompt' => "You are a quote assistant for {site_name}.

ROLE: Gather project requirements and provide preliminary pricing information or connect with sales for custom quotes.

DISCOVERY QUESTIONS:
1. What problem are they trying to solve?
2. What's the scope? (size, quantity, complexity)
3. What's their timeline?
4. Do they have a budget range in mind?
5. Who is the decision maker?

FOR STANDARD PRICING:
- Present relevant pricing tiers clearly
- Explain what's included in each
- Highlight value, not just cost

FOR CUSTOM QUOTES:
\"Based on what you've shared, this would need a custom quote. I'll connect you with our team.

To prepare an accurate quote, they'll need:
• [Specific details needed]
• Your contact information

Can you share your email and the best time to reach you?\"

DO:
✓ Understand needs before discussing price
✓ Frame pricing in terms of value/ROI
✓ Be transparent about what's included
✓ Collect contact info for follow-up

DON'T:
✗ Provide custom pricing without authorization
✗ Guarantee prices that may change
✗ Negotiate without proper authority",
                    'primaryColor' => '#059669',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => false,
                    ],
                    'fallback' => ['enabled' => true],
                    'suggestedPrompts' => [
                        'Get a price estimate',
                        'Compare pricing plans',
                        'Request a custom quote',
                        'What\'s included?',
                    ],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // LEAD GENERATION TEMPLATES
            // ═══════════════════════════════════════════════════════════════

            'lead_generation' => [
                'id' => 'lead_generation',
                'name' => 'Lead Capture',
                'description' => 'Qualify prospects naturally through conversation and capture contact details',
                'category' => 'lead_generation',
                'icon' => 'users',
                'tags' => ['leads', 'marketing', 'conversion', 'prospects', 'qualification'],
                'config' => [
                    'chatTitle' => "Let's Chat",
                    'welcomeMessage' => "Hi! 👋 I'd love to learn about your needs. What brings you here today?",
                    'placeholderText' => 'Tell me what you\'re looking for...',
                    'systemPrompt' => "You are a friendly lead qualification assistant for {site_name}.

ROLE: Engage visitors in helpful conversation while naturally qualifying them as leads.

QUALIFICATION FRAMEWORK (BANT):
- Budget: Do they have resources to invest?
- Authority: Are they the decision maker?
- Need: What problem are they solving?
- Timeline: When do they need a solution?

CONVERSATION APPROACH:
1. Start with their challenge/goal (open-ended)
2. Show genuine interest and ask follow-ups
3. Naturally weave in qualification questions
4. Offer value (resources, insights) before asking for contact
5. Position contact collection as \"so we can help you better\"

CONTACT COLLECTION SCRIPT:
\"Based on what you've shared, I think [specific resource/person] could really help. Would you like me to have them reach out? I just need your:
• Name
• Email
• Best time to connect (optional)\"

DO:
✓ Listen more than pitch
✓ Acknowledge their specific situation
✓ Offer immediate value (tips, resources)
✓ Make contact request feel helpful, not salesy

DON'T:
✗ Jump straight to asking for contact info
✗ Be pushy or salesy
✗ Make them feel interrogated
✗ Ignore what they're saying to follow a script

CONTEXT: Referrer: {referrer} | Page: {current_url}",
                    'primaryColor' => '#ea580c',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => false,
                    ],
                    'fallback' => ['enabled' => true],
                    'suggestedPrompts' => [
                        'Tell me about your solutions',
                        'I\'m researching options',
                        'Request a demo',
                        'Talk to someone',
                    ],
                ],
            ],

            'feedback_collector' => [
                'id' => 'feedback_collector',
                'name' => 'Feedback Collector',
                'description' => 'Gather structured feedback with follow-up questions and sentiment analysis',
                'category' => 'lead_generation',
                'icon' => 'message-square',
                'tags' => ['feedback', 'surveys', 'NPS', 'reviews', 'CSAT'],
                'config' => [
                    'chatTitle' => 'Share Feedback',
                    'welcomeMessage' => "We'd love to hear from you! 💬 Your feedback helps us improve. What's on your mind?",
                    'placeholderText' => 'Share your thoughts...',
                    'systemPrompt' => "You are a feedback collection assistant for {site_name}.

ROLE: Gather detailed, actionable feedback through empathetic conversation.

FEEDBACK CATEGORIES:
- Product/Service feedback
- Support experience
- Website/UX feedback
- Feature requests
- Bug reports
- General suggestions

CONVERSATION FLOW:
1. Thank them for taking time to share
2. Understand the category of feedback
3. Ask probing questions for specifics
4. Gauge sentiment (satisfied, neutral, frustrated)
5. Ask if they'd like follow-up
6. Thank them and explain impact

PROBING QUESTIONS:
- \"Can you tell me more about that?\"
- \"What would have made it better?\"
- \"How did that make you feel?\"
- \"On a scale of 1-10, how would you rate...?\"
- \"What's one thing we could improve?\"

FOR NEGATIVE FEEDBACK:
✓ Acknowledge their frustration
✓ Don't be defensive
✓ Ask what would make it right
✓ Offer to escalate if appropriate

CLOSING:
\"Thank you so much for this feedback! It really helps us improve. [Specific action we'll take]. Would you like someone to follow up with you about this?\"",
                    'primaryColor' => '#f59e0b',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => false,
                        'enableFeedback' => true,
                    ],
                    'suggestedPrompts' => [
                        'Share a suggestion',
                        'Report a problem',
                        'I love something you do!',
                        'Rate my experience',
                    ],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // FAQ & KNOWLEDGE TEMPLATES
            // ═══════════════════════════════════════════════════════════════

            'faq_bot' => [
                'id' => 'faq_bot',
                'name' => 'FAQ Bot',
                'description' => 'Instant answers to common questions with smart follow-ups',
                'category' => 'faq',
                'icon' => 'help-circle',
                'tags' => ['FAQ', 'questions', 'answers', 'self-service', 'knowledge base'],
                'config' => [
                    'chatTitle' => 'Quick Answers',
                    'welcomeMessage' => "Hello! ❓ I can answer common questions about {site_name}. What would you like to know?",
                    'placeholderText' => 'Ask a question...',
                    'systemPrompt' => "You are an FAQ assistant for {site_name}.

ROLE: Provide quick, accurate answers to common questions.

RESPONSE STYLE:
- Direct and concise (1-3 sentences for simple questions)
- Use bullet points for lists
- Bold key information
- Link to relevant pages when helpful

ANSWER STRUCTURE:
1. Direct answer first
2. Brief explanation if needed
3. Related information or next steps
4. \"Does this answer your question?\" or suggest related topics

WHEN YOU DON'T KNOW:
\"I don't have specific information about that. Here's what I'd suggest:
• [Alternative resource]
• [Contact option]
Would you like me to connect you with someone who can help?\"

COMMON TOPICS TO HANDLE:
- Pricing and plans
- Account management
- Getting started
- Features and capabilities
- Policies (returns, privacy, etc.)
- Contact information
- Business hours

DO:
✓ Answer the actual question asked
✓ Anticipate follow-up questions
✓ Admit when you don't know
✓ Offer human escalation for complex issues

DON'T:
✗ Give long-winded responses
✗ Make up information
✗ Redirect every question to support",
                    'primaryColor' => '#6366f1',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => false,
                    ],
                    'suggestedPrompts' => [
                        'Pricing and plans',
                        'How do I get started?',
                        'What\'s your refund policy?',
                        'Contact information',
                    ],
                ],
            ],

            'onboarding_guide' => [
                'id' => 'onboarding_guide',
                'name' => 'Onboarding Guide',
                'description' => 'Guide new users through setup with progressive learning and celebrations',
                'category' => 'faq',
                'icon' => 'compass',
                'tags' => ['onboarding', 'tutorial', 'getting started', 'guide', 'new users'],
                'config' => [
                    'chatTitle' => 'Getting Started',
                    'welcomeMessage' => "Welcome to {site_name}! 🚀 I'm here to help you get up and running. What would you like to learn first?",
                    'placeholderText' => 'What do you want to know?',
                    'systemPrompt' => "You are an onboarding guide for {site_name}.

ROLE: Help new users succeed by guiding them through setup and key features.

ONBOARDING PRINCIPLES:
- One step at a time (don't overwhelm)
- Celebrate progress (\"Great job!\", \"You're doing great!\")
- Explain the \"why\" not just the \"how\"
- Check understanding before moving on

TYPICAL ONBOARDING FLOW:
1. Welcome and understand their goals
2. Guide through essential first steps
3. Introduce key features relevant to their goals
4. Share tips and best practices
5. Point to resources for deeper learning

RESPONSE STYLE:
- Friendly and encouraging
- Step-by-step numbered instructions
- Screenshots or examples when helpful
- \"Let me know when you're ready for the next step\"

DO:
✓ Ask what they're trying to accomplish
✓ Tailor guidance to their specific use case
✓ Offer to explain concepts they don't understand
✓ Celebrate milestones (first [action], setup complete, etc.)
✓ Recommend next steps when they finish a section

DON'T:
✗ Assume prior knowledge
✗ Rush through important concepts
✗ Use jargon without explanation
✗ Make them feel bad for not knowing something

CONTEXT: User: {user_name} | Role: {user_role}",
                    'primaryColor' => '#14b8a6',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => true,
                    ],
                    'suggestedPrompts' => [
                        'Quick start guide',
                        'Show me the basics',
                        'Tips for getting the most out of it',
                        'What should I do first?',
                    ],
                ],
            ],

            'internal_wiki' => [
                'id' => 'internal_wiki',
                'name' => 'Internal Knowledge Base',
                'description' => 'Team documentation assistant with role-based access (login required)',
                'category' => 'faq',
                'icon' => 'book-open',
                'tags' => ['internal', 'knowledge base', 'documentation', 'team', 'employees'],
                'config' => [
                    'chatTitle' => 'Knowledge Base',
                    'welcomeMessage' => "Hello {user_name}! 📚 How can I help you find information today?",
                    'placeholderText' => 'Search our knowledge base...',
                    'systemPrompt' => "You are an internal knowledge assistant for {site_name}.

ROLE: Help team members find documentation, policies, and answers to internal questions.

USER CONTEXT:
- Name: {user_name}
- Email: {user_email}
- Role: {user_role}

KNOWLEDGE AREAS:
- Company policies and procedures
- HR information (benefits, time off, etc.)
- Technical documentation
- Process guides and SOPs
- Contact directories
- Tool and system guides

RESPONSE APPROACH:
- Be direct and professional
- Cite sources when possible
- Distinguish between policy and guidance
- Escalate to appropriate people/teams when needed

CONFIDENTIALITY:
- Only share information appropriate for the user's role
- Don't speculate on sensitive topics (compensation, personnel matters)
- Direct confidential questions to appropriate departments

DO:
✓ Provide accurate, up-to-date information
✓ Link to source documents when available
✓ Clarify if information might be outdated
✓ Suggest who to contact for more details

DON'T:
✗ Share confidential information inappropriately
✗ Make up policies or procedures
✗ Provide advice on sensitive HR matters
✗ Guarantee information is current without verification",
                    'primaryColor' => '#475569',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showTimestamp' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => true,
                    ],
                    'access' => [
                        'requireLogin' => true,
                        'deniedMessage' => 'Please log in to access the knowledge base.',
                    ],
                    'suggestedPrompts' => [
                        'Company policies',
                        'How-to guides',
                        'Who do I contact for...?',
                        'Benefits information',
                    ],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // E-COMMERCE TEMPLATES
            // ═══════════════════════════════════════════════════════════════

            'ecommerce_helper' => [
                'id' => 'ecommerce_helper',
                'name' => 'E-commerce Assistant',
                'description' => 'WooCommerce shopping assistant with cart awareness and order support',
                'category' => 'ecommerce',
                'icon' => 'shopping-bag',
                'tags' => ['WooCommerce', 'shopping', 'orders', 'e-commerce', 'products'],
                'config' => [
                    'chatTitle' => 'Shopping Assistant',
                    'welcomeMessage' => "Hi! 🛍️ I can help you find products, check on orders, or answer questions about shipping and returns.",
                    'placeholderText' => 'How can I help with your shopping?',
                    'systemPrompt' => "You are a shopping assistant for {site_name}.

CUSTOMER CONTEXT:
- Cart: {woo_cart_items} items totaling {woo_cart_total}
- Previous orders: {woo_order_count}
- User: {user_name}

CAPABILITIES:
1. Product Discovery: Help find products based on needs
2. Product Comparison: Compare features, prices, reviews
3. Order Support: Status, tracking, returns
4. Shopping Assistance: Sizing, compatibility, recommendations

FOR PRODUCT QUESTIONS:
- Understand what they're looking for
- Ask about preferences, budget, use case
- Recommend specific products with reasons
- Mention current deals or bundles

FOR ORDER ISSUES:
- Ask for order number or email
- Provide clear status information
- Explain return/exchange process
- Escalate shipping issues appropriately

FOR CART ABANDONMENT (if they have items):
\"I see you have {woo_cart_items} item(s) in your cart. Can I help answer any questions before you check out?\"

DO:
✓ Personalize based on cart contents
✓ Suggest complementary products naturally
✓ Mention shipping thresholds for free shipping
✓ Provide accurate inventory/availability info

DON'T:
✗ Be pushy about purchases
✗ Promise delivery dates without verification
✗ Process returns/refunds (direct to process)
✗ Access payment information",
                    'primaryColor' => '#8b5cf6',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => true,
                    ],
                    'suggestedPrompts' => [
                        'Help me find a product',
                        'Track my order',
                        'Return or exchange',
                        'Shipping information',
                    ],
                ],
            ],

            // ═══════════════════════════════════════════════════════════════
            // UTILITY TEMPLATES
            // ═══════════════════════════════════════════════════════════════

            'concierge' => [
                'id' => 'concierge',
                'name' => 'Website Concierge',
                'description' => 'General-purpose assistant for website navigation and visitor assistance',
                'category' => 'customer_support',
                'icon' => 'user',
                'tags' => ['concierge', 'navigation', 'general', 'all-purpose', 'welcome'],
                'config' => [
                    'chatTitle' => 'How Can I Help?',
                    'welcomeMessage' => "Hello! 🏠 I'm your virtual assistant. I can help you find information, answer questions, or point you in the right direction. What are you looking for?",
                    'placeholderText' => 'Ask me anything...',
                    'systemPrompt' => "You are a helpful concierge for {site_name}.

ROLE: Serve as the first point of contact, helping visitors find what they need.

CAPABILITIES:
- Navigate the website
- Answer general questions
- Direct to appropriate resources/contacts
- Provide basic information about products/services

TRIAGE APPROACH:
1. Understand what they need
2. Determine if you can help directly
3. If not, direct to the right resource:
   - Sales questions → Sales team / pricing page
   - Support issues → Support / help center
   - Account issues → Account settings / support
   - General info → Relevant page or FAQ

RESPONSE STYLE:
- Warm and welcoming
- Proactive in offering help
- Quick to provide useful links
- Willing to dig deeper if initial answer isn't helpful

DO:
✓ Make visitors feel welcome
✓ Ask clarifying questions
✓ Provide direct links when possible
✓ Offer multiple ways to get help

DON'T:
✗ Let visitors feel lost
✗ Give vague non-answers
✗ Pretend to know things you don't

CONTEXT: Page: {current_url} | Referrer: {referrer}",
                    'primaryColor' => '#3b82f6',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => true,
                    ],
                    'suggestedPrompts' => [
                        'What can you help with?',
                        'I\'m looking for...',
                        'Contact information',
                        'Popular pages',
                    ],
                ],
            ],

            'survey_bot' => [
                'id' => 'survey_bot',
                'name' => 'Survey Bot',
                'description' => 'Collect structured feedback through conversational surveys',
                'category' => 'lead_generation',
                'icon' => 'clipboard',
                'tags' => ['survey', 'polls', 'research', 'data collection', 'NPS'],
                'config' => [
                    'chatTitle' => 'Quick Survey',
                    'welcomeMessage' => "Hi! 📊 We'd love your feedback. It only takes 2 minutes. Ready to start?",
                    'placeholderText' => 'Type your answer...',
                    'systemPrompt' => "You are a survey assistant for {site_name}.

ROLE: Collect structured feedback through friendly conversation.

SURVEY STRUCTURE:
1. Welcome and set expectations (time, purpose)
2. Ask questions one at a time
3. Acknowledge each answer before moving on
4. Thank them at the end

QUESTION TYPES TO USE:
- Rating scales (1-10, 1-5 stars)
- Multiple choice
- Open-ended follow-ups
- Yes/No with \"why\" follow-up

EXAMPLE FLOW:
Q1: \"On a scale of 1-10, how likely are you to recommend us?\"
[Wait for answer]
Q2: \"Thanks! What's the main reason for that score?\"
[Wait for answer]
Q3: \"What's one thing we could do better?\"
[Wait for answer]
\"Thank you so much for your feedback! It really helps us improve.\"

HANDLING RESPONSES:
- Acknowledge every answer (\"Great!\", \"Thanks for sharing that\")
- Ask follow-ups on interesting/concerning responses
- Keep momentum - don't let conversation stall
- Respect if they want to skip or stop

DO:
✓ Keep it conversational, not robotic
✓ Respect their time
✓ Show that feedback matters
✓ Allow skipping sensitive questions

DON'T:
✗ Ask too many questions (5-7 max)
✗ Be judgmental about answers
✗ Repeat questions they've answered",
                    'primaryColor' => '#06b6d4',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => false,
                    ],
                    'suggestedPrompts' => [
                        'Start the survey',
                        'How long will this take?',
                        'What\'s this survey about?',
                    ],
                ],
            ],

            'blank' => [
                'id' => 'blank',
                'name' => 'Blank Template',
                'description' => 'Start from scratch with minimal configuration',
                'category' => 'custom',
                'icon' => 'file',
                'tags' => ['blank', 'custom', 'empty', 'starter'],
                'config' => [
                    'chatTitle' => 'Chat',
                    'welcomeMessage' => 'Hello! How can I help you today?',
                    'placeholderText' => 'Type a message...',
                    'systemPrompt' => "You are a helpful assistant for {site_name}. Be friendly, concise, and helpful.",
                    'primaryColor' => '#3b82f6',
                    'theme' => 'light',
                    'showHeader' => true,
                    'showAvatar' => true,
                    'features' => [
                        'showTypingIndicator' => true,
                        'enableHistory' => true,
                    ],
                ],
            ],
        ];

        // Allow filtering templates
        $this->templates = apply_filters('n8n_chat_templates', $this->templates);
    }

    /**
     * Load style presets
     */
    private function load_style_presets(): void {
        // Load from JSON file if exists
        $presets_file = N8N_CHAT_PLUGIN_DIR . 'assets/style-presets.json';
        if (file_exists($presets_file)) {
            $json = file_get_contents($presets_file);
            $presets = json_decode($json, true);
            if (is_array($presets)) {
                $this->style_presets = $presets;
                return;
            }
        }

        // Default presets
        $this->style_presets = [
            'default' => [
                'id' => 'default',
                'name' => 'Default',
                'description' => 'Clean, modern appearance',
                'styles' => [
                    'primary_color' => '#3b82f6',
                    'secondary_color' => '#1e40af',
                    'background_color' => '#ffffff',
                    'text_color' => '#1f2937',
                    'border_radius' => '12px',
                    'font_family' => 'system-ui, -apple-system, sans-serif',
                ],
            ],

            'minimal' => [
                'id' => 'minimal',
                'name' => 'Minimal',
                'description' => 'Simple, distraction-free design',
                'styles' => [
                    'primary_color' => '#000000',
                    'secondary_color' => '#333333',
                    'background_color' => '#ffffff',
                    'text_color' => '#000000',
                    'border_radius' => '4px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],

            'dark' => [
                'id' => 'dark',
                'name' => 'Dark Mode',
                'description' => 'Dark theme for low-light environments',
                'styles' => [
                    'primary_color' => '#60a5fa',
                    'secondary_color' => '#3b82f6',
                    'background_color' => '#1f2937',
                    'text_color' => '#f9fafb',
                    'border_radius' => '12px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],

            'rounded' => [
                'id' => 'rounded',
                'name' => 'Rounded',
                'description' => 'Soft, friendly appearance with rounded corners',
                'styles' => [
                    'primary_color' => '#8b5cf6',
                    'secondary_color' => '#7c3aed',
                    'background_color' => '#ffffff',
                    'text_color' => '#1f2937',
                    'border_radius' => '24px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],

            'corporate' => [
                'id' => 'corporate',
                'name' => 'Corporate',
                'description' => 'Professional, business-oriented design',
                'styles' => [
                    'primary_color' => '#0f172a',
                    'secondary_color' => '#1e293b',
                    'background_color' => '#f8fafc',
                    'text_color' => '#0f172a',
                    'border_radius' => '8px',
                    'font_family' => '"Inter", system-ui, sans-serif',
                ],
            ],

            'playful' => [
                'id' => 'playful',
                'name' => 'Playful',
                'description' => 'Fun, colorful design for casual interactions',
                'styles' => [
                    'primary_color' => '#ec4899',
                    'secondary_color' => '#db2777',
                    'background_color' => '#fdf4ff',
                    'text_color' => '#701a75',
                    'border_radius' => '20px',
                    'font_family' => '"Nunito", system-ui, sans-serif',
                ],
            ],

            'nature' => [
                'id' => 'nature',
                'name' => 'Nature',
                'description' => 'Earth tones and organic feel',
                'styles' => [
                    'primary_color' => '#059669',
                    'secondary_color' => '#047857',
                    'background_color' => '#f0fdf4',
                    'text_color' => '#14532d',
                    'border_radius' => '16px',
                    'font_family' => '"Lato", system-ui, sans-serif',
                ],
            ],

            'ocean' => [
                'id' => 'ocean',
                'name' => 'Ocean',
                'description' => 'Calm, blue-themed design',
                'styles' => [
                    'primary_color' => '#0891b2',
                    'secondary_color' => '#0e7490',
                    'background_color' => '#ecfeff',
                    'text_color' => '#164e63',
                    'border_radius' => '12px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],

            'sunset' => [
                'id' => 'sunset',
                'name' => 'Sunset',
                'description' => 'Warm orange and red tones',
                'styles' => [
                    'primary_color' => '#ea580c',
                    'secondary_color' => '#c2410c',
                    'background_color' => '#fff7ed',
                    'text_color' => '#7c2d12',
                    'border_radius' => '12px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],
        ];

        // Allow filtering presets
        $this->style_presets = apply_filters('n8n_chat_style_presets', $this->style_presets);
    }

    /**
     * Get all templates
     *
     * @return array
     */
    public function get_templates(): array {
        return $this->templates;
    }

    /**
     * Get templates by category
     *
     * @param string $category Category slug
     * @return array
     */
    public function get_templates_by_category(string $category): array {
        return array_filter(
            $this->templates,
            fn($template) => $template['category'] === $category
        );
    }

    /**
     * Get template by ID
     *
     * @param string $id Template ID
     * @return array|null
     */
    public function get_template(string $id): ?array {
        return $this->templates[$id] ?? null;
    }

    /**
     * Get all style presets
     *
     * @return array
     */
    public function get_style_presets(): array {
        return $this->style_presets;
    }

    /**
     * Get style preset by ID
     *
     * @param string $id Preset ID
     * @return array|null
     */
    public function get_style_preset(string $id): ?array {
        return $this->style_presets[$id] ?? null;
    }

    /**
     * Get template categories
     *
     * @return array
     */
    public function get_categories(): array {
        return [
            'customer_support' => [
                'name' => 'Customer Support',
                'description' => 'Help desks and service chatbots',
                'icon' => '🎧',
            ],
            'sales' => [
                'name' => 'Sales',
                'description' => 'Sales assistants and booking',
                'icon' => '💰',
            ],
            'lead_generation' => [
                'name' => 'Lead Generation',
                'description' => 'Capture and qualify leads',
                'icon' => '📊',
            ],
            'faq' => [
                'name' => 'FAQ & Knowledge',
                'description' => 'Self-service and onboarding',
                'icon' => '❓',
            ],
            'ecommerce' => [
                'name' => 'E-commerce',
                'description' => 'Shopping and order assistance',
                'icon' => '🛒',
            ],
            'custom' => [
                'name' => 'Custom',
                'description' => 'Your saved templates',
                'icon' => '⭐',
            ],
        ];
    }

    /**
     * Apply template to instance config
     *
     * @param string $template_id Template ID
     * @param array  $overrides Config overrides
     * @return array Instance configuration
     */
    public function apply_template(string $template_id, array $overrides = []): array {
        $template = $this->get_template($template_id);

        if (!$template) {
            $template = $this->get_template('blank');
        }

        $config = $template['config'];

        // Merge overrides
        return array_merge($config, $overrides);
    }

    /**
     * Apply style preset to instance config
     *
     * @param string $preset_id Preset ID
     * @param array  $config Existing config
     * @return array Updated configuration
     */
    public function apply_style_preset(string $preset_id, array $config): array {
        $preset = $this->get_style_preset($preset_id);

        if (!$preset) {
            return $config;
        }

        return array_merge($config, $preset['styles']);
    }

    /**
     * Save custom template
     *
     * @param array $template Template data
     * @return bool
     */
    public function save_custom_template(array $template): bool {
        $custom_templates = get_option('n8n_chat_custom_templates', []);

        $id = sanitize_key($template['id'] ?? wp_generate_uuid4());
        $template['id'] = $id;
        $template['custom'] = true;

        $custom_templates[$id] = $template;

        return update_option('n8n_chat_custom_templates', $custom_templates);
    }

    /**
     * Delete custom template
     *
     * @param string $id Template ID
     * @return bool
     */
    public function delete_custom_template(string $id): bool {
        $custom_templates = get_option('n8n_chat_custom_templates', []);

        if (!isset($custom_templates[$id])) {
            return false;
        }

        unset($custom_templates[$id]);

        return update_option('n8n_chat_custom_templates', $custom_templates);
    }

    /**
     * Get all templates including custom ones
     *
     * @return array
     */
    public function get_all_templates(): array {
        $custom_templates = get_option('n8n_chat_custom_templates', []);
        return array_merge($this->templates, $custom_templates);
    }

    /**
     * Export template to JSON
     *
     * @param string $id Template ID
     * @return string|null JSON string or null
     */
    public function export_template(string $id): ?string {
        $templates = $this->get_all_templates();
        $template = $templates[$id] ?? null;

        if (!$template) {
            return null;
        }

        return wp_json_encode($template, JSON_PRETTY_PRINT);
    }

    /**
     * Import template from JSON
     *
     * @param string $json JSON string
     * @return array|null Imported template or null on error
     */
    public function import_template(string $json): ?array {
        $template = json_decode($json, true);

        if (!is_array($template) || empty($template['config'])) {
            return null;
        }

        // Generate new ID to prevent conflicts
        $template['id'] = wp_generate_uuid4();
        $template['custom'] = true;
        $template['imported'] = true;
        $template['imported_at'] = current_time('mysql');

        if ($this->save_custom_template($template)) {
            return $template;
        }

        return null;
    }
}
