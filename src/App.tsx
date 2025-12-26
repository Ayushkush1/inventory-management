import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { InventoryProvider } from './context/InventoryContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import Unauthorized from './pages/Unauthorized';

// Lazy load other pages
const Products = lazy(() => import('./pages/Products/Products'));
const Stock = lazy(() => import('./pages/Stock/Stock'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const TeamManagement = lazy(() => import('./pages/Settings/TeamManagement'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdmin/SuperAdminDashboard'));

const Loading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-slate-600 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Super Admin Routes */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <Suspense fallback={<Loading />}>
                    <SuperAdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Shop Owner & Manager Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['SHOP_OWNER', 'SHOP_MANAGER']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />

              <Route
                path="products"
                element={
                  <Suspense fallback={<Loading />}>
                    <Products />
                  </Suspense>
                }
              />

              <Route
                path="stock"
                element={
                  <Suspense fallback={<Loading />}>
                    <Stock />
                  </Suspense>
                }
              />

              <Route
                path="reports"
                element={
                  <ProtectedRoute requiredPermissions={['VIEW_REPORTS']}>
                    <Suspense fallback={<Loading />}>
                      <Reports />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              <Route
                path="settings"
                element={
                  <ProtectedRoute requiredPermissions={['MANAGE_SETTINGS']}>
                    <Suspense fallback={<Loading />}>
                      <Settings />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              <Route
                path="team"
                element={
                  <ProtectedRoute allowedRoles={['SHOP_OWNER']}>
                    <Suspense fallback={<Loading />}>
                      <TeamManagement />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </InventoryProvider>
    </AuthProvider>
  );
}

export default App;

