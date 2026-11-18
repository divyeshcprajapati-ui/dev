import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Box,
  TextField,
  Select,
  Banner,
  Badge,
  Divider,
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { b2bSuiteService } from '../services/b2bSuiteService';

const SUPPORTED_LOCALES = [
  { label: 'French (fr)', value: 'fr' },
  { label: 'German (de)', value: 'de' },
  { label: 'Spanish (es)', value: 'es' },
  { label: 'Italian (it)', value: 'it' },
  { label: 'Dutch (nl)', value: 'nl' },
  { label: 'Portuguese (pt)', value: 'pt' },
  { label: 'Hindi (hi)', value: 'hi' },
  { label: 'Japanese (ja)', value: 'ja' },
  { label: 'Chinese (zh)', value: 'zh' },
];

const SECTIONS = [
  { id: 'registration', label: 'Registration form' },
  { id: 'quotation', label: 'Quotation' },
  { id: 'bulk', label: 'Quick order pad' },
  { id: 'csv', label: 'CSV Upload' },
  { id: 'list', label: 'Shopping list' },
  { id: 'members', label: 'Members & roles' },
];

export default function Translations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locales, setLocales] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [translations, setTranslations] = useState({});
  const [activeLocale, setActiveLocale] = useState('');
  const [newLocale, setNewLocale] = useState('fr');
  const [activeSection, setActiveSection] = useState('registration');
  const [draftValues, setDraftValues] = useState({});
  const [notice, setNotice] = useState(null);

  const loadData = async (preferredLocale = null) => {
    setLoading(true);
    try {
      const res = await b2bSuiteService.getTranslations();
      if (res?.success && res.data) {
        const fetchedLocales = res.data.locales || [];
        setLocales(fetchedLocales);
        setDefaults(res.data.defaults || {});
        setTranslations(res.data.translations || {});
        const targetLocale = preferredLocale || activeLocale || fetchedLocales[0] || '';
        setActiveLocale(targetLocale);
      }
    } catch (err) {
      setNotice({ tone: 'critical', message: err.message || 'Failed to load translations.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!activeLocale) return;
    const sectionDefaults = defaults[activeSection] || {};
    const existing = translations?.[activeLocale]?.[activeSection] || {};
    const next = {};
    Object.keys(sectionDefaults).forEach((k) => {
      next[k] = existing[k] ?? '';
    });
    setDraftValues(next);
  }, [activeLocale, activeSection, defaults, translations]);

  const handleAddLocale = () => {
    if (!locales.includes(newLocale)) {
      setLocales((prev) => [...prev, newLocale]);
    }
    setActiveLocale(newLocale);
    setNotice({ tone: 'info', message: `Editing locale "${newLocale.toUpperCase()}". Enter your translations below and click Save.` });
  };

  const handleSave = async () => {
    if (!activeLocale) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await b2bSuiteService.saveTranslations({
        locale: activeLocale,
        section: activeSection,
        entries: draftValues,
      });
      if (res?.success) {
        setNotice({ tone: 'success', message: res.message || 'Translations saved.' });
        await loadData(activeLocale);
      }
    } catch (err) {
      setNotice({
        tone: err?.status === 403 ? 'warning' : 'critical',
        message: err?.message || 'Failed to save translations.',
        requiresUpgrade: err?.status === 403,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocale = async () => {
    if (!activeLocale) return;
    setSaving(true);
    try {
      await b2bSuiteService.deleteLocale(activeLocale);
      setNotice({ tone: 'success', message: `Removed locale "${activeLocale.toUpperCase()}".` });
      setActiveLocale('');
      await loadData('');
    } catch (err) {
      setNotice({ tone: 'critical', message: err?.message || 'Failed to delete locale.' });
    } finally {
      setSaving(false);
    }
  };

  const sectionDefaults = defaults[activeSection] || {};

  return (
    <Page
      title="Content & Translation"
      subtitle="Translate storefront B2B forms, quotation labels, and buyer portals for international markets."
      primaryAction={activeLocale ? { content: 'Save translations', onAction: handleSave, loading: saving } : undefined}
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
          <InlineStack align="space-between" blockAlign="center" wrap gap="300">
            <InlineStack gap="200" blockAlign="center">
              <Text variant="headingSm" as="span">English</Text>
              <Badge>Default</Badge>
              <Text as="span" tone="subdued">→</Text>
              {locales.length > 0 ? (
                <div style={{ minWidth: '180px' }}>
                  <Select
                    label="Target language"
                    labelHidden
                    options={locales.map((loc) => ({ label: loc.toUpperCase(), value: loc }))}
                    value={activeLocale}
                    onChange={setActiveLocale}
                  />
                </div>
              ) : (
                <Badge tone="attention">No target language yet</Badge>
              )}
            </InlineStack>

            <InlineStack gap="200" blockAlign="center">
              <div style={{ minWidth: '170px' }}>
                <Select
                  label="Add language"
                  labelHidden
                  options={SUPPORTED_LOCALES}
                  value={newLocale}
                  onChange={setNewLocale}
                />
              </div>
              <Button variant="primary" onClick={handleAddLocale}>Add language</Button>
              {activeLocale && (
                <Button tone="critical" onClick={handleDeleteLocale} disabled={saving}>Remove</Button>
              )}
            </InlineStack>
          </InlineStack>
        </Card>

        <Card padding="500">
          <BlockStack gap="400">
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e1e3e5', paddingBottom: '8px', overflowX: 'auto' }}>
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: '8px 0',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: isActive ? '#008060' : '#6d7175',
                      fontWeight: isActive ? 600 : 400,
                      borderBottom: isActive ? '2px solid #008060' : '2px solid transparent',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sec.label}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <Box padding="600"><Text alignment="center" tone="subdued">Loading translations...</Text></Box>
            ) : !activeLocale ? (
              <Box padding="800">
                <BlockStack gap="300" inlineAlign="center">
                  <Text variant="headingMd" as="h3">Select a language above to start translating</Text>
                  <Text variant="bodyMd" tone="subdued">
                    Storefront B2B blocks automatically fetch your saved translations via /api/b2b/translations.
                  </Text>
                  <Button variant="primary" onClick={handleAddLocale}>Add {newLocale.toUpperCase()} Language</Button>
                </BlockStack>
              </Box>
            ) : (
              <BlockStack gap="400">
                {Object.entries(sectionDefaults).map(([key, defaultText], idx) => (
                  <div key={key}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
                      <BlockStack gap="100">
                        <Text variant="bodySm" fontWeight="semibold">{key}</Text>
                        <Text variant="bodyMd" tone="subdued">{defaultText}</Text>
                      </BlockStack>
                      <TextField
                        label={`Translation for ${key}`}
                        labelHidden
                        value={draftValues[key] || ''}
                        placeholder={defaultText}
                        onChange={(val) => setDraftValues((prev) => ({ ...prev, [key]: val }))}
                        autoComplete="off"
                      />
                    </div>
                    {idx < Object.keys(sectionDefaults).length - 1 && <Box paddingBlockStart="300"><Divider /></Box>}
                  </div>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
