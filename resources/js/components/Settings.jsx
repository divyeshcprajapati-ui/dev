import React from 'react';
import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';

export default function Settings() {
  return (
    <Page title="Settings">
      <Layout>
        <Layout.Section>
          <Card padding="400">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                App Settings
              </Text>
              <Text as="p" color="subdued">
                Configure your app preferences here.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
