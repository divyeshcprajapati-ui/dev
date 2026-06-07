import React, { useState } from 'react';
import {
    Page,
    Layout,
    Card,
    Tabs,
    ResourceList,
    ResourceItem,
    Badge,
    Text,
    Icon,
    Box,
    InlineStack,
    BlockStack,
    TextField
} from '@shopify/polaris';
import {
    SearchIcon,
    ClipboardIcon,
    CreditCardIcon,
    SettingsIcon,
    TeamIcon,
    CashDollarIcon
} from '@shopify/polaris-icons';
import B2BRegistrationForm from './B2BRegistrationForm';

export default function B2BExtensionsHub() {
    const [selectedTab, setSelectedTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentView, setCurrentView] = useState('hub');

    const handleTabChange = (selectedTabIndex) => {
        setSelectedTab(selectedTabIndex);
    };

    const tabs = [
        {
            id: 'all-extensions',
            content: 'All extensions (8)',
            accessibilityLabel: 'All extensions',
            panelID: 'all-extensions-content',
        },
        {
            id: 'company-setup',
            content: 'Company setup (2)',
            panelID: 'company-setup-content',
        },
        {
            id: 'ordering',
            content: 'Ordering (4)',
            panelID: 'ordering-content',
        },
        {
            id: 'finance-credit',
            content: 'Finance & credit (2)',
            panelID: 'finance-credit-content',
        },
        {
            id: 'active',
            content: 'Active (1)',
            panelID: 'active-content',
        },
    ];

    const extensions = [
        {
            id: 'b2b-registration',
            title: 'B2B registration',
            description: 'Manage registration form & review applications before creating B2B company account.',
            status: 'Inactive',
            isPlus: false,
            category: 'company-setup',
            icon: ClipboardIcon,
            iconBg: '#f0f4f9',
            iconColor: '#3a77ff'
        },
        {
            id: 'credit-limit',
            title: 'Credit limit',
            description: 'Manage B2B credit accounts, track outstanding balances across your B2B clients.',
            status: 'Inactive',
            isPlus: true,
            category: 'finance-credit',
            icon: CreditCardIcon,
            iconBg: '#fff5f5',
            iconColor: '#ff4d4f'
        },
        {
            id: 'finance-payment',
            title: 'Finance & payment',
            description: 'Let buyers view and manage financial record for their purchases, payments and financial ledger.',
            status: 'Inactive',
            isPlus: false,
            category: 'finance-credit',
            icon: CashDollarIcon,
            iconBg: '#f6ffed',
            iconColor: '#52c41a'
        },
        {
            id: 'users-permissions',
            title: 'Users & permissions',
            description: 'Let buyers manage their own team members with roles & permissions.',
            status: 'Inactive',
            isPlus: true,
            category: 'company-setup',
            icon: TeamIcon,
            iconBg: '#e6f7ff',
            iconColor: '#1890ff'
        }
    ];

    // Simple filtering based on tab selection
    const filteredExtensions = extensions.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        
        if (selectedTab === 0) return true; // All
        if (selectedTab === 1 && item.category === 'company-setup') return true;
        if (selectedTab === 3 && item.category === 'finance-credit') return true;
        // Mock tabs: Ordering (2) is empty, Active (4) matches active status (none in our demo)
        return false;
    });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f2f4' }}>
            {/* Simulated Shopify Admin Sidebar */}
            <div style={{
                width: '240px',
                backgroundColor: '#ebebeb',
                borderRight: '1px solid #dcdcdc',
                display: 'flex',
                flexDirection: 'column',
                fontSize: '13px',
                color: '#303030',
                padding: '12px 0'
            }}>
                <div style={{ padding: '0 20px 12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                    }}>S</div>
                    <Text variant="headingSm" as="span">shopify</Text>
                </div>
                
                {/* Main Nav Items */}
                <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {['Home', 'Orders', 'Products', 'Customers', 'Marketing', 'Discounts', 'Content', 'Markets', 'Finance', 'Analytics'].map(item => (
                        <div key={item} style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}>{item}</div>
                    ))}
                </div>

                <div style={{ padding: '8px 20px', fontSize: '11px', color: '#6d6d6d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sales channels</div>
                <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Online Store</div>
                    <div style={{ padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Agentic</div>
                </div>

                <div style={{ padding: '8px 20px', fontSize: '11px', color: '#6d6d6d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Apps</div>
                <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ padding: '6px 12px', borderRadius: '4px', backgroundColor: '#dfdfdf', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px' }}>😊</span> Duos B2B
                    </div>
                    {/* App Subnavigation */}
                    <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid #dcdcdc', marginLeft: '20px', marginTop: '4px' }}>
                        <div style={{ padding: '4px 12px', borderRadius: '4px', backgroundColor: '#d0d0d0', fontWeight: '600', cursor: 'pointer' }}>B2B extensions</div>
                        <div style={{ padding: '4px 12px', borderRadius: '4px', color: '#616161', cursor: 'pointer' }}>Notifications</div>
                        <div style={{ padding: '4px 12px', borderRadius: '4px', color: '#616161', cursor: 'pointer' }}>Translations</div>
                        <div style={{ padding: '4px 12px', borderRadius: '4px', color: '#616161', cursor: 'pointer' }}>Pricing</div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', padding: '4px 8px' }}>
                    <div style={{ padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Icon source={SettingsIcon} tone="secondary" /> Settings
                    </div>
                </div>
            </div>

            {/* Main Application Area */}
            <div style={{ flex: 1, padding: '24px 32px' }}>
                {currentView === 'b2b-registration' ? (
                    <B2BRegistrationForm onBack={() => setCurrentView('hub')} />
                ) : (
                    <Page
                        title="Duos B2B"
                        subtitle="B2B extensions hub"
                        backAction={{ content: 'Apps', url: '#' }}
                    >
                        <BlockStack gap="400">
                            {/* Title and Description */}
                            <div style={{ marginBottom: '12px' }}>
                                <Text variant="headingLg" as="h1">B2B extensions hub</Text>
                                <div style={{ marginTop: '4px' }}>
                                    <Text variant="bodyMd" tone="subdued">
                                        Manage your front-end and back-end B2B processes and provide B2B customers with self-service account capabilities.
                                    </Text>
                                </div>
                            </div>

                            {/* Tabs Navigation & Search */}
                            <Card padding="0">
                                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e1e3e5', paddingRight: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} fitted={false} />
                                    </div>
                                    <div style={{ width: '240px' }}>
                                        <TextField
                                            value={searchQuery}
                                            onChange={(val) => setSearchQuery(val)}
                                            prefix={<Icon source={SearchIcon} />}
                                            placeholder="Search extensions..."
                                            autoComplete="off"
                                            labelHidden
                                            label="Search"
                                        />
                                    </div>
                                </div>

                                {/* Extensions List */}
                                <ResourceList
                                    resourceName={{ singular: 'extension', plural: 'extensions' }}
                                    items={filteredExtensions}
                                    renderItem={(item) => {
                                        const { id, title, description, status, isPlus, icon, iconBg, iconColor } = item;
                                        return (
                                            <ResourceItem
                                                id={id}
                                                accessibilityLabel={`View details for ${title}`}
                                                onClick={() => {
                                                    if (id === 'b2b-registration') {
                                                        setCurrentView('b2b-registration');
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        {/* Decorative Icon */}
                                                        <div style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            backgroundColor: iconBg,
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: '1px solid #e1e3e5'
                                                        }}>
                                                            <span style={{ color: iconColor, display: 'flex', alignItems: 'center' }}>
                                                                <Icon source={icon} />
                                                            </span>
                                                        </div>

                                                        <BlockStack gap="050">
                                                            <InlineStack align="start" blockAlign="center" gap="150">
                                                                <Text variant="headingSm" as="h3">{title}</Text>
                                                                {isPlus && (
                                                                    <Badge tone="info" progress="complete">Plus</Badge>
                                                                )}
                                                            </InlineStack>
                                                            <Text variant="bodyMd" tone="subdued">{description}</Text>
                                                        </BlockStack>
                                                    </div>

                                                    <div>
                                                        <Badge tone="attention">{status}</Badge>
                                                    </div>
                                                </div>
                                            </ResourceItem>
                                        );
                                    }}
                                />
                            </Card>
                        </BlockStack>
                    </Page>
                )}
            </div>
        </div>
    );
}
