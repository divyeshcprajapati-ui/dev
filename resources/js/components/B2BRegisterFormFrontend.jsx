import React, { useState } from 'react';

export default function B2BRegisterFormFrontend() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        companyName: '',
        taxId: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        zip: '',
        country: '',
        businessDocument: '',
        notes: ''
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.address.trim()) newErrors.address = 'Street address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.zip.trim()) newErrors.zip = 'ZIP / Postal code is required';
        if (!formData.country.trim()) newErrors.country = 'Country is required';
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        // Simulate API call and save locally
        setTimeout(() => {
            const saved = localStorage.getItem('b2b_submissions');
            let list = [];
            
            // Standard initial mock list
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
                    list = JSON.parse(saved);
                } catch (err) {
                    list = defaultMocks;
                }
            } else {
                list = defaultMocks;
            }

            const newSub = {
                id: String(Date.now()),
                company: formData.companyName,
                contact: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                taxId: formData.taxId || '-',
                status: 'Pending',
                date: new Date().toISOString().split('T')[0]
            };

            list.unshift(newSub);
            localStorage.setItem('b2b_submissions', JSON.stringify(list));

            setLoading(false);
            setSubmitted(true);
        }, 1200);
    };

    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f6f6f7',
                padding: '20px',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    maxWidth: '480px',
                    width: '100%',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '40px 32px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#e6f4ea',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', marginBottom: '12px' }}>Application Submitted!</h2>
                    <p style={{ fontSize: '15px', color: '#6d7175', lineHeight: '1.6', marginBottom: '28px' }}>
                        Thank you for applying for a wholesale account with us. We have received your application for <strong>{formData.companyName}</strong> and are currently reviewing it. We will get back to you via <strong>{formData.email}</strong> shortly.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        style={{
                            width: '100%',
                            backgroundColor: '#1a1a1a',
                            color: '#ffffff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#333333'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#1a1a1a'}
                    >
                        Return to Store
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f6f6f7',
            padding: '40px 20px',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '40px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>B2B Registration</h1>
                    <p style={{ fontSize: '15px', color: '#6d7175' }}>Submit your business information below to apply for a wholesale dealer account.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>First Name *</label>
                            <input 
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    border: errors.firstName ? '1px solid #d82c0d' : '1px solid #c9cccf',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {errors.firstName && <span style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.firstName}</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Last Name *</label>
                            <input 
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    border: errors.lastName ? '1px solid #d82c0d' : '1px solid #c9cccf',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {errors.lastName && <span style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.lastName}</span>}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Business Email *</label>
                        <input 
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@company.com"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                border: errors.email ? '1px solid #d82c0d' : '1px solid #c9cccf',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                        />
                        {errors.email && <span style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Company Name *</label>
                        <input 
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                border: errors.companyName ? '1px solid #d82c0d' : '1px solid #c9cccf',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                        />
                        {errors.companyName && <span style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.companyName}</span>}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Website URL</label>
                        <input 
                            type="text"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://yourcompany.com"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                border: '1px solid #c9cccf',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Tax ID / VAT Number</label>
                            <input 
                                type="text"
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleChange}
                                placeholder="Optional"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid #c9cccf',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Phone Number</label>
                            <input 
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Optional"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    border: '1px solid #c9cccf',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '20px', marginTop: '10px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '14px' }}>Company Address</h3>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Street Address *</label>
                            <input 
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    border: errors.address ? '1px solid #d82c0d' : '1px solid #c9cccf',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {errors.address && <span style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.address}</span>}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>City *</label>
                                <input 
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '6px',
                                        border: errors.city ? '1px solid #d82c0d' : '1px solid #c9cccf',
                                        fontSize: '15px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                {errors.city && <span style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.city}</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>ZIP / Postal Code *</label>
                                <input 
                                    type="text"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '6px',
                                        border: errors.zip ? '1px solid #d82c0d' : '1px solid #c9cccf',
                                        fontSize: '15px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                {errors.zip && <span style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.zip}</span>}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Country *</label>
                            <input 
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    border: errors.country ? '1px solid #d82c0d' : '1px solid #c9cccf',
                                    fontSize: '15px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            {errors.country && <span style={{ color: '#d82c0d', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.country}</span>}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '20px', marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Business License / Reseller Certificate</label>
                        <div style={{
                            border: '2px dashed #c9cccf',
                            borderRadius: '8px',
                            padding: '20px',
                            textAlign: 'center',
                            backgroundColor: '#fafafa',
                            cursor: 'pointer',
                            position: 'relative'
                        }}>
                            <input 
                                type="file"
                                name="businessDocument"
                                onChange={(e) => setFormData(prev => ({ ...prev, businessDocument: e.target.files[0]?.name || '' }))}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                            />
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d7175" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', display: 'inline-block' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <p style={{ fontSize: '14px', color: '#303030', margin: '0 0 4px 0', fontWeight: '500' }}>
                                {formData.businessDocument ? formData.businessDocument : 'Click to upload or drag files here'}
                            </p>
                            <span style={{ fontSize: '12px', color: '#6d7175' }}>PDF, PNG, JPG up to 10MB</span>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#303030', marginBottom: '6px' }}>Additional Comments / Notes</label>
                        <textarea 
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="4"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                border: '1px solid #c9cccf',
                                fontSize: '15px',
                                boxSizing: 'border-box',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            backgroundColor: '#008060', // Shopify Green
                            color: '#ffffff',
                            border: 'none',
                            padding: '14px 24px',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '10px',
                            transition: 'background-color 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
}
