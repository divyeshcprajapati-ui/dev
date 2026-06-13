import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';

// Lazy load route components for code splitting & LCP optimization
const B2BDashboard = lazy(() => import('./components/B2BDashboard'));
const B2BExtensionsHub = lazy(() => import('./components/B2BExtensionsHub'));
const Translations = lazy(() => import('./components/Translations'));
const B2BRegisterFormFrontend = lazy(() => import('./components/B2BRegisterFormFrontend'));
const CustomerListing = lazy(() => import('./components/CustomerListing'));
const Pricing = lazy(() => import('./components/Pricing'));
const Notifications = lazy(() => import('./components/Notifications'));

import { BrowserRouter, Routes, Route, Link as ReactRouterLink, useNavigate, useLocation } from 'react-router-dom';
import { NavMenu } from '@shopify/app-bridge-react';
import { useEffect } from 'react';

const IS_EXTERNAL_LINK_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function LinkLikeComponent({ children, url, ...rest }) {
  if (IS_EXTERNAL_LINK_REGEX.test(url)) {
    return (
      <a href={url} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <ReactRouterLink to={url} {...rest}>
      {children}
    </ReactRouterLink>
  );
}

// Performance and LCP Monitoring logger for page transitions
function PerformanceLogger() {
  const location = useLocation();

  useEffect(() => {
    const startTime = performance.now();
    console.log(`[Navigation] Navigating to: ${location.pathname}`);

    // Observe standard browser LCP candidates
    let observer;
    try {
      observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        
        let status = 'GOOD';
        let color = '#008060'; // Green
        if (lcp > 4000) {
          status = 'POOR';
          color = '#d82c0d'; // Red
        } else if (lcp > 2500) {
          status = 'NEEDS IMPROVEMENT';
          color = '#ff9800'; // Orange
        }

        console.log(
          `%c[LCP Monitor] ${location.pathname} - LCP: ${lcp.toFixed(2)}ms (Status: ${status})`,
          `color: ${color}; font-weight: bold;`,
          lastEntry
        );
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('[LCP Monitor] PerformanceObserver not fully supported in this browser.', e);
    }

    // Monitor paint/rendering timeline
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const renderTime = performance.now() - startTime;
        
        let status = 'GOOD';
        let color = '#008060';
        if (renderTime > 300) {
          status = 'POOR';
          color = '#d82c0d';
        } else if (renderTime > 100) {
          status = 'NEEDS IMPROVEMENT';
          color = '#ff9800';
        }

        console.log(
          `%c[Performance] ${location.pathname} rendered and painted in ${renderTime.toFixed(2)}ms (Status: ${status})`,
          `color: ${color}; font-weight: bold;`
        );
      });
    });

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [location]);

  return null;
}

// Visual loading spinner during bundle resolution
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(0, 128, 96, 0.15)',
        borderTop: '3px solid #008060',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AdminRoutes() {
  const navigate = useNavigate();
  return (
    <>
      <PerformanceLogger />
      <NavMenu>
        <a href="/" rel="home">B2B extensions</a>
        <a href="/customers">B2B company</a>
        <a href="/notifications">Notifications</a>
        <a href="/translations">Translations</a>
        <a href="/pricing">Pricing</a>
      </NavMenu>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<B2BExtensionsHub />} />
          <Route path="/b2b-register" element={<B2BExtensionsHub />} />
          <Route path="/customers" element={<CustomerListing />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/translations" element={<Translations />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/register" element={<B2BRegisterFormFrontend />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <AppProvider i18n={enTranslations} linkComponent={LinkLikeComponent}>
      <BrowserRouter>
        <AdminRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}


const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

