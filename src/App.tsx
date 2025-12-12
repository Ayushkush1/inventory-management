import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { InventoryProvider } from './context/InventoryContext';
import Dashboard from './pages/Dashboard/Dashboard';

// Lazy load other pages

// Lazy load other pages
const Products = lazy(() => import('./pages/Products/Products'));
const Stock = lazy(() => import('./pages/Stock/Stock'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Settings = lazy(() => import('./pages/Settings/Settings'));

const Loading = () => <div className="flex-center h-full text-gold">Loading...</div>;

function App() {
  return (
    <InventoryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />

            <Route path="products" element={
              <Suspense fallback={<Loading />}>
                <Products />
              </Suspense>
            } />
            <Route path="stock" element={
              <Suspense fallback={<Loading />}>
                <Stock />
              </Suspense>
            } />
            <Route path="reports" element={
              <Suspense fallback={<Loading />}>
                <Reports />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<Loading />}>
                <Settings />
              </Suspense>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </InventoryProvider>
  );
}

export default App;
