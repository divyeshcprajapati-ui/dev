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
import { SearchIcon, FilterIcon } from '@shopify/polaris-icons';

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

    const tabs = [
        { id: 'all', content: 'All extensions (8)', panelID: 'all-content' },
        { id: 'company-setup', content: 'Company setup (2)', panelID: 'company-setup-content' },
        { id: 'ordering', content: 'Ordering (4)', panelID: 'ordering-content' },
        { id: 'finance-credit', content: 'Finance & credit (2)', panelID: 'finance-credit-content' },
        { id: 'active', content: 'Active (2)', panelID: 'active-content' }
    ];

    const extensions = [
        {
            id: 'b2b-registration',
            title: 'B2B registration',
            description: 'Manage registration form & review applications before creating B2B company account.',
            status: 'Active',
            isPlus: false,
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
            id: 'credit-limit',
            title: 'Credit limit',
            description: 'Manage B2B credit accounts, track outstanding balances across your B2B clients.',
            status: 'Inactive',
            isPlus: true,
            category: 'finance-credit',
            colorGrad: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
            mockIcon: (
                <div style={{ width: '26px', height: '16px', borderRadius: '3px', border: '1.5px solid #dc2626', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#dc2626', marginTop: '2px' }} />
                    <div style={{ width: '4px', height: '2px', backgroundColor: '#ef4444', position: 'absolute', bottom: '2px', left: '2px' }} />
                </div>
            )
        },
        {
            id: 'finance-payment',
            title: 'Finance & payment',
            description: 'Let buyers view and manage financial record for their purchases, payments and financial ledger.',
            status: 'Inactive',
            isPlus: false,
            category: 'finance-credit',
            colorGrad: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
            mockIcon: (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '20px', width: '20px' }}>
                    <div style={{ width: '4px', height: '8px', backgroundColor: '#ca8a04', borderRadius: '1px' }} />
                    <div style={{ width: '4px', height: '14px', backgroundColor: '#ca8a04', borderRadius: '1px' }} />
                    <div style={{ width: '4px', height: '18px', backgroundColor: '#eab308', borderRadius: '1px' }} />
                </div>
            )
        },
        {
            id: 'users-permissions',
            title: 'Users & permissions',
            description: 'Let buyers manage their own team members with roles & permissions.',
            status: 'Inactive',
            isPlus: true,
            category: 'company-setup',
            colorGrad: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            mockIcon: (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                        <div style={{ width: '12px', height: '6px', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', backgroundColor: '#16a34a' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.7 }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#15803d' }} />
                        <div style={{ width: '10px', height: '5px', borderTopLeftRadius: '3px', borderTopRightRadius: '3px', backgroundColor: '#15803d' }} />
                    </div>
                </div>
            )
        },
        {
            id: 'quick-order-pad',
            title: 'Quick order pad',
            description: 'Provide B2B buyers with a quick grid format to enter SKU and quantities directly.',
            status: 'Inactive',
            isPlus: false,
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
            id: 'reorder-page',
            title: 'Reorder page',
            description: 'Enable B2B clients to reorder previously purchased items in a single click.',
            status: 'Inactive',
            isPlus: false,
            category: 'ordering',
            colorGrad: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
            mockIcon: (
                <div style={{ width: '22px', height: '22px', border: '2px solid #ea580c', borderRadius: '50%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '0', height: '0', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid #ea580c', position: 'absolute', top: '-2px', right: '4px', transform: 'rotate(-30deg)' }} />
                </div>
            )
        },
        {
            id: 'csv-upload-order',
            title: 'CSV upload order',
            description: 'Allows wholesale buyers to upload large order sheets via CSV for instant cart generation.',
            status: 'Inactive',
            isPlus: false,
            category: 'ordering',
            colorGrad: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
            mockIcon: (
                <div style={{ width: '18px', height: '20px', border: '2px solid #0d9488', borderRadius: '2px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#0d9488' }}>CSV</span>
                </div>
            )
        },
        {
            id: 'quote-requests',
            title: 'Quote requests',
            description: 'Manage your quote settings and review all quote submissions.',
            status: isQuoteActive ? 'Active' : 'Inactive',
            isPlus: false,
            category: 'ordering',
            colorGrad: 'linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%)',
            mockIcon: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                    <div style={{ width: '14px', height: '8px', border: '1.5px solid #455a64', borderRadius: '2px' }} />
                    <div style={{ width: '8px', height: '2px', backgroundColor: '#455a64' }} />
                </div>
            )
        }
    ];

    const filteredExtensions = extensions.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        if (selectedTab === 0) return true; // All
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
                            <div style={{ width: '180px' }}>
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
                            <div style={{
                                width: '36px',
                                height: '36px',
                                border: '1px solid #c9cccf',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: 'white'
                            }}>
                                <Icon source={FilterIcon} />
                            </div>
                        </div>
                    </div>

                    {/* Extensions List */}
                    <ResourceList
                        resourceName={{ singular: 'extension', plural: 'extensions' }}
                        items={filteredExtensions}
                        renderItem={(item) => {
                            const { id, title, description, status, isPlus, mockIcon, colorGrad } = item;
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
                                                    {isPlus && (
                                                        <Badge tone="info" progress="complete">Plus</Badge>
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
