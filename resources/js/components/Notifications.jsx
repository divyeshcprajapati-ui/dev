import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Divider,
  Icon,
  Badge
} from '@shopify/polaris';
import { registrationService } from '../services/registrationService';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('submission');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch notification settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await registrationService.getNotificationSettings();
      const data = response && response.success ? response.data : [];
      // Map to an object for easy lookup: { [key]: boolean }
      const settingsMap = {};
      data.forEach(item => {
        settingsMap[item.setting_key] = !!item.is_enabled;
      });
      setSettings(settingsMap);
    } catch (err) {
      console.error('Failed to load notification settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async (key) => {
    const newValue = !settings[key];
    setUpdatingKey(key);
    
    // Optimistic UI update
    setSettings(prev => ({ ...prev, [key]: newValue }));

    try {
      const res = await registrationService.updateNotificationSetting(key, newValue);
      if (res && res.success) {
        showToast('Settings saved successfully.');
      } else {
        // Rollback on failure
        setSettings(prev => ({ ...prev, [key]: !newValue }));
        showToast('Failed to save settings. Please try again.');
      }
    } catch (err) {
      console.error('Error updating notification setting:', err);
      // Rollback on failure
      setSettings(prev => ({ ...prev, [key]: !newValue }));
      showToast('Error saving settings.');
    } finally {
      setUpdatingKey(null);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Tabs structure
  const tabs = [
    {
      id: 'submission',
      label: 'B2B Submission',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v10a2 2 0 002 2h10a2 2 0 002-2V5a1 1 0 10-2 0v10H5V5h3a1 1 0 000-2H3z" clipRule="evenodd" />
          <path d="M8 9a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H9a1 1 0 01-1-1z" />
        </svg>
      ),
      description: 'Configure notifications for new account submissions, approvals, and rejections.'
    },
    {
      id: 'quotations',
      label: 'Quotations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      ),
      description: 'Manage email alerts for quote submissions, acceptances, rejections, and auto-responses.'
    },
    {
      id: 'members',
      label: 'Members & permissions',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      ),
      description: 'Receive updates when new company members are added or permissions are updated.'
    },
    {
      id: 'lists',
      label: 'Shopping list',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
      ),
      description: 'Control notifications for shopping lists requiring approval or marked as approved.'
    },
    {
      id: 'credit',
      label: 'Credit limit',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h3a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
      ),
      description: 'Set alerts for low credit limits and notifications for new credit allocations.'
    }
  ];

  if (loading) {
    return (
      <Page title="Notifications">
        <Box padding="1000" style={{ textAlign: 'center' }}>
          <div className="notifications-loader" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(0, 128, 96, 0.15)',
            borderTop: '3px solid #008060',
            borderRadius: '50%',
            margin: '100px auto 20px',
            animation: 'spin-notifications 0.8s linear infinite'
          }} />
          <Text variant="headingMd">Loading notification settings...</Text>
          <style>{`
            @keyframes spin-notifications {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </Box>
      </Page>
    );
  }

  // Active tab settings items mapping
  const tabContent = {
    submission: [
      {
        key: 'b2b_submission_received',
        title: 'New submission received',
        desc: 'Receive an email notification when a new B2B registration form is submitted.',
        recipient: 'Staff email'
      },
      {
        key: 'b2b_submission_approved',
        title: 'B2B application approved',
        desc: 'Send an email notification to the customer when their B2B application is approved.',
        recipient: 'Customer email'
      },
      {
        key: 'b2b_submission_rejected',
        title: 'B2B application rejected',
        desc: 'Send an email notification to the customer when their B2B application is rejected.',
        recipient: 'Customer email'
      }
    ],
    quotations: [
      {
        key: 'quote_submitted',
        title: 'New quote submitted',
        desc: 'Receive an email notification when a quote is submitted by a B2B customer.',
        recipient: 'Staff email'
      },
      {
        key: 'quote_accepted',
        title: 'Quote accepted',
        desc: 'Receive an email notification when a quote is accepted by a customer.',
        recipient: 'Staff email'
      },
      {
        key: 'quote_rejected',
        title: 'Quote rejected',
        desc: 'Receive an email notification when a quote is rejected by a customer.',
        recipient: 'Staff email'
      },
      {
        key: 'quote_requoted',
        title: 'Quote requoted',
        desc: 'Send an email notification to the customer when a staff member requotes a quote.',
        recipient: 'Customer email'
      },
      {
        key: 'quote_auto_response',
        title: 'Quote auto-response',
        desc: 'Automatically send a confirmation email to the customer upon quote submission.',
        recipient: 'Customer email'
      }
    ],
    members: [
      {
        key: 'member_added',
        title: 'New member added',
        desc: 'Send an email notification to the new member when they are added to a B2B company account.',
        recipient: 'Customer email'
      },
      {
        key: 'member_role_updated',
        title: 'Member role updated',
        desc: 'Send an email notification to the member when their role or permissions are modified.',
        recipient: 'Customer email'
      }
    ],
    lists: [
      {
        key: 'list_approved',
        title: 'Shopping list approved',
        desc: 'Send an email notification to the buyer when their shopping list is approved by an administrator.',
        recipient: 'Customer email'
      },
      {
        key: 'list_pending_approval',
        title: 'Shopping list pending approval',
        desc: 'Receive an email notification when a shopping list requires approval from administrators.',
        recipient: 'Staff email'
      }
    ],
    credit: [
      {
        key: 'credit_low_alert',
        title: 'Low credit alert',
        desc: 'Receive an email alert when a customer’s remaining credit balance falls below 10%.',
        recipient: 'Staff email'
      },
      {
        key: 'credit_assigned',
        title: 'Credit limit assigned',
        desc: 'Send an email notification to the customer when a new credit limit is assigned to their account.',
        recipient: 'Customer email'
      }
    ]
  };

  const currentItems = tabContent[activeTab] || [];
  const activeTabMeta = tabs.find(t => t.id === activeTab);

  return (
    <Page title="Notifications" subtitle="Manage email notifications sent to your customers and staff.">
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#303030',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          animation: 'fade-in 0.3s ease'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#008060' }} />
          {toastMessage}
        </div>
      )}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <Layout>
        {/* Left Column Navigation */}
        <Layout.Section variant="oneThird">
          <Card padding="0">
            <Box padding="400">
              <Text variant="headingSm" as="h3" tone="subdued">Categories</Text>
            </Box>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      border: 'none',
                      background: isActive ? 'rgba(0, 128, 96, 0.08)' : 'transparent',
                      color: isActive ? '#008060' : '#202223',
                      borderLeft: isActive ? '3px solid #008060' : '3px solid transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '400',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = '#f6f6f7';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ color: isActive ? '#008060' : '#6d7175', display: 'flex', alignItems: 'center' }}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </Card>
        </Layout.Section>

        {/* Right Column Settings Card */}
        <Layout.Section>
          <Card padding="600">
            <BlockStack gap="400">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    {activeTabMeta ? activeTabMeta.label : ''}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    {activeTabMeta ? activeTabMeta.description : ''}
                  </Text>
                </BlockStack>
              </div>

              <Divider />

              <BlockStack gap="500">
                {currentItems.map((item, index) => {
                  const isEnabled = !!settings[item.key];
                  const isUpdating = updatingKey === item.key;
                  return (
                    <div key={item.key} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      animation: 'fade-in 0.3s ease',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '16px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <InlineStack align="start" blockAlign="center" gap="200">
                            <Text variant="headingSm" as="h4">
                              {item.title}
                            </Text>
                            <Badge tone={item.recipient.includes('Staff') ? 'info' : 'attention'}>
                              {item.recipient}
                            </Badge>
                          </InlineStack>
                          <Box marginTop="100">
                            <Text variant="bodyMd" tone="subdued">
                              {item.desc}
                            </Text>
                          </Box>
                        </div>
                        <div>
                          {/* Toggle Switch design */}
                          <button
                            onClick={() => !isUpdating && handleToggle(item.key)}
                            disabled={isUpdating}
                            style={{
                              width: '46px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: isEnabled ? '#008060' : '#e4e6e7',
                              border: 'none',
                              position: 'relative',
                              cursor: isUpdating ? 'not-allowed' : 'pointer',
                              transition: 'background-color 0.2s ease',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              opacity: isUpdating ? 0.6 : 1
                            }}
                          >
                            <span style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              position: 'absolute',
                              left: isEnabled ? '24px' : '4px',
                              transition: 'left 0.2s cubic-bezier(0.85, 0, 0.15, 1)',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)'
                            }} />
                          </button>
                        </div>
                      </div>
                      {index < currentItems.length - 1 && <Divider />}
                    </div>
                  );
                })}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
