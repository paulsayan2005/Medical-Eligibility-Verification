import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import VerificationPage from './pages/VerificationPage';
import VaultPage from './pages/VaultPage';
import HistoryPage from './pages/HistoryPage';
import PrivacyPage from './pages/PrivacyPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="verify" element={<VerificationPage />} />
        <Route path="vault" element={<VaultPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
