import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CourseWorkspacePage from './pages/CourseWorkspacePage';
import BillingPage from './pages/BillingPage';
import ProfilePage from './pages/ProfilePage';
import RlsTestPage from './pages/RlsTestPage';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const AppShell: React.FC = () => {
    const location = useLocation();
    const isWorkspaceRoute = location.pathname.startsWith('/course/');
    return (
      <div className="min-h-screen flex flex-col premium-texture bg-ink-50 dark:bg-ink-900 text-ink-900 dark:text-ink-100 transition-colors duration-300">
        {!isWorkspaceRoute && <Header />}
        <main className={isWorkspaceRoute ? 'flex-grow' : 'pt-16 flex-grow'}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/course/:id" element={<PrivateRoute><CourseWorkspacePage /></PrivateRoute>} />
            <Route path="/billing" element={<PrivateRoute><BillingPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/tests" element={<PrivateRoute><RlsTestPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        {!isWorkspaceRoute && <Footer />}
      </div>
    );
  };

  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <HelmetProvider>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </HelmetProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
