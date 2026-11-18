import apiClient from '../utils/axios';

export const b2bSuiteService = {
    // Translations
    getTranslations: (locale = '') => apiClient.get('/b2b/translations', { params: locale ? { locale } : {} }),
    saveTranslations: (payload) => apiClient.post('/b2b/translations/upsert', payload),
    deleteLocale: (locale) => apiClient.delete(`/b2b/translations/${encodeURIComponent(locale)}`),

    // Ordering (Quick Order / CSV SKU lookup)
    lookupSkus: (params) => apiClient.post('/b2b/ordering/lookup-skus', params),
    searchCatalog: (q) => apiClient.get('/b2b/ordering/lookup-skus', { params: { q } }),

    // Shopping Lists
    getShoppingLists: (status = 'all') => apiClient.get('/b2b/shopping-lists', { params: { status } }),
    createShoppingList: (payload) => apiClient.post('/b2b/shopping-lists', payload),
    updateShoppingListStatus: (id, status) => apiClient.post(`/b2b/shopping-lists/${id}/status`, { status }),
    deleteShoppingList: (id) => apiClient.delete(`/b2b/shopping-lists/${id}`),

    // Team Members (Users & Permissions)
    getTeamMembers: (companyName = '') => apiClient.get('/b2b/team-members', { params: companyName ? { company_name: companyName } : {} }),
    saveTeamMember: (payload) => apiClient.post('/b2b/team-members', payload),
    updateTeamMember: (id, payload) => apiClient.put(`/b2b/team-members/${id}`, payload),
    deleteTeamMember: (id) => apiClient.delete(`/b2b/team-members/${id}`),

    // Credit Limit & Finance Ledger
    getCreditAccounts: () => apiClient.get('/b2b/credit-accounts'),
    saveCreditAccount: (payload) => apiClient.post('/b2b/credit-accounts', payload),
    recordLedgerEntry: (accountId, payload) => apiClient.post(`/b2b/credit-accounts/${accountId}/transactions`, payload),
};
