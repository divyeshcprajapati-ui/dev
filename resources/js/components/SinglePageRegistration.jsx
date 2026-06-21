import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationService } from '../services/registrationService';
import { quoteService } from '../services/quoteService';

export default function SinglePageRegistration() {
    const navigate = useNavigate();

    // Portal Navigation Tabs
    const [activePortalTab, setActivePortalTab] = useState(1); // Default to B2B Quotes tab

    // B2B Quotes sub-views: 'product_page' or 'my_quotes' or 'quote_detail'
    const [quotesSubView, setQuotesSubView] = useState('product_page');
    const [customerQuotes, setCustomerQuotes] = useState([]);
    const [selectedQuoteId, setSelectedQuoteId] = useState(null);
    const [selectedQuote, setSelectedQuote] = useState(null);

    // Product Page Quantity State
    const [productQty, setProductQty] = useState(100);
    const [showQuoteModal, setShowQuoteModal] = useState(false);

    // Quote Request Modal input values
    const [quotedPriceInput, setQuotedPriceInput] = useState('1.80');
    const [modalQty, setModalQty] = useState(100);
    const [quoteSettings, setQuoteSettings] = useState({
        productPage: true,
        cartPage: false,
        notLoggedIn: false,
        emptyQuoteButton: false
    });

    // Default fields to use if nothing is configured in the admin
    const defaultFields = {
        first_name: { label: 'First Name', type: 'text', required: true, metafieldType: 'none' },
        last_name: { label: 'Last Name', type: 'text', required: true, metafieldType: 'none' },
        email: { label: 'Business Email', type: 'email', required: true, metafieldType: 'none' },
        company_name: { label: 'Company Name', type: 'text', required: true, metafieldType: 'none' },
        tax_id: { label: 'Tax ID / VAT Number', type: 'text', required: false, metafieldType: 'none' },
        phone: { label: 'Phone Number', type: 'text', required: false, metafieldType: 'none' },
        company_address: { label: 'Street Address', type: 'text', required: true, metafieldType: 'none' },
        apartment: { label: 'Apartment, suite, etc.', type: 'text', required: false, metafieldType: 'none' },
        company_city: { label: 'City', type: 'text', required: true, metafieldType: 'none' },
        province: { label: 'State/Province', type: 'text', required: true, metafieldType: 'none' },
        zip: { label: 'ZIP / Postal Code', type: 'text', required: true, metafieldType: 'none' },
        company_country: { label: 'Country', type: 'text', required: true, metafieldType: 'none' },
        message: { label: 'Additional Comments / Notes', type: 'textarea', required: false, metafieldType: 'none' },
        document_upload: { label: 'Business License / Reseller Certificate', type: 'file', required: false, metafieldType: 'none' }
    };

    const [fieldConfig, setFieldConfig] = useState(defaultFields);
    
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        company_name: '',
        tax_id: '',
        phone: '',
        company_address: '',
        apartment: '',
        company_city: '',
        province: '',
        zip: '',
        company_country: '',
        document_upload: '',
        message: ''
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [fileObject, setFileObject] = useState(null);
    const [generalError, setGeneralError] = useState('');

    // Location States (Backend API integration)
    const [countriesList, setCountriesList] = useState([]);
    const [statesList, setStatesList] = useState([]);
    const [citiesList, setCitiesList] = useState([]);
    
    const [selectedCountryCode, setSelectedCountryCode] = useState('');
    const [selectedStateCode, setSelectedStateCode] = useState('');

    useEffect(() => {
        fetch('/api/b2b/locations/countries')
            .then(res => res.json())
            .then(data => setCountriesList(data || []))
            .catch(err => console.error('Error fetching countries:', err));

        // Fetch quote settings
        quoteService.getSettings()
            .then(res => {
                if (res && res.success && res.data) {
                    const data = res.data;
                    setQuoteSettings({
                        productPage: data.productPage === 'true' || data.productPage === true,
                        cartPage: data.cartPage === 'true' || data.cartPage === true,
                        notLoggedIn: data.notLoggedIn === 'true' || data.notLoggedIn === true,
                        emptyQuoteButton: data.emptyQuoteButton === 'true' || data.emptyQuoteButton === true
                    });
                }
            })
            .catch(err => console.error('Error loading quote settings:', err));

        // Fetch submitted quotes
        fetchCustomerQuotes();
    }, []);

    const fetchCustomerQuotes = async () => {
        try {
            const res = await quoteService.getQuotes();
            if (res && res.success && Array.isArray(res.data)) {
                setCustomerQuotes(res.data);
            }
        } catch (e) {
            console.error('Failed to load quotes:', e);
        }
    };

    useEffect(() => {
        if (selectedCountryCode) {
            fetch(`/api/b2b/locations/states?countryCode=${selectedCountryCode}`)
                .then(res => res.json())
                .then(data => setStatesList(data || []))
                .catch(err => console.error('Error fetching states:', err));
        } else {
            setStatesList([]);
        }
    }, [selectedCountryCode]);

    useEffect(() => {
        if (selectedCountryCode && selectedStateCode) {
            fetch(`/api/b2b/locations/cities?countryCode=${selectedCountryCode}&stateCode=${selectedStateCode}`)
                .then(res => res.json())
                .then(data => setCitiesList(data || []))
                .catch(err => console.error('Error fetching cities:', err));
        } else {
            setCitiesList([]);
        }
    }, [selectedCountryCode, selectedStateCode]);

    useEffect(() => {
        const savedConfig = localStorage.getItem('b2b_form_steps');
        if (savedConfig) {
            try {
                const parsedSteps = JSON.parse(savedConfig);
                const mergedConfig = { ...defaultFields };
                const newFormData = { ...formData };
                
                parsedSteps.forEach(step => {
                    step.fields.forEach(f => {
                        if (mergedConfig[f.id]) {
                            mergedConfig[f.id].label = f.name;
                            mergedConfig[f.id].required = f.required;
                            mergedConfig[f.id].metafieldType = f.metafieldType || 'none';
                        } else {
                            mergedConfig[f.id] = { label: f.name, type: f.type, required: f.required, metafieldType: f.metafieldType || 'none' };
                            if (!(f.id in newFormData)) {
                                newFormData[f.id] = '';
                            }
                        }
                    });
                });
                
                setFieldConfig(mergedConfig);
                setFormData(newFormData);
            } catch (e) {
                console.error("Could not load dynamic configuration", e);
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCountryChange = (e) => {
        const isoCode = e.target.value;
        setSelectedCountryCode(isoCode);
        const countryName = countriesList.find(c => c.isoCode === isoCode)?.name || '';
        setFormData(prev => ({ ...prev, company_country: countryName, province: '', company_city: '' }));
        setSelectedStateCode('');
        if (errors.company_country) setErrors(prev => ({ ...prev, company_country: '' }));
    };

    const handleStateChange = (e) => {
        const isoCode = e.target.value;
        setSelectedStateCode(isoCode);
        const stateName = statesList.find(s => s.isoCode === isoCode)?.name || '';
        setFormData(prev => ({ ...prev, province: stateName, company_city: '' }));
        if (errors.province) setErrors(prev => ({ ...prev, province: '' }));
    };

    const handleCityChange = (e) => {
        const cityName = e.target.value;
        setFormData(prev => ({ ...prev, company_city: cityName }));
        if (errors.company_city) setErrors(prev => ({ ...prev, company_city: '' }));
    };

    const validate = () => {
        const newErrors = {};
        Object.keys(fieldConfig).forEach(key => {
            const config = fieldConfig[key];
            if (config.required && !formData[key]?.trim() && config.type !== 'file') {
                if (key === 'province' && statesList.length === 0) {
                    // Do not require province if country has no states
                } else {
                    newErrors[key] = `${config.label} is required`;
                }
            }
            if (key === 'email' && formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            }
            if (key === 'phone' && formData.phone) {
                const phoneRegex = /^[0-9\+\-\s\(\)]+$/;
                if (!phoneRegex.test(formData.phone)) {
                    newErrors.phone = 'Phone number can only contain numbers and basic symbols (+, -, (, ))';
                }
            }
        });
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setLoading(true);
        try {
            const submitData = { ...formData };
            delete submitData.document_upload; 

            const customerMetafields = {};
            const companyMetafields = {};

            Object.keys(fieldConfig).forEach(key => {
                if (fieldConfig[key].metafieldType === 'customer') {
                    customerMetafields[key] = submitData[key];
                } else if (fieldConfig[key].metafieldType === 'company') {
                    companyMetafields[key] = submitData[key];
                }
            });

            if (Object.keys(customerMetafields).length > 0) submitData.customer_metafields = JSON.stringify(customerMetafields);
            if (Object.keys(companyMetafields).length > 0) submitData.company_metafields = JSON.stringify(companyMetafields);

            const response = await registrationService.submitRegistration(submitData, fileObject);
            
            if (response.success) {
                setLoading(false);
                setSubmitted(true);
            } else {
                setGeneralError(response.message || 'Submission failed. Please try again.');
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
            if (error.errors) {
                const apiErrors = {};
                Object.keys(error.errors).forEach(key => {
                    apiErrors[key] = error.errors[key][0];
                });
                setErrors(apiErrors);
                setGeneralError('Please fix the validation errors below.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setGeneralError(error.message || 'An error occurred during submission.');
            }
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const config = fieldConfig[name];
        if (!config) return;

        let error = '';
        if (config.required && !value.trim() && config.type !== 'file') {
            if (name === 'province' && statesList.length === 0) {
                // Do not require province if country has no states
            } else {
                error = `${config.label} is required`;
            }
        } else if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
            error = 'Please enter a valid email address';
        } else if (name === 'phone' && value) {
            const phoneRegex = /^[0-9\+\-\s\(\)]+$/;
            if (!phoneRegex.test(value)) {
                error = 'Phone number can only contain numbers and basic symbols (+, -, (, ))';
            }
        }

        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const getInputStyle = (error) => ({
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: error ? '2px solid #ff4d4f' : '2px solid transparent',
        backgroundColor: error ? '#fff' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        boxShadow: error ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(225, 227, 229, 1)',
        fontSize: '15px',
        color: '#1c1e21',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
        outline: 'none'
    });

    const getLabelStyle = () => ({
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#303030',
        marginBottom: '8px',
        letterSpacing: '0.3px'
    });

    // Submit a Quote Request
    const handleQuoteSubmit = async () => {
        try {
            const payload = {
                product_name: "Bamboo cutlery set",
                original_price: 1.80,
                quoted_price: parseFloat(quotedPriceInput),
                quantity: modalQty,
                subtotal: parseFloat(quotedPriceInput) * modalQty,
                customer_name: "Sylvia Qikify",
                customer_email: "sylvia@qikify.com",
                company_name: "Artisan Eats & Co.",
                company_location: "Artisan Eats & Co. / Peachtree Street Northeast / Atlanta GA 30308 / United States",
                shipping_address: "Artisan Eats & Co. / Peachtree Street Northeast / Atlanta GA 30308 / United States",
                billing_address: "No billing address provided",
                expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days expiration
            };

            const res = await quoteService.createQuote(payload);
            if (res && res.success) {
                setShowQuoteModal(false);
                fetchCustomerQuotes();
                // Switch to my quotes sub-view
                setQuotesSubView('my_quotes');
            } else {
                alert("Failed to submit quote request.");
            }
        } catch (e) {
            console.error(e);
            alert("Error submitting quote request.");
        }
    };

    const handleSelectQuote = async (id) => {
        try {
            const res = await quoteService.getQuote(id);
            if (res && res.success) {
                setSelectedQuote(res.data);
                setSelectedQuoteId(id);
                setQuotesSubView('quote_detail');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const extraFields = Object.keys(fieldConfig).filter(key => !Object.keys(defaultFields).includes(key));

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa', fontFamily: 'Inter, system-ui, sans-serif' }}>
            
            {/* Storefront Top Header Banner */}
            <header style={{
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e1e3e5',
                padding: '16px 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#ffeb3b',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '20px'
                    }}>
                        😀
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px', color: '#1a1a1a' }}>duos</span>
                        <span style={{ fontSize: '10px', color: '#7a7a7a', marginTop: '-3px' }}>by qikify</span>
                    </div>
                </div>

                <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <a href="#" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '15px', fontWeight: '500' }}>How it works</a>
                    <a href="#" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '15px', fontWeight: '500' }}>Pricing</a>
                    <a href="#" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '15px', fontWeight: '500' }}>About us</a>
                </nav>

                <button style={{
                    backgroundColor: '#ffeb3b',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fdd835'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ffeb3b'}
                >
                    REQUEST A DEMO
                </button>
            </header>

            {/* B2B Self-Service Navigation Tabs */}
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '0 40px',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div style={{ display: 'flex', gap: '40px' }}>
                    {[
                        'B2B Account registration',
                        'B2B Quotes',
                        'B2B Shopping List',
                        'Member & Roles',
                        'Credit & Finance'
                    ].map((tab, idx) => {
                        const isActive = activePortalTab === idx;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActivePortalTab(idx)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: isActive ? '3px solid #ffeb3b' : '3px solid transparent',
                                    color: isActive ? '#ffeb3b' : '#a0a0a0',
                                    padding: '20px 10px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, padding: '40px 20px', background: '#f5f6f8' }}>
                
                {/* 1. B2B Account Registration Form Tab */}
                {activePortalTab === 0 && (
                    <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', background: '#ffffff', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '16px' }}>Application Received</h2>
                                <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', marginBottom: '32px' }}>
                                    Thank you for applying. We are reviewing your application for <strong>{formData.company_name}</strong>.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                    <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>B2B registration</h1>
                                    <p style={{ fontSize: '15px', color: '#6b7280' }}>Fill out the details below to register your company account.</p>
                                </div>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {generalError && (
                                        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', fontSize: '14px', borderRadius: '4px' }}>
                                            {generalError}
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={getLabelStyle()}>{fieldConfig.first_name?.label} *</label>
                                            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} onBlur={handleBlur} style={getInputStyle(errors.first_name)} />
                                            {errors.first_name && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.first_name}</span>}
                                        </div>
                                        <div>
                                            <label style={getLabelStyle()}>{fieldConfig.last_name?.label} *</label>
                                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} onBlur={handleBlur} style={getInputStyle(errors.last_name)} />
                                            {errors.last_name && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.last_name}</span>}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={getLabelStyle()}>{fieldConfig.email?.label} *</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} style={getInputStyle(errors.email)} />
                                            {errors.email && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
                                        </div>
                                        <div>
                                            <label style={getLabelStyle()}>{fieldConfig.phone?.label}</label>
                                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} style={getInputStyle(errors.phone)} />
                                            {errors.phone && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.phone}</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={getLabelStyle()}>{fieldConfig.company_name?.label} *</label>
                                        <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} onBlur={handleBlur} style={getInputStyle(errors.company_name)} />
                                        {errors.company_name && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.company_name}</span>}
                                    </div>

                                    <button type="submit" disabled={loading} style={{
                                        backgroundColor: '#1a1a1a',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '14px 20px',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}>
                                        {loading ? 'Submitting...' : 'Register'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. B2B Quotes Tab */}
                {activePortalTab === 1 && (
                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        {/* Sub Navigation Bar for Quotes */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <button
                                onClick={() => setQuotesSubView('product_page')}
                                style={{
                                    backgroundColor: quotesSubView === 'product_page' ? '#1a1a1a' : '#ffffff',
                                    color: quotesSubView === 'product_page' ? '#ffffff' : '#1a1a1a',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Product Page (Order Demo)
                            </button>
                            <button
                                onClick={() => {
                                    fetchCustomerQuotes();
                                    setQuotesSubView('my_quotes');
                                }}
                                style={{
                                    backgroundColor: quotesSubView === 'my_quotes' ? '#1a1a1a' : '#ffffff',
                                    color: quotesSubView === 'my_quotes' ? '#ffffff' : '#1a1a1a',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                My Quote Requests ({customerQuotes.length})
                            </button>
                        </div>

                        {/* SUB VIEW A: Product Page View */}
                        {quotesSubView === 'product_page' && (
                            <div style={{ display: 'flex', gap: '40px', backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                {/* Left Side Image */}
                                <div style={{ flex: 1 }}>
                                    <img 
                                        src="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png" 
                                        alt="Bamboo cutlery set" 
                                        style={{ width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', objectFit: 'cover', height: '400px' }}
                                    />
                                </div>

                                {/* Right Side Product Details */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px' }}>DUOS-B2B-DEMO</span>
                                        <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', margin: '4px 0 8px 0' }}>Bamboo cutlery set</h1>
                                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>$1.80 USD</span>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Quantity</label>
                                        <div style={{ display: 'flex', alignItems: 'center', width: '150px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                                            <button 
                                                onClick={() => setProductQty(Math.max(100, productQty - 1))}
                                                style={{ border: 'none', background: 'none', padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#64748b' }}
                                            >-</button>
                                            <input 
                                                type="number" 
                                                value={productQty}
                                                onChange={(e) => setProductQty(Math.max(100, parseInt(e.target.value) || 100))}
                                                style={{ border: 'none', width: '100%', textAlign: 'center', fontSize: '15px', fontWeight: '600', outline: 'none' }}
                                            />
                                            <button 
                                                onClick={() => setProductQty(Math.min(500, productQty + 1))}
                                                style={{ border: 'none', background: 'none', padding: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#64748b' }}
                                            >+</button>
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginTop: '6px' }}>Minimum of 100 - Maximum of 500</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                                        <button style={{
                                            backgroundColor: '#ffffff',
                                            color: '#0f172a',
                                            border: '2px solid #0f172a',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            fontWeight: '700',
                                            fontSize: '16px',
                                            cursor: 'pointer'
                                        }}>
                                            Add to cart
                                        </button>
                                        
                                        {quoteSettings.productPage && (
                                            <button 
                                                onClick={() => {
                                                    setModalQty(productQty);
                                                    setQuotedPriceInput('1.80');
                                                    setShowQuoteModal(true);
                                                }}
                                                style={{
                                                    backgroundColor: '#1a1a1a',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '16px',
                                                    fontWeight: '700',
                                                    fontSize: '16px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#333333'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#1a1a1a'}
                                            >
                                                Add to quote
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUB VIEW B: User's Quote Requests List */}
                        {quotesSubView === 'my_quotes' && (
                            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>My Quote Requests</h2>
                                {customerQuotes.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        No quotes submitted yet. Use the "Product Page" tab to request a quote.
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                                <th style={{ padding: '12px 8px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Quote ID</th>
                                                <th style={{ padding: '12px 8px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Date</th>
                                                <th style={{ padding: '12px 8px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Product</th>
                                                <th style={{ padding: '12px 8px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Quoted Price</th>
                                                <th style={{ padding: '12px 8px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Qty</th>
                                                <th style={{ padding: '12px 8px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Total</th>
                                                <th style={{ padding: '12px 8px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Status</th>
                                                <th style={{ padding: '12px 8px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customerQuotes.map((q) => (
                                                <tr key={q.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px 8px', fontWeight: 'bold' }}>Quote {q.quote_number}</td>
                                                    <td style={{ padding: '16px 8px', color: '#64748b' }}>{new Date(q.created_at).toLocaleDateString()}</td>
                                                    <td style={{ padding: '16px 8px' }}>{q.product_name}</td>
                                                    <td style={{ padding: '16px 8px' }}>${parseFloat(q.quoted_price).toFixed(2)} USD</td>
                                                    <td style={{ padding: '16px 8px' }}>{q.quantity}</td>
                                                    <td style={{ padding: '16px 8px', fontWeight: 'bold' }}>${parseFloat(q.subtotal).toFixed(2)} USD</td>
                                                    <td style={{ padding: '16px 8px' }}>
                                                        <span style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            backgroundColor: q.status === 'Approved' ? '#dcfce7' : q.status === 'Sent' ? '#dbeafe' : '#f1f5f9',
                                                            color: q.status === 'Approved' ? '#166534' : q.status === 'Sent' ? '#1e40af' : '#475569'
                                                        }}>
                                                            {q.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px 8px' }}>
                                                        <button 
                                                            onClick={() => handleSelectQuote(q.id)}
                                                            style={{
                                                                background: '#f1f5f9',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '6px 12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                color: '#475569'
                                                            }}
                                                        >
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* SUB VIEW C: Customer Quote Details View */}
                        {quotesSubView === 'quote_detail' && selectedQuote && (
                            <div>
                                <button 
                                    onClick={() => setQuotesSubView('my_quotes')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: '#64748b',
                                        fontWeight: '600',
                                        marginBottom: '20px'
                                    }}
                                >
                                    ← Back to list
                                </button>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                                    {/* Left Side Quote Content */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {/* Product Details Card */}
                                        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Product Details</h3>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <img 
                                                    src="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png" 
                                                    alt="Bamboo cutlery set" 
                                                    style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px solid #e2e8f0', objectFit: 'cover' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{selectedQuote.product_name}</h4>
                                                    <span style={{ fontSize: '13px', color: '#64748b', display: 'block', marginTop: '4px' }}>Default Title</span>
                                                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Original Price: ${parseFloat(selectedQuote.original_price).toFixed(2)} USD</span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '14px', color: '#475569' }}>Quantity: <strong style={{ color: '#0f172a' }}>{selectedQuote.quantity}</strong></div>
                                                    <div style={{ fontSize: '14px', color: '#475569' }}>Quoted Price: <strong style={{ color: '#0f172a' }}>${parseFloat(selectedQuote.quoted_price).toFixed(2)} USD</strong></div>
                                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginTop: '6px' }}>Subtotal: ${parseFloat(selectedQuote.subtotal).toFixed(2)} USD</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expiration & Quote Application details */}
                                        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Quote Settings</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div>
                                                    <span style={{ fontSize: '14px', color: '#475569' }}>Apply quote price to future orders: </span>
                                                    <strong style={{ color: selectedQuote.apply_to_future_orders ? '#166534' : '#ef4444' }}>
                                                        {selectedQuote.apply_to_future_orders ? 'Yes' : 'No'}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '14px', color: '#475569' }}>Expiration date: </span>
                                                    <strong style={{ color: '#0f172a' }}>{selectedQuote.expiration_date || 'None'}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Timeline</h3>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6', marginTop: '4px' }}></div>
                                                <div>
                                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>Quote Request Submitted</span>
                                                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                                                        {new Date(selectedQuote.created_at).toLocaleString()}
                                                    </span>
                                                    <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#475569' }}>
                                                        Submitted proposal for {selectedQuote.quantity} units at ${parseFloat(selectedQuote.quoted_price).toFixed(2)} USD.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side Customer Info Card */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Details</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div>
                                                    <label style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>Customer Name</label>
                                                    <span style={{ display: 'block', fontSize: '15px', color: '#0f172a', fontWeight: '600', marginTop: '4px' }}>{selectedQuote.customer_name}</span>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>Email Address</label>
                                                    <span style={{ display: 'block', fontSize: '15px', color: '#0f172a', marginTop: '4px' }}>{selectedQuote.customer_email}</span>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>Company</label>
                                                    <span style={{ display: 'block', fontSize: '15px', color: '#0f172a', fontWeight: '600', marginTop: '4px' }}>{selectedQuote.company_name}</span>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>Company location</label>
                                                    <span style={{ display: 'block', fontSize: '14px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>{selectedQuote.company_location}</span>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>Shipping Address</label>
                                                    <span style={{ display: 'block', fontSize: '14px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>{selectedQuote.shipping_address}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. B2B Shopping List Tab */}
                {activePortalTab === 2 && (
                    <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <h2>B2B Shopping List</h2>
                        <p style={{ color: '#64748b' }}>Store and organize your standard items list for fast checkout operations.</p>
                    </div>
                )}

                {/* 4. Member & Roles Tab */}
                {activePortalTab === 3 && (
                    <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <h2>Member & Roles</h2>
                        <p style={{ color: '#64748b' }}>Manage your corporate buyer sub-accounts and permission structures.</p>
                    </div>
                )}

                {/* 5. Credit & Finance Tab */}
                {activePortalTab === 4 && (
                    <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <h2>Credit & Finance</h2>
                        <p style={{ color: '#64748b' }}>Check outstanding balances, credit terms, and financial ledger data.</p>
                    </div>
                )}

            </div>

            {/* REQUEST FOR QUOTE MODAL (Screenshot 2) */}
            {showQuoteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        width: '800px',
                        maxWidth: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Request for quote</h3>
                            <button 
                                onClick={() => setShowQuoteModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                        <th style={{ paddingBottom: '12px', color: '#475569', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Product</th>
                                        <th style={{ paddingBottom: '12px', color: '#475569', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', width: '140px' }}>Quoted Price</th>
                                        <th style={{ paddingBottom: '12px', color: '#475569', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', width: '150px' }}>Quantity</th>
                                        <th style={{ paddingBottom: '12px', color: '#475569', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '20px 0', verticalAlign: 'top' }}>
                                            <div style={{ display: 'flex', gap: '16px' }}>
                                                <img 
                                                    src="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png" 
                                                    alt="Bamboo cutlery set" 
                                                    style={{ width: '70px', height: '70px', borderRadius: '6px', border: '1px solid #e2e8f0', objectFit: 'cover' }}
                                                />
                                                <div>
                                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>Bamboo cutlery set</h4>
                                                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Default Title</span>
                                                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', display: 'block', margin: '4px 0' }}>$1.80 USD</span>
                                                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Increments of 1 - Minimum of 100 - Maximum of 500</span>
                                                    <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: '500', display: 'block', marginTop: '2px' }}>Available stock: 9650</span>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td style={{ padding: '20px 0', verticalAlign: 'top' }}>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={quotedPriceInput}
                                                onChange={(e) => setQuotedPriceInput(e.target.value)}
                                                style={{
                                                    width: '100px',
                                                    padding: '8px 12px',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </td>

                                        <td style={{ padding: '20px 0', verticalAlign: 'top' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                                                    <button 
                                                        onClick={() => setModalQty(Math.max(100, modalQty - 1))}
                                                        style={{ border: 'none', background: 'none', padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >-</button>
                                                    <input 
                                                        type="number" 
                                                        value={modalQty}
                                                        onChange={(e) => setModalQty(Math.max(100, parseInt(e.target.value) || 100))}
                                                        style={{ border: 'none', width: '50px', textAlign: 'center', fontSize: '14px', outline: 'none' }}
                                                    />
                                                    <button 
                                                        onClick={() => setModalQty(Math.min(500, modalQty + 1))}
                                                        style={{ border: 'none', background: 'none', padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >+</button>
                                                </div>

                                                <button 
                                                    onClick={() => setShowQuoteModal(false)}
                                                    style={{ border: 'none', background: 'none', padding: '8px', cursor: 'pointer', color: '#94a3b8' }}
                                                    title="Delete item"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>

                                        <td style={{ padding: '20px 0', verticalAlign: 'top', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>
                                            ${(parseFloat(quotedPriceInput || 0) * modalQty).toFixed(2)} USD
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button 
                                onClick={() => setShowQuoteModal(false)}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    padding: '10px 18px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleQuoteSubmit}
                                style={{
                                    backgroundColor: '#1a1a1a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '10px 20px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Submit request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
