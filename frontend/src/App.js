import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const AuctionsPage = lazy(() => import('./pages/AuctionsPage'));
const AuctionDetailPage = lazy(() => import('./pages/AuctionDetailPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyOTPPage = lazy(() => import('./pages/auth/VerifyOTPPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const OAuthCallbackPage = lazy(() => import('./pages/auth/OAuthCallbackPage'));
const UserDashboard = lazy(() => import('./pages/buyer/UserDashboard'));
const BidHistoryPage = lazy(() => import('./pages/buyer/BidHistoryPage'));
const WatchlistPage = lazy(() => import('./pages/buyer/WatchlistPage'));
const WinsPage = lazy(() => import('./pages/buyer/WinsPage'));
const PaymentPage = lazy(() => import('./pages/buyer/PaymentPage'));
const ProfilePage = lazy(() => import('./pages/buyer/ProfilePage'));
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'));
const CreateAuctionPage = lazy(() => import('./pages/seller/CreateAuctionPage'));
const ManageAuctionsPage = lazy(() => import('./pages/seller/ManageAuctionsPage'));
const SellerAnalyticsPage = lazy(() => import('./pages/seller/SellerAnalyticsPage'));
const SellerProfilePage = lazy(() => import('./pages/seller/SellerProfilePage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminAuctionsPage = lazy(() => import('./pages/admin/AdminAuctionsPage'));
const AdminSellersPage = lazy(() => import('./pages/admin/AdminSellersPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Route guards
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const SellerRoute = ({ children }) => {
  const { isAuthenticated, isSeller, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSeller) return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/auctions" element={<AuctionsPage />} />
        <Route path="/auctions/:id" element={<AuctionDetailPage />} />

        {/* Auth */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* Buyer */}
        <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
        <Route path="/dashboard/bids" element={<PrivateRoute><BidHistoryPage /></PrivateRoute>} />
        <Route path="/dashboard/watchlist" element={<PrivateRoute><WatchlistPage /></PrivateRoute>} />
        <Route path="/dashboard/wins" element={<PrivateRoute><WinsPage /></PrivateRoute>} />
        <Route path="/dashboard/payment/:auctionId" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
        <Route path="/dashboard/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Seller */}
        <Route path="/seller/dashboard" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
        <Route path="/seller/auctions/create" element={<SellerRoute><CreateAuctionPage /></SellerRoute>} />
        <Route path="/seller/auctions" element={<SellerRoute><ManageAuctionsPage /></SellerRoute>} />
        <Route path="/seller/analytics" element={<SellerRoute><SellerAnalyticsPage /></SellerRoute>} />
        <Route path="/seller/profile" element={<SellerRoute><SellerProfilePage /></SellerRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/auctions" element={<AdminRoute><AdminAuctionsPage /></AdminRoute>} />
        <Route path="/admin/sellers" element={<AdminRoute><AdminSellersPage /></AdminRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '12px', fontSize: '14px' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
