import React, { useState, useContext, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const TravelBookingLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    {/* Globe */}
    <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1.5" opacity="0.9" />
    <ellipse cx="20" cy="20" rx="7" ry="14" stroke="white" strokeWidth="1" opacity="0.5" />
    <line x1="6" y1="20" x2="34" y2="20" stroke="white" strokeWidth="1" opacity="0.5" />
    <line x1="6" y1="14" x2="34" y2="14" stroke="white" strokeWidth="1" opacity="0.3" />
    <line x1="6" y1="26" x2="34" y2="26" stroke="white" strokeWidth="1" opacity="0.3" />
    {/* Plane */}
    <path
      d="M28 12l-4 2.5L14 13l-1.5 1.5 7 4-1.5 5.5 2.5-1 1.5-4.5 5.5 2.5 1.5-1.5-4-7.5z"
      fill="white"
    />
  </svg>
);

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
      isActive
        ? 'text-white bg-white/20'
        : 'text-indigo-100 hover:text-white hover:bg-white/10'
    }`;

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-indigo-900/95 backdrop-blur-md shadow-xl shadow-indigo-950/30'
          : 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link
            to="/search"
            className="flex items-center gap-3 group"
          >
            <div className="plane-fly flex-shrink-0">
              <TravelBookingLogo size={36} />
            </div>
            <div className="leading-none">
              <span className="block text-xl font-black text-white tracking-tight">
                Travel<span className="text-gradient">Booking</span>
              </span>
              <span className="block text-[10px] text-indigo-300 font-medium tracking-widest uppercase">
                Travel Platform
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/search" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                  Search
                </span>
              </NavLink>
              <NavLink to="/my-trips" className={navLinkClass}>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  My Trips
                </span>
              </NavLink>
            </div>
          )}

          {/* ── Right side ── */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="hidden md:block">
                  <NotificationBell />
                </div>

                <div className="hidden md:flex items-center gap-3 ml-1">
                  <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                      {userInitial}
                    </div>
                    <span className="text-white text-sm font-medium max-w-[120px] truncate">
                      {user?.name || user?.email?.split('@')[0] || 'Traveler'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-ripple px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm font-semibold transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 rounded-lg text-indigo-200 hover:bg-white/10 transition-colors"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                  aria-label="Toggle menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {menuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-indigo-100 text-sm font-semibold hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-ripple px-5 py-2 bg-white text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all duration-200 shadow-lg shadow-indigo-950/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {isAuthenticated && menuOpen && (
        <div className="md:hidden border-t border-white/10 glass-dark anim-fade-in">
          <div className="px-4 pt-3 pb-2 space-y-1">
            <NavLink
              to="/search"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Flights & Hotels
            </NavLink>
            <NavLink
              to="/my-trips"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              My Trips
            </NavLink>
          </div>
          <div className="px-4 pb-4 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow">
                {userInitial}
              </div>
              <div>
                <p className="text-white text-sm font-semibold truncate max-w-[160px]">
                  {user?.name || 'Traveler'}
                </p>
                <p className="text-indigo-300 text-xs truncate max-w-[160px]">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
