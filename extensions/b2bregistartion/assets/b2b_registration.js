(function () {
  // Configured backend base URL
  const API_BASE_URL = 'https://onshore-embezzle-skinny.ngrok-free.dev';

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('b2b-registration-form');
    if (!form) return;

    const submitBtn = form.querySelector('.submit-btn');
    const fileInput = document.getElementById('businessDocument');
    const filePlaceholder = form.querySelector('.upload-text');

    const countrySelect = document.getElementById('country');
    const stateSelect = document.getElementById('state');
    const citySelect = document.getElementById('city');

    let countriesData = [];
    let statesData = [];

    // Helper to get request headers including ngrok bypass
    function getRequestHeaders(extraHeaders = {}) {
      const shop = document.getElementById('shopify-shop-domain')?.value || (typeof Shopify !== 'undefined' ? Shopify.shop : '');
      return {
        'ngrok-skip-browser-warning': 'true',
        ...(shop ? { 'X-Shop-Domain': shop } : {}),
        ...extraHeaders
      };
    }

    // --- 1. Dynamic Locations Fetching ---
    async function loadCountries() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/b2b/locations/countries`, {
          headers: getRequestHeaders()
        });
        if (!res.ok) throw new Error('Failed to load countries');
        countriesData = await res.json();
        
        countrySelect.innerHTML = '<option value="">Select Country</option>';
        countriesData.forEach(country => {
          const opt = document.createElement('option');
          opt.value = country.name;
          opt.dataset.code = country.isoCode;
          opt.textContent = country.name;
          countrySelect.appendChild(opt);
        });
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    }

    async function loadStates(countryCode) {
      try {
        stateSelect.disabled = true;
        stateSelect.innerHTML = '<option value="">Loading states...</option>';
        
        const res = await fetch(`${API_BASE_URL}/api/b2b/locations/states?countryCode=${countryCode}`, {
          headers: getRequestHeaders()
        });
        if (!res.ok) throw new Error('Failed to load states');
        statesData = await res.json();
        
        stateSelect.innerHTML = '<option value="">Select State</option>';
        if (statesData.length === 0) {
          stateSelect.innerHTML = '<option value="">No states available</option>';
          stateSelect.required = false;
          citySelect.disabled = false;
          citySelect.innerHTML = '<option value="">Select City</option>';
          loadCities(countryCode, '');
        } else {
          stateSelect.disabled = false;
          stateSelect.required = true;
          statesData.forEach(state => {
            const opt = document.createElement('option');
            opt.value = state.name;
            opt.dataset.code = state.isoCode;
            opt.textContent = state.name;
            stateSelect.appendChild(opt);
          });
        }
      } catch (err) {
        console.error('Error loading states:', err);
        stateSelect.innerHTML = '<option value="">Error loading states</option>';
      }
    }

    async function loadCities(countryCode, stateCode) {
      try {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">Loading cities...</option>';
        
        const res = await fetch(`${API_BASE_URL}/api/b2b/locations/cities?countryCode=${countryCode}&stateCode=${stateCode}`, {
          headers: getRequestHeaders()
        });
        if (!res.ok) throw new Error('Failed to load cities');
        const cities = await res.json();
        
        citySelect.innerHTML = '<option value="">Select City</option>';
        citySelect.disabled = false;
        
        if (cities.length === 0) {
          const opt = document.createElement('option');
          opt.value = "Other";
          opt.textContent = "Other / Not Listed";
          citySelect.appendChild(opt);
        } else {
          cities.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city.name;
            opt.textContent = city.name;
            citySelect.appendChild(opt);
          });
        }
      } catch (err) {
        console.error('Error loading cities:', err);
        citySelect.innerHTML = '<option value="">Error loading cities</option>';
      }
    }

    // Event Listeners for Location Selects
    countrySelect.addEventListener('change', function () {
      stateSelect.disabled = true;
      stateSelect.innerHTML = '<option value="">Select State</option>';
      citySelect.disabled = true;
      citySelect.innerHTML = '<option value="">Select City</option>';
      
      const selectedOption = countrySelect.options[countrySelect.selectedIndex];
      const code = selectedOption.dataset.code;
      if (code) {
        loadStates(code);
      }
    });

    stateSelect.addEventListener('change', function () {
      citySelect.disabled = true;
      citySelect.innerHTML = '<option value="">Select City</option>';
      
      const selectedCountryOption = countrySelect.options[countrySelect.selectedIndex];
      const countryCode = selectedCountryOption.dataset.code;
      
      const selectedStateOption = stateSelect.options[stateSelect.selectedIndex];
      const stateCode = selectedStateOption.dataset.code;
      
      if (countryCode) {
        loadCities(countryCode, stateCode || '');
      }
    });

    // Initialize Countries
    loadCountries();

    // --- 2. Validation & Submits ---
    function clearErrors() {
      form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
      form.querySelectorAll('input, select, textarea').forEach(el => el.classList.remove('invalid'));
      const genError = document.getElementById('general-error');
      genError.classList.add('hidden');
      genError.textContent = '';
      const genSuccess = document.getElementById('general-success');
      genSuccess.classList.add('hidden');
      genSuccess.textContent = '';
    }

    function validateForm() {
      clearErrors();
      let isValid = true;

      // Validate all required fields at once
      const requiredFields = ['firstName', 'lastName', 'email', 'companyName', 'address', 'country', 'zip'];
      if (stateSelect.required && !stateSelect.disabled) {
        requiredFields.push('state');
      }
      if (citySelect.required && !citySelect.disabled) {
        requiredFields.push('city');
      }

      requiredFields.forEach(id => {
        const field = document.getElementById(id);
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('invalid');
          document.getElementById(`error-${id}`).textContent = 'This field is required';
        }
      });

      // Email validation
      const email = document.getElementById('email');
      if (email.value.trim() && !/\S+@\S+\.\S+/.test(email.value.trim())) {
        isValid = false;
        email.classList.add('invalid');
        document.getElementById('error-email').textContent = 'Please enter a valid email address';
      }

      // Website URL validation if filled
      const website = document.getElementById('website');
      if (website.value.trim()) {
        try {
          new URL(website.value.trim());
        } catch (_) {
          isValid = false;
          website.classList.add('invalid');
          document.getElementById('error-website').textContent = 'Please enter a valid URL (including http:// or https://)';
        }
      }

      // File validation if exists
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          isValid = false;
          fileInput.classList.add('invalid');
          document.getElementById('error-businessDocument').textContent = 'Allowed formats: PDF, PNG, JPG';
        } else if (file.size > 10 * 1024 * 1024) { // 10MB
          isValid = false;
          fileInput.classList.add('invalid');
          document.getElementById('error-businessDocument').textContent = 'File size cannot exceed 10MB';
        }
      }

      return isValid;
    }

    // File Input UI Handler
    fileInput.addEventListener('change', function () {
      if (fileInput.files.length > 0) {
        filePlaceholder.textContent = fileInput.files[0].name;
        filePlaceholder.style.color = '#111827';
      } else {
        filePlaceholder.textContent = 'Choose file (PDF, PNG, JPG - Max 10MB)';
        filePlaceholder.style.color = '#6b7280';
      }
    });

    // --- 3. Form Submit ---
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm()) return;

      // Set Loading UI State
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').classList.add('hidden');
      submitBtn.querySelector('.btn-spinner').classList.remove('hidden');

      const formData = new FormData();
      const shopDomain = document.getElementById('shopify-shop-domain')?.value || (typeof Shopify !== 'undefined' ? Shopify.shop : '');
      if (shopDomain) {
        formData.append('shop', shopDomain);
      }
      formData.append('firstName', document.getElementById('firstName').value.trim());
      formData.append('lastName', document.getElementById('lastName').value.trim());
      formData.append('email', document.getElementById('email').value.trim());
      formData.append('companyName', document.getElementById('companyName').value.trim());
      formData.append('address', document.getElementById('address').value.trim());
      formData.append('country', document.getElementById('country').value);
      formData.append('zip', document.getElementById('zip').value.trim());
      
      const websiteVal = document.getElementById('website').value.trim();
      if (websiteVal) formData.append('website', websiteVal);
      
      const taxIdVal = document.getElementById('taxId').value.trim();
      if (taxIdVal) formData.append('taxId', taxIdVal);
      
      const phoneVal = document.getElementById('phone').value.trim();
      if (phoneVal) formData.append('phone', phoneVal);
      
      const notesVal = document.getElementById('notes').value.trim();
      if (notesVal) formData.append('notes', notesVal);

      // Handle optional state/city
      const stateVal = stateSelect.value;
      if (stateVal && !stateSelect.disabled) {
        formData.append('state', stateVal);
      }
      const cityVal = citySelect.value;
      if (cityVal && !citySelect.disabled) {
        formData.append('city', cityVal);
      }

      // Add file if uploaded
      if (fileInput.files.length > 0) {
        formData.append('businessDocument', fileInput.files[0]);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/b2b/register`, {
          method: 'POST',
          headers: getRequestHeaders({
            'Accept': 'application/json'
          }),
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Success State
          form.reset();
          filePlaceholder.textContent = 'Choose file (PDF, PNG, JPG - Max 10MB)';
          
          const successBanner = document.getElementById('general-success');
          successBanner.textContent = data.message || 'Application submitted successfully!';
          successBanner.classList.remove('hidden');
          
          form.scrollIntoView({ behavior: 'smooth' });
        } else {
          // Handle Validation / Backend Errors
          const genError = document.getElementById('general-error');
          genError.textContent = data.message || 'Failed to submit application. Please check your fields.';
          genError.classList.remove('hidden');

          if (data.errors) {
            Object.keys(data.errors).forEach(key => {
              const errEl = document.getElementById(`error-${key}`);
              const fieldEl = document.getElementById(key);
              if (errEl && fieldEl) {
                errEl.textContent = data.errors[key][0];
                fieldEl.classList.add('invalid');
              }
            });
          }
          
          form.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (error) {
        console.error('Submission Error:', error);
        const genError = document.getElementById('general-error');
        genError.textContent = 'An unexpected connection error occurred. Please try again later.';
        genError.classList.remove('hidden');
        form.scrollIntoView({ behavior: 'smooth' });
      } finally {
        // Reset Loading UI State
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.btn-spinner').classList.add('hidden');
      }
    });
  });
})();
