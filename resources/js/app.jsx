import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';
import B2BDashboard from './components/B2BDashboard';
import B2BExtensionsHub from './components/B2BExtensionsHub';

import { BrowserRouter, Routes, Route, Link as ReactRouterLink, useNavigate } from 'react-router-dom';
import Settings from './components/Settings';
import { NavMenu } from '@shopify/app-bridge-react';

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

function AdminRoutes() {
  const navigate = useNavigate();
  return (
    <>
      <NavMenu>
        <a href="/" rel="home">Dashboard</a>
        <a href="/b2b-register">Registration</a>
        <a href="/settings">Settings</a>
      </NavMenu>
      <Routes>
        <Route path="/" element={<B2BDashboard />} />
        <Route path="/b2b-register" element={<B2BExtensionsHub />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
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

