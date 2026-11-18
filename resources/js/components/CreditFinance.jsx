import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Select,
  Button,
  Badge,
  Banner,
  Divider,
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { b2bSuiteService } from '../services/b2bSuiteService';

export default function CreditFinance() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // Account form
  const [companyName, setCompanyName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState('10000');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  // Transaction form
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [txType, setTxType] = useState('charge');
  const [txAmount, setTxAmount] = useState('');
  const [txReference, setTxReference] = useState('');
  const [txNotes, setTxNotes] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await b2bSuiteService.getCreditAccounts();
      if (res?.success) {
        const list = res.data || [];
        setAccounts(list);
        if (list.length > 0 && !selectedAccountId) {
          setSelectedAccountId(String(list[0].id));
        }
      }
    } catch (err) {
      setNotice({ tone: 'critical', message: err?.message || 'Failed to load credit accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSaveAccount = async () => {
    if (!companyName.trim() || !customerEmail.trim()) {
      setNotice({ tone: 'warning', message: 'Company name and email are required.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const res = await b2bSuiteService.saveCreditAccount({
        company_name: companyName.trim(),
        customer_email: customerEmail.trim(),
        credit_limit: parseFloat(creditLimit) || 0,
        payment_terms: paymentTerms,
      });
      if (res?.success) {
        setCompanyName('');
        setCustomerEmail('');
        setNotice({ tone: 'success', message: 'Credit account saved successfully.' });
        fetchAccounts();
      }
    } catch (err) {
      setNotice({
        tone: err?.status === 403 ? 'warning' : 'critical',
        message: err?.message || 'Failed to save credit account.',
        requiresUpgrade: err?.status === 403,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRecordTx = async () => {
    if (!selectedAccountId || !txAmount) {
      setNotice({ tone: 'warning', message: 'Select an account and enter an amount.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const res = await b2bSuiteService.recordLedgerEntry(selectedAccountId, {
        type: txType,
        amount: parseFloat(txAmount),
        reference: txReference.trim(),
        notes: txNotes.trim(),
      });
      if (res?.success) {
        setTxAmount('');
        setTxReference('');
        setTxNotes('');
        setNotice({ tone: 'success', message: 'Ledger transaction recorded.' });
        fetchAccounts();
      }
    } catch (err) {
      setNotice({
        tone: err?.status === 403 ? 'warning' : 'critical',
        message: err?.message || 'Failed to record transaction.',
        requiresUpgrade: err?.status === 403,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      backAction={{ content: 'Extensions', onAction: () => navigate('/') }}
      title="Credit Limit & Finance Ledger"
      subtitle="Allocate wholesale credit limits, track outstanding balances, and record payments (Enterprise plan)."
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          <Card padding="400">
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">Assign / Update Credit Limit</Text>
              <TextField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="Acme Corp" autoComplete="off" />
              <TextField label="Primary Buyer Email" type="email" value={customerEmail} onChange={setCustomerEmail} placeholder="finance@acme.com" autoComplete="off" />
              <InlineStack gap="200">
                <div style={{ flex: 1 }}>
                  <TextField label="Credit Limit (USD)" type="number" value={creditLimit} onChange={setCreditLimit} autoComplete="off" />
                </div>
                <div style={{ flex: 1 }}>
                  <Select
                    label="Payment Terms"
                    options={['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt'].map((t) => ({ label: t, value: t }))}
                    value={paymentTerms}
                    onChange={setPaymentTerms}
                  />
                </div>
              </InlineStack>
              <Button variant="primary" onClick={handleSaveAccount} loading={saving}>Save Credit Account</Button>
            </BlockStack>
          </Card>

          <Card padding="400">
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">Record Ledger Entry</Text>
              <Select
                label="Company Account"
                options={accounts.length > 0
                  ? accounts.map((a) => ({ label: `${a.company_name} (Avail: $${Number(a.available_credit).toFixed(2)})`, value: String(a.id) }))
                  : [{ label: 'No credit accounts yet', value: '' }]}
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                disabled={accounts.length === 0}
              />
              <InlineStack gap="200">
                <div style={{ flex: 1 }}>
                  <Select
                    label="Entry Type"
                    options={[
                      { label: 'Order Charge (+Balance)', value: 'charge' },
                      { label: 'Payment Received (-Balance)', value: 'payment' },
                      { label: 'Manual Balance Set', value: 'adjustment' },
                    ]}
                    value={txType}
                    onChange={setTxType}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField label="Amount (USD)" type="number" value={txAmount} onChange={setTxAmount} placeholder="500.00" autoComplete="off" />
                </div>
              </InlineStack>
              <TextField label="Reference (Invoice / PO #)" value={txReference} onChange={setTxReference} placeholder="INV-2026-001" autoComplete="off" />
              <TextField label="Notes" value={txNotes} onChange={setTxNotes} placeholder="Wire transfer received" autoComplete="off" />
              <Button onClick={handleRecordTx} loading={saving} disabled={accounts.length === 0}>Record Transaction</Button>
            </BlockStack>
          </Card>
        </div>

        <Card padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">Active Credit Accounts & Ledgers ({accounts.length})</Text>
            {loading ? (
              <Text tone="subdued">Loading credit accounts...</Text>
            ) : accounts.length === 0 ? (
              <Text tone="subdued">No credit accounts configured yet.</Text>
            ) : (
              accounts.map((acc, idx) => {
                const limit = Number(acc.credit_limit || 0);
                const used = Number(acc.balance_used || 0);
                const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                const isLow = limit > 0 && pct >= 90;

                return (
                  <div key={acc.id}>
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center" wrap>
                        <BlockStack gap="050">
                          <InlineStack gap="200" blockAlign="center">
                            <Text variant="headingSm" as="h3">{acc.company_name}</Text>
                            <Badge tone={isLow ? 'critical' : 'success'}>{acc.payment_terms}</Badge>
                          </InlineStack>
                          <Text variant="bodySm" tone="subdued">{acc.customer_email}</Text>
                        </BlockStack>
                        <InlineStack gap="400">
                          <Text variant="bodyMd">Used: <strong>${used.toFixed(2)}</strong></Text>
                          <Text variant="bodyMd">Available: <strong style={{ color: isLow ? '#d82c0d' : '#008060' }}>${Number(acc.available_credit).toFixed(2)}</strong></Text>
                          <Text variant="bodyMd">Limit: <strong>${limit.toFixed(2)}</strong></Text>
                        </InlineStack>
                      </InlineStack>
                      <div style={{ height: '8px', background: '#e1e3e5', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isLow ? '#d82c0d' : '#008060' }} />
                      </div>
                      {(acc.entries || []).length > 0 && (
                        <BlockStack gap="100">
                          {(acc.entries || []).slice(0, 5).map((e) => (
                            <Text key={e.id} variant="bodySm" tone="subdued">
                              • [{e.type.toUpperCase()}] ${Number(e.amount).toFixed(2)} {e.reference ? `(${e.reference})` : ''} {e.notes ? `— ${e.notes}` : ''}
                            </Text>
                          ))}
                        </BlockStack>
                      )}
                    </BlockStack>
                    {idx < accounts.length - 1 && <div style={{ margin: '16px 0' }}><Divider /></div>}
                  </div>
                );
              })
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
