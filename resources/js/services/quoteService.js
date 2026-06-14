import apiClient from '../utils/axios';

/**
 * Quote Settings API service
 */
export const quoteService = {
    /**
     * Get all quote settings from database.
     * @returns {Promise<Object>}
     */
    getSettings: async () => {
        return apiClient.get('/b2b/quote-settings');
    },

    /**
     * Update quote settings.
     * @param {Object} settings
     * @returns {Promise<Object>}
     */
    updateSettings: async (settings) => {
        return apiClient.post('/b2b/quote-settings/update', {
            settings: settings
        });
    }
};
