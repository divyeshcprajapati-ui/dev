import React, { useState, useEffect, Suspense, lazy, startTransition } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { quoteService } from '../services/quoteService';
import {
    Page,
    Card,
    Tabs,
    ResourceList,
    ResourceItem,
    Badge,
    Text,
    Box,
    InlineStack,
    BlockStack,
    TextField,
    Icon
} from '@shopify/polaris';
import { SearchIcon } from '@shopify/polaris-icons';

const B2BRegistrationForm = lazy(() => import('./B2BRegistrationForm'));

export default function B2BExtensionsHub() {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedTab, setSelectedTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentView, setCurrentView] = useState(location.pathname === '/b2b-register' ? 'b2b-registration' : 'hub');
    const [isQuoteActive, setIsQuoteActive] = useState(false);

    useEffect(() => {
        const CACHE_KEY = 'b2b_quote_status_cache';
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

        const checkQuoteStatus = async () => {
            // Serve from cache first — avoids API round-trip on every '/' mount
            try {
                const cached = sessionStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { value, expiresAt } = JSON.parse(cached);
                    if (Date.now() < expiresAt) {
                        setIsQuoteActive(value);
                        return; // cache hit — skip API call
                    }
                }
            } catch (_) { /* ignore malformed cache */ }

            // Cache miss or expired — fetch from API
            try {
                const res = await quoteService.getSettings();
                if (res && res.success && res.data) {
                    const data = res.data;
                    const active = (data.productPage === 'true' || data.productPage === true || data.cartPage === 'true' || data.cartPage === true);
                    setIsQuoteActive(active);
                    try {
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ value: active, expiresAt: Date.now() + CACHE_TTL }));
                    } catch (_) { /* storage quota exceeded — skip caching */ }
                }
            } catch (e) {
                console.error("Error loading quote settings in hub", e);
            }
        };
        checkQuoteStatus();
    }, []);

    const handleTabChange = (selectedTabIndex) => {
        setSelectedTab(selectedTabIndex);
    };

    const extensions = [
        {
            id: 'b2b-registration',
            title: 'B2B registration',
            description: 'Manage registration form & review applications before creating B2B company accounts.',
            status: 'Active',
            tierLabel: 'Free',
            category: 'company-setup',
            colorGrad: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
            mockIcon: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '24px' }}>
                    <div style={{ width: '100%', height: '3px', backgroundColor: '#0284c7', borderRadius: '1px' }} />
                    <div style={{ width: '80%', height: '3px', backgroundColor: '#0284c7', borderRadius: '1px' }} />
                    <div style={{ width: '100%', height: '3px', backgroundColor: '#0284c7', borderRadius: '1px' }} />
                    <div style={{ width: '60%', height: '6px', backgroundColor: '#0369a1', borderRadius: '1px', marginTop: '2px', alignSelf: 'center' }} />
                </div>
            )
        },
        {
            id: 'quote-requests',
            title: 'Quote requests',
            description: 'Manage product & cart quote settings, review proposals, and auto-create Shopify draft orders.',
            status: isQuoteActive ? 'Active' : 'Ready',
            tierLabel: 'Grow+',
            category: 'ordering',
            colorGrad: 'linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%)',
            mockIcon: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                    <div style={{ width: '14px', height: '8px', border: '1.5px solid #455a64', borderRadius: '2px' }} />
                    <div style={{ width: '8px', height: '2px', backgroundColor: '#455a64' }} />
                </div>
            )
        },
        {
            id: 'quick-order-pad',
            title: 'Quick order pad, CSV bulk order & reorder',
            description: 'SKU search grid, CSV bulk upload, and 1-click reorder storefront blocks for wholesale buyers.',
            status: 'Active',
            tierLabel: 'Grow+',
            category: 'ordering',
            colorGrad: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
            mockIcon: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 8px)', gap: '3px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#7e22ce', borderRadius: '1px' }} />
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#9333ea', borderRadius: '1px' }} />
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#a855f7', borderRadius: '1px' }} />
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#c084fc', borderRadius: '1px' }} />
                </div>
            )
        },
        {
            id: 'shopping-lists',
            title: 'Reusable shopping lists',
            description: 'Let buyers save recurring requisition lists, submit for approval, and add all items to cart.',
            status: 'Active',
            tierLabel: 'Advanced+',
            category: 'ordering',
            colorGrad: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
            mockIcon: (
                <div style={{ width: '24px', height: '20px', border: '2px solid #0d9488', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#0d9488' }}>LIST</span>
                </div>
            )
        },
        {
            id: 'users-permissions',
            title: 'Users & permissions',
            description: 'Manage B2B company team members with Admin, Buyer, and Viewer roles.',
            status: 'Active',
            tierLabel: 'Enterprise',
            category: 'company-setup',
            colorGrad: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            mockIcon: (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#15803d', opacity: 0.7 }} />
                </div>
            )
        },
        {
            id: 'credit-finance',
            title: 'Credit limit & finance ledger',
            description: 'Assign wholesale credit limits, Net terms, track balances, and record ledger payments.',
            status: 'Active',
            tierLabel: 'Enterprise',
            category: 'finance-credit',
            colorGrad: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
            mockIcon: (
                <div style={{ width: '26px', height: '16px', borderRadius: '3px', border: '1.5px solid #dc2626', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#dc2626', marginTop: '2px' }} />
                </div>
            )
        }
    ];

    const activeCount = extensions.filter(e => e.status === 'Active').length;
    const tabs = [
        { id: 'all', content: `All extensions (${extensions.length})`, panelID: 'all-content' },
        { id: 'company-setup', content: 'Company setup (2)', panelID: 'company-setup-content' },
        { id: 'ordering', content: 'Ordering (3)', panelID: 'ordering-content' },
        { id: 'finance-credit', content: 'Finance & credit (1)', panelID: 'finance-credit-content' },
        { id: 'active', content: `Active (${activeCount})`, panelID: 'active-content' }
    ];

    const filteredExtensions = extensions.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedTab === 0) return true;
        if (selectedTab === 1 && item.category === 'company-setup') return true;
        if (selectedTab === 2 && item.category === 'ordering') return true;
        if (selectedTab === 3 && item.category === 'finance-credit') return true;
        if (selectedTab === 4 && item.status === 'Active') return true;
        return false;
    });

    if (currentView === 'b2b-registration') {
        return (
            <Suspense fallback={
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <div style={{
                        width: '30px',
                        height: '30px',
                        border: '3px solid rgba(0, 128, 96, 0.15)',
                        borderTop: '3px solid #008060',
                        borderRadius: '50%',
                        animation: 'spin-reg 0.8s linear infinite'
                    }} />
                    <style>{`
                        @keyframes spin-reg {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            }>
                <B2BRegistrationForm onBack={() => { startTransition(() => { setCurrentView('hub'); navigate('/'); }); }} />
            </Suspense>
        );
    }

    return (
        <Page>
            <BlockStack gap="400">
                {/* Title and Description */}
                <div>
                    <Text variant="headingLg" as="h1">B2B extensions hub</Text>
                    <div style={{ marginTop: '4px' }}>
                        <Text variant="bodyMd" tone="subdued">
                            Manage your front-end and back-end B2B processes and provide B2B customers with self-service account capabilities.
                        </Text>
                    </div>
                </div>

                {/* Tabs Navigation & Search Bar */}
                <Card padding="0">
                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e1e3e5', padding: '0 16px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} fitted={false} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                            <div style={{ width: '200px' }}>
                                <TextField
                                    value={searchQuery}
                                    onChange={(val) => setSearchQuery(val)}
                                    prefix={<Icon source={SearchIcon} />}
                                    placeholder="Search"
                                    autoComplete="off"
                                    labelHidden
                                    label="Search"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Extensions List */}
                    <ResourceList
                        resourceName={{ singular: 'extension', plural: 'extensions' }}
                        items={filteredExtensions}
                        renderItem={(item) => {
                            const { id, title, description, status, tierLabel, mockIcon, colorGrad } = item;
                            const isActive = status === 'Active';

                            return (
                                <ResourceItem
                                    id={id}
                                    accessibilityLabel={`View details for ${title}`}
                                    onClick={() => {
                                        if (id === 'b2b-registration') {
                                            startTransition(() => {
                                                setCurrentView('b2b-registration');
                                            });
                                        } else if (id === 'quote-requests') {
                                            navigate('/quotes');
                                        } else if (id === 'quick-order-pad') {
                                            navigate('/ordering');
                                        } else if (id === 'shopping-lists') {
                                            navigate('/shopping-lists');
                                        } else if (id === 'users-permissions') {
                                            navigate('/team-members');
                                        } else if (id === 'credit-finance') {
                                            navigate('/credit-finance');
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            {/* Decorative Mock Icon Box */}
                                            <div style={{
                                                width: '52px',
                                                height: '52px',
                                                background: colorGrad,
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1.5px solid rgba(0, 0, 0, 0.08)',
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.02)'
                                            }}>
                                                {mockIcon}
                                            </div>

                                            <BlockStack gap="050">
                                                <InlineStack align="start" blockAlign="center" gap="100">
                                                    <Text variant="headingSm" as="h3">{title}</Text>
                                                    {tierLabel && (
                                                        <Badge tone="info">{tierLabel}</Badge>
                                                    )}
                                                </InlineStack>
                                                <Text variant="bodyMd" tone="subdued">{description}</Text>
                                            </BlockStack>
                                        </div>

                                        <div>
                                            <Badge tone={isActive ? 'success' : 'subdued'}>{status}</Badge>
                                        </div>
                                    </div>
                                </ResourceItem>
                            );
                        }}
                    />
                </Card>
            </BlockStack>
        </Page>
    );
}
