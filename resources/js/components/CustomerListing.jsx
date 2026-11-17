import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Box,
  DataTable,
  Banner,
  Divider,
  Pagination
} from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';
import { registrationService } from '../services/registrationService';

export default function CustomerListing() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Server-side pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const navigate = useNavigate();

  const CACHE_KEY_PREFIX = 'b2b_customers_cache_';
  const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  const getCacheKey = (pageNumber, statusFilter) =>
    `${CACHE_KEY_PREFIX}${statusFilter}_p${pageNumber}`;

  const readCache = (pageNumber, statusFilter) => {
    try {
      const raw = sessionStorage.getItem(getCacheKey(pageNumber, statusFilter));
      if (!raw) return null;
      const { data, expiresAt } = JSON.parse(raw);
      if (Date.now() > expiresAt) return null; // expired
      return data;
    } catch (_) { return null; }
  };

  const writeCache = (pageNumber, statusFilter, payload) => {
    try {
      sessionStorage.setItem(
        getCacheKey(pageNumber, statusFilter),
        JSON.stringify({ data: payload, expiresAt: Date.now() + CACHE_TTL })
      );
    } catch (_) { /* storage quota */ }
  };

  const applyResponse = (response, pageNumber) => {
    if (response && response.success && Array.isArray(response.data)) {
      setSubmissions(response.data);
      if (response.meta) {
        setTotalPages(response.meta.last_page || 1);
        setTotalItems(response.meta.total || 0);
        setHasMore(!!response.meta.has_more);
      }
    } else if (Array.isArray(response)) {
      setSubmissions(response);
      setTotalPages(1);
      setTotalItems(response.length);
      setHasMore(false);
    } else {
      setSubmissions([]);
    }
  };

  const fetchLeads = async (pageNumber = page, statusFilter = activeTab) => {
    setError('');

    // Stale-while-revalidate: render cached data instantly, then refresh silently
    const cached = readCache(pageNumber, statusFilter);
    if (cached) {
      applyResponse(cached, pageNumber);
      // Still revalidate in background — no loading spinner for cache hits
      registrationService.getApplications(pageNumber, 20, statusFilter)
        .then(fresh => {
          applyResponse(fresh, pageNumber);
          writeCache(pageNumber, statusFilter, fresh);
        })
        .catch(() => {}); // silent background refresh failure is fine
      return;
    }

    // Cache miss — show loading spinner
    setLoading(true);
    try {
      const response = await registrationService.getApplications(pageNumber, 20, statusFilter);
      applyResponse(response, pageNumber);
      writeCache(pageNumber, statusFilter, response);
    } catch (err) {
      console.error("Failed fetching leads:", err);
      setError(err.message || 'Failed to fetch registered customers. Using mock/local cache.');
      const saved = localStorage.getItem('b2b_submissions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(sub => {
              const s = (sub.status || 'Pending').toLowerCase();
              if (statusFilter === 'all') return true;
              if (statusFilter === 'pending') return s === 'pending';
              if (statusFilter === 'approved') return s === 'approved';
              if (statusFilter === 'failed') return s === 'failed' || s === 'rejected';
              return true;
            });
            const limit = 20;
            const startIndex = (pageNumber - 1) * limit;
            const paged = filtered.slice(startIndex, startIndex + limit);
            setSubmissions(paged);
            setTotalPages(Math.ceil(filtered.length / limit) || 1);
            setTotalItems(filtered.length);
            setHasMore(startIndex + limit < filtered.length);
          }
        } catch (e) {
          console.error("Failed parsing fallback cache:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1, 'all');
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    fetchLeads(1, tab);
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLeads(nextPage, activeTab);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      fetchLeads(prevPage, activeTab);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await registrationService.approveApplication(id);
      if (response && response.success) {
        setSubmissions(prev => prev.map(sub => 
          sub.id === id ? { ...sub, status: 'Approved' } : sub
        ));
      } else {
        updateLocalStatus(id, 'Approved');
      }
    } catch (err) {
      updateLocalStatus(id, 'Approved');
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await registrationService.rejectApplication(id);
      if (response && response.success) {
        setSubmissions(prev => prev.map(sub => 
          sub.id === id ? { ...sub, status: 'Rejected' } : sub
        ));
      } else {
        updateLocalStatus(id, 'Rejected');
      }
    } catch (err) {
      updateLocalStatus(id, 'Rejected');
    }
  };

  const updateLocalStatus = (id, status) => {
    const updated = submissions.map(sub => 
      sub.id === id ? { ...sub, status } : sub
    );
    setSubmissions(updated);
    localStorage.setItem('b2b_submissions', JSON.stringify(updated));
  };

  const safeSubmissions = Array.isArray(submissions) ? submissions : [];

  // Date formatter matching screenshot: 05:24:27 7/6/2026 (HH:MM:SS D/M/YYYY)
  const formatSubmittedDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const pad = (num) => String(num).padStart(2, '0');
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Format rows for Polaris DataTable
  const submissionRows = safeSubmissions.map((sub) => {
    const contactName = sub.contact || `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'N/A';
    const companyName = sub.company || sub.company_name || 'N/A';
    const emailAddress = sub.email || 'N/A';
    const phoneNo = sub.phone || '-';
    const rawStatus = sub.status || 'Pending';
    const createdDate = formatSubmittedDate(sub.created_at || sub.date);

    // Map UI Display and Tones
    let displayStatus = rawStatus;
    let badgeTone = 'attention'; // Pending
    if (rawStatus === 'Approved') {
      badgeTone = 'success';
    } else if (rawStatus === 'Rejected' || rawStatus === 'Failed') {
      displayStatus = 'Failed';
      badgeTone = 'critical';
    }

    return [
      <input type="checkbox" style={{ cursor: 'pointer' }} />,
      <span 
        style={{ cursor: 'pointer', color: '#005bd3', fontWeight: '500', textDecoration: 'underline' }} 
        onClick={() => navigate(`/customers/${sub.id}`)}
      >
        {contactName}
      </span>,
      companyName,
      emailAddress,
      phoneNo,
      <Badge tone={badgeTone}>{displayStatus}</Badge>,
      createdDate
    ];
  });

  return (
    <Page>
      <BlockStack gap="500">
        {error && (
          <Banner tone="warning" onDismiss={() => setError('')}>
            <p>{error}</p>
          </Banner>
        )}

        {/* Custom Page Header with Back Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <span style={{ fontSize: '18px', color: '#6d7175' }}>←</span>
            <Text variant="headingLg" as="h1">B2B Company management</Text>
          </div>
          <Text variant="bodyMd" tone="subdued">
            Manage registration form and all company submissions, review applications before creating company
          </Text>
        </div>

        {/* Sub-header Banner */}
        <Card padding="400">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <InlineStack gap="200" blockAlign="center">
              <Text variant="headingSm" as="span">B2B/Wholesale Company registration form</Text>
              <Badge tone="info">1/1</Badge>
            </InlineStack>
            <Button size="medium" onClick={() => navigate('/b2b-register')}>Edit form</Button>
          </div>
        </Card>

        {/* Main Tabs and Table Card */}
        <Card padding="0">
          {/* Custom Tabs matching screenshot */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e1e3e5',
            padding: '8px 16px 0 16px',
            background: '#ffffff'
          }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              {['all', 'pending', 'approved', 'failed'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: '8px 4px 12px 4px',
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? '#202223' : '#6d7175',
                      borderBottom: isActive ? '3px solid #008060' : '3px solid transparent',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Filter Search / Sort Icons */}
            <div style={{ display: 'flex', gap: '8px', paddingBottom: '8px' }}>
              <div style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #d2d5d8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff'
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6d7175" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #d2d5d8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff'
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6d7175" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ padding: '0 0' }}>
            {loading ? (
              <Box padding="1000" style={{ textAlign: 'center' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  border: '3px solid rgba(0, 128, 96, 0.15)',
                  borderTop: '3px solid #008060',
                  borderRadius: '50%',
                  margin: '30px auto 10px',
                  animation: 'spin-leads 0.8s linear infinite'
                }} />
                <Text variant="bodyMd">Loading applications...</Text>
                <style>{`
                  @keyframes spin-leads {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </Box>
            ) : safeSubmissions.length > 0 ? (
              <>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={[
                    <input type="checkbox" style={{ cursor: 'pointer' }} />,
                    'Customer',
                    'Company',
                    'Email',
                    'Phone',
                    'Status',
                    'Submitted at'
                  ]}
                  rows={submissionRows}
                />
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '16px',
                    borderTop: '1px solid #e1e3e5',
                    background: '#f6f6f7'
                  }}>
                    <Pagination
                      hasPrevious={page > 1}
                      onPrevious={handlePrevPage}
                      hasNext={page < totalPages}
                      onNext={handleNextPage}
                      label={`Page ${page} of ${totalPages} (Total: ${totalItems})`}
                    />
                  </div>
                )}
              </>
            ) : (
              <Box padding="1000" style={{ textAlign: 'center' }}>
                <BlockStack gap="200" align="center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8c9196" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <Text variant="headingSm">No applications found</Text>
                  <Text variant="bodySm" tone="subdued">
                    No registrations fit this filter category.
                  </Text>
                </BlockStack>
              </Box>
            )}
          </div>
        </Card>

        {/* Notifications Footer Card */}
        <Card padding="400">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <BlockStack gap="100">
              <Text variant="headingMd" as="h3">Notifications</Text>
              <Text variant="bodyMd" tone="subdued">
                Set up and manage notifications for you and your customers.
              </Text>
            </BlockStack>
            <Button size="medium" onClick={() => navigate('/notifications')}>Manage</Button>
          </div>
        </Card>
      </BlockStack>
    </Page>
  );
}
