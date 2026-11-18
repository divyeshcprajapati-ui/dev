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

const ROLE_OPTIONS = [
  { label: 'Admin (Full access, approve lists, manage team)', value: 'Admin' },
  { label: 'Buyer (Place orders & request quotes)', value: 'Buyer' },
  { label: 'Viewer (Read-only & view finance)', value: 'Viewer' },
];

export default function TeamMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Buyer');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await b2bSuiteService.getTeamMembers();
      if (res?.success) setMembers(res.data || []);
    } catch (err) {
      setNotice({ tone: 'critical', message: err?.message || 'Failed to load team members.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdd = async () => {
    if (!companyName.trim() || !name.trim() || !email.trim()) {
      setNotice({ tone: 'warning', message: 'Company name, member name, and email are required.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const res = await b2bSuiteService.saveTeamMember({
        company_name: companyName.trim(),
        name: name.trim(),
        email: email.trim(),
        role,
      });
      if (res?.success) {
        setName('');
        setEmail('');
        setNotice({ tone: 'success', message: 'Team member saved & notification dispatched (if enabled).' });
        fetchMembers();
      }
    } catch (err) {
      setNotice({
        tone: err?.status === 403 ? 'warning' : 'critical',
        message: err?.message || 'Failed to save team member.',
        requiresUpgrade: err?.status === 403,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await b2bSuiteService.updateTeamMember(memberId, { role: newRole });
      setNotice({ tone: 'success', message: `Updated role to ${newRole}.` });
      fetchMembers();
    } catch (err) {
      setNotice({
        tone: err?.status === 403 ? 'warning' : 'critical',
        message: err?.message || 'Failed to update role.',
        requiresUpgrade: err?.status === 403,
      });
    }
  };

  const handleRemove = async (memberId) => {
    try {
      await b2bSuiteService.deleteTeamMember(memberId);
      fetchMembers();
    } catch (err) {
      setNotice({ tone: 'critical', message: err?.message || 'Failed to remove member.' });
    }
  };

  return (
    <Page
      backAction={{ content: 'Extensions', onAction: () => navigate('/') }}
      title="Users & Permissions"
      subtitle="Manage B2B company team members, buyer roles, and permissions (Enterprise plan)."
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
            <Text variant="headingMd" as="h2">Add Company Member</Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <TextField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="Acme Wholesale" autoComplete="off" />
              <TextField label="Member Name" value={name} onChange={setName} placeholder="Alex Rivera" autoComplete="off" />
              <TextField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="alex@acme.com" autoComplete="off" />
              <Select label="Role" options={ROLE_OPTIONS} value={role} onChange={setRole} />
            </div>
            <InlineStack align="end">
              <Button variant="primary" onClick={handleAdd} loading={saving}>Add Member</Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card padding="400">
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Company Team Directory ({members.length})</Text>
            {loading ? (
              <Text tone="subdued">Loading team members...</Text>
            ) : members.length === 0 ? (
              <Text tone="subdued">No team members added yet.</Text>
            ) : (
              members.map((m, idx) => (
                <div key={m.id}>
                  <InlineStack align="space-between" blockAlign="center" wrap gap="200">
                    <BlockStack gap="100">
                      <InlineStack gap="200" blockAlign="center">
                        <Text variant="headingSm" as="h3">{m.name}</Text>
                        <Badge tone={m.role === 'Admin' ? 'success' : m.role === 'Buyer' ? 'info' : 'subdued'}>{m.role}</Badge>
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued">{m.company_name} • {m.email}</Text>
                    </BlockStack>
                    <InlineStack gap="200" blockAlign="center">
                      <div style={{ width: '130px' }}>
                        <Select
                          label="Change role"
                          labelHidden
                          options={['Admin', 'Buyer', 'Viewer'].map((r) => ({ label: r, value: r }))}
                          value={m.role}
                          onChange={(val) => handleRoleChange(m.id, val)}
                        />
                      </div>
                      <Button tone="critical" size="slim" onClick={() => handleRemove(m.id)}>Remove</Button>
                    </InlineStack>
                  </InlineStack>
                  {idx < members.length - 1 && <div style={{ margin: '12px 0' }}><Divider /></div>}
                </div>
              ))
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
