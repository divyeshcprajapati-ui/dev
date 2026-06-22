import apiClient from '../utils/axios';

/**
 * B2B Registration API service
 */
export const registrationService = {
    /**
     * Submit B2B registration application form data.
     * Handles file uploads automatically by converting the payload to FormData.
     * 
     * @param {Object} rawData - Form fields
     * @param {File|null} file - Business document file instance
     * @returns {Promise<Object>}
     */
    submitRegistration: async (rawData, file = null) => {
        const formData = new FormData();

        // Append standard fields
        Object.keys(rawData).forEach(key => {
            if (rawData[key] !== undefined && rawData[key] !== null) {
                if (key === 'metafields' && typeof rawData[key] === 'object') {
                    formData.append(key, JSON.stringify(rawData[key]));
                } else {
                    formData.append(key, rawData[key]);
                }
            }
        });

        // Append file if present
        if (file) {
            formData.append('businessDocument', file);
        }

        // Post request with multipart/form-data headers
        return apiClient.post('/b2b/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    /**
     * Get all B2B applications from database with pagination and status filters.
     * @param {number} page
     * @param {number} limit
     * @param {string} status
     * @returns {Promise<Object>}
     */
    getApplications: async (page = 1, limit = 20, status = 'all') => {
        return apiClient.get('/b2b/applications', {
            params: { page, limit, status }
        });
    },

    /**
     * Get a single B2B application by ID.
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    getApplication: async (id) => {
        return apiClient.get(`/b2b/applications/${id}`);
    },

    /**
     * Approve a B2B application by ID.
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    approveApplication: async (id) => {
        return apiClient.post(`/b2b/applications/${id}/approve`);
    },

    /**
     * Reject a B2B application by ID.
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    rejectApplication: async (id) => {
        return apiClient.post(`/b2b/applications/${id}/reject`);
    },

    /**
     * Get all B2B subscription modules and pricing from database.
     * @returns {Promise<Object>}
     */
    getSubscriptions: async () => {
        return apiClient.get('/b2b/subscriptions');
    },

    /**
     * Get all notification settings.
     * @returns {Promise<Object>}
     */
    getNotificationSettings: async () => {
        return apiClient.get('/b2b/notification-settings');
    },

    /**
     * Update a specific notification setting.
     * @param {string} key
     * @param {boolean} isEnabled
     * @returns {Promise<Object>}
     */
    updateNotificationSetting: async (key, isEnabled) => {
        return apiClient.post('/b2b/notification-settings/update', {
            setting_key: key,
            is_enabled: isEnabled ? 1 : 0
        });
    },

    /**
     * Fetch form configuration steps from the database
     * @returns {Promise<Object>}
     */
    getFormConfig: async () => {
        return apiClient.get('/b2b/form-config');
    },

    /**
     * Save form configuration steps to the database
     * @param {Array} steps
     * @returns {Promise<Object>}
     */
    saveFormConfig: async (steps) => {
        return apiClient.post('/b2b/form-config/update', { steps });
    }
};

