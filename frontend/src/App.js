import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/dashboard/DashboardLayout';
import VendorLayout from './components/vendor/VendorLayout';
import HomePage from './pages/HomePage';
import GetStartedPage from './pages/GetStartedPage';
import CoupleGetStartedPage from './pages/CoupleGetStartedPage';
import VendorGetStartedPage from './pages/VendorGetStartedPage';
import CreateAccountPage from './pages/CreateAccountPage';
import LoginPage from './pages/LoginPage';
import PasswordResetPage from './pages/PasswordResetPage';
import WeddingProfilePage from './pages/WeddingProfilePage';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import ChecklistPage from './pages/dashboard/ChecklistPage';
import GuestListPage from './pages/dashboard/GuestListPage';
import SeatingChartPage from './pages/dashboard/SeatingChartPage';
import BudgetPage from './pages/dashboard/BudgetPage';
import ExpenseOverviewPage from './pages/dashboard/ExpenseOverviewPage';
import VendorsPage from './pages/dashboard/VendorsPage';
import CoupleBookingsPage from './pages/dashboard/CoupleBookingsPage';
import WeddingCrewPage from './pages/dashboard/WeddingCrewPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import InvitationsPage from './pages/dashboard/InvitationsPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import ChatbotPage from './pages/dashboard/ChatbotPage';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorBookingsPage from './pages/vendor/VendorBookingsPage';
import VendorSetupPage from './pages/vendor/VendorSetupPage';
import './App.css';

function AppShell() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/vendor');
  const isOnboarding = location.pathname.startsWith('/get-started')
    || location.pathname === '/create-account'
    || (location.pathname === '/wedding-profile' && location.state?.fromSignup);

  return (
    <div className="app">
      {!isDashboard && !isOnboarding && <Navbar />}
      <main className={isDashboard ? 'app-main--dash' : ''}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/get-started/couple" element={<CoupleGetStartedPage />} />
          <Route path="/get-started/vendor" element={<VendorGetStartedPage />} />
          <Route path="/create-account" element={<CreateAccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/wedding-profile" element={<WeddingProfilePage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="checklist" element={<ChecklistPage />} />
            <Route path="crew" element={<WeddingCrewPage />} />
            <Route path="guests" element={<GuestListPage />} />
            <Route path="seating" element={<SeatingChartPage />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="budget/expenses" element={<ExpenseOverviewPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="bookings" element={<CoupleBookingsPage />} />
            <Route path="invitations" element={<InvitationsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="assistant" element={<ChatbotPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/vendor" element={<VendorLayout />}>
            <Route index element={<VendorDashboard />} />
            <Route path="bookings" element={<VendorBookingsPage />} />
            <Route path="profile" element={<VendorSetupPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isDashboard && !isOnboarding && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
