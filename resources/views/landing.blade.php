<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>B2B Hub — Wholesale Registration, Quotations & Portal for Shopify</title>
    <meta name="description" content="Supercharge your B2B wholesale store on Shopify with customizable registration forms, instant company approvals, and powerful quotation negotiations.">

    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}">
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <link rel="apple-touch-icon" href="{{ asset('b2b_app_icon.png') }}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">

    <style>
        :root {
            --primary: #008060;
            --primary-hover: #006e52;
            --primary-light: #e3f5ec;
            --dark: #0f172a;
            --dark-card: #1e293b;
            --slate: #475569;
            --light-slate: #f8fafc;
            --border: #e2e8f0;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --accent: #0ea5e9;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: var(--text-main);
            background-color: #ffffff;
            line-height: 1.6;
            overflow-x: hidden;
        }

        h1, h2, h3, h4 {
            font-family: 'Outfit', sans-serif;
            color: var(--dark);
            line-height: 1.25;
        }

        a {
            color: inherit;
            text-decoration: none;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* ── Header ───────────────────────────────────────────── */
        header {
            position: sticky;
            top: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border);
            z-index: 1000;
        }

        .nav-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 72px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.35rem;
            font-weight: 800;
            color: var(--dark);
            font-family: 'Outfit', sans-serif;
        }

        .brand img {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 128, 96, 0.2);
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 32px;
            list-style: none;
        }

        .nav-links a {
            color: var(--slate);
            font-weight: 500;
            font-size: 0.95rem;
            transition: color 0.2s;
        }

        .nav-links a:hover {
            color: var(--primary);
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
        }

        .btn-primary {
            background-color: var(--primary);
            color: #ffffff;
        }

        .btn-primary:hover {
            background-color: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 128, 96, 0.25);
        }

        .btn-secondary {
            background-color: #ffffff;
            color: var(--dark);
            border: 1px solid var(--border);
        }

        .btn-secondary:hover {
            background-color: var(--light-slate);
            border-color: #cbd5e1;
        }

        /* ── Hero Section ─────────────────────────────────────── */
        .hero {
            padding: 80px 0 60px;
            background: radial-gradient(circle at 50% 10%, #e8f7f0 0%, #ffffff 70%);
            text-align: center;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 999px;
            background-color: var(--primary-light);
            color: var(--primary);
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 24px;
            border: 1px solid rgba(0, 128, 96, 0.2);
        }

        .hero h1 {
            font-size: 3.2rem;
            font-weight: 800;
            max-width: 840px;
            margin: 0 auto 20px;
            letter-spacing: -0.02em;
        }

        .hero h1 span {
            color: var(--primary);
        }

        .hero p {
            font-size: 1.15rem;
            color: var(--slate);
            max-width: 640px;
            margin: 0 auto 36px;
        }

        .install-box {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            max-width: 520px;
            margin: 0 auto 20px;
            background: #ffffff;
            padding: 8px;
            border-radius: 12px;
            border: 1px solid var(--border);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }

        .install-box input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid transparent;
            font-size: 0.95rem;
            outline: none;
            color: var(--dark);
        }

        .install-box input::placeholder {
            color: #94a3b8;
        }

        .hero-proof {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 24px;
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: 16px;
        }

        .hero-proof span {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* ── Features ─────────────────────────────────────────── */
        .features {
            padding: 90px 0;
            background-color: #ffffff;
        }

        .section-header {
            text-align: center;
            max-width: 680px;
            margin: 0 auto 56px;
        }

        .section-header h2 {
            font-size: 2.25rem;
            font-weight: 700;
            margin-bottom: 14px;
        }

        .section-header p {
            color: var(--slate);
            font-size: 1.05rem;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 28px;
        }

        .feature-card {
            background: var(--light-slate);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 32px 28px;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .feature-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.04);
            border-color: #cbd5e1;
        }

        .feature-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            background: var(--primary-light);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            margin-bottom: 20px;
        }

        .feature-card h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .feature-card p {
            color: var(--slate);
            font-size: 0.92rem;
            line-height: 1.55;
        }

        /* ── Pricing ──────────────────────────────────────────── */
        .pricing {
            padding: 90px 0;
            background-color: var(--light-slate);
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
        }

        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 24px;
            margin-top: 40px;
        }

        .pricing-card {
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 32px 24px;
            display: flex;
            flex-direction: column;
            position: relative;
            transition: all 0.2s ease;
        }

        .pricing-card.popular {
            border-color: var(--primary);
            box-shadow: 0 12px 30px rgba(0, 128, 96, 0.12);
            transform: scale(1.02);
        }

        .popular-tag {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 999px;
            letter-spacing: 0.05em;
        }

        .plan-name {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .plan-price {
            display: flex;
            align-items: baseline;
            gap: 4px;
            margin-bottom: 20px;
        }

        .plan-price .amount {
            font-size: 2.4rem;
            font-weight: 800;
            color: var(--dark);
            font-family: 'Outfit', sans-serif;
        }

        .plan-price .period {
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .plan-desc {
            font-size: 0.88rem;
            color: var(--slate);
            margin-bottom: 24px;
            min-height: 40px;
        }

        .plan-features {
            list-style: none;
            margin-bottom: 32px;
            flex-grow: 1;
        }

        .plan-features li {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.88rem;
            color: var(--slate);
            margin-bottom: 12px;
        }

        .plan-features li svg {
            flex-shrink: 0;
            color: var(--primary);
        }

        /* ── FAQ ──────────────────────────────────────────────── */
        .faq {
            padding: 90px 0;
            background-color: #ffffff;
        }

        .faq-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
            gap: 24px;
            max-width: 1000px;
            margin: 0 auto;
        }

        .faq-item {
            background: var(--light-slate);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px 28px;
        }

        .faq-item h4 {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: var(--dark);
        }

        .faq-item p {
            font-size: 0.92rem;
            color: var(--slate);
            line-height: 1.55;
        }

        /* ── CTA Banner ───────────────────────────────────────── */
        .cta-banner {
            padding: 80px 0;
            background: linear-gradient(135deg, #0b192c 0%, #1e293b 100%);
            color: #ffffff;
            text-align: center;
        }

        .cta-banner h2 {
            color: #ffffff;
            font-size: 2.4rem;
            margin-bottom: 16px;
        }

        .cta-banner p {
            color: #94a3b8;
            font-size: 1.1rem;
            max-width: 600px;
            margin: 0 auto 32px;
        }

        /* ── Footer ───────────────────────────────────────────── */
        footer {
            background-color: #ffffff;
            border-top: 1px solid var(--border);
            padding: 50px 0 30px;
            font-size: 0.9rem;
            color: var(--text-muted);
        }

        .footer-grid {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 24px;
            margin-bottom: 30px;
        }

        .footer-links {
            display: flex;
            gap: 24px;
        }

        .footer-links a:hover {
            color: var(--primary);
        }

        @media (max-width: 768px) {
            .hero h1 { font-size: 2.2rem; }
            .nav-links { display: none; }
            .faq-grid { grid-template-columns: 1fr; }
            .install-box { flex-direction: column; }
            .install-box button { width: 100%; }
        }
    </style>
</head>
<body>

    <!-- Header Navigation -->
    <header>
        <div class="container nav-wrapper">
            <a href="/" class="brand">
                <img src="{{ asset('b2b_app_icon.png') }}" alt="B2B Hub App Logo">
                <span>B2B Hub</span>
            </a>
            <ul class="nav-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="/privacy-policy">Privacy</a></li>
                <li><a href="/terms">Terms</a></li>
            </ul>
            <a href="#install" class="btn btn-primary">Install on Shopify</a>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <div class="badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Built for Shopify & B2B Merchants
            </div>
            <h1>Supercharge <span>B2B Wholesale</span> on Your Shopify Store</h1>
            <p>Customizable registration forms, instant tax & GSTIN verification, custom quotations, and automated customer-to-company workflows — all in one unified platform.</p>

            <form id="install" class="install-box" action="/auth/shopify" method="GET" onsubmit="return handleInstall(event)">
                <input type="text" id="shop-input" name="shop" placeholder="your-store.myshopify.com" required>
                <button type="submit" class="btn btn-primary">Add App</button>
            </form>

            <div class="hero-proof">
                <span>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    Fast & Seamless Setup
                </span>
                <span>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    GDPR Compliant
                </span>
                <span>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    Shopify Token Exchange Ready
                </span>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
        <div class="container">
            <div class="section-header">
                <h2>Everything You Need for B2B Wholesale</h2>
                <p>Designed to scale wholesale operations seamlessly without sacrificing your brand experience.</p>
            </div>

            <div class="features-grid">
                <!-- Feature 1 -->
                <div class="feature-card">
                    <div class="feature-icon">📝</div>
                    <h3>Multi-Step & Single Page Registration</h3>
                    <p>Build custom wholesale signup forms matching your store branding. Capture company information, tax certificates, and trade licenses effortlessly.</p>
                </div>

                <!-- Feature 2 -->
                <div class="feature-card">
                    <div class="feature-icon">🔍</div>
                    <h3>Smart Tax & GSTIN Validation</h3>
                    <p>Automated format validation for Indian GSTIN and international VAT numbers so you only onboard verified business entities.</p>
                </div>

                <!-- Feature 3 -->
                <div class="feature-card">
                    <div class="feature-icon">💼</div>
                    <h3>Quotation & Negotiation Engine</h3>
                    <p>Enable wholesale buyers to request quotes directly on product pages. Review submittals, adjust tiered pricing, and send custom offers with 1-click checkout.</p>
                </div>

                <!-- Feature 4 -->
                <div class="feature-card">
                    <div class="feature-icon">🏢</div>
                    <h3>Company & Location Association</h3>
                    <p>Automatically create and associate approved customers with Shopify B2B Companies and Locations for automated wholesale catalog pricing.</p>
                </div>

                <!-- Feature 5 -->
                <div class="feature-card">
                    <div class="feature-icon">🔔</div>
                    <h3>Automated Notifications</h3>
                    <p>Instant alerts and automated email confirmations for submissions, approvals, quotation updates, and re-quotes.</p>
                </div>

                <!-- Feature 6 -->
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3>Built for Speed & LCP Performance</h3>
                    <p>Optimized with pre-warmed token caching, code splitting, and zero reload friction under Shopify App Bridge.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="pricing">
        <div class="container">
            <div class="section-header">
                <h2>Simple, Transparent Pricing</h2>
                <p>Choose the plan that fits your wholesale business needs. Upgrade or downgrade anytime.</p>
            </div>

            <div class="pricing-grid">
                <!-- Free Plan -->
                <div class="pricing-card">
                    <div class="plan-name">Free</div>
                    <div class="plan-price">
                        <span class="amount">$0</span>
                        <span class="period">/ month</span>
                    </div>
                    <div class="plan-desc">For emerging stores starting wholesale onboarding.</div>
                    <ul class="plan-features">
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Standard B2B Registration Form</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Manual Customer Approvals</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Document Uploads (up to 10MB)</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Basic Email Notifications</li>
                    </ul>
                    <a href="#install" class="btn btn-secondary">Get Started</a>
                </div>

                <!-- Grow Plan -->
                <div class="pricing-card">
                    <div class="plan-name">Grow</div>
                    <div class="plan-price">
                        <span class="amount">$29</span>
                        <span class="period">/ month</span>
                    </div>
                    <div class="plan-desc">Perfect for growing wholesale stores with quote requests.</div>
                    <ul class="plan-features">
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Everything in Free</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Product Quotations (up to 25/month)</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Quick Order Pad &amp; CSV Bulk Upload</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> 1-Click Past Order Reorder</li>
                    </ul>
                    <a href="#install" class="btn btn-secondary">Get Started</a>
                </div>

                <!-- Advanced Plan -->
                <div class="pricing-card popular">
                    <div class="popular-tag">MOST POPULAR</div>
                    <div class="plan-name">Advanced</div>
                    <div class="plan-price">
                        <span class="amount">$79</span>
                        <span class="period">/ month</span>
                    </div>
                    <div class="plan-desc">Full quotation negotiation engine, shopping lists &amp; translations.</div>
                    <ul class="plan-features">
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Everything in Grow</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Unlimited Multi-Item Cart Quotes</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Custom Expiration &amp; Draft Order Checkout</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Reusable Shopping Lists &amp; Approvals</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Multi-Language Storefront Translations</li>
                    </ul>
                    <a href="#install" class="btn btn-primary">Get Started</a>
                </div>

                <!-- Enterprise Plan -->
                <div class="pricing-card">
                    <div class="plan-name">Enterprise</div>
                    <div class="plan-price">
                        <span class="amount">$149</span>
                        <span class="period">/ month</span>
                    </div>
                    <div class="plan-desc">Enterprise-scale wholesale automation, team roles &amp; credit ledger.</div>
                    <ul class="plan-features">
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Everything in Advanced</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Shopify Flow Automations</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Users &amp; Permissions (Team Roles)</li>
                        <li><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> Credit Limit &amp; Finance Ledger Portal</li>
                    </ul>
                    <a href="#install" class="btn btn-secondary">Get Started</a>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="faq">
        <div class="container">
            <div class="section-header">
                <h2>Frequently Asked Questions</h2>
                <p>Have questions? We have answers.</p>
            </div>

            <div class="faq-grid">
                <div class="faq-item">
                    <h4>Do I need Shopify Plus to use B2B Hub?</h4>
                    <p>You can collect B2B registrations and manage wholesale quote requests on any Shopify plan. Native Shopify B2B Company &amp; Location syncing requires a store with Shopify B2B (Shopify Plus) enabled.</p>
                </div>
                <div class="faq-item">
                    <h4>How does customer registration work?</h4>
                    <p>When a customer submits your wholesale form, their data is saved to B2B Hub and can automatically create a customer record in Shopify for your review and approval.</p>
                </div>
                <div class="faq-item">
                    <h4>Can customers negotiate quotations on product pages?</h4>
                    <p>Yes. With the quotation module enabled, buyers can submit single or multi-product quote requests. You can counter-offer or approve quotes with customized discounts.</p>
                </div>
                <div class="faq-item">
                    <h4>Is B2B Hub compliant with privacy and GDPR laws?</h4>
                    <p>Yes, B2B Hub fully complies with Shopify's GDPR and privacy requirements, including automated customer data request and redaction processing within 5 days.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-banner">
        <div class="container">
            <h2>Ready to Transform Your B2B Sales?</h2>
            <p>Join hundreds of high-growth merchants automating B2B customer onboarding and quotations.</p>
            <a href="#install" class="btn btn-primary" style="padding: 14px 32px; font-size: 1.05rem;">Install B2B Hub Today</a>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="brand">
                    <img src="{{ asset('b2b_app_icon.png') }}" alt="B2B Hub App Logo">
                    <span>B2B Hub</span>
                </div>
                <div class="footer-links">
                    <a href="#features">Features</a>
                    <a href="#pricing">Pricing</a>
                    <a href="/privacy-policy">Privacy Policy</a>
                    <a href="/terms">Terms of Service</a>
                </div>
            </div>
            <div style="text-align: center; border-top: 1px solid var(--border); padding-top: 20px;">
                &copy; {{ date('Y') }} B2B Hub. All rights reserved. Built for Shopify.
            </div>
        </div>
    </footer>

    <script>
        function handleInstall(e) {
            e.preventDefault();
            let shop = document.getElementById('shop-input').value.trim();
            if (!shop) return false;
            
            // Clean up protocol if pasted
            shop = shop.replace(/^https?:\/\//i, '').replace(/\/$/, '');
            if (!shop.includes('.myshopify.com')) {
                shop = shop + '.myshopify.com';
            }
            window.location.href = '/auth/shopify?shop=' + encodeURIComponent(shop);
            return false;
        }
    </script>
</body>
</html>

