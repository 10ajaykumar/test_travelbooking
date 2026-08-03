import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import SearchPage         from './pages/SearchPage';
import BookingSummaryPage from './pages/BookingSummaryPage';
import PaymentPage        from './pages/PaymentPage';
import MyTripsPage        from './pages/MyTripsPage';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="text-center anim-fade-in">
      <p className="text-[120px] font-black text-indigo-100 leading-none select-none">404</p>
      <h2 className="text-2xl font-black text-slate-800 mt-2 mb-3">Page Not Found</h2>
      <p className="text-slate-400 mb-8 max-w-sm mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a href="/search"
        className="btn-ripple inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
        Back to Search
      </a>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/search"   element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/booking-summary" element={<ProtectedRoute><BookingSummaryPage /></ProtectedRoute>} />
              <Route path="/payment"  element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
              <Route path="/my-trips" element={<ProtectedRoute><MyTripsPage /></ProtectedRoute>} />
              <Route path="/"         element={<Navigate to="/search" replace />} />
              <Route path="*"         element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* ── Footer ── */}
          <footer className="bg-slate-900 text-slate-400 py-12 px-4 mt-auto">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                {/* Brand */}
                <div className="md:col-span-1">
                  <div className="flex items-center gap-2.5 mb-4">
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1.5" opacity="0.7" />
                      <ellipse cx="20" cy="20" rx="7" ry="14" stroke="white" strokeWidth="1" opacity="0.4" />
                      <line x1="6" y1="20" x2="34" y2="20" stroke="white" strokeWidth="1" opacity="0.4" />
                      <path d="M28 12l-4 2.5L14 13l-1.5 1.5 7 4-1.5 5.5 2.5-1 1.5-4.5 5.5 2.5 1.5-1.5-4-7.5z" fill="white" />
                    </svg>
                    <span className="text-xl font-black text-white">TravelBooking</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Your trusted travel companion. Book flights and hotels at unbeatable prices worldwide.
                  </p>
                  <div className="flex gap-3 mt-4">
                    {['🐦', '📘', '📸', '▶️'].map((icon, i) => (
                      <a key={i} href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-sm transition-colors">
                        {icon}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Links */}
                {[
                  { title: 'Company',  links: ['About Us', 'Careers', 'Press', 'Blog'] },
                  { title: 'Support',  links: ['Help Center', 'Contact Us', 'Cancellation Policy', 'Safety'] },
                  { title: 'Legal',    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Accessibility'] },
                ].map(col => (
                  <div key={col.title}>
                    <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
                    <ul className="space-y-2.5">
                      {col.links.map(link => (
                        <li key={link}>
                          <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">{link}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-600">
                  &copy; {new Date().getFullYear()} TravelBooking Travel Platform. All rights reserved.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    256-bit SSL Secure
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    All systems operational
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
