import React from 'react';
import {
  Page,
  Card,
  Text,
  Layout,
} from '@shopify/polaris';

export default function B2BDashboard() {
  return (
    <Page title="B2B Dashboard" subtitle="Overview of B2B activity">
      <Layout>
        <Layout.Section>
          <Card title="Statistics" sectioned>
            <Text variant="bodyMd">Add your key metrics here.</Text>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card title="Recent Applications" sectioned>
            <Text variant="bodyMd">List recent registrations here.</Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
