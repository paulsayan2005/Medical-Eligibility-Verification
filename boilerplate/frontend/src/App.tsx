import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { useWallet } from './context/WalletContext';

// Placeholders for Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import VerificationPage from './pages/VerificationPage';
import VaultPage from './pages/VaultPage';
import HistoryPage from './pages/HistoryPage';
import PrivacyPage from './pages/PrivacyPage';
import SettingsPage from './pages/SettingsPage';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { connectorAPI } = useWallet();
  if (!connectorAPI) {
    // If not connected, we could show a nice empty state or redirect to dashboard
    return <Navigate to="/app" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="verify" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
        <Route path="vault" element={<ProtectedRoute><VaultPage /></ProtectedRoute>} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
