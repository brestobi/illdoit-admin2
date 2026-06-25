import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersView from './components/UsersView';
import VerificationsView from './components/VerificationsView';
import WithdrawalsView from './components/WithdrawalsView';
import DisputesView from './components/DisputesView';
import ReportsView from './components/ReportsView';
import TransactionsView from './components/TransactionsView';
import ContentView from './components/ContentView';
import ConfigView from './components/ConfigView';

const queryClient = new QueryClient();

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>
    <Layout>{children}</Layout>
  </AuthGuard>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <DashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <AdminRoute>
                <VerificationsView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <AdminRoute>
                <WithdrawalsView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/disputes"
            element={
              <AdminRoute>
                <DisputesView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <ReportsView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <TransactionsView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <AdminRoute>
                <ContentView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/config"
            element={
              <AdminRoute>
                <ConfigView />
              </AdminRoute>
            }
          />
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
