import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationService } from '../services/registrationService';


export default function SinglePageRegistration() {
    const navigate = useNavigate();

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
    }, []);

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
        // Load dynamically customized field names and types from the builder's local storage
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
                            // It's a dynamically added field
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
            // Strict Phone validation
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

            // Group Metafields logically
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

    const extraFields = Object.keys(fieldConfig).filter(key => !Object.keys(defaultFields).includes(key));

    if (submitted) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f6f8fd 0%, #f1f6fd 100%)', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '48px 32px', boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '16px', letterSpacing: '-0.5px' }}>Application Received</h2>
                    <p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.6', marginBottom: '32px' }}>
                        Thank you for applying. We are reviewing your application for <strong>{formData.company_name}</strong> and will contact you at <strong>{formData.email}</strong> soon.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        style={{ width: '100%', background: 'linear-gradient(135deg, #111827 0%, #374151 100%)', color: '#ffffff', border: 'none', padding: '14px 24px', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 6px rgba(17, 24, 39, 0.1)' }}
                        onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 12px rgba(17, 24, 39, 0.2)'; }}
                        onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 6px rgba(17, 24, 39, 0.1)'; }}
                    >
                        Return to Store
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', background: 'radial-gradient(circle at top right, #eef2f3 0%, #8e9eab 100%)', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ maxWidth: '720px', width: '100%', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '48px', boxShadow: '0 24px 48px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5) inset', animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{ display: 'inline-block', padding: '8px 16px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', color: '#166534', borderRadius: '20px', fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '16px' }}>B2B PARTNER APPLICATION</div>
                    <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#111827', marginBottom: '12px', letterSpacing: '-1px' }}>Join our network</h1>
                    <p style={{ fontSize: '16px', color: '#4b5563', maxWidth: '400px', margin: '0 auto' }}>Provide your business details below to unlock wholesale pricing and exclusive benefits.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {generalError && (
                        <div style={{ padding: '16px 20px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '8px', color: '#991b1b', fontSize: '14px', fontWeight: '600', animation: 'fadeIn 0.3s' }}>
                            {generalError}
                        </div>
                    )}

                    {/* Personal Info Group */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Contact Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={getLabelStyle()}>{fieldConfig.first_name?.label} {fieldConfig.first_name?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                <input 
                                    type="text" name="first_name" value={formData.first_name} onChange={handleChange} onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors.first_name ? '#ef4444' : 'transparent'; }}
                                    style={getInputStyle(errors.first_name)}
                                />
                                {errors.first_name && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.first_name}</span>}
                            </div>
                            <div>
                                <label style={getLabelStyle()}>{fieldConfig.last_name?.label} {fieldConfig.last_name?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                <input 
                                    type="text" name="last_name" value={formData.last_name} onChange={handleChange} onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors.last_name ? '#ef4444' : 'transparent'; }}
                                    style={getInputStyle(errors.last_name)}
                                />
                                {errors.last_name && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.last_name}</span>}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={getLabelStyle()}>{fieldConfig.email?.label} {fieldConfig.email?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                <input 
                                    type="email" name="email" value={formData.email} onChange={handleChange} onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors.email ? '#ef4444' : 'transparent'; }} placeholder="you@company.com"
                                    style={getInputStyle(errors.email)}
                                />
                                {errors.email && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.email}</span>}
                            </div>
                            <div>
                                <label style={getLabelStyle()}>{fieldConfig.phone?.label} {fieldConfig.phone?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                <input 
                                    type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors.phone ? '#ef4444' : 'transparent'; }} placeholder="+1 555 0123"
                                    style={getInputStyle(errors.phone)}
                                />
                                {errors.phone && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.phone}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Company Info Group */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Company Details</h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={getLabelStyle()}>{fieldConfig.company_name?.label} {fieldConfig.company_name?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                            <input 
                                type="text" name="company_name" value={formData.company_name} onChange={handleChange} onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors.company_name ? '#ef4444' : 'transparent'; }}
                                style={getInputStyle(errors.company_name)}
                            />
                            {errors.company_name && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.company_name}</span>}
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={getLabelStyle()}>{fieldConfig.tax_id?.label} {fieldConfig.tax_id?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                            <input 
                                type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors.tax_id ? '#ef4444' : 'transparent'; }} placeholder="Optional"
                                style={getInputStyle(errors.tax_id)}
                            />
                            {errors.tax_id && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.tax_id}</span>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={getLabelStyle()}>{fieldConfig.company_country?.label} {fieldConfig.company_country?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                        <select
                                            name="company_country"
                                            value={selectedCountryCode}
                                            onChange={handleCountryChange}
                                            onBlur={() => handleBlur({ target: { name: 'company_country', value: selectedCountryCode } })}
                                            style={getInputStyle(errors.company_country)}
                                        >
                                            <option value="">Select country</option>
                                            {countriesList.map(country => (
                                                <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                                            ))}
                                        </select>
                                {errors.company_country && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.company_country}</span>}
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={getLabelStyle()}>{fieldConfig.company_address?.label} {fieldConfig.company_address?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                <input 
                                    type="text" name="company_address" value={formData.company_address} onChange={handleChange} onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors.company_address ? '#ef4444' : 'transparent'; }}
                                    style={getInputStyle(errors.company_address)}
                                />
                                {errors.company_address && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.company_address}</span>}
                            </div>
                            <div>
                                <label style={getLabelStyle()}>{fieldConfig.apartment?.label} {fieldConfig.apartment?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                <input 
                                    type="text" name="apartment" value={formData.apartment} onChange={handleChange} onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors.apartment ? '#ef4444' : 'transparent'; }}
                                    style={getInputStyle(errors.apartment)}
                                />
                                {errors.apartment && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.apartment}</span>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            {statesList.length > 0 && (
                                <div>
                                    <label style={getLabelStyle()}>{fieldConfig.province?.label} {fieldConfig.province?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                    <select
                                        name="province"
                                        value={selectedStateCode}
                                        onChange={handleStateChange}
                                        onBlur={() => handleBlur({ target: { name: 'province', value: selectedStateCode } })}
                                        style={getInputStyle(errors.province)}
                                    >
                                        <option value="">Select state/province</option>
                                        {statesList.map(state => (
                                            <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                                        ))}
                                    </select>
                                    {errors.province && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.province}</span>}
                                </div>
                            )}
                            <div>
                                <label style={getLabelStyle()}>{fieldConfig.company_city?.label} {fieldConfig.company_city?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                        {citiesList.length > 0 ? (
                                            <select
                                                name="company_city"
                                                value={formData.company_city}
                                                onChange={handleCityChange}
                                                onBlur={() => handleBlur({ target: { name: 'company_city', value: formData.company_city } })}
                                                style={getInputStyle(errors.company_city)}
                                            >
                                                <option value="">Select city</option>
                                                {citiesList.map(city => (
                                                    <option key={city.name} value={city.name}>{city.name}</option>
                                                ))}
                                            </select>
                                ) : (
                                    <input type="text" name="company_city" value={formData.company_city} onChange={handleChange} onBlur={handleBlur} style={getInputStyle(errors.company_city)} />
                                )}
                                {errors.company_city && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.company_city}</span>}
                            </div>
                            <div>
                                <label style={getLabelStyle()}>{fieldConfig.zip?.label} {fieldConfig.zip?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                <input 
                                    type="text" name="zip" value={formData.zip} onChange={handleChange} onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors.zip ? '#ef4444' : 'transparent'; }}
                                    style={getInputStyle(errors.zip)}
                                />
                                {errors.zip && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.zip}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Extra Fields Group */}
                    {extraFields.length > 0 && (
                        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>Additional Information</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                {extraFields.map(key => (
                                    <div key={key}>
                                        <label style={getLabelStyle()}>{fieldConfig[key].label} {fieldConfig[key].required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                                        <input 
                                            type={fieldConfig[key].type || 'text'} name={key} value={formData[key] || ''} onChange={handleChange}
                                            style={getInputStyle(errors[key])}
                                            onBlur={(e) => { handleBlur(e); e.target.style.borderColor = errors[key] ? '#ef4444' : 'transparent'; }}
                                        />
                                        {errors[key] && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors[key]}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Document & Notes */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={getLabelStyle()}>{fieldConfig.document_upload?.label} {fieldConfig.document_upload?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                            <div style={{
                                border: errors.document_upload ? '2px dashed #ef4444' : '2px dashed #cbd5e1',
                                borderRadius: '12px', padding: '32px 20px', textAlign: 'center', backgroundColor: '#f8fafc',
                                cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease'
                            }}>
                                <input 
                                    type="file" name="document_upload"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        setFileObject(file || null);
                                        setFormData(prev => ({ ...prev, document_upload: file?.name || '' }));
                                        if (errors.document_upload) setErrors(prev => ({ ...prev, document_upload: '' }));
                                    }}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                />
                                <div style={{ background: '#ffffff', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                </div>
                                <p style={{ fontSize: '15px', color: '#111827', margin: '0 0 4px 0', fontWeight: '600' }}>
                                    {formData.document_upload ? formData.document_upload : 'Click to upload or drag files here'}
                                </p>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>PDF, PNG, JPG up to 10MB</span>
                            </div>
                            {errors.document_upload && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.document_upload}</span>}
                        </div>

                        <div>
                            <label style={getLabelStyle()}>{fieldConfig.message?.label} {fieldConfig.message?.required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                            <textarea 
                                name="message" value={formData.message} onChange={handleChange} rows="4"
                                style={{ ...getInputStyle(errors.message), resize: 'vertical' }}
                            />
                            {errors.message && <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'block' }}>{errors.message}</span>}
                        </div>
                    </div>

                    <button 
                        type="submit" disabled={loading}
                        style={{
                            width: '100%', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff',
                            border: 'none', padding: '16px 24px', borderRadius: '12px', fontSize: '18px', fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', transition: 'all 0.3s ease',
                            opacity: loading ? 0.7 : 1, boxShadow: '0 10px 15px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
