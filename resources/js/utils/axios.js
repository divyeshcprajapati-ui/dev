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

// Request Interceptor: Attach CSRF Token if available in meta tags
apiClient.interceptors.request.use(
    (config) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            config.headers['X-CSRF-TOKEN'] = csrfToken;
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
