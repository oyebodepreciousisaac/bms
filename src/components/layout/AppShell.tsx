import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useLocation } from 'react-router-dom';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 w-full max-w-7xl mx-auto overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 p-3.5 sm:p-6 w-full min-w-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

