import React, { Suspense, lazy, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';
import { prewarmToken } from './utils/axios';
import B2BExtensionsHub from './components/B2BExtensionsHub';

// Lazy load non-default route components for code splitting & initial LCP speed
const Translations = lazy(() => import('./components/Translations'));
const CustomerListing = lazy(() => import('./components/CustomerListing'));
const Pricing = lazy(() => import('./components/Pricing'));
const Notifications = lazy(() => import('./components/Notifications'));
const SinglePageRegistration = lazy(() => import('./components/SinglePageRegistration'));
const QuoteSettings = lazy(() => import('./components/QuoteSettings'));
const CustomerDetail = lazy(() => import('./components/CustomerDetail'));
const QuoteDetailAdmin = lazy(() => import('./components/QuoteDetailAdmin'));
const OrderingTools = lazy(() => import('./components/OrderingTools'));
const ShoppingLists = lazy(() => import('./components/ShoppingLists'));
const TeamMembers = lazy(() => import('./components/TeamMembers'));
const CreditFinance = lazy(() => import('./components/CreditFinance'));

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
    case '/customers':
      import('./components/CustomerListing');
      break;
    case '/notifications':
      import('./components/Notifications');
      break;
    case '/translations':
      import('./components/Translations');
      break;
    case '/ordering':
      import('./components/OrderingTools');
      break;
    case '/shopping-lists':
      import('./components/ShoppingLists');
      break;
    case '/team-members':
      import('./components/TeamMembers');
      break;
    case '/credit-finance':
      import('./components/CreditFinance');
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

// Performance and LCP monitoring logger for Shopify Admin embedded pages.
function PerformanceLogger() {
  const location = useLocation();

  // 1. Initial Page Load LCP Observer (measures native browser document LCP ONCE on app mount per Web Vitals spec)
  useEffect(() => {
    let lcpObserver;
    const stopObserver = () => {
      if (lcpObserver) {
        try { lcpObserver.disconnect(); } catch (_) {}
      }
    };

    try {
      if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
        lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (!lastEntry) return;

          const lcpValue = Math.round(lastEntry.startTime);
          let badgeColor = '#008060';
          let statusText = 'GOOD (< 2.5s)';
          if (lcpValue > 4000) {
            badgeColor = '#dc2626';
            statusText = 'POOR (> 4.0s)';
          } else if (lcpValue > 2500) {
            badgeColor = '#f59e0b';
            statusText = 'NEEDS IMPROVEMENT (2.5s - 4.0s)';
          }

          console.log(
            `%c[INITIAL APP LCP]%c ${window.location.pathname} → ${lcpValue}ms (%c${statusText}%c)`,
            `background: ${badgeColor}; color: #ffffff; padding: 3px 7px; border-radius: 4px; font-weight: bold; font-size: 11px;`,
            'font-weight: bold; color: #111827; font-size: 12px;',
            `color: ${badgeColor}; font-weight: bold;`,
            'color: #111827;',
            lastEntry.element || lastEntry
          );

          window.__b2b_initial_lcp = { lcp: lcpValue, status: statusText, entry: lastEntry };
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Disconnect observer on first user interaction as per official Google Core Web Vitals spec
        ['keydown', 'click', 'pointerdown', 'touchstart'].forEach(type => {
          window.addEventListener(type, stopObserver, { once: true, passive: true });
        });
      }
    } catch (_) {}

    return () => {
      stopObserver();
      ['keydown', 'click', 'pointerdown', 'touchstart'].forEach(type => {
        window.removeEventListener(type, stopObserver);
      });
    };
  }, []); // Run ONCE on initial document load

  // 2. SPA Route Transition & Render Timing (measures every tab/page change)
  useEffect(() => {
    const pagePath = location.pathname;
    const navStartTime = performance.now();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const routeRenderTime = Math.round(performance.now() - navStartTime);
        let badgeColor = '#008060';
        let statusText = 'FAST (< 300ms)';
        if (routeRenderTime > 800) {
          badgeColor = '#dc2626';
          statusText = 'SLOW (> 800ms)';
        } else if (routeRenderTime > 300) {
          badgeColor = '#f59e0b';
          statusText = 'MODERATE (300ms - 800ms)';
        }

        console.log(
          `%c[PAGE RENDER]%c ${pagePath} rendered in ${routeRenderTime}ms (%c${statusText}%c)`,
          `background: ${badgeColor}; color: #ffffff; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 11px;`,
          'font-weight: 600; color: #374151; font-size: 11px;',
          `color: ${badgeColor}; font-weight: bold;`,
          'color: #374151;'
        );

        window.__b2b_route_timings = window.__b2b_route_timings || [];
        window.__b2b_route_timings.push({
          page: pagePath,
          renderTime: `${routeRenderTime}ms`,
          status: statusText,
          timestamp: new Date().toLocaleTimeString()
        });

        window.getB2BPerformance = () => {
          console.table(window.__b2b_route_timings);
          return { initialLCP: window.__b2b_initial_lcp, routes: window.__b2b_route_timings };
        };
      });
    });
  }, [location.pathname]);

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

  // Eagerly prefetch the most-visited route immediately on app mount.
  useEffect(() => {
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
          <Route path="/ordering" element={<OrderingTools />} />
          <Route path="/shopping-lists" element={<ShoppingLists />} />
          <Route path="/team-members" element={<TeamMembers />} />
          <Route path="/credit-finance" element={<CreditFinance />} />
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
