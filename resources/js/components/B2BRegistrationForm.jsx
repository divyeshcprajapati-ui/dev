import React, { useState } from 'react';
import {
    Page,
    Layout,
    Card,
    Button,
    TextField,
    Checkbox,
    Text,
    BlockStack,
    InlineStack,
    Grid,
    DataTable,
    Badge,
    Tabs,
    Divider,
    Box,
    Select,
    Banner,
    Icon
} from '@shopify/polaris';
import { ArrowLeftIcon } from '@shopify/polaris-icons';

export default function B2BRegistrationForm({ onBack }) {
    const [activeTab, setActiveTab] = useState(0);

    // Form builder state
    const [formTitle, setFormTitle] = useState('B2B Business Account Registration');
    const [formDesc, setFormDesc] = useState('Apply for a wholesale/business account. We will review your application within 24-48 hours.');
    const [buttonText, setButtonText] = useState('Submit Application');
    const [buttonColor, setButtonColor] = useState('#008060'); // Shopify green
    const [autoApprove, setAutoApprove] = useState(false);
    const [customerTags, setCustomerTags] = useState('b2b-pending, wholesale-applied');
    const [redirectUrl, setRedirectUrl] = useState('/pages/thank-you');

    // Fields list state
    const [fields, setFields] = useState([
        { id: 'first_name', name: 'First Name', enabled: true, required: true },
        { id: 'last_name', name: 'Last Name', enabled: true, required: true },
        { id: 'email', name: 'Email Address', enabled: true, required: true },
        { id: 'company_name', name: 'Company Name', enabled: true, required: true },
        { id: 'tax_id', name: 'Tax ID / VAT Number', enabled: true, required: false },
        { id: 'phone', name: 'Phone Number', enabled: true, required: false },
        { id: 'website', name: 'Website URL', enabled: false, required: false },
        { id: 'notes', name: 'Additional Notes', enabled: false, required: false }
    ]);

    // Mock registration submissions data
    const [submissions, setSubmissions] = useState([
        {
            id: '1',
            company: 'Acme Corp',
            contact: 'John Doe',
            email: 'john@acme.com',
            taxId: 'US-987654321',
            status: 'Pending',
            date: '2026-06-07'
        },
        {
            id: '2',
            company: 'Global Trade LLC',
            contact: 'Sarah Jenkins',
            email: 's.jenkins@globaltrade.com',
            taxId: 'GB-123456789',
            status: 'Approved',
            date: '2026-06-06'
        },
        {
            id: '3',
            company: 'Apex Retailers',
            contact: 'Michael Chang',
            email: 'mchang@apex.io',
            taxId: 'CA-445566778',
            status: 'Rejected',
            date: '2026-06-05'
        }
    ]);

    const handleTabChange = (selectedTabIndex) => {
        setActiveTab(selectedTabIndex);
    };

    const handleFieldToggle = (index, property) => {
        const updatedFields = [...fields];
        updatedFields[index][property] = !updatedFields[index][property];
        setFields(updatedFields);
    };

    const handleApprove = (id) => {
        setSubmissions(submissions.map(sub => 
            sub.id === id ? { ...sub, status: 'Approved' } : sub
        ));
    };

    const handleReject = (id) => {
        setSubmissions(submissions.map(sub => 
            sub.id === id ? { ...sub, status: 'Rejected' } : sub
        ));
    };

    const builderTabs = [
        { id: 'form-builder', content: 'Form Builder & Settings', panelID: 'form-builder-content' },
        { id: 'applications', content: 'Applications & Leads', panelID: 'applications-content' }
    ];

    const submissionRows = submissions.map((sub) => {
        let statusTone = 'attention';
        if (sub.status === 'Approved') statusTone = 'success';
        if (sub.status === 'Rejected') statusTone = 'critical';

        return [
            sub.date,
            <sub>{sub.company}</sub>,
            sub.contact,
            sub.email,
            sub.taxId,
            <Badge tone={statusTone}>{sub.status}</Badge>,
            sub.status === 'Pending' ? (
                <InlineStack gap="100">
                    <Button size="micro" variant="primary" tone="success" onClick={() => handleApprove(sub.id)}>Approve</Button>
                    <Button size="micro" variant="primary" tone="critical" onClick={() => handleReject(sub.id)}>Reject</Button>
                </InlineStack>
            ) : '-'
        ];
    });

    return (
        <Page
            title="B2B Registration Form"
            subtitle="Customize registration forms and manage incoming business applications"
            backAction={{ content: 'Back to Hub', onAction: onBack }}
            primaryAction={{ content: 'Save changes', variant: 'primary' }}
        >
            <div style={{ marginBottom: '20px' }}>
                <Tabs tabs={builderTabs} selected={activeTab} onSelect={handleTabChange} />
            </div>

            {activeTab === 0 ? (
                <Grid>
                    {/* Left Pane: Config Form */}
                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 5, xl: 5 }}>
                        <BlockStack gap="400">
                            <Card>
                                <BlockStack gap="300">
                                    <Text variant="headingMd" as="h2">Form Headings</Text>
                                    <TextField
                                        label="Form Title"
                                        value={formTitle}
                                        onChange={(val) => setFormTitle(val)}
                                        autoComplete="off"
                                    />
                                    <TextField
                                        label="Description / Subtext"
                                        value={formDesc}
                                        onChange={(val) => setFormDesc(val)}
                                        multiline={3}
                                        autoComplete="off"
                                    />
                                </BlockStack>
                            </Card>

                            <Card>
                                <BlockStack gap="300">
                                    <Text variant="headingMd" as="h2">Form Fields Config</Text>
                                    <Text variant="bodySm" tone="subdued">Select which fields should be visible on the store registration page and whether they are required.</Text>
                                    <Divider />
                                    {fields.map((field, index) => (
                                        <div key={field.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                                            <div style={{ width: '40%' }}>
                                                <Text variant="bodyMd" as="span">{field.name}</Text>
                                            </div>
                                            <InlineStack gap="200">
                                                <Checkbox
                                                    label="Enabled"
                                                    checked={field.enabled}
                                                    onChange={() => handleFieldToggle(index, 'enabled')}
                                                />
                                                <Checkbox
                                                    label="Required"
                                                    checked={field.required}
                                                    disabled={!field.enabled}
                                                    onChange={() => handleFieldToggle(index, 'required')}
                                                />
                                            </InlineStack>
                                        </div>
                                    ))}
                                </BlockStack>
                            </Card>

                            <Card>
                                <BlockStack gap="300">
                                    <Text variant="headingMd" as="h2">Form Submission Actions</Text>
                                    <Checkbox
                                        label="Auto-approve registrations (Skip manual review)"
                                        checked={autoApprove}
                                        onChange={(val) => setAutoApprove(val)}
                                    />
                                    <TextField
                                        label="Customer tags to apply"
                                        value={customerTags}
                                        onChange={(val) => setCustomerTags(val)}
                                        autoComplete="off"
                                        helpText="Comma separated list of tags (e.g. b2b, wholesale)"
                                    />
                                    <TextField
                                        label="Success redirect URL"
                                        value={redirectUrl}
                                        onChange={(val) => setRedirectUrl(val)}
                                        autoComplete="off"
                                    />
                                </BlockStack>
                            </Card>

                            <Card>
                                <BlockStack gap="300">
                                    <Text variant="headingMd" as="h2">Submit Button Style</Text>
                                    <TextField
                                        label="Button Label"
                                        value={buttonText}
                                        onChange={(val) => setButtonText(val)}
                                        autoComplete="off"
                                    />
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <TextField
                                                label="Button Hex Color"
                                                value={buttonColor}
                                                onChange={(val) => setButtonColor(val)}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '4px',
                                            backgroundColor: buttonColor,
                                            border: '1px solid #c9cccf',
                                            marginTop: '22px'
                                        }} />
                                    </div>
                                </BlockStack>
                            </Card>
                        </BlockStack>
                    </Grid.Cell>

                    {/* Right Pane: Live Preview */}
                    <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 8, lg: 7, xl: 7 }}>
                        <div style={{ position: 'sticky', top: '20px' }}>
                            <BlockStack gap="200">
                                <Text variant="headingSm" tone="subdued">LIVE STOREFRONT PREVIEW</Text>
                                <div style={{
                                    border: '1px solid #dcdcdc',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    padding: '28px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <BlockStack gap="400">
                                        <div>
                                            <Text variant="headingLg" as="h3">{formTitle || 'Registration Form'}</Text>
                                            {formDesc && (
                                                <div style={{ marginTop: '6px' }}>
                                                    <Text variant="bodyMd" tone="subdued">{formDesc}</Text>
                                                </div>
                                            )}
                                        </div>
                                        <Divider />
                                        <BlockStack gap="300">
                                            {fields.filter(f => f.enabled).map(f => (
                                                <TextField
                                                    key={f.id}
                                                    label={`${f.name} ${f.required ? '*' : ''}`}
                                                    autoComplete="off"
                                                    placeholder={`Enter your ${f.name.toLowerCase()}`}
                                                    multiline={f.id === 'notes'}
                                                />
                                            ))}
                                            <div style={{ marginTop: '10px' }}>
                                                <button style={{
                                                    backgroundColor: buttonColor,
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px 24px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    width: '100%',
                                                    fontSize: '14px',
                                                    transition: 'opacity 0.2s'
                                                }}>
                                                    {buttonText || 'Submit'}
                                                </button>
                                            </div>
                                        </BlockStack>
                                    </BlockStack>
                                </div>
                            </BlockStack>
                        </div>
                    </Grid.Cell>
                </Grid>
            ) : (
                <Card padding="0">
                    <DataTable
                        columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                        headers={['Submission Date', 'Company', 'Contact', 'Email', 'Tax ID', 'Status', 'Actions']}
                        rows={submissionRows}
                    />
                </Card>
            )}
        </Page>
    );
}
