import React, { useState } from 'react';
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  Banner,
  Badge,
  DataTable,
  Divider,
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { b2bSuiteService } from '../services/b2bSuiteService';

export default function OrderingTools() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleTestSkuLookup = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await b2bSuiteService.searchCatalog(searchTerm.trim());
      if (res?.success) {
        setResults(res.data || []);
      } else {
        setError({ message: res?.message || 'Search failed.' });
      }
    } catch (err) {
      setError({
        message: err?.message || 'Unable to search catalog.',
        requiresUpgrade: err?.status === 403,
      });
    } finally {
      setSearching(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = 'sku,quantity\nSKU-001,10\nSKU-002,25\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'b2b-bulk-order-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tableRows = results.map((item) => [
    item.sku || '—',
    item.product_title,
    `$${Number(item.price || 0).toFixed(2)}`,
    String(item.inventory_quantity ?? 0),
    item.variant_id,
  ]);

  return (
    <Page
      backAction={{ content: 'Extensions', onAction: () => navigate('/') }}
      title="Bulk Ordering Suite"
      subtitle="Quick Order Pad, CSV Upload Bulk Order, and 1-Click Reorder storefront blocks (Grow plan & higher)."
    >
      <BlockStack gap="400">
        {error && (
          <Banner
            tone={error.requiresUpgrade ? 'warning' : 'critical'}
            onDismiss={() => setError(null)}
            action={error.requiresUpgrade ? { content: 'Upgrade Plan', onAction: () => navigate('/pricing') } : undefined}
          >
            <p>{error.message}</p>
          </Banner>
        )}

        <Card padding="400">
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">Storefront Theme App Blocks</Text>
              <Badge tone="success">Ready in Theme Editor</Badge>
            </InlineStack>
            <Text variant="bodyMd" tone="subdued">
              Add any of these 3 ordering blocks to your storefront pages from Online Store → Themes → Customize → Add block → Apps:
            </Text>
            <BlockStack gap="200">
              <Text variant="bodyMd"><strong>1. B2B Quick Order Pad</strong> — Multi-row SKU search grid that adds items straight to the buyer's Shopify cart.</Text>
              <Text variant="bodyMd"><strong>2. B2B CSV Bulk Order</strong> — Buyers upload a CSV (`sku,quantity`), validate stock/prices live, and populate their cart in one click.</Text>
              <Text variant="bodyMd"><strong>3. B2B 1-Click Reorder</strong> — Displays a logged-in buyer's past Shopify orders with 1-click Reorder All to cart.</Text>
            </BlockStack>
            <InlineStack gap="200">
              <Button onClick={handleDownloadSampleCsv}>Download Sample CSV Template</Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card padding="400">
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Live SKU Catalog Lookup Test</Text>
            <Text variant="bodySm" tone="subdued">
              Test your store's live SKU & product search used by Quick Order Pad and CSV Upload blocks.
            </Text>
            <InlineStack gap="200" blockAlign="end">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Search SKU or Product Title"
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="e.g. SHIRT-01 or Snowboard"
                  autoComplete="off"
                />
              </div>
              <Button variant="primary" onClick={handleTestSkuLookup} loading={searching}>
                Search Catalog
              </Button>
            </InlineStack>

            {results.length > 0 && (
              <>
                <Divider />
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'numeric', 'text']}
                  headings={['SKU', 'Product', 'Price', 'Inventory', 'Variant ID']}
                  rows={tableRows}
                />
              </>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
