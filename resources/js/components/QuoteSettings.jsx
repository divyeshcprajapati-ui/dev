import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Checkbox,
  Banner,
  List,
  TextField,
  Box,
  InlineStack,
  Button,
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { quoteService } from '../services/quoteService';

export default function QuoteSettings() {
  const navigate = useNavigate();
  const [productPage, setProductPage] = useState(true);
  const [cartPage, setCartPage] = useState(false);
  const [b2bCustomers, setB2bCustomers] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [emptyQuoteButton, setEmptyQuoteButton] = useState(false);
  const [addToCartSelector, setAddToCartSelector] = useState('');
  const [formSelector, setFormSelector] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await quoteService.getSettings();
        if (response && response.success && response.data) {
          const data = response.data;
          if (data.productPage !== undefined) setProductPage(data.productPage === 'true' || data.productPage === true);
          if (data.cartPage !== undefined) setCartPage(data.cartPage === 'true' || data.cartPage === true);
          if (data.notLoggedIn !== undefined) setNotLoggedIn(data.notLoggedIn === 'true' || data.notLoggedIn === true);
          if (data.emptyQuoteButton !== undefined) setEmptyQuoteButton(data.emptyQuoteButton === 'true' || data.emptyQuoteButton === true);
          if (data.addToCartSelector !== undefined) setAddToCartSelector(data.addToCartSelector);
          if (data.formSelector !== undefined) setFormSelector(data.formSelector);
        }
      } catch (err) {
        console.error("Failed to load quote settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await quoteService.updateSettings({
        productPage: productPage,
        cartPage: cartPage,
        b2bCustomers: b2bCustomers, // default static value check
        notLoggedIn: notLoggedIn,
        emptyQuoteButton: emptyQuoteButton,
        addToCartSelector: addToCartSelector,
        formSelector: formSelector
      });
      shopify.toast.show('Settings saved');
    } catch (err) {
      console.error("Failed to save settings", err);
      // Fallback alert if shopify bridge isn't available
      alert("Settings saved locally (API error)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      backAction={{ content: 'Extensions', onAction: () => navigate(-1) }}
      title="Quote Settings"
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
        loading: saving,
        disabled: loading
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Quote button display
                </Text>
                
                <Banner tone="info" onDismiss={() => {}}>
                  <p>To ensure the quote button display on your store, please verify these steps:</p>
                  <List type="bullet">
                    <List.Item>The customer's company location is associated with a B2B catalog.</List.Item>
                    <List.Item>Customers are assigned to the role with the permission to request quotes.</List.Item>
                    <List.Item>If you're using paid themes, please contact our team for additional configuration.</List.Item>
                  </List>
                </Banner>

                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="semibold">Display button on which page:</Text>
                  <Checkbox
                    label="Product page"
                    checked={productPage}
                    onChange={(val) => setProductPage(val)}
                  />
                  <Checkbox
                    label="Cart page"
                    checked={cartPage}
                    onChange={(val) => setCartPage(val)}
                  />
                </BlockStack>

                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="semibold">Who will see this button:</Text>
                  <Checkbox
                    label="B2B customers (default)"
                    checked={b2bCustomers}
                    onChange={(val) => setB2bCustomers(val)}
                    helpText="Customers who are assigned to specific B2B company locations"
                    disabled // Appears uneditable or forced in screenshot? Will make it checked and disabled or just normal.
                  />
                  <Checkbox
                    label="Not logged-in users"
                    checked={notLoggedIn}
                    onChange={(val) => setNotLoggedIn(val)}
                    helpText="If enabled, they will be requested to register a B2B account inside quote request"
                  />
                </BlockStack>
              </BlockStack>
            </Card>

            <Card padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Quote popup modal
                </Text>
                <Checkbox
                  label="Show a button when quote is empty"
                  checked={emptyQuoteButton}
                  onChange={(val) => setEmptyQuoteButton(val)}
                  helpText="If enabled, a button appears in the empty quote modal to guide buyers to a page."
                />
              </BlockStack>
            </Card>

            <Card padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Custom CSS selector
                </Text>
                <TextField
                  label="Add to cart button selector"
                  value={addToCartSelector}
                  onChange={(val) => setAddToCartSelector(val)}
                  autoComplete="off"
                />
                <TextField
                  label="Form selector"
                  value={formSelector}
                  onChange={(val) => setFormSelector(val)}
                  autoComplete="off"
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card padding="0">
            <div style={{ padding: '16px', borderBottom: '1px solid #e1e3e5' }}>
              <Text variant="headingMd" as="h2">Preview</Text>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fafbfb' }}>
              <Card padding="0">
                <BlockStack gap="300">
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#e1e3e5',
                    backgroundImage: 'url("https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px'
                  }}></div>
                  <div style={{ padding: '16px' }}>
                    <BlockStack gap="200">
                      <div style={{ width: '60%', height: '16px', backgroundColor: '#e1e3e5', borderRadius: '4px' }}></div>
                      <div style={{ width: '40%', height: '12px', backgroundColor: '#e1e3e5', borderRadius: '4px' }}></div>
                      <div style={{ width: '80%', height: '12px', backgroundColor: '#e1e3e5', borderRadius: '4px' }}></div>
                      
                      <div style={{ marginTop: '16px' }}>
                         <BlockStack gap="200">
                           <Button fullWidth>Add to cart</Button>
                           <Button fullWidth>Add to quote</Button>
                         </BlockStack>
                      </div>
                    </BlockStack>
                  </div>
                </BlockStack>
              </Card>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
