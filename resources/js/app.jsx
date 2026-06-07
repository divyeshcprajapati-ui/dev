import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';
import B2BDashboard from './components/B2BDashboard';
import B2BRegisterFormFrontend from './components/B2BRegisterFormFrontend';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Settings from './components/Settings';

function App() {
  return (
    <AppProvider i18n={enTranslations}>
      <BrowserRouter>
        <ui-nav-menu>
          <a href="/" rel="home">Dashboard</a>
          <a href="/b2b-register">Registration</a>
          <a href="/settings">Settings</a>
        </ui-nav-menu>
        <Routes>
          <Route path="/" element={<B2BDashboard />} />
          <Route path="/b2b-register" element={<B2BRegisterFormFrontend />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
