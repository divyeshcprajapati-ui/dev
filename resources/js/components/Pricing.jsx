import React, { useState, useEffect } from 'react';
import {
    Page,
    Text,
    Button,
    BlockStack,
    InlineStack,
    Box,
    Badge,
    Divider
} from '@shopify/polaris';
import { registrationService } from '../services/registrationService';

export default function Pricing() {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [modules, setModules] = useState([]);
    const [checkedModules, setCheckedModules] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchPricing = async () => {
        setLoading(true);
        try {
            const response = await registrationService.getSubscriptions();
            const data = response && response.success ? response.data : (Array.isArray(response) ? response : []);
            setModules(data);

            const initialChecked = {};
            data.forEach(mod => {
                initialChecked[mod.subscription_key] = true;
            });
            setCheckedModules(initialChecked);
        } catch (err) {
            console.error("Failed to load pricing subscriptions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPricing();
    }, []);

    const handleToggle = (key) => {
        setCheckedModules(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Filter modules by plan
    const freeModules = modules.filter(m => m.plan_type === 'free');
    const growModules = modules.filter(m => m.plan_type === 'grow');
    const advModules = modules.filter(m => m.plan_type === 'advanced');
    const plusModules = modules.filter(m => m.plan_type === 'plus');

    // Sum prices
    const activeGrowSum = growModules
        .filter(m => checkedModules[m.subscription_key])
        .reduce((sum, m) => sum + Number(m.price), 0);

    const activeAdvSum = advModules
        .filter(m => checkedModules[m.subscription_key])
        .reduce((sum, m) => sum + Number(m.price), 0);

    const activePlusSum = plusModules
        .filter(m => checkedModules[m.subscription_key])
        .reduce((sum, m) => sum + Number(m.price), 0);

    // Annual conversion (20% discount)
    const annualGrowPrice = activeGrowSum * 0.8;
    const annualAdvPrice = activeAdvSum * 0.8;
    const annualPlusPrice = activePlusSum * 0.8;

    if (loading) {
        return (
            <Page title="Pricing">
                <Box padding="1000" style={{ textAlign: 'center' }}>
                    <div className="pricing-loader" style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(0, 128, 96, 0.15)',
                        borderTop: '3px solid #008060',
                        borderRadius: '50%',
                        margin: '100px auto 20px',
                        animation: 'spin-pricing 0.8s linear infinite'
                    }} />
                    <Text variant="headingMd">Loading pricing plans...</Text>
                    <style>{`
                        @keyframes spin-pricing {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </Box>
            </Page>
        );
    }

    return (
        <Page>
            {/* Fonts & Styling Injector */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
                
                .pricing-container {
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                    background-color: #f6f8fa;
                    padding: 24px 0 40px;
                    border-radius: 12px;
                }

                .plan-card {
                    background-color: white;
                    border-radius: 16px;
                    border: 1px solid #e1e3e5;
                    padding: 32px 24px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    box-sizing: border-box;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
                    position: relative;
                }

                .plan-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
                    border-color: #008060;
                }

                .plan-card.highlighted {
                    border: 2px solid #008060;
                    box-shadow: 0 10px 25px rgba(0, 128, 96, 0.05);
                }

                .plan-card.highlighted:hover {
                    box-shadow: 0 16px 36px rgba(0, 128, 96, 0.12);
                }

                .popular-badge {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #008060 0%, #004b35 100%);
                    color: white;
                    padding: 4px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    fontWeight: 600;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 10px rgba(0, 128, 96, 0.2);
                }

                .plan-price {
                    font-size: 36px;
                    font-weight: 700;
                    color: #1a1a1a;
                    display: flex;
                    align-items: baseline;
                    gap: 4px;
                }

                .feature-list {
                    margin-top: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .feature-item-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    font-size: 14.5px;
                    color: #4a4a4a;
                    line-height: 1.4;
                }

                .checkmark-icon {
                    color: #008060;
                    font-weight: bold;
                    flex-shrink: 0;
                    font-size: 16px;
                }

                .interactive-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    padding: 8px 12px;
                    border-radius: 8px;
                    background-color: #f9fbf9;
                    border: 1px solid #f0f3f0;
                    transition: all 0.2s;
                    font-size: 14px;
                }

                .interactive-row:hover {
                    background-color: #f1f7f3;
                    border-color: #d1ebd8;
                    transform: scale(1.02);
                }

                .interactive-row.selected {
                    background-color: rgba(0, 128, 96, 0.05);
                    border-color: rgba(0, 128, 96, 0.15);
                }
            `}</style>

            <div className="pricing-container">
                <BlockStack gap="600">
                    {/* Header title */}
                    <Box padding="300" style={{ textAlign: 'center' }}>
                        <Text variant="headingXl" as="h1" fontWeight="bold">Sleek Pricing Estimates</Text>
                        <div style={{ marginTop: '8px' }}>
                            <Text variant="bodyMd" tone="subdued">
                                Choose modules to build your tailored wholesale workflow with transparent rates.
                            </Text>
                        </div>
                    </Box>

                    {/* Billing Cycle Switcher */}
                    <Box style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            display: 'inline-flex',
                            backgroundColor: '#eaecee',
                            padding: '4px',
                            borderRadius: '24px',
                            gap: '4px',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
                        }}>
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                style={{
                                    border: 'none',
                                    padding: '10px 28px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: billingCycle === 'monthly' ? 'white' : 'transparent',
                                    color: billingCycle === 'monthly' ? '#1a1a1a' : '#6d7175',
                                    boxShadow: billingCycle === 'monthly' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('annually')}
                                style={{
                                    border: 'none',
                                    padding: '10px 28px',
                                    borderRadius: '20px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: billingCycle === 'annually' ? 'white' : 'transparent',
                                    color: billingCycle === 'annually' ? '#1a1a1a' : '#6d7175',
                                    boxShadow: billingCycle === 'annually' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Annually (Save 20%)
                            </button>
                        </div>
                    </Box>

                    {/* Plan Cards Grid using Flexbox to avoid squishing */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '24px',
                        padding: '0 24px',
                        justifyContent: 'center'
                    }}>
                        {/* Plan 1: Free */}
                        <div style={{ flex: '1 1 270px', maxWidth: '320px' }}>
                            <div className="plan-card">
                                <BlockStack gap="400">
                                    <div>
                                        <Text variant="headingMd" as="h3" tone="subdued">Free Modules</Text>
                                        <div className="plan-price" style={{ margin: '16px 0' }}>
                                            <span>Free</span>
                                        </div>
                                    </div>

                                    <Divider />

                                    <div className="feature-list">
                                        <Text variant="headingSm" as="h4" fontWeight="semibold">Included Features</Text>
                                        {freeModules.map(m => (
                                            <div className="feature-item-row" key={m.id}>
                                                <span className="checkmark-icon">✓</span>
                                                <span>{m.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </BlockStack>

                                <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
                                    <Button size="large" fullWidth disabled>Active Plan</Button>
                                </div>
                            </div>
                        </div>

                        {/* Plan 2: Grow */}
                        <div style={{ flex: '1 1 270px', maxWidth: '320px' }}>
                            <div className="plan-card">
                                <BlockStack gap="400">
                                    <div>
                                        <Text variant="headingMd" as="h3">Grow Plan</Text>
                                        <div className="plan-price" style={{ margin: '16px 0 8px 0' }}>
                                            <span>${billingCycle === 'monthly' ? activeGrowSum : annualGrowPrice.toFixed(0)}</span>
                                            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6d7175' }}>
                                                /mo
                                            </span>
                                        </div>
                                        {billingCycle === 'annually' && (
                                            <Badge tone="success" progress="complete">Save 20%</Badge>
                                        )}
                                    </div>

                                    <Text variant="bodySm" tone="subdued">
                                        Customize your workspace by toggling B2B Grow modules below.
                                    </Text>

                                    <Divider />

                                    <BlockStack gap="200">
                                        <Text variant="headingSm" as="h4" fontWeight="semibold">Select Modules</Text>
                                        
                                        {growModules.map(m => (
                                            <div 
                                                key={m.id}
                                                className={`interactive-row ${checkedModules[m.subscription_key] ? 'selected' : ''}`}
                                                onClick={() => handleToggle(m.subscription_key)}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!checkedModules[m.subscription_key]}
                                                    readOnly 
                                                    style={{ cursor: 'pointer', accentColor: '#008060' }}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '500' }}>{m.name}</span>
                                                    <span style={{ fontSize: '12px', color: '#008060' }}>+${Math.round(m.price)}/mo</span>
                                                </div>
                                            </div>
                                        ))}
                                    </BlockStack>
                                </BlockStack>

                                <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
                                    <Button size="large" variant="primary" fullWidth onClick={() => alert("Redirecting to select Grow plan...")}>
                                        Start Grow Trial
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Plan 3: Advanced */}
                        <div style={{ flex: '1 1 270px', maxWidth: '320px' }}>
                            <div className="plan-card highlighted">
                                <div className="popular-badge">MOST POPULAR</div>
                                
                                <BlockStack gap="400">
                                    <div>
                                        <Text variant="headingMd" as="h3">Advanced Plan</Text>
                                        <div className="plan-price" style={{ margin: '16px 0 8px 0' }}>
                                            <span>${billingCycle === 'monthly' ? activeAdvSum : annualAdvPrice.toFixed(0)}</span>
                                            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6d7175' }}>
                                                /mo
                                            </span>
                                        </div>
                                        {billingCycle === 'annually' && (
                                            <Badge tone="success" progress="complete">Save 20%</Badge>
                                        )}
                                    </div>

                                    <Text variant="bodySm" tone="subdued">
                                        Empower larger teams with custom modules and dedicated support channels.
                                    </Text>

                                    <Divider />

                                    <BlockStack gap="200">
                                        <Text variant="headingSm" as="h4" fontWeight="semibold">Select Modules</Text>
                                        
                                        {advModules.map(m => (
                                            <div 
                                                key={m.id}
                                                className={`interactive-row ${checkedModules[m.subscription_key] ? 'selected' : ''}`}
                                                onClick={() => handleToggle(m.subscription_key)}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!checkedModules[m.subscription_key]}
                                                    readOnly 
                                                    style={{ cursor: 'pointer', accentColor: '#008060' }}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '500' }}>{m.name}</span>
                                                    <span style={{ fontSize: '12px', color: '#008060' }}>+${Math.round(m.price)}/mo</span>
                                                </div>
                                            </div>
                                        ))}
                                    </BlockStack>
                                </BlockStack>

                                <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
                                    <Button size="large" variant="primary" tone="success" fullWidth onClick={() => alert("Redirecting to select Advanced plan...")}>
                                        Start Advanced Trial
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Plan 4: Shopify Plus */}
                        <div style={{ flex: '1 1 270px', maxWidth: '320px' }}>
                            <div className="plan-card">
                                <BlockStack gap="400">
                                    <div>
                                        <Text variant="headingMd" as="h3">Shopify Plus</Text>
                                        <div className="plan-price" style={{ margin: '16px 0 8px 0' }}>
                                            <span>${billingCycle === 'monthly' ? activePlusSum : annualPlusPrice.toFixed(0)}</span>
                                            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6d7175' }}>
                                                /mo
                                            </span>
                                        </div>
                                        {billingCycle === 'annually' && (
                                            <Badge tone="success" progress="complete">Save 20%</Badge>
                                        )}
                                    </div>

                                    <Text variant="bodySm" tone="subdued">
                                        Enterprise grade performance, custom fields, and an account manager.
                                    </Text>

                                    <Divider />

                                    <BlockStack gap="200">
                                        <Text variant="headingSm" as="h4" fontWeight="semibold">Select Modules</Text>
                                        
                                        {plusModules.map(m => (
                                            <div 
                                                key={m.id}
                                                className={`interactive-row ${checkedModules[m.subscription_key] ? 'selected' : ''}`}
                                                onClick={() => handleToggle(m.subscription_key)}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!checkedModules[m.subscription_key]}
                                                    readOnly 
                                                    style={{ cursor: 'pointer', accentColor: '#008060' }}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '500' }}>{m.name}</span>
                                                    <span style={{ fontSize: '12px', color: '#008060' }}>+${Math.round(m.price)}/mo</span>
                                                </div>
                                            </div>
                                        ))}
                                    </BlockStack>
                                </BlockStack>

                                <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
                                    <Button size="large" variant="primary" fullWidth onClick={() => alert("Redirecting to select Plus plan...")}>
                                        Start Plus Trial
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer Footer */}
                    <Box padding="300" style={{ textAlign: 'center' }}>
                        <Text variant="bodySm" tone="subdued">
                            All charges are billed in USD. Recurring and usage-based charges are billed every 30 days. See all pricing options
                        </Text>
                    </Box>
                </BlockStack>
            </div>
        </Page>
    );
}
