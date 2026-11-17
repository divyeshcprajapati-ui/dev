import React, { Suspense, lazy, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';
import { prewarmToken } from './utils/axios';

// Lazy load route components for code splitting & LCP optimization
const B2BExtensionsHub = lazy(() => import('./components/B2BExtensionsHub'));
const Translations = lazy(() => import('./components/Translations'));
const CustomerListing = lazy(() => import('./components/CustomerListing'));
const Pricing = lazy(() => import('./components/Pricing'));
const Notifications = lazy(() => import('./components/Notifications'));
const SinglePageRegistration = lazy(() => import('./components/SinglePageRegistration'));
const QuoteSettings = lazy(() => import('./components/QuoteSettings'));
const CustomerDetail = lazy(() => import('./components/CustomerDetail'));
const QuoteDetailAdmin = lazy(() => import('./components/QuoteDetailAdmin'));

import { BrowserRouter, Routes, Route, Link as ReactRouterLink, useNavigate, useLocation } from 'react-router-dom';
import { NavMenu } from '@shopify/app-bridge-react';

const IS_EXTERNAL_LINK_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

// Pre-warm the Shopify token cache immediately so the first API call
// doesn't pay the 100-500ms idToken() latency.
prewarmToken();

// Prefetch route bundle chunks on hover or touch to minimize redirect wait time.
function prefetchRoute(url) {
  if (!url || IS_EXTERNAL_LINK_REGEX.test(url)) return;
  const path = url.split('?')[0].split('#')[0];
  switch (path) {
    case '/':
    case '/b2b-register':
      import('./components/B2BExtensionsHub');
      break;
    case '/customers':
      import('./components/CustomerListing');
      break;
    case '/notifications':
      import('./components/Notifications');
      break;
    case '/translations':
      import('./components/Translations');
      break;
    case '/pricing':
      import('./components/Pricing');
      break;
    case '/quotes':
      import('./components/QuoteSettings');
      break;
    case '/register':
      import('./components/SinglePageRegistration');
      break;
    default:
      if (path.startsWith('/customers/')) {
        import('./components/CustomerDetail');
      } else if (path.startsWith('/quotes/')) {
        import('./components/QuoteDetailAdmin');
      }
      break;
  }
}

function LinkLikeComponent({ children, url, ...rest }) {
  if (IS_EXTERNAL_LINK_REGEX.test(url)) {
    return (
      <a href={url} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <ReactRouterLink
      to={url}
      {...rest}
      onMouseEnter={() => prefetchRoute(url)}
      onTouchStart={() => prefetchRoute(url)}
    >
      {children}
    </ReactRouterLink>
  );
}

// Dev-only performance and LCP monitoring logger for page transitions.
// Stripped in production builds so it doesn't add PerformanceObserver overhead.
function PerformanceLogger() {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.PROD) return;

    const startTime = performance.now();
    console.log(`[Navigation] Navigating to: ${location.pathname}`);

    let observer;
    try {
      observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        let status = 'GOOD';
        let color = '#008060';
        if (lcp > 4000) {
          status = 'POOR';
          color = '#d82c0d';
        } else if (lcp > 2500) {
          status = 'NEEDS IMPROVEMENT';
          color = '#ff9800';
        }
        console.log(
          `%c[LCP Monitor] ${location.pathname} - LCP: ${lcp.toFixed(2)}ms (Status: ${status})`,
          `color: ${color}; font-weight: bold;`,
          lastEntry
        );
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // PerformanceObserver not supported
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const renderTime = performance.now() - startTime;
        let status = 'GOOD';
        let color = '#008060';
        if (renderTime > 300) { status = 'POOR'; color = '#d82c0d'; }
        else if (renderTime > 100) { status = 'NEEDS IMPROVEMENT'; color = '#ff9800'; }
        console.log(
          `%c[Performance] ${location.pathname} rendered and painted in ${renderTime.toFixed(2)}ms (Status: ${status})`,
          `color: ${color}; font-weight: bold;`
        );
      });
    });

    return () => { if (observer) observer.disconnect(); };
  }, [location]);

  return null;
}

