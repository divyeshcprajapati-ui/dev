import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Badge,
  Banner,
  Button,
  Box,
  InlineStack,
  TextField,
} from '@shopify/polaris';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationService } from '../services/registrationService';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      try {
        const response = await registrationService.getApplication(id);
        if (response && response.success && response.data) {
          setCustomer(response.data);
        } else if (response && !response.success && response.data) {
           setCustomer(response.data);
        } else {
           setCustomer(response);
        }
      } catch (err) {
        console.error("Failed fetching customer:", err);
        // Fallback to local storage for demo/mock purposes
        const saved = localStorage.getItem('b2b_submissions');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const found = parsed.find(sub => String(sub.id) === String(id));
            if (found) {
              setCustomer(found);
            } else {
              setError("Customer not found.");
            }
          } catch (e) {
            setError("Failed to parse local cache.");
          }
        } else {
          setError(err.message || "Failed to load customer details.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  const handleApprove = async () => {
    if (!customer) return;
    setApproving(true);
    try {
      await registrationService.approveApplication(id);
      
      // Update local state
      setCustomer({ ...customer, status: 'Approved' });
      
      // Update local storage if needed
      const saved = localStorage.getItem('b2b_submissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = parsed.map(sub => String(sub.id) === String(id) ? { ...sub, status: 'Approved' } : sub);
        localStorage.setItem('b2b_submissions', JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Failed to approve:", err);
      // Mock approval
      setCustomer({ ...customer, status: 'Approved' });
      const saved = localStorage.getItem('b2b_submissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = parsed.map(sub => String(sub.id) === String(id) ? { ...sub, status: 'Approved' } : sub);
        localStorage.setItem('b2b_submissions', JSON.stringify(updated));
      }
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <Page backAction={{ content: 'Customers', onAction: () => navigate(-1) }}>
        <Box padding="1000" style={{ textAlign: 'center' }}>
          <Text variant="bodyMd">Loading details...</Text>
        </Box>
      </Page>
    );
  }

  if (error || !customer) {
    return (
      <Page backAction={{ content: 'Customers', onAction: () => navigate(-1) }}>
        <Banner tone="critical">
          <p>{error || "Customer not found."}</p>
        </Banner>
      </Page>
    );
  }

  const rawStatus = customer.status || 'Pending';
  let badgeTone = 'attention';
  if (rawStatus === 'Approved') badgeTone = 'success';
  else if (rawStatus === 'Failed' || rawStatus === 'Rejected') badgeTone = 'critical';

  const isFailed = rawStatus === 'Failed' || rawStatus === 'Rejected';

  const formatSubmittedDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const hours = date.getHours() % 12 || 12;
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();

      return `${hours}:${minutes} ${ampm}, ${month} ${day}, ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const contactName = customer.contact || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A';

  return (
    <Page
      backAction={{ content: 'Customers', onAction: () => navigate(-1) }}
      title={contactName}
      titleMetadata={<Badge tone={badgeTone}>{rawStatus}</Badge>}
      subtitle={`Submitted at ${formatSubmittedDate(customer.created_at || customer.date)}`}
      primaryAction={{
        content: 'Approve company',
        onAction: handleApprove,
        loading: approving,
        disabled: rawStatus === 'Approved'
      }}
    >
      <BlockStack gap="400">
        {isFailed && (
          <Banner tone="warning" onDismiss={() => {}}>
            <p>The VAT number submitted is invalid. Please contact the applicant to verify their VAT number before approving the registration.</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card padding="0">
              <div style={{ padding: '16px', borderBottom: '1px solid #e1e3e5', display: 'flex', justifyContent: 'space-between' }}>
                 <Text variant="headingMd" as="h2">Submission</Text>
                 <span style={{ cursor: 'pointer', color: '#5c5f62' }}>✎</span>
              </div>
              <div style={{ padding: '16px' }}>
                <BlockStack gap="400">
                  {/* Company Info */}
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">Company info</Text>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Company name</Text>
                       <Text variant="bodyMd" alignment="end">{customer.company || customer.company_name || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Company address</Text>
                       <Text variant="bodyMd" alignment="end">{customer.address || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Appartment, suite, etc.</Text>
                       <Text variant="bodyMd" alignment="end">{customer.suite || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Company country</Text>
                       <Text variant="bodyMd" alignment="end">{customer.country || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Company city</Text>
                       <Text variant="bodyMd" alignment="end">{customer.city || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Province</Text>
                       <Text variant="bodyMd" alignment="end">{customer.province || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Zip code / Postal code</Text>
                       <Text variant="bodyMd" alignment="end">{customer.zip || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Message</Text>
                       <Text variant="bodyMd" alignment="end">{customer.message || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Number</Text>
                       <Text variant="bodyMd" alignment="end">{customer.number || '-'}</Text>
                    </div>
                  </BlockStack>

                  {/* Taxes and terms */}
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">Taxes and terms</Text>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Is your company tax-exempt?</Text>
                       <Text variant="bodyMd" alignment="end">{customer.tax_exempt ? 'Yes' : 'No'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">VAT/Tax id</Text>
                       <Text variant="bodyMd" alignment="end">{customer.vat_id || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Terms checkbox</Text>
                       <Text variant="bodyMd" alignment="end">{customer.terms_accepted ? 'true' : 'false'}</Text>
                    </div>
                  </BlockStack>

                  {/* Account */}
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">Account</Text>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">First name</Text>
                       <Text variant="bodyMd" alignment="end">{customer.first_name || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Last name</Text>
                       <Text variant="bodyMd" alignment="end">{customer.last_name || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid #f1f2f3', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Your email</Text>
                       <Text variant="bodyMd" alignment="end">{customer.email || '-'}</Text>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingBottom: '8px' }}>
                       <Text variant="bodyMd" tone="subdued">Your phone number</Text>
                       <Text variant="bodyMd" alignment="end">{customer.phone || '-'}</Text>
                    </div>
                  </BlockStack>
                </BlockStack>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card padding="400">
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Text variant="headingMd" as="h2">Contact information</Text>
                    <span style={{ cursor: 'pointer', color: '#5c5f62' }}>✎</span>
                 </div>
                 <BlockStack gap="200">
                    <Box>
                      <Text variant="bodySm" tone="subdued">Customer name</Text>
                      <Text variant="bodyMd">{contactName}</Text>
                    </Box>
                    <Box>
                      <Text variant="bodySm" tone="subdued">Email</Text>
                      <Text variant="bodyMd" style={{ color: '#005bd3' }}>{customer.email || '-'}</Text>
                    </Box>
                    <Box>
                      <Text variant="bodySm" tone="subdued">Phone</Text>
                      <Text variant="bodyMd">{customer.phone || '-'}</Text>
                    </Box>
                 </BlockStack>
              </Card>

              <Card padding="400">
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text variant="headingMd" as="h2">Payment terms</Text>
                    <span style={{ cursor: 'pointer', color: '#5c5f62' }}>✎</span>
                 </div>
                 <Text variant="bodyMd" tone="subdued">No payment terms</Text>
              </Card>

              <Card padding="400">
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text variant="headingMd" as="h2">Catalogs</Text>
                    <span style={{ cursor: 'pointer', color: '#5c5f62' }}>✎</span>
                 </div>
                 <Text variant="bodyMd" tone="subdued">No catalogs</Text>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
