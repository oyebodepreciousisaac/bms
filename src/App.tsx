import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { SalesListPage } from './pages/sales/SalesListPage';
import { NewSalePage } from './pages/sales/NewSalePage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ProductionPage } from './pages/production/ProductionPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { RawMaterialsPage } from './pages/raw-materials/RawMaterialsPage';
import { DistributionPage } from './pages/distribution/DistributionPage';
import { StaffPage } from './pages/staff/StaffPage';
import { SyncStatusPage } from './pages/sync/SyncStatusPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { currentUser, activeRole } = useStore();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    if (activeRole === 'salesperson') {
      return <Navigate to="/sales/new" replace />;
    }
    if (activeRole === 'distributor') {
      return <Navigate to="/distribution" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { currentUser, activeRole } = useStore();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={currentUser ? <Navigate to={activeRole === 'salesperson' ? '/sales/new' : activeRole === 'distributor' ? '/distribution' : '/'} replace /> : <LoginPage />}
      />

      {/* Owner Only Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/raw-materials"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <RawMaterialsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <StaffPage />
          </ProtectedRoute>
        }
      />

      {/* Shared Sales & Counter Staff Routes */}
      <Route
        path="/sales"
        element={
          <ProtectedRoute allowedRoles={['owner', 'salesperson']}>
            <SalesListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales/new"
        element={
          <ProtectedRoute allowedRoles={['owner', 'salesperson']}>
            <NewSalePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute allowedRoles={['owner', 'salesperson', 'distributor']}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/production"
        element={
          <ProtectedRoute allowedRoles={['owner', 'salesperson']}>
            <ProductionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute allowedRoles={['owner', 'salesperson']}>
            <CustomersPage />
          </ProtectedRoute>
        }
      />

      {/* Shared Distribution Route */}
      <Route
        path="/distribution"
        element={
          <ProtectedRoute allowedRoles={['owner', 'distributor']}>
            <DistributionPage />
          </ProtectedRoute>
        }
      />

      {/* Offline Sync Status & Queue Diagnostics */}
      <Route
        path="/sync-status"
        element={
          <ProtectedRoute allowedRoles={['owner', 'salesperson']}>
            <SyncStatusPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
