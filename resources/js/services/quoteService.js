import apiClient from '../utils/axios';

/**
 * Quote Settings & Management API service
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
    },

    /**
     * Get all quotes submitted by customers.
     * @param {string} status - Filter by status
     * @returns {Promise<Object>}
     */
    getQuotes: async (status = 'all') => {
        return apiClient.get('/b2b/quotes', {
            params: { status }
        });
    },

    /**
     * Get a single quote by ID.
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    getQuote: async (id) => {
        return apiClient.get(`/b2b/quotes/${id}`);
    },

    /**
     * Submit a new quote request from storefront.
     * @param {Object} quoteData
     * @returns {Promise<Object>}
     */
    createQuote: async (quoteData) => {
        return apiClient.post('/b2b/quotes', quoteData);
    },

    /**
     * Update a quote (e.g. adjust price/quantity/expiration/etc.).
     * @param {number|string} id
     * @param {Object} quoteData
     * @returns {Promise<Object>}
     */
    updateQuote: async (id, quoteData) => {
        return apiClient.post(`/b2b/quotes/${id}/update`, quoteData);
    },

    /**
     * Send a quote proposal back to client.
     * @param {number|string} id
     * @returns {Promise<Object>}
     */
    sendQuote: async (id) => {
        return apiClient.post(`/b2b/quotes/${id}/send`);
    }
};
