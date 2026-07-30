import axios from 'axios';

// Create a custom Axios instance configured for API requests
const apiClient = axios.create({
    baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api',
    timeout: 15000,
    headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    withCredentials: true // Required to allow cookies (like XSRF-TOKEN) to be sent automatically
});

// Request Interceptor: Attach CSRF Token, Shop Domain, and Shopify Session Token if available
apiClient.interceptors.request.use(
    async (config) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            config.headers['X-CSRF-TOKEN'] = csrfToken;
        }

        // Extract shop from URL parameters or session storage
        const urlParams = new URLSearchParams(window.location.search);
        let shop = urlParams.get('shop');
        if (shop) {
            sessionStorage.setItem('shopify_shop', shop);
        } else {
            shop = sessionStorage.getItem('shopify_shop');
        }

        if (shop) {
            config.headers['X-Shop-Domain'] = shop;
        }

        // Fetch Shopify Session Token (ID Token) if shopify API is loaded in App Bridge
        if (typeof window !== 'undefined' && window.shopify && typeof window.shopify.idToken === 'function') {
            try {
                const token = await window.shopify.idToken();
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
            } catch (e) {
                console.error('[Axios Interceptor] Failed to retrieve Shopify ID Token:', e);
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Format and normalize success and error states
apiClient.interceptors.response.use(
    (response) => {
        // Return standard response structure
        return response.data;
    },
    (error) => {
        const customError = {
            message: 'An unexpected error occurred. Please try again.',
            status: error.response?.status || 500,
            errors: null,
            originalError: error
        };

        if (error.response) {
            const data = error.response.data;
            customError.message = data.message || customError.message;
            
            // Handle Validation Errors (422 Unprocessable Entity)
            if (error.response.status === 422 && data.errors) {
                customError.errors = data.errors;
            }
            
            // Handle Rate Limiting (429 Too Many Requests)
            if (error.response.status === 429) {
                customError.message = 'Too many requests. Please wait a moment before trying again.';
            }
        } else if (error.request) {
            customError.message = 'No response received from the server. Please check your network connection.';
        }

        return Promise.reject(customError);
    }
);

export default apiClient;