// Custom top loading progress bar (asymptotic progression like YouTube/GitHub)
function TopProgressBar({ active }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer;
    if (active) {
      setProgress(10);
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + (90 - prev) * 0.12;
        });
      }, 120);
    } else {
      setProgress(100);
      timer = setTimeout(() => { setProgress(0); }, 300);
    }
    return () => {
      clearInterval(timer);
      clearTimeout(timer);
    };
  }, [active]);

  if (progress === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      height: '3px',
      backgroundColor: '#008060',
      zIndex: 9999,
      width: `${progress}%`,
      opacity: progress === 100 ? 0 : 1,
      transition: progress === 100 ? 'width 0.2s ease-out, opacity 0.2s ease-in 0.1s' : 'width 0.3s ease-out',
      boxShadow: '0 0 5px rgba(0, 128, 96, 0.4)'
    }} />
  );
}

// Visual loading spinner during initial bundle resolution
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
  const location = useLocation();
  const [isPending, setIsPending] = useState(false);

  // Eagerly prefetch the two most-visited routes immediately on app mount.
  // This ensures chunks are already cached before the user clicks anything.
  useEffect(() => {
    import('./components/B2BExtensionsHub');
    import('./components/CustomerListing');
  }, []);

  // ─── CRITICAL FIX ────────────────────────────────────────────────────────────
  // NavMenu <a> links are intercepted via onClick + navigate() to prevent
  // Shopify App Bridge from triggering a full-page tunnel reload.
  // A plain <a href="/customers"> inside the Shopify iframe causes the entire
  // React app to be destroyed and re-mounted, which is why LCP was 30-35 seconds.
  // ─────────────────────────────────────────────────────────────────────────────
  const handleNavClick = (e, path) => {
    e.preventDefault();
    setIsPending(true);
    navigate(path);
    // Give the Suspense boundary a tick to start resolving, then clear progress
    requestAnimationFrame(() => setIsPending(false));
  };

  return (
    <>
      <PerformanceLogger />
      <TopProgressBar active={isPending} />
      <NavMenu>
        <a
          href="/"
          rel="home"
          onClick={(e) => handleNavClick(e, '/')}
          onMouseEnter={() => prefetchRoute('/')}
          onTouchStart={() => prefetchRoute('/')}
        >B2B extensions</a>
        <a
          href="/customers"
          onClick={(e) => handleNavClick(e, '/customers')}
          onMouseEnter={() => prefetchRoute('/customers')}
          onTouchStart={() => prefetchRoute('/customers')}
        >B2B company</a>
        <a
          href="/notifications"
          onClick={(e) => handleNavClick(e, '/notifications')}
          onMouseEnter={() => prefetchRoute('/notifications')}
          onTouchStart={() => prefetchRoute('/notifications')}
        >Notifications</a>
        <a
          href="/translations"
          onClick={(e) => handleNavClick(e, '/translations')}
          onMouseEnter={() => prefetchRoute('/translations')}
          onTouchStart={() => prefetchRoute('/translations')}
        >Translations</a>
        <a
          href="/pricing"
          onClick={(e) => handleNavClick(e, '/pricing')}
          onMouseEnter={() => prefetchRoute('/pricing')}
          onTouchStart={() => prefetchRoute('/pricing')}
        >Pricing</a>
      </NavMenu>
      <Suspense fallback={<PageLoader />}>
        {/* Use live location directly — no displayLocation deferral.
            The old useTransition pattern was delaying route rendering unnecessarily,
            keeping the spinner visible for extra seconds. */}
        <Routes location={location}>
          <Route path="/" element={<B2BExtensionsHub />} />
          <Route path="/b2b-register" element={<B2BExtensionsHub />} />
          <Route path="/quotes" element={<QuoteSettings />} />
          <Route path="/quotes/:id" element={<QuoteDetailAdmin />} />
          <Route path="/customers" element={<CustomerListing />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/translations" element={<Translations />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/register" element={<SinglePageRegistration />} />
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
