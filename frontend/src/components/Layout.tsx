import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../api/supabase';

const NavItem = ({ to, label, icon }: { to: string; label: string; icon: string }) => {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-indigo-600 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        <span className="text-lg">{icon}</span>
        {label}
      </Link>
    </li>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-200`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-white tracking-tight">
              <span className="text-indigo-400">illdoit</span> Admin
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavItem to="/admin" label="Dashboard" icon="📊" />
          <div className="border-t border-gray-700 my-2" />
          <p className={`text-xs text-gray-500 uppercase tracking-wider px-3 py-1 ${!sidebarOpen && 'hidden'}`}>
            Management
          </p>
          <NavItem to="/admin/users" label="Users" icon="👥" />
          <NavItem to="/admin/verifications" label="Verifications" icon="✅" />
          <NavItem to="/admin/withdrawals" label="Withdrawals" icon="💰" />
          <NavItem to="/admin/disputes" label="Disputes" icon="⚖️" />
          <NavItem to="/admin/reports" label="Reports" icon="🚩" />
          <div className="border-t border-gray-700 my-2" />
          <p className={`text-xs text-gray-500 uppercase tracking-wider px-3 py-1 ${!sidebarOpen && 'hidden'}`}>
            Finance
          </p>
          <NavItem to="/admin/transactions" label="Transactions" icon="💳" />
          <div className="border-t border-gray-700 my-2" />
          <p className={`text-xs text-gray-500 uppercase tracking-wider px-3 py-1 ${!sidebarOpen && 'hidden'}`}>
            Content
          </p>
          <NavItem to="/admin/content" label="Content" icon="📋" />
          <NavItem to="/admin/config" label="Config" icon="⚙️" />
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg w-full transition-colors"
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-900">
        {children}
      </main>
    </div>
  );
};

export default Layout;
