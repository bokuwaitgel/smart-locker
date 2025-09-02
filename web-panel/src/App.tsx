import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Containers } from './pages/Containers';
import { Lockers } from './pages/Lockers';
import { Deliveries } from './pages/Deliveries';
import { Payments } from './pages/Payments';
import { SMS } from './pages/SMS';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="containers" element={<Containers />} />
            <Route path="lockers" element={<Lockers />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="payments" element={<Payments />} />
            <Route path="sms" element={<SMS />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;