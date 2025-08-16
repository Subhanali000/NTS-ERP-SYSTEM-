import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  onLogout: () => void;
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ onLogout, children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header onLogout={onLogout} />
      <main className="ml-64 pt-16 p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;