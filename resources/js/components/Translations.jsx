import React, { useState } from 'react';
import {
  Page,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Divider,
  Icon
} from '@shopify/polaris';

export default function Translations() {
  const [activeSubTab, setActiveSubTab] = useState('registration');

  const subTabs = [
    { id: 'registration', label: 'Registration form' },
    { id: 'csv', label: 'CSV Upload' },
    { id: 'bulk', label: 'Bulk add SKUs' },
    { id: 'members', label: 'Members and roles' },
    { id: 'list', label: 'Shopping list' },
    { id: 'quotation', label: 'Quotation' },
    { id: 'more', label: 'More views ▾' }
  ];

  return (
    <Page title="Content & Translation">
      <BlockStack gap="400">
        {/* Top Market Row */}
        <Card padding="400">
          <InlineStack align="start" blockAlign="center" gap="300">
            <InlineStack gap="100" blockAlign="center">
              <Text variant="headingSm" as="span">English</Text>
              <span style={{
                fontSize: '11px',
                background: '#e4e6e7',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '500',
                color: '#4a4a4a'
              }}>Default</span>
            </InlineStack>

            <span style={{ color: '#8c9196', fontSize: '16px' }}>➔</span>

            <div style={{
              background: '#f6f6f7',
              border: '1px solid #d2d5d8',
              borderRadius: '6px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#6d7175',
              cursor: 'pointer'
            }}>
              <span>No locale found</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </InlineStack>
        </Card>

        {/* Translation Inner Navigation & Main Workspace */}
        <Card padding="600">
          <BlockStack gap="500">
            {/* Horizontal Sub-Tabs */}
            <div style={{
              display: 'flex',
              gap: '24px',
              borderBottom: '1px solid #e1e3e5',
              paddingBottom: '8px',
              overflowX: 'auto'
            }}>
              {subTabs.map(tab => {
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: '8px 0',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: isActive ? '#008060' : '#6d7175',
                      fontWeight: isActive ? '600' : '400',
                      borderBottom: isActive ? '2px solid #008060' : '2px solid transparent',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Centered Empty State illustration & CTA */}
            <Box paddingY="1200" style={{ textAlign: 'center' }}>
              <BlockStack gap="500" align="center">
                
                {/* SVG Illustration resembling the screenshot */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '160px',
                    height: '160px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Background decoration circles */}
                    <div style={{
                      position: 'absolute',
                      width: '140px',
                      height: '140px',
                      borderRadius: '50%',
                      background: '#f1f8f5',
                      zIndex: 1
                    }} />
                    <div style={{
                      position: 'absolute',
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      border: '2px dashed #a3e0c7',
                      zIndex: 2,
                      animation: 'spin 40s linear infinite'
                    }} />
                    
                    {/* Center Arrows */}
                    <div style={{
                      zIndex: 4,
                      background: '#008060',
                      color: '#ffffff',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(0, 128, 96, 0.3)'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '22px', height: '22px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>

                    {/* Left Card Placeholder */}
                    <div style={{
                      position: 'absolute',
                      left: '10px',
                      top: '40px',
                      width: '48px',
                      height: '52px',
                      background: '#ffffff',
                      border: '1px solid #d2d5d8',
                      borderRadius: '6px',
                      zIndex: 3,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ width: '100%', height: '3px', background: '#e1e3e5' }} />
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8c9196' }}>A</div>
                      <div style={{
                        fontSize: '9px',
                        background: '#f6f6f7',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        color: '#6d7175'
                      }}>6</div>
                    </div>

                    {/* Right Card Placeholder */}
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '40px',
                      width: '48px',
                      height: '52px',
                      background: '#ffffff',
                      border: '1px solid #d2d5d8',
                      borderRadius: '6px',
                      zIndex: 3,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ width: '100%', height: '3px', background: '#008060' }} />
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#008060' }}>文</div>
                      <div style={{
                        fontSize: '9px',
                        background: '#f1f8f5',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        color: '#008060'
                      }}>4</div>
                    </div>
                  </div>
                </div>

                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">
                    Translate and manage content for each market
                  </Text>
                  <Text variant="bodyMd" tone="subdued">
                    Manage language translation, custom content for each market.
                  </Text>
                </BlockStack>

                <Box marginTop="200">
                  <Button variant="primary" size="large">Add language</Button>
                </Box>
              </BlockStack>
            </Box>
          </BlockStack>
        </Card>
      </BlockStack>
      
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Page>
  );
}
