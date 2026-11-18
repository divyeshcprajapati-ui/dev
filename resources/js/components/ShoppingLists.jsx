import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Button,
  Banner,
  TextField,
  Divider,
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { b2bSuiteService } from '../services/b2bSuiteService';

export default function ShoppingLists() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // Quick create form
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemQty, setItemQty] = useState('10');

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await b2bSuiteService.getShoppingLists();
      if (res?.success) setLists(res.data || []);
    } catch (err) {
      setNotice({ tone: 'critical', message: err?.message || 'Failed to load shopping lists.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !customerEmail.trim()) {
      setNotice({ tone: 'warning', message: 'List name and customer email are required.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const items = itemTitle.trim()
        ? [{ product_title: itemTitle.trim(), sku: itemSku.trim(), quantity: parseInt(itemQty, 10) || 1, price: 0 }]
        : [];
      const res = await b2bSuiteService.createShoppingList({
        name: name.trim(),
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        company_name: companyName.trim(),
        status: 'Pending Approval',
        items,
      });
      if (res?.success) {
        setName('');
        setCustomerName('');
        setCustomerEmail('');
        setCompanyName('');
        setItemTitle('');
        setItemSku('');
        setNotice({ tone: 'success', message: 'Shopping list created.' });
        fetchLists();
      }
    } catch (err) {
      setNotice({
        tone: err?.status === 403 ? 'warning' : 'critical',
        message: err?.message || 'Failed to create shopping list.',
        requiresUpgrade: err?.status === 403,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id, status) => {
    setNotice(null);
    try {
      const res = await b2bSuiteService.updateShoppingListStatus(id, status);
      if (res?.success) {
        setNotice({ tone: 'success', message: res.message });
        fetchLists();
      }
    } catch (err) {
      setNotice({
        tone: err?.status === 403 ? 'warning' : 'critical',
        message: err?.message || 'Failed to update status.',
        requiresUpgrade: err?.status === 403,
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await b2bSuiteService.deleteShoppingList(id);
      fetchLists();
    } catch (err) {
      setNotice({ tone: 'critical', message: err?.message || 'Failed to delete list.' });
    }
  };

  const statusTone = (status) => {
    if (status === 'Approved') return 'success';
    if (status === 'Pending Approval') return 'attention';
    if (status === 'Rejected') return 'critical';
    return 'info';
  };

  return (
    <Page
      backAction={{ content: 'Extensions', onAction: () => navigate('/') }}
      title="Reusable B2B Shopping Lists"
      subtitle="Review, approve, and manage recurring buyer requisition lists (Advanced plan & higher)."
    >
      <BlockStack gap="400">
        {notice && (
          <Banner
            tone={notice.tone}
            onDismiss={() => setNotice(null)}
            action={notice.requiresUpgrade ? { content: 'Upgrade Plan', onAction: () => navigate('/pricing') } : undefined}
          >
            <p>{notice.message}</p>
          </Banner>
        )}

        <Card padding="400">
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Create Shopping List</Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <TextField label="List Name" value={name} onChange={setName} placeholder="Monthly Warehouse Restock" autoComplete="off" />
              <TextField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="Acme Corp" autoComplete="off" />
              <TextField label="Buyer Name" value={customerName} onChange={setCustomerName} placeholder="Jane Doe" autoComplete="off" />
              <TextField label="Buyer Email" type="email" value={customerEmail} onChange={setCustomerEmail} placeholder="buyer@acme.com" autoComplete="off" />
              <TextField label="Initial Product (Optional)" value={itemTitle} onChange={setItemTitle} placeholder="Heavy Duty Gloves" autoComplete="off" />
              <InlineStack gap="200">
                <div style={{ flex: 1 }}>
                  <TextField label="SKU" value={itemSku} onChange={setItemSku} placeholder="GLV-100" autoComplete="off" />
                </div>
                <div style={{ width: '90px' }}>
                  <TextField label="Qty" type="number" value={itemQty} onChange={setItemQty} autoComplete="off" />
                </div>
              </InlineStack>
            </div>
            <InlineStack align="end">
              <Button variant="primary" onClick={handleCreate} loading={saving}>Create List</Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card padding="400">
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">All Buyer Shopping Lists ({lists.length})</Text>
            {loading ? (
              <Text tone="subdued">Loading shopping lists...</Text>
            ) : lists.length === 0 ? (
              <Text tone="subdued">No shopping lists created yet. Add the B2B Shopping Lists block to your storefront or create one above.</Text>
            ) : (
              lists.map((list, idx) => (
                <div key={list.id}>
                  <InlineStack align="space-between" blockAlign="center" wrap gap="200">
                    <BlockStack gap="100">
                      <InlineStack gap="200" blockAlign="center">
                        <Text variant="headingSm" as="h3">{list.name}</Text>
                        <Badge tone={statusTone(list.status)}>{list.status}</Badge>
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued">
                        {list.company_name || 'B2B Buyer'} • {list.customer_email} • {(list.items || []).length} item(s)
                      </Text>
                    </BlockStack>
                    <InlineStack gap="200">
                      {list.status !== 'Approved' && (
                        <Button variant="primary" size="slim" onClick={() => handleStatus(list.id, 'Approved')}>Approve</Button>
                      )}
                      {list.status !== 'Rejected' && (
                        <Button size="slim" onClick={() => handleStatus(list.id, 'Rejected')}>Reject</Button>
                      )}
                      <Button tone="critical" size="slim" onClick={() => handleDelete(list.id)}>Delete</Button>
                    </InlineStack>
                  </InlineStack>
                  {idx < lists.length - 1 && <div style={{ margin: '12px 0' }}><Divider /></div>}
                </div>
              ))
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
