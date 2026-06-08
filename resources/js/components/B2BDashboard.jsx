import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Page,
  Card,
  Text,
  Layout,
  Button,
  Badge,
  BlockStack,
  InlineStack,
  Grid,
  Box,
  Divider
} from '@shopify/polaris';

export default function B2BDashboard() {
  const navigate = useNavigate();

  return (
    <Page
      title="Welcome to b2bDev,"
      primaryAction={<Button variant="secondary">Help center</Button>}
    >
      <Layout>
        {/* App Embed Status Card */}
        <Layout.Section>
          <Card padding="400">
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Text variant="bodyMd" fontWeight="semibold">
                  b2bDev app embed status
                </Text>
                <Badge tone="success" progress="complete">
                  Enabled
                </Badge>
              </InlineStack>
              <Button disabled>Enable app</Button>
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Setup Guide Card */}
        <Layout.Section>
          <Card padding="500">
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    Setup guide
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Use this personalized guide to set up a B2B registration form and activate B2B quick order extensions on your store.
                  </Text>
                </BlockStack>
                <Badge tone="attention" progress="partiallyComplete">
                  2 / 3 completed
                </Badge>
              </InlineStack>

              <Divider />

              {/* Checklist Items */}
              <BlockStack gap="400">
                {/* Step 1: Set up B2B Company Registration form */}
                <div 
                  onClick={() => navigate('/b2b-register')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f2f4'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ color: '#008060', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <Text variant="bodyMd" fontWeight="semibold">
                    Set up B2B Company Registration form
                  </Text>
                  <span style={{ color: '#008060', fontSize: '12px', marginLeft: 'auto', fontWeight: '500' }}>Click to configure</span>
                </div>

                {/* Step 2: Enable theme app extensions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
                  <div style={{ color: '#008060', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <Text variant="bodyMd" fontWeight="semibold">
                    Enable theme app extensions
                  </Text>
                </div>

                {/* Step 3: Explore all B2B extensions in Customer Account */}
                <div style={{ padding: '8px' }}>
                  <BlockStack gap="300">
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        border: '2px solid #8c9196', 
                        boxSizing: 'border-box' 
                      }} />
                      <Text variant="bodyMd" fontWeight="semibold">
                        Explore all B2B extensions in Customer Account
                      </Text>
                      <Badge tone="info" progress="complete">
                        Shopify's latest update
                      </Badge>
                    </InlineStack>
                    <div style={{ paddingLeft: '32px' }}>
                      <BlockStack gap="200" align="start">
                        <Text variant="bodySm" tone="subdued">
                          Allow B2B customers to bulk order by uploading CSV file, quick order by inputting a list of SKUs & quantities, and so much more.
                        </Text>
                        <Button size="medium" variant="secondary">
                          Explore all extensions
                        </Button>
                      </BlockStack>
                    </div>
                  </BlockStack>
                </div>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Tutorials Section */}
        <Layout.Section>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">
              Tutorials
            </Text>
            <Grid>
              {/* Tutorial 1 */}
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                <Card padding="0">
                  <Box 
                    style={{ 
                      height: '120px', 
                      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px'
                    }} 
                  />
                  <Box padding="400">
                    <BlockStack gap="200" align="start">
                      <Badge tone="attention">Storefront</Badge>
                      <Text variant="headingSm" as="h3">
                        Display B2B/Wholesale registration form
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
              </Grid.Cell>

              {/* Tutorial 2 */}
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                <Card padding="0">
                  <Box 
                    style={{ 
                      height: '120px', 
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px'
                    }} 
                  />
                  <Box padding="400">
                    <BlockStack gap="200" align="start">
                      <Badge tone="info">Customer account</Badge>
                      <Text variant="headingSm" as="h3">
                        Add Quick order with SKUs page
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
              </Grid.Cell>

              {/* Tutorial 3 */}
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                <Card padding="0">
                  <Box 
                    style={{ 
                      height: '120px', 
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px'
                    }} 
                  />
                  <Box padding="400">
                    <BlockStack gap="200" align="start">
                      <Badge tone="info">Customer account</Badge>
                      <Text variant="headingSm" as="h3">
                        Add Quick order with CSV Upload
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
              </Grid.Cell>
            </Grid>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

