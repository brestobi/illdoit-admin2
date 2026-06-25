import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UsersView from './components/UsersView';

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-gray-100">
    <aside className="w-64 bg-gray-800 text-white p-4">
      <h1 className="text-2xl font-bold mb-8">Admin</h1>
      <nav>
        <ul className="space-y-2">
          <li><Link to="/admin" className="block p-2 hover:bg-gray-700">Dashboard</Link></li>
          <li><Link to="/admin/users" className="block p-2 hover:bg-gray-700">Users</Link></li>
          <li><Link to="/admin/verifications" className="block p-2 hover:bg-gray-700">Verifications</Link></li>
        </ul>
      </nav>
    </aside>
    <main className="flex-1 p-8 overflow-y-auto">
      {children}
    </main>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/admin" element={<h2>Dashboard Overview</h2>} />
            <Route path="/admin/users" element={<UsersView />} />
            <Route path="/admin/verifications" element={<h2>Verifications</h2>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
