import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Badge,
  Button,
  InlineStack,
  TextField,
  Checkbox,
  Banner,
  Box,
  Divider,
  Icon
} from '@shopify/polaris';
import { useNavigate, useParams } from 'react-router-dom';
import { quoteService } from '../services/quoteService';

export default function QuoteDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState(null);

  // Editable fields state
  const [qty, setQty] = useState(100);
  const [quotedPrice, setQuotedPrice] = useState('1.80');
  const [applyFuture, setApplyFuture] = useState(false);
  const [expDate, setExpDate] = useState('');

  useEffect(() => {
    fetchQuoteDetails();
  }, [id]);

  const fetchQuoteDetails = async () => {
    try {
      const res = await quoteService.getQuote(id);
      if (res && res.success && res.data) {
        setQuote(res.data);
        setQty(res.data.quantity);
        setQuotedPrice(res.data.quoted_price.toString());
        setApplyFuture(res.data.apply_to_future_orders);
        setExpDate(res.data.expiration_date || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuote = async (statusOverride = null) => {
    setSaving(true);
    try {
      const payload = {
        quantity: parseInt(qty) || 1,
        quoted_price: parseFloat(quotedPrice) || 0,
        subtotal: (parseInt(qty) || 1) * (parseFloat(quotedPrice) || 0),
        apply_to_future_orders: applyFuture ? 1 : 0,
        expiration_date: expDate || null
      };

      if (statusOverride) {
        payload.status = statusOverride;
      }

      const res = await quoteService.updateQuote(id, payload);
      if (res && res.success) {
        shopify.toast.show('Quote updated successfully');
        fetchQuoteDetails();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleSendQuote = async () => {
    setSaving(true);
    try {
      await handleUpdateQuote('Sent');
      shopify.toast.show('Quote sent to customer');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page title="Loading quote details...">
        <Card>
          <Box padding="800" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #ccc', borderTopColor: '#008060', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </Box>
        </Card>
      </Page>
    );
  }

  if (!quote) {
    return (
      <Page title="Quote not found">
        <Card>
          <Box padding="400">
            <Text tone="critical">The requested B2B quote request does not exist or has been deleted.</Text>
          </Box>
        </Card>
      </Page>
    );
  }

  const subtotalValue = (parseInt(qty) || 0) * (parseFloat(quotedPrice) || 0);
  const badgeTone = quote.status === 'Approved' ? 'success' : quote.status === 'Sent' ? 'info' : 'attention';

  return (
    <Page
      backAction={{ content: 'Quote Requests', onAction: () => navigate('/quotes') }}
      title={`Quote ${quote.quote_number}`}
      titleMetadata={<Badge tone={badgeTone}>{quote.status}</Badge>}
      subtitle="View the details of a specific quote."
      primaryAction={{
        content: 'Send quote',
        onAction: handleSendQuote,
        loading: saving
      }}
      secondaryActions={[
        {
          content: 'Save Changes',
          onAction: () => handleUpdateQuote(),
          loading: saving
        }
      ]}
    >
      <Layout>
        {/* Left Column (2/3 width) */}
        <Layout.Section>
          <BlockStack gap="400">
            
            {/* Products Table Card */}
            <Card padding="400">
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Product</Text>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e1e3e5' }}>
                      <th style={{ padding: '8px 0', fontSize: '12px', color: '#6d7175', textTransform: 'uppercase' }}>Variants</th>
                      <th style={{ padding: '8px 0', fontSize: '12px', color: '#6d7175', textTransform: 'uppercase', width: '100px' }}>Quantity</th>
                      <th style={{ padding: '8px 0', fontSize: '12px', color: '#6d7175', textTransform: 'uppercase', width: '180px' }}>Quote Price</th>
                      <th style={{ padding: '8px 0', fontSize: '12px', color: '#6d7175', textTransform: 'uppercase', textAlign: 'right' }}>Subtotal</th>
                      <th style={{ padding: '8px 0', fontSize: '12px', color: '#6d7175', textTransform: 'uppercase', width: '50px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '16px 0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <img 
                          src="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png" 
                          alt="Bamboo cutlery set" 
                          style={{ width: '52px', height: '52px', borderRadius: '4px', border: '1px solid #e1e3e5', objectFit: 'cover' }}
                        />
                        <div>
                          <Text variant="bodyMd" fontWeight="semibold">{quote.product_name}</Text>
                          <Text variant="bodySm" tone="subdued">Default Title</Text>
                          <Text variant="bodySm" tone="subdued">SKU: BCS-CC-4P</Text>
                          <Text variant="bodySm" tone="subdued">Available stock: 9650</Text>
                        </div>
                      </td>
                      
                      <td style={{ padding: '16px 0' }}>
                        <TextField
                          type="number"
                          value={qty.toString()}
                          onChange={(val) => setQty(parseInt(val) || 0)}
                          autoComplete="off"
                          labelHidden
                          label="Quantity"
                        />
                      </td>
                      
                      <td style={{ padding: '16px 0' }}>
                        <TextField
                          type="number"
                          value={quotedPrice}
                          onChange={(val) => setQuotedPrice(val)}
                          suffix="USD"
                          autoComplete="off"
                          labelHidden
                          label="Quote Price"
                        />
                      </td>
                      
                      <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 'semibold' }}>
                        ${subtotalValue.toFixed(2)} USD
                      </td>

                      <td style={{ padding: '16px 0', textAlign: 'center' }}>
                        <Button variant="plain" tone="critical">🗑️</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </BlockStack>
            </Card>

            {/* Quote Price Application Card */}
            <Card padding="400">
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Quote price application</Text>
                <Checkbox
                  label="Apply quote price to future orders"
                  checked={applyFuture}
                  onChange={(val) => setApplyFuture(val)}
                />
                <Banner tone="warning">
                  <p>
                    If enabled, accepting this quote will update the product's price on the quote to the B2B catalog price assigned to that company location. <a href="#">Learn more</a>
                  </p>
                </Banner>
              </BlockStack>
            </Card>

            {/* Timeline Card */}
            <Card padding="400">
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Timeline</Text>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#008060', marginTop: '6px' }}></div>
                  <BlockStack gap="100">
                    <InlineStack gap="200">
                      <Text variant="bodyMd" fontWeight="semibold">Quote request created</Text>
                      <Text variant="bodySm" tone="subdued">{new Date(quote.created_at).toLocaleDateString()}</Text>
                    </InlineStack>
                    <Text variant="bodySm" tone="subdued">
                      Quote created from form for 1 products for ${parseFloat(quote.subtotal).toFixed(2)} in total.
                    </Text>
                  </BlockStack>
                </div>
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>

        {/* Right Column (1/3 width) */}
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            
            {/* Customer Details Card */}
            <Card padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Customer</Text>
                
                <BlockStack gap="300">
                  <div>
                    <Text variant="bodySm" tone="subdued">Contact Name</Text>
                    <a href="#" style={{ color: '#005bd3', fontWeight: '500', textDecoration: 'underline' }}>{quote.customer_name}</a>
                  </div>
                  
                  <div>
                    <Text variant="bodySm" tone="subdued">Contact Information</Text>
                    <Text variant="bodyMd">{quote.customer_email}</Text>
                  </div>
                  
                  <div>
                    <Text variant="bodySm" tone="subdued">Company</Text>
                    <a href="#" style={{ color: '#005bd3', fontWeight: '500', textDecoration: 'underline' }}>{quote.company_name}</a>
                  </div>
                  
                  <div>
                    <Text variant="bodySm" tone="subdued">Company location</Text>
                    <Text variant="bodyMd">{quote.company_location}</Text>
                  </div>

                  <div>
                    <Text variant="bodySm" tone="subdued">Shipping address</Text>
                    <Text variant="bodyMd">{quote.shipping_address}</Text>
                  </div>

                  <div>
                    <Text variant="bodySm" tone="subdued">Billing address</Text>
                    <Text variant="bodyMd">{quote.billing_address || 'No billing address provided'}</Text>
                  </div>
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Expiration Date Card */}
            <Card padding="400">
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">Expiration date</Text>
                <input 
                  type="date" 
                  value={expDate} 
                  onChange={(e) => setExpDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: '#1c1e21',
                    outline: 'none'
                  }}
                />
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
