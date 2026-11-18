(function() {
    document.addEventListener('DOMContentLoaded', async function() {
        const form = document.getElementById('b2b-registration-form');
        if (!form) return;

        const URL = (form.dataset.apiBase || 'https://onshore-embezzle-skinny.ngrok-free.dev').replace(/\/$/, '');
        const activeLocale = form.dataset.locale || 'en';
        let i18nStrings = {};

        const container = document.getElementById('b2b-dynamic-fields-container');
        const submitBtn = form.querySelector('.submit-btn');
        const shopDomain = document.getElementById('shopify-shop-domain')?.value || (typeof Shopify !== 'undefined' ? Shopify.shop : '');

        if (window.B2B_I18N && shopDomain) {
            i18nStrings = await window.B2B_I18N.load(URL, shopDomain, activeLocale, 'registration');
            const titleEl = document.getElementById('b2b-reg-title');
            const descEl = document.getElementById('b2b-reg-desc');
            const btnTextEl = form.querySelector('.btn-text');
            if (titleEl && i18nStrings.title) titleEl.textContent = i18nStrings.title;
            if (descEl && i18nStrings.description) descEl.textContent = i18nStrings.description;
            if (btnTextEl && i18nStrings.submit_button) btnTextEl.textContent = i18nStrings.submit_button;
        }
        
        let steps = [];
        let cData = [];
        let sData = [];
        
        function getHeaders(extra = {}) {
            return {
                'ngrok-skip-browser-warning': 'true',
                ...(shopDomain ? { 'X-Shop-Domain': shopDomain } : {}),
                ...extra
            };
        }
        
        const fieldMap = {
            'first_name': 'firstName',
            'last_name': 'lastName',
            'email': 'email',
            'company_name': 'companyName',
            'tax_id': 'taxId',
            'phone': 'phone',
            'company_address': 'address',
            'company_country': 'country',
            'province': 'state',
            'company_city': 'city',
            'zip': 'zip',
            'document_upload': 'businessDocument',
            'message': 'notes'
        };
        
        function mapId(id) {
            return fieldMap[id] || id;
        }
        
        async function loadCountries(sel) {
            try {
                const res = await fetch(`${URL}/api/b2b/locations/countries`, { headers: getHeaders() });
                cData = await res.json();
                sel.innerHTML = '<option value="">Select Country</option>';
                cData.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.name;
                    opt.dataset.code = c.isoCode;
                    opt.textContent = c.name;
                    sel.appendChild(opt);
                });
            } catch (err) {
                console.error(err);
            }
        }
        
        async function loadStates(countryCode, stateEl, cityEl) {
            try {
                stateEl.disabled = true;
                stateEl.innerHTML = '<option value="">Loading...</option>';
                const res = await fetch(`${URL}/api/b2b/locations/states?countryCode=${countryCode}`, { headers: getHeaders() });
                sData = await res.json();
                stateEl.innerHTML = '<option value="">Select State</option>';
                
                if (sData.length === 0) {
                    stateEl.innerHTML = '<option value="">No states</option>';
                    stateEl.required = false;
                    cityEl.disabled = false;
                    cityEl.innerHTML = '<option value="">Select City</option>';
                    loadCities(countryCode, '', cityEl);
                } else {
                    stateEl.disabled = false;
                    stateEl.required = true;
                    sData.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.name;
                        opt.dataset.code = s.isoCode;
                        opt.textContent = s.name;
                        stateEl.appendChild(opt);
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }
        
        async function loadCities(countryCode, stateCode, cityEl) {
            try {
                cityEl.disabled = true;
                cityEl.innerHTML = '<option value="">Loading...</option>';
                const res = await fetch(`${URL}/api/b2b/locations/cities?countryCode=${countryCode}&stateCode=${stateCode}`, { headers: getHeaders() });
                const cities = await res.json();
                cityEl.innerHTML = '<option value="">Select City</option>';
                cityEl.disabled = false;
                
                if (cities.length === 0) {
                    const opt = document.createElement('option');
                    opt.value = "Other";
                    opt.textContent = "Other";
                    cityEl.appendChild(opt);
                } else {
                    cities.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.name;
                        opt.textContent = c.name;
                        cityEl.appendChild(opt);
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }
        
        async function buildForm() {
            try {
                container.innerHTML = '<div style="text-align:center;padding:20px;color:#6b7280;">Loading...</div>';
                
                const cacheKey = `b2b_form_config_${shopDomain}`;
                const cached = sessionStorage.getItem(cacheKey);
                let result;
                
                if (cached) {
                    try {
                        result = JSON.parse(cached);
                    } catch (e) {
                        console.error('Failed to parse cached form config', e);
                    }
                }
                
                if (!result) {
                    const res = await fetch(`${URL}/api/b2b/form-config?shop=${shopDomain}`, { headers: getHeaders() });
                    result = await res.json();
                    if (result && result.success) {
                        sessionStorage.setItem(cacheKey, JSON.stringify(result));
                    }
                }
                
                if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                    steps = result.data;
                } else {
                    steps = [
                        {
                            id: 'company-fields',
                            name: 'Company Section',
                            fields: [
                                { id: 'company_name', name: 'Company name', type: 'text', required: true, metafieldType: 'none' },
                                { id: 'company_address', name: 'Company address', type: 'text', required: true, metafieldType: 'none' },
                                { id: 'apartment', name: 'Appartment, suite, etc.', type: 'text', required: false, metafieldType: 'none' },
                                { id: 'company_country', name: 'Company country', type: 'select', required: true, metafieldType: 'none' },
                                { id: 'company_city', name: 'Company city', type: 'text', required: true, metafieldType: 'none' },
                                { id: 'province', name: 'Province', type: 'text', required: true, metafieldType: 'none' },
                                { id: 'zip', name: 'Zip code / Postal code', type: 'text', required: true, metafieldType: 'none' },
                                { id: 'tax_id', name: 'Tax ID / VAT Number', type: 'text', required: true, metafieldType: 'none', metafieldNamespace: 'custom', metafieldKey: 'tax_id', metafieldValueType: 'single_line_text_field' },
                                { id: 'document_upload', name: 'Business License / Document Upload', type: 'file', required: false, metafieldType: 'none' },
                                { id: 'message', name: 'Message', type: 'textarea', required: false, metafieldType: 'none' }
                            ]
                        },
                        {
                            id: 'customer-fields',
                            name: 'Customer Section',
                            fields: [
                                { id: 'first_name', name: 'First name', type: 'text', required: true, metafieldType: 'none' },
                                { id: 'last_name', name: 'Last name', type: 'text', required: true, metafieldType: 'none' },
                                { id: 'email', name: 'Your email', type: 'email', required: true, metafieldType: 'none' },
                                { id: 'phone', name: 'Your phone number', type: 'phone', required: true, metafieldType: 'none' }
                            ]
                        }
                    ];
                }
                
                container.innerHTML = '';
                steps.forEach(step => {
                    const section = document.createElement('div');
                    section.className = 'b2b-form-section';
                    section.insertAdjacentHTML('beforeend', `<div class="b2b-section-title">${step.name}</div>`);
                    
                    const grid = document.createElement('div');
                    grid.className = 'form-row';
                    if (step.fields.length > 2) grid.style.display = 'block';
                    
                    step.fields.forEach(field => {
                        const group = document.createElement('div');
                        group.className = 'form-group';
                        const fieldId = mapId(field.id);
                        group.insertAdjacentHTML('beforeend', `<label for="${fieldId}">${field.name}${field.required ? '*' : ''}</label>`);
                        
                        let input;
                        if (field.id === 'company_country' || field.type === 'select') {
                            input = document.createElement('select');
                            input.id = fieldId;
                            input.name = fieldId;
                            input.innerHTML = '<option value="">Select country</option>';
                        } else if (field.id === 'province' || field.id === 'company_city') {
                            input = document.createElement('select');
                            input.id = fieldId;
                            input.name = fieldId;
                            input.disabled = true;
                        } else if (field.type === 'textarea' || field.id === 'message') {
                            input = document.createElement('textarea');
                            input.id = fieldId;
                            input.name = fieldId;
                            input.rows = 4;
                        } else if (field.type === 'file' || field.id === 'document_upload') {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'file-upload-wrapper';
                            input = document.createElement('input');
                            input.type = 'file';
                            input.id = fieldId;
                            input.name = fieldId;
                            input.style.display = 'none';
                            input.accept = '.pdf,.png,.jpeg,.jpg';
                            
                            const placeholder = document.createElement('div');
                            placeholder.className = 'upload-text';
                            placeholder.textContent = 'Choose file(Max 10MB)';
                            
                            wrapper.appendChild(input);
                            wrapper.appendChild(placeholder);
                            group.appendChild(wrapper);
                            
                            wrapper.addEventListener('click', () => input.click());
                            input.addEventListener('change', () => {
                                if (input.files[0]) placeholder.textContent = input.files[0].name;
                            });
                        } else {
                            input = document.createElement('input');
                            input.type = field.type === 'phone' ? 'tel' : (field.type || 'text');
                            input.id = fieldId;
                            input.name = fieldId;
                        }
                        
                        if (input) {
                            if (field.required) input.required = true;
                            group.appendChild(input);
                            group.insertAdjacentHTML('beforeend', `<span class="field-error" id="error-${fieldId}"></span>`);
                        }
                        grid.appendChild(group);
                    });
                    
                    section.appendChild(grid);
                    container.appendChild(section);
                });
                
                const cS = document.getElementById('country');
                const sS = document.getElementById('state');
                const yS = document.getElementById('city');
                
                if (cS) {
                    loadCountries(cS);
                    cS.addEventListener('change', function() {
                        if (sS) {
                            sS.disabled = true;
                            sS.innerHTML = '<option value="">Select State</option>';
                        }
                        if (yS) {
                            yS.disabled = true;
                            yS.innerHTML = '<option value="">Select City</option>';
                        }
                        
                        const opt = cS.options[cS.selectedIndex];
                        const code = opt.dataset.code;
                        if (code && sS && yS) {
                            loadStates(code, sS, yS);
                        }
                    });
                }
                
                if (sS) {
                    sS.addEventListener('change', function() {
                        if (yS) {
                            yS.disabled = true;
                            yS.innerHTML = '<option value="">Select City</option>';
                        }
                        const countryOpt = cS.options[cS.selectedIndex];
                        const stateOpt = sS.options[sS.selectedIndex];
                        const cCode = countryOpt.dataset.code;
                        const sCode = stateOpt.dataset.code;
                        if (cCode && yS) {
                            loadCities(cCode, sCode || '', yS);
                        }
                    });
                }
            } catch (err) {
                console.error(err);
                container.innerHTML = '<div style="text-align:center;padding:20px;color:#ef4444;">Load error</div>';
            }
        }
        
        await buildForm();
        
        function validateForm() {
            form.querySelectorAll('.field-error').forEach(e => e.textContent = '');
            form.querySelectorAll('input,select,textarea').forEach(e => e.classList.remove('invalid'));
            document.getElementById('general-error').classList.add('hidden');
            document.getElementById('general-success').classList.add('hidden');
            
            let isValid = true;
            
            steps.forEach(step => {
                step.fields.forEach(field => {
                    const fieldId = mapId(field.id);
                    const el = document.getElementById(fieldId);
                    if (el && field.required && !el.value.trim() && el.type !== 'file') {
                        isValid = false;
                        el.classList.add('invalid');
                        const errEl = document.getElementById(`error-${fieldId}`);
                        if (errEl) errEl.textContent = 'Required';
                    }
                });
            });
            
            // Email Validation
            const email = document.getElementById('email');
            if (email && email.value.trim() && !/\S+@\S+\.\S+/.test(email.value.trim())) {
                isValid = false;
                email.classList.add('invalid');
                const errEl = document.getElementById('error-email');
                if (errEl) errEl.textContent = 'Invalid email';
            }
            
            // Dynamic Tax ID Validation for India (GSTIN) & International VAT (UK / EU)
            const countryEl = document.getElementById('country');
            const taxIdEl = document.getElementById('taxId');
            if (countryEl && taxIdEl && taxIdEl.value.trim()) {
                const selectedOption = countryEl.options[countryEl.selectedIndex];
                const countryCode = (selectedOption ? selectedOption.dataset.code : '') || '';
                const countryVal = countryEl.value.trim().toLowerCase();
                const taxVal = taxIdEl.value.trim();

                if (countryVal === 'india' || countryCode.toUpperCase() === 'IN') {
                    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
                    if (!gstRegex.test(taxVal)) {
                        isValid = false;
                        taxIdEl.classList.add('invalid');
                        const errEl = document.getElementById('error-taxId');
                        if (errEl) errEl.textContent = 'Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)';
                    }
                } else {
                    const vatMap = {
                        GB: /^(GB)?([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3})$/i,
                        DE: /^(DE)?[0-9]{9}$/i,
                        FR: /^(FR)?[0-9A-Z]{2}[0-9]{9}$/i,
                        IT: /^(IT)?[0-9]{11}$/i,
                        ES: /^(ES)?[A-Z0-9][0-9]{7}[A-Z0-9]$/i,
                        NL: /^(NL)?[0-9]{9}B[0-9]{2}$/i,
                        BE: /^(BE)?0?[0-9]{9,10}$/i,
                        AT: /^(AT)?U[0-9]{8}$/i,
                        PL: /^(PL)?[0-9]{10}$/i,
                        SE: /^(SE)?[0-9]{12}$/i,
                        IE: /^(IE)?[0-9][A-Z0-9+*][0-9]{5}[A-Z]{1,2}$/i
                    };
                    const vatRegex = vatMap[countryCode.toUpperCase()];
                    if (vatRegex && !vatRegex.test(taxVal)) {
                        isValid = false;
                        taxIdEl.classList.add('invalid');
                        const errEl = document.getElementById('error-taxId');
                        if (errEl) errEl.textContent = `Invalid VAT number format for ${countryCode.toUpperCase()}.`;
                    }
                }
            }
            
            return isValid;
        }
        
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!validateForm()) return;
            
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-text').classList.add('hidden');
            submitBtn.querySelector('.btn-spinner').classList.remove('hidden');
            
            const formData = new FormData();
            if (shopDomain) formData.append('shop', shopDomain);
            const customerIdEl = document.getElementById('shopify-customer-id');
            if (customerIdEl && customerIdEl.value) {
                formData.append('shopify_customer_id', customerIdEl.value);
            }
            
            const standardFields = ['firstName', 'lastName', 'email', 'companyName', 'address', 'country', 'state', 'city', 'zip', 'taxId', 'phone', 'notes'];
            standardFields.forEach(key => {
                const el = document.getElementById(key);
                if (el && el.value !== undefined) formData.append(key, el.value.trim());
            });
            const countrySelect = document.getElementById('country');
            if (countrySelect && countrySelect.selectedIndex >= 0) {
                const cCode = countrySelect.options[countrySelect.selectedIndex]?.dataset?.code;
                if (cCode) formData.append('country_code', cCode);
            }
            
            const fileInput = document.getElementById('businessDocument');
            if (fileInput && fileInput.files.length > 0) formData.append('businessDocument', fileInput.files[0]);
            
            const metafields = {};
            steps.forEach(step => {
                step.fields.forEach(field => {
                    if (field.metafieldType && field.metafieldType !== 'none') {
                        const fieldId = mapId(field.id);
                        const el = document.getElementById(fieldId);
                        const val = el ? el.value.trim() : '';
                        if (val) {
                            const ns = field.metafieldNamespace || 'custom';
                            const mKey = field.metafieldKey || field.id;
                            metafields[`${ns}.${mKey}`] = {
                                value: val,
                                owner_type: field.metafieldType,
                                type: field.metafieldValueType || 'single_line_text_field'
                            };
                        }
                    }
                });
            });
            
            formData.append('metafields', JSON.stringify(metafields));
            
            try {
                const response = await fetch(`${URL}/api/b2b/register`, {
                    method: 'POST',
                    headers: getHeaders({ 'Accept': 'application/json' }),
                    body: formData
                });
                
                const data = await response.json();
                if (response.ok && data.success) {
                    form.reset();
                    const cleanContainer = document.getElementById('b2b-dynamic-fields-container');
                    if (cleanContainer) cleanContainer.innerHTML = '';
                    await buildForm();
                    
                    const successBanner = document.getElementById('general-success');
                    successBanner.textContent = i18nStrings.success_message || data.message || 'Submitted successfully!';
                    successBanner.classList.remove('hidden');
                    form.scrollIntoView({ behavior: 'smooth' });
                } else {
                    const genError = document.getElementById('general-error');
                    genError.textContent = data.message || 'Please check fields.';
                    genError.classList.remove('hidden');
                    
                    if (data.errors) {
                        Object.keys(data.errors).forEach(key => {
                            const fieldId = mapId(key);
                            const errEl = document.getElementById(`error-${fieldId}`);
                            const fieldEl = document.getElementById(fieldId);
                            if (errEl && fieldEl) {
                                errEl.textContent = data.errors[key][0];
                                fieldEl.classList.add('invalid');
                            }
                        });
                    }
                    form.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) {
                console.error(err);
                const genError = document.getElementById('general-error');
                genError.textContent = 'Connection error.';
                genError.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-text').classList.remove('hidden');
                submitBtn.querySelector('.btn-spinner').classList.add('hidden');
            }
        });
    });
})();