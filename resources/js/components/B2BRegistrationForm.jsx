import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationService } from '../services/registrationService';

import {
    Page,
    Card,
    Button,
    TextField,
    Checkbox,
    Text,
    BlockStack,
    InlineStack,
    Grid,
    Badge,
    Divider,
    Box,
    Select,
    Tabs,
    DataTable
} from '@shopify/polaris';

export default function B2BRegistrationForm({ onBack }) {
    const navigate = useNavigate();
    // Top Tabs Navigation
    const [activeTab, setActiveTab] = useState(0);
    const builderTabs = [
        { id: 'form-builder', content: 'Form Builder & Settings', panelID: 'form-builder-content' },
        { id: 'applications', content: 'Applications & Leads', panelID: 'applications-content' }
    ];

    // Top Bar & Configuration States
    const [isActive, setIsActive] = useState(true);
    const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' or 'mobile'
    const [activeEditSection, setActiveEditSection] = useState('company-info'); // 'header', 'footer', or step id

    // Header & Footer States
    const [formTitle, setFormTitle] = useState('Wholesale Application');
    const [formDesc, setFormDesc] = useState('Submit your information and we will get back to you as soon as possible.');
    const [submitBtnLabel, setSubmitBtnLabel] = useState('Submit');

    // Tree/Steps Config
    const [steps, setSteps] = useState(() => {
        const saved = localStorage.getItem('b2b_form_steps');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Migration: Flatten old multi-step structure if it has > 1 steps
                if (parsed.length > 1) {
                    const allFields = parsed.reduce((acc, step) => [...acc, ...step.fields], []);
                    return [{
                        id: 'form-fields',
                        name: 'Registration Form',
                        isOpen: true,
                        fields: allFields
                    }];
                }
                return parsed;
            } catch (e) {
                console.error("Failed to parse form steps from local storage", e);
            }
        }
        return [
            {
                id: 'form-fields',
                name: 'Registration Form',
                isOpen: true,
                fields: [
                    { id: 'company_name', name: 'Company name', type: 'text', required: true, metafieldType: 'none' },
                    { id: 'company_address', name: 'Company address', type: 'text', required: true, metafieldType: 'none' },
                    { id: 'apartment', name: 'Appartment, suite, etc.', type: 'text', required: false, metafieldType: 'none' },
                    { id: 'company_country', name: 'Company country', type: 'select', required: true, metafieldType: 'none' },
                    { id: 'company_city', name: 'Company city', type: 'text', required: true, metafieldType: 'none' },
                    { id: 'province', name: 'Province', type: 'text', required: true, metafieldType: 'none' },
                    { id: 'zip', name: 'Zip code / Postal code', type: 'text', required: true, metafieldType: 'none' },
                    { id: 'message', name: 'Message', type: 'textarea', required: false, metafieldType: 'none' },
                    { id: 'number', name: 'Number', type: 'number', required: false, metafieldType: 'none' },
                    { id: 'tax_id', name: 'Tax ID / VAT Number', type: 'text', required: true, metafieldType: 'none' },
                    { id: 'document_upload', name: 'Business License / Document Upload', type: 'file', required: false, metafieldType: 'none' },
                    { id: 'first_name', name: 'First name', type: 'text', required: true, metafieldType: 'none' },
                    { id: 'last_name', name: 'Last name', type: 'text', required: true, metafieldType: 'none' },
                    { id: 'email', name: 'Your email', type: 'email', required: true, metafieldType: 'none' },
                    { id: 'phone', name: 'Your phone number', type: 'phone', required: true, metafieldType: 'none' }
                ]
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem('b2b_form_steps', JSON.stringify(steps));
    }, [steps]);

    // Live Preview Form State
    const [previewFormData, setPreviewFormData] = useState({
        companyName: '',
        companyAddress: '',
        apartment: '',
        companyCountry: '',
        companyCity: '',
        province: '',
        zip: '',
        message: '',
        number: '',
        taxId: '',
        document_upload: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneCode: 'US +1',
        phone: ''
    });
    const [previewErrors, setPreviewErrors] = useState({});

    // Location API Data for Preview
    const [countriesList, setCountriesList] = useState([]);
    const [statesList, setStatesList] = useState([]);
    const [previewSelectedCountryCode, setPreviewSelectedCountryCode] = useState('');

    useEffect(() => {
        fetch('/api/b2b/locations/countries')
            .then(res => res.json())
            .then(data => setCountriesList(data || []))
            .catch(err => console.error('Error fetching countries:', err));
    }, []);

    useEffect(() => {
        if (previewSelectedCountryCode) {
            fetch(`/api/b2b/locations/states?countryCode=${previewSelectedCountryCode}`)
                .then(res => res.json())
                .then(data => setStatesList(data || []))
                .catch(err => console.error('Error fetching states:', err));
        } else {
            setStatesList([]);
        }
    }, [previewSelectedCountryCode]);

    // Submissions State (Temporary Local Storage)
    const [submissions, setSubmissions] = useState(() => {
        const saved = localStorage.getItem('b2b_submissions');
        const defaultMocks = [
            {
                id: '1',
                company: 'Acme Corp',
                contact: 'John Doe',
                email: 'john@acme.com',
                taxId: 'US-987654321',
                status: 'Pending',
                date: '2026-06-08'
            },
            {
                id: '2',
                company: 'Global Trade LLC',
                contact: 'Sarah Jenkins',
                email: 's.jenkins@globaltrade.com',
                taxId: 'GB-123456789',
                status: 'Approved',
                date: '2026-06-07'
            },
            {
                id: '3',
                company: 'Apex Retailers',
                contact: 'Michael Chang',
                email: 'mchang@apex.io',
                taxId: 'CA-445566778',
                status: 'Rejected',
                date: '2026-06-06'
            }
        ];

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (e) {
                console.error("Failed to parse submissions", e);
            }
        }
        return defaultMocks;
    });

    const [loadingLeads, setLoadingLeads] = useState(false);
    const [leadsError, setLeadsError] = useState('');

    const fetchLeads = async () => {
        setLoadingLeads(true);
        setLeadsError('');
        try {
            const response = await registrationService.getApplications();
            if (response && response.success && Array.isArray(response.data)) {
                setSubmissions(response.data);
            } else {
                // Safety: ensure we never set undefined/null
                setSubmissions([]);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
            setLeadsError("Failed to fetch applications from server.");
            // Don't clear submissions on error — keep whatever we have
        } finally {
            setLoadingLeads(false);
        }
    };

    // Fetch DB leads on tab change to Applications tab
    useEffect(() => {
        if (activeTab === 1) {
            fetchLeads();
        }
    }, [activeTab]);

    // Keep Local Storage in sync (with safety check)
    useEffect(() => {
        if (Array.isArray(submissions)) {
            localStorage.setItem('b2b_submissions', JSON.stringify(submissions));
        }
    }, [submissions]);


    // Active Preview Step index (matches expanded folder)
    const activeStepIndex = steps.findIndex(s => s.id === activeEditSection) >= 0 
        ? steps.findIndex(s => s.id === activeEditSection)
        : 0;

    const handleTabChange = (selectedTabIndex) => {
        setActiveTab(selectedTabIndex);
    };

    const handleToggleFolder = (stepId) => {
        setSteps(steps.map(s => s.id === stepId ? { ...s, isOpen: !s.isOpen } : s));
        setActiveEditSection(stepId);
    };

    const handleToggleFieldRequired = (stepId, fieldId) => {
        setSteps(steps.map(s => {
            if (s.id === stepId) {
                return {
                    ...s,
                    fields: s.fields.map(f => f.id === fieldId ? { ...f, required: !f.required } : f)
                };
            }
            return s;
        }));
    };

    const handleDeleteField = (stepId, fieldId) => {
        setSteps(steps.map(s => {
            if (s.id === stepId) {
                return {
                    ...s,
                    fields: s.fields.filter(f => f.id !== fieldId)
                };
            }
            return s;
        }));
    };

    const handleAddField = (stepId) => {
        const fieldName = prompt("Enter new field name:");
        if (!fieldName) return;
        const newId = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        setSteps(steps.map(s => {
            if (s.id === stepId) {
                return {
                    ...s,
                    fields: [...s.fields, { id: newId, name: fieldName, type: 'text', required: false, metafieldType: 'none' }]
                };
            }
            return s;
        }));
    };

    const handleToggleMetafield = (stepId, fieldId) => {
        const options = ['none', 'customer', 'company'];
        setSteps(steps.map(s => {
            if (s.id === stepId) {
                return {
                    ...s,
                    fields: s.fields.map(f => {
                        if (f.id === fieldId) {
                            const current = f.metafieldType || 'none';
                            const nextIndex = (options.indexOf(current) + 1) % options.length;
                            return { ...f, metafieldType: options[nextIndex] };
                        }
                        return f;
                    })
                };
            }
            return s;
        }));
    };

    const handleRenameField = (stepId, fieldId, currentName) => {
        const newName = prompt("Enter new field name:", currentName);
        if (!newName || newName === currentName) return;
        setSteps(steps.map(s => {
            if (s.id === stepId) {
                return {
                    ...s,
                    fields: s.fields.map(f => f.id === fieldId ? { ...f, name: newName } : f)
                };
            }
            return s;
        }));
    };

    const handleAddStep = () => {
        const stepName = prompt("Enter new step name:");
        if (!stepName) return;
        const newId = stepName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        setSteps([...steps, { id: newId, name: stepName, isOpen: true, fields: [] }]);
        setActiveEditSection(newId);
    };

    const handlePreviewChange = (fieldId, val) => {
        setPreviewFormData(prev => ({ ...prev, [fieldId]: val }));
        if (previewErrors[fieldId]) {
            setPreviewErrors(prev => ({ ...prev, [fieldId]: '' }));
        }

        // Special handling for Country to load states
        if (fieldId === 'companyCountry') {
            const country = countriesList.find(c => c.name === val || c.isoCode === val);
            setPreviewSelectedCountryCode(country ? country.isoCode : '');
            setPreviewFormData(prev => ({ ...prev, province: '' })); // reset state when country changes
        }
    };

    const handleApprove = async (id) => {
        try {
            const response = await registrationService.approveApplication(id);
            if (response.success) {
                setSubmissions(prev => prev.map(sub => 
                    sub.id === id ? { ...sub, status: 'Approved' } : sub
                ));
            }
        } catch (error) {
            alert(error.message || "Failed to approve application.");
        }
    };

    const handleReject = async (id) => {
        try {
            const response = await registrationService.rejectApplication(id);
            if (response.success) {
                setSubmissions(prev => prev.map(sub => 
                    sub.id === id ? { ...sub, status: 'Rejected' } : sub
                ));
            }
        } catch (error) {
            alert(error.message || "Failed to reject application.");
        }
    };


    const handleClearSubmissions = () => {
        if (confirm("Are you sure you want to clear all lead submissions?")) {
            setSubmissions([]);
        }
    };

    // Submitting live preview form
    const handlePreviewSubmit = async () => {
        // Validate Preview
        const newErrors = {};
        const allFields = steps[0]?.fields || [];
        allFields.forEach(field => {
            const stateKey = field.id === 'company_name' ? 'companyName' :
                             field.id === 'company_address' ? 'companyAddress' :
                             field.id === 'apartment' ? 'apartment' :
                             field.id === 'company_city' ? 'companyCity' :
                             field.id === 'province' ? 'province' :
                             field.id === 'zip' ? 'zip' :
                             field.id === 'message' ? 'message' :
                             field.id === 'number' ? 'number' :
                             field.id === 'tax_id' ? 'taxId' :
                             field.id === 'email' ? 'email' :
                             field.id === 'first_name' ? 'firstName' :
                             field.id === 'last_name' ? 'lastName' :
                             field.id === 'company_country' ? 'companyCountry' : field.id;

            const val = previewFormData[stateKey];
            if (field.required && (!val || (typeof val === 'string' && !val.trim())) && field.type !== 'file') {
                if (stateKey === 'province' && statesList.length === 0) {
                    // Skip validation for province if no states
                } else {
                    newErrors[stateKey] = `${field.name} is required`;
                }
            } else if (stateKey === 'email' && val && !/\S+@\S+\.\S+/.test(val)) {
                newErrors.email = 'Please enter a valid email address';
            } else if (stateKey === 'phone' && val) {
                const phoneRegex = /^[0-9\+\-\s\(\)]+$/;
                if (!phoneRegex.test(val)) {
                    newErrors.phone = 'Invalid phone number format';
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setPreviewErrors(newErrors);
            return;
        }

        try {
            const submitData = {
                firstName: previewFormData.firstName || 'Jane',
                lastName: previewFormData.lastName || 'Smith',
                email: previewFormData.email || 'jane@company.com',
                companyName: previewFormData.companyName || 'Mock Company LLC',
                address: previewFormData.companyAddress || '123 Preview St',
                city: previewFormData.companyCity || 'Cityville',
                zip: previewFormData.zip || '12345',
                country: previewFormData.companyCountry || 'United States',
                taxId: previewFormData.taxId || '',
                phone: previewFormData.phone || '',
                notes: previewFormData.message || ''
            };
            
            await registrationService.submitRegistration(submitData);
        } catch (error) {
            console.error("Failed to save preview submission to database", error);
        }

        // Redirect to the customer listing page
        navigate('/customers');
    };

    // Rendering SVG Icons helper
    const getFieldIcon = (fieldId) => {
        if (fieldId.includes('email')) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
            );
        }
        if (fieldId.includes('phone')) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
            );
        }
        if (fieldId.includes('address') || fieldId.includes('city') || fieldId.includes('province') || fieldId.includes('zip')) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            );
        }
        if (fieldId.includes('country') || fieldId.includes('globe')) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            );
        }
        if (fieldId.includes('name') || fieldId.includes('user')) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            );
        }
        if (fieldId.includes('document') || fieldId.includes('file')) {
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
            );
        }
        return (
            <span style={{ fontSize: '12px', fontWeight: 'semibold', color: '#6d7175' }}>@</span>
        );
    };

    // Submissions table rows (with safety fallback)
    const safeSubmissions = Array.isArray(submissions) ? submissions : [];
    const submissionRows = safeSubmissions.map((sub) => {
        // Format Date
        const dateStr = sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '-';
        // Support both old simulated structure (sub.company, sub.contact) and database structure (sub.company_name, sub.first_name, sub.last_name)
        const companyName = sub.company_name || sub.company;
        const contactName = sub.first_name ? `${sub.first_name} ${sub.last_name}` : sub.contact;
        const taxId = sub.tax_id || sub.taxId;

        return [
            dateStr,
            <Text variant="bodyMd" fontWeight="semibold">{companyName}</Text>,
            <span 
                style={{ cursor: 'pointer', color: '#005bd3', fontWeight: '500', textDecoration: 'underline' }} 
                onClick={() => navigate(`/customers/${sub.id}`)}
            >
                {contactName}
            </span>,
            sub.email,
            sub.phone || '-',
            taxId || '-'
        ];
    });


    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f1f2f4', overflow: 'hidden' }}>
            {/* Form Top Header Bar */}
            <div style={{
                height: '56px',
                backgroundColor: 'white',
                borderBottom: '1px solid #e1e3e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                zIndex: 10
            }}>
                <InlineStack gap="300" blockAlign="center">
                    <button 
                        onClick={onBack}
                        style={{ 
                            border: 'none', 
                            background: 'none', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '6px',
                            borderRadius: '4px',
                            color: '#616161'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f2f4'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <Text variant="headingMd" as="h1">B2B/Wholesale registration form</Text>
                    <Badge tone={isActive ? 'success' : 'subdued'}>{isActive ? 'Active' : 'Inactive'}</Badge>
                    <span 
                        onClick={() => setIsActive(!isActive)}
                        style={{ fontSize: '11px', color: '#008060', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Toggle Status
                    </span>
                </InlineStack>

                <InlineStack gap="300" blockAlign="center">
                    {/* Device Selector */}
                    {activeTab === 0 && (
                        <div style={{
                            display: 'flex',
                            border: '1px solid #c9cccf',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            backgroundColor: '#fafafa'
                        }}>
                            <button 
                                onClick={() => setDeviceMode('desktop')}
                                style={{
                                    border: 'none',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: deviceMode === 'desktop' ? '#ebebeb' : 'transparent',
                                    cursor: 'pointer',
                                    color: '#303030'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                </svg>
                            </button>
                            <button 
                                onClick={() => setDeviceMode('mobile')}
                                style={{
                                    border: 'none',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: deviceMode === 'mobile' ? '#ebebeb' : 'transparent',
                                    cursor: 'pointer',
                                    color: '#303030'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={onBack}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #c9cccf',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        Discard
                    </button>
                    <button 
                        onClick={() => alert("Form changes saved successfully!")}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: '#1a1a1a',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        Save
                    </button>
                </InlineStack>
            </div>

            {/* Inner Tabs Bar */}
            <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e1e3e5', padding: '0 24px' }}>
                <Tabs tabs={builderTabs} selected={activeTab} onSelect={handleTabChange} />
            </div>

            {/* Main Editor / Leads Content Area */}
            {activeTab === 0 ? (
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left Panel: Accordion Sidebar Node Tree */}
                    <div style={{
                        width: '320px',
                        backgroundColor: 'white',
                        borderRight: '1px solid #e1e3e5',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                        padding: '16px'
                    }}>
                        <BlockStack gap="400">
                            {/* Header Settings Node */}
                            <div 
                                onClick={() => setActiveEditSection('header')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    backgroundColor: activeEditSection === 'header' ? '#f1f2f4' : 'transparent',
                                    border: '1px solid transparent'
                                }}
                            >
                                <InlineStack gap="150" blockAlign="center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6d7175" strokeWidth="2">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                        <line x1="4" y1="22" x2="4" y2="15"></line>
                                    </svg>
                                    <Text variant="bodyMd" fontWeight="semibold">Header</Text>
                                </InlineStack>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c9196" strokeWidth="2">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                            </div>

                            {/* Fields Header */}
                            <div>
                                <Text variant="headingSm" as="h3" tone="subdued">Fields</Text>
                            </div>

                            {/* Step items with Tree node lists */}
                            <BlockStack gap="200">
                                {steps.map((step) => {
                                    const isSelectedStep = activeEditSection === step.id;
                                    
                                    return (
                                        <div key={step.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                            {/* Step Title Row */}
                                            <div 
                                                onClick={() => handleToggleFolder(step.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 12px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelectedStep ? '#e0f2fe' : 'transparent',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <InlineStack gap="150" blockAlign="center">
                                                    <svg 
                                                        width="16" 
                                                        height="16" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke={isSelectedStep ? '#0284c7' : '#6d7175'} 
                                                        strokeWidth="2"
                                                        style={{ transform: step.isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
                                                    >
                                                        <polyline points="9 18 15 12 9 6"></polyline>
                                                    </svg>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isSelectedStep ? '#0284c7' : '#6d7175'} strokeWidth="2">
                                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                                    </svg>
                                                    <Text variant="bodyMd" fontWeight={isSelectedStep ? 'bold' : 'semibold'}>
                                                        {step.name}
                                                    </Text>
                                                </InlineStack>
                                                
                                                <InlineStack gap="100" blockAlign="center">
                                                    <span 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddField(step.id);
                                                        }}
                                                        style={{
                                                            fontSize: '12px',
                                                            color: '#008060',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #c9cccf',
                                                            backgroundColor: 'white'
                                                        }}
                                                    >
                                                        + Add
                                                    </span>
                                                </InlineStack>
                                            </div>

                                            {/* Nested Field items list */}
                                            {step.isOpen && (
                                                <div style={{
                                                    paddingLeft: '24px',
                                                    borderLeft: '1px dashed #c9cccf',
                                                    marginLeft: '20px',
                                                    marginTop: '4px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px'
                                                }}>
                                                    {step.fields.map((field) => (
                                                        <div 
                                                            key={field.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '6px 8px',
                                                                borderRadius: '4px',
                                                                cursor: 'default',
                                                                backgroundColor: '#fafafa',
                                                                fontSize: '13px',
                                                                border: '1px solid rgba(0,0,0,0.03)'
                                                            }}
                                                        >
                                                            <InlineStack gap="100" blockAlign="center">
                                                                <span style={{ color: '#8c9196', display: 'flex', alignItems: 'center' }}>
                                                                    {getFieldIcon(field.id)}
                                                                </span>
                                                                <span 
                                                                    onClick={() => handleRenameField(step.id, field.id, field.name)}
                                                                    title="Click to rename field"
                                                                    style={{ fontWeight: '500', color: '#303030', cursor: 'pointer', borderBottom: '1px dashed #c9cccf' }}
                                                                >
                                                                    {field.name} {field.required && <span style={{ color: '#d82c0d' }}>*</span>}
                                                                </span>
                                                            </InlineStack>

                                                            <InlineStack gap="100" blockAlign="center">
                                                                {/* Toggle Required */}
                                                                <button 
                                                                    title={field.required ? 'Make Optional' : 'Make Required'}
                                                                    onClick={() => handleToggleFieldRequired(step.id, field.id)}
                                                                    style={{
                                                                        border: '1px solid #c9cccf',
                                                                        borderRadius: '4px',
                                                                        background: '#fff',
                                                                        cursor: 'pointer',
                                                                        color: field.required ? '#d82c0d' : '#8c9196',
                                                                        padding: '2px 6px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 'bold',
                                                                        marginRight: '4px'
                                                                    }}
                                                                >
                                                                    {field.required ? 'Req' : 'Opt'}
                                                                </button>
                                                                {/* Delete Field */}
                                                                <button 
                                                                    onClick={() => handleDeleteField(step.id, field.id)}
                                                                    style={{
                                                                        border: 'none',
                                                                        background: 'none',
                                                                        cursor: 'pointer',
                                                                        color: '#8c9196',
                                                                        padding: '2px'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#d82c0d'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.color = '#8c9196'}
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                    </svg>
                                                                </button>
                                                            </InlineStack>
                                                        </div>
                                                    ))}
                                                    {step.fields.length === 0 && (
                                                        <span style={{ fontSize: '12px', color: '#8c9196', fontStyle: 'italic', padding: '4px 8px' }}>
                                                            No fields. Click + Add to insert.
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </BlockStack>

                            {/* Add Step Button */}
                            <div style={{ padding: '4px 0' }}>
                                <Button variant="secondary" onClick={handleAddStep} fullWidth>
                                    + Add step
                                </Button>
                            </div>

                            {/* Footer Node */}
                            <div 
                                onClick={() => setActiveEditSection('footer')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    backgroundColor: activeEditSection === 'footer' ? '#f1f2f4' : 'transparent',
                                    border: '1px solid transparent'
                                }}
                            >
                                <InlineStack gap="150" blockAlign="center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6d7175" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="3" y1="17" x2="21" y2="17"></line>
                                    </svg>
                                    <Text variant="bodyMd" fontWeight="semibold">Footer</Text>
                                </InlineStack>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c9196" strokeWidth="2">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                            </div>

                            {/* Accordion Edit Drawer details based on selected node */}
                            <Divider />
                            
                            <Card padding="300">
                                {activeEditSection === 'header' && (
                                    <BlockStack gap="300">
                                        <Text variant="headingSm">Edit Header</Text>
                                        <TextField
                                            label="Form Heading Title"
                                            value={formTitle}
                                            onChange={(v) => setFormTitle(v)}
                                            autoComplete="off"
                                        />
                                        <TextField
                                            label="Form Subheading Description"
                                            value={formDesc}
                                            onChange={(v) => setFormDesc(v)}
                                            multiline={3}
                                            autoComplete="off"
                                        />
                                    </BlockStack>
                                )}

                                {activeEditSection === 'footer' && (
                                    <BlockStack gap="300">
                                        <Text variant="headingSm">Edit Footer</Text>
                                        <TextField
                                            label="Submit Button Text"
                                            value={submitBtnLabel}
                                            onChange={(v) => setSubmitBtnLabel(v)}
                                            autoComplete="off"
                                        />
                                    </BlockStack>
                                )}

                                {activeEditSection !== 'header' && activeEditSection !== 'footer' && (
                                    <BlockStack gap="200">
                                        <Text variant="headingSm">Step Details</Text>
                                        <Text variant="bodySm" tone="subdued">
                                            Step Name: <strong>{steps.find(s => s.id === activeEditSection)?.name}</strong>
                                        </Text>
                                        <Text variant="bodyXs" tone="subdued">
                                            Type details inside the Live Storefront form fields in the preview frame to test inputting data.
                                        </Text>
                                    </BlockStack>
                                )}
                            </Card>
                        </BlockStack>
                    </div>

                    {/* Right Area: Interactive Frame Device Preview Panel */}
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'flex-start',
                        padding: '40px 24px', 
                        overflowY: 'auto' 
                    }}>
                        {/* Device Width Container Wrapper */}
                        <div style={{
                            width: deviceMode === 'mobile' ? '375px' : '100%',
                            maxWidth: deviceMode === 'mobile' ? '375px' : '820px',
                            backgroundColor: 'white',
                            border: '1.5px solid #dcdcdc',
                            borderRadius: deviceMode === 'mobile' ? '36px' : '8px',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                            padding: deviceMode === 'mobile' ? '28px 16px' : '36px 44px',
                            boxSizing: 'border-box',
                            transition: 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                            position: 'relative'
                        }}>
                            {/* Mock Phone Notch / Bezel */}
                            {deviceMode === 'mobile' && (
                                <div style={{
                                    width: '130px',
                                    height: '18px',
                                    backgroundColor: '#1a1a1a',
                                    borderBottomLeftRadius: '12px',
                                    borderBottomRightRadius: '12px',
                                    position: 'absolute',
                                    top: '0',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 5
                                }} />
                            )}

                            {/* Preview Form Content Card */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Headings */}
                                <div>
                                    <h1 style={{ 
                                        fontSize: deviceMode === 'mobile' ? '22px' : '28px', 
                                        fontWeight: '700', 
                                        color: '#1a1a1a', 
                                        margin: '0 0 6px 0',
                                        textAlign: 'center'
                                    }}>
                                        {formTitle || 'Wholesale Application'}
                                    </h1>
                                    <p style={{ 
                                        fontSize: '14px', 
                                        color: '#6d7175', 
                                        margin: 0,
                                        textAlign: 'center'
                                    }}>
                                        {formDesc || 'Fill in the details to complete registration.'}
                                    </p>
                                </div>

                                <Divider />

                                {/* Render Active Step Fields with editable state */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                                    {steps[activeStepIndex] && steps[activeStepIndex].fields.map((field) => {
                                        // Custom side-by-side render for First Name / Last Name in Step 3
                                        if (field.id === 'first_name') {
                                            const lastNameField = steps[activeStepIndex].fields.find(f => f.id === 'last_name');
                                            return (
                                                <div key={field.id} style={{ display: 'flex', gap: '16px', flexDirection: deviceMode === 'mobile' ? 'column' : 'row' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>
                                                            {field.name} {field.required && <span style={{ color: '#d82c0d' }}>*</span>}
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={previewFormData.firstName}
                                                            onChange={(e) => handlePreviewChange('firstName', e.target.value)}
                                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${previewErrors.firstName ? '#d82c0d' : '#c9cccf'}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                                            placeholder="e.g. John"
                                                        />
                                                        {previewErrors.firstName && <div style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px' }}>{previewErrors.firstName}</div>}
                                                    </div>
                                                    {lastNameField && (
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>
                                                                {lastNameField.name} {lastNameField.required && <span style={{ color: '#d82c0d' }}>*</span>}
                                                            </label>
                                                            <input 
                                                                type="text" 
                                                                value={previewFormData.lastName}
                                                                onChange={(e) => handlePreviewChange('lastName', e.target.value)}
                                                                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${previewErrors.lastName ? '#d82c0d' : '#c9cccf'}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                                                placeholder="e.g. Doe"
                                                            />
                                                            {previewErrors.lastName && <div style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px' }}>{previewErrors.lastName}</div>}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                        
                                        // Skip rendering Last Name stand-alone because it was already rendered side-by-side with First Name
                                        if (field.id === 'last_name') return null;

                                        // Custom render for Phone Number with Country Code Dropdown
                                        if (field.id === 'phone') {
                                            return (
                                                <div key={field.id}>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>
                                                        {field.name} {field.required && <span style={{ color: '#d82c0d' }}>*</span>}
                                                    </label>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <select 
                                                            value={previewFormData.phoneCode}
                                                            onChange={(e) => handlePreviewChange('phoneCode', e.target.value)}
                                                            style={{ padding: '10px', border: '1px solid #c9cccf', borderRadius: '6px', backgroundColor: '#fafafa', fontSize: '14px', width: '90px', cursor: 'pointer' }}
                                                        >
                                                            <option value="US +1">US +1</option>
                                                            <option value="CA +1">CA +1</option>
                                                            <option value="UK +44">UK +44</option>
                                                        </select>
                                                        <input 
                                                            type="text" 
                                                            placeholder="201-555-0123"
                                                            value={previewFormData.phone}
                                                            onChange={(e) => handlePreviewChange('phone', e.target.value)}
                                                            style={{ flex: 1, padding: '10px 12px', border: `1px solid ${previewErrors.phone ? '#d82c0d' : '#c9cccf'}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                                        />
                                                    </div>
                                                    {previewErrors.phone && <div style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px' }}>{previewErrors.phone}</div>}
                                                </div>
                                            );
                                        }

                                        // Country Dropdown
                                        if (field.type === 'select' || field.id === 'company_country') {
                                            return (
                                                <div key={field.id}>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>
                                                        {field.name} {field.required && <span style={{ color: '#d82c0d' }}>*</span>}
                                                    </label>
                                                    <select 
                                                        value={previewSelectedCountryCode}
                                                        onChange={(e) => {
                                                            const isoCode = e.target.value;
                                                            const countryName = countriesList.find(c => c.isoCode === isoCode)?.name || '';
                                                            handlePreviewChange('companyCountry', countryName);
                                                        }}
                                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${previewErrors.companyCountry ? '#d82c0d' : '#c9cccf'}`, borderRadius: '6px', backgroundColor: 'white', fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer' }}
                                                    >
                                                        <option value="">Select country</option>
                                                        {countriesList.map(country => (
                                                            <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                                                        ))}
                                                    </select>
                                                    {previewErrors.companyCountry && <div style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px' }}>{previewErrors.companyCountry}</div>}
                                                </div>
                                            );
                                        }

                                        // File Upload Drop Container
                                        if (field.type === 'file' || field.id === 'document_upload') {
                                            return (
                                                <div key={field.id}>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>
                                                        {field.name} {field.required && <span style={{ color: '#d82c0d' }}>*</span>}
                                                    </label>
                                                    <div 
                                                        onClick={() => {
                                                            const fileName = prompt("Upload simulated business document (e.g. resale_license.pdf):");
                                                            if (fileName) {
                                                                handlePreviewChange('document_upload', fileName);
                                                            }
                                                        }}
                                                        style={{
                                                            border: '1.5px dashed #c9cccf',
                                                            borderRadius: '8px',
                                                            padding: '24px 16px',
                                                            textAlign: 'center',
                                                            backgroundColor: '#fafafa',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d7175" strokeWidth="2" style={{ marginBottom: '8px', display: 'inline-block' }}>
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                            <polyline points="17 8 12 3 7 8"></polyline>
                                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                                        </svg>
                                                        <p style={{ margin: 0, fontSize: '13px', color: '#6d7175', fontWeight: '500' }}>
                                                            {previewFormData.document_upload ? `Selected: ${previewFormData.document_upload}` : 'Click to upload or drag files here (PDF, PNG, JPG)'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Hide Province if no states
                                        if (field.id === 'province' && statesList.length === 0) {
                                            return null;
                                        }

                                        // Render Province Dropdown if states exist
                                        if (field.id === 'province' && statesList.length > 0) {
                                            return (
                                                <div key={field.id}>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>
                                                        {field.name} {field.required && <span style={{ color: '#d82c0d' }}>*</span>}
                                                    </label>
                                                    <select 
                                                        value={previewFormData.province}
                                                        onChange={(e) => handlePreviewChange('province', e.target.value)}
                                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${previewErrors.province ? '#d82c0d' : '#c9cccf'}`, borderRadius: '6px', backgroundColor: 'white', fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer' }}
                                                    >
                                                        <option value="">Select province/state</option>
                                                        {statesList.map(state => (
                                                            <option key={state.isoCode} value={state.name}>{state.name}</option>
                                                        ))}
                                                    </select>
                                                    {previewErrors.province && <div style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px' }}>{previewErrors.province}</div>}
                                                </div>
                                            );
                                        }

                                        // Standard input / textarea
                                        const formVal = field.id === 'company_name' ? previewFormData.companyName :
                                                        field.id === 'company_address' ? previewFormData.companyAddress :
                                                        field.id === 'apartment' ? previewFormData.apartment :
                                                        field.id === 'company_city' ? previewFormData.companyCity :
                                                        field.id === 'province' ? previewFormData.province :
                                                        field.id === 'zip' ? previewFormData.zip :
                                                        field.id === 'message' ? previewFormData.message :
                                                        field.id === 'number' ? previewFormData.number :
                                                        field.id === 'tax_id' ? previewFormData.taxId :
                                                        field.id === 'email' ? previewFormData.email : '';
                                                        
                                        const stateKey = field.id === 'company_name' ? 'companyName' :
                                                         field.id === 'company_address' ? 'companyAddress' :
                                                         field.id === 'apartment' ? 'apartment' :
                                                         field.id === 'company_city' ? 'companyCity' :
                                                         field.id === 'province' ? 'province' :
                                                         field.id === 'zip' ? 'zip' :
                                                         field.id === 'message' ? 'message' :
                                                         field.id === 'number' ? 'number' :
                                                         field.id === 'tax_id' ? 'taxId' :
                                                         field.id === 'email' ? 'email' : field.id;

                                        return (
                                            <div key={field.id}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>
                                                    {field.name} {field.required && <span style={{ color: '#d82c0d' }}>*</span>}
                                                </label>
                                                {field.type === 'textarea' ? (
                                                    <textarea 
                                                        rows="3" 
                                                        value={formVal}
                                                        onChange={(e) => handlePreviewChange(stateKey, e.target.value)}
                                                        placeholder={`Enter ${field.name.toLowerCase()}`}
                                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${previewErrors[stateKey] ? '#d82c0d' : '#c9cccf'}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'none' }}
                                                    />
                                                ) : (
                                                    <input 
                                                        type="text" 
                                                        value={formVal}
                                                        onChange={(e) => handlePreviewChange(stateKey, e.target.value)}
                                                        placeholder={`Enter ${field.name.toLowerCase()}`}
                                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${previewErrors[stateKey] ? '#d82c0d' : '#c9cccf'}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                                    />
                                                )}
                                                {previewErrors[stateKey] && <div style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px' }}>{previewErrors[stateKey]}</div>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Wizard Footer Navigation Controls Removed for single-page layout */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', alignItems: 'center' }}>
                                    <button 
                                        onClick={handlePreviewSubmit}
                                        style={{
                                            padding: '10px 24px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            backgroundColor: '#1a1a1a', 
                                            color: 'white',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {submitBtnLabel || 'Submit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Tab 2: Applications & Leads Table Listing */
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                    <BlockStack gap="400">
                        <InlineStack align="space-between" blockAlign="center">
                            <div>
                                <Text variant="headingMd" as="h2">Incoming Applications</Text>
                                <Text variant="bodySm" tone="subdued">Review and approve self-service registration forms before creating company accounts.</Text>
                            </div>
                            <Button tone="critical" onClick={handleClearSubmissions} disabled={safeSubmissions.length === 0}>
                                Clear all leads
                            </Button>
                        </InlineStack>

                        <Card padding="0">
                            {safeSubmissions.length > 0 ? (
                                <DataTable
                                    columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                                    headings={['Date', 'Company', 'Contact Person', 'Email Address', 'Phone', 'Tax ID']}
                                    rows={submissionRows}
                                />
                            ) : (
                                <Box padding="1000" style={{ textAlign: 'center' }}>
                                    <BlockStack gap="200" align="center">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8c9196" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        <Text variant="headingSm">No applications found</Text>
                                        <Text variant="bodySm" tone="subdued">Try typing and submitting some data inside the Live Preview form on the editor tab!</Text>
                                    </BlockStack>
                                </Box>
                            )}
                        </Card>
                    </BlockStack>
                </div>
            )}
        </div>
    );
}
