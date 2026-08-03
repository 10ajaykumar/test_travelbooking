import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const DESTINATIONS = [
  { name: 'Paris', emoji: '🗼', color: 'from-pink-400 to-rose-500' },
  { name: 'Tokyo', emoji: '🗾', color: 'from-violet-400 to-purple-500' },
  { name: 'Bali',  emoji: '🏝️', color: 'from-teal-400 to-emerald-500' },
  { name: 'Dubai', emoji: '🌆', color: 'from-amber-400 to-orange-500' },
];

const LoginPage = () => {
  const { login, isAuthenticated, isLoading, authError, clearError } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/search';

  const [form, setForm]           = useState({ email: '', password: '' });
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPass, setShowPass]   = useState(false);

  useEffect(() => { if (isAuthenticated) navigate(from, { replace: true }); }, [isAuthenticated, navigate, from]);
  useEffect(() => { if (authError) setServerError(authError); }, [authError]);
  useEffect(() => () => clearError(), [clearError]);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'At least 6 characters.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) { setErrors(ve); return; }
    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = 'w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 transition-all duration-200';
  const inputOk   = `${inputBase} border-slate-200 bg-white input-glow`;
  const inputErr  = `${inputBase} border-red-400 bg-red-50 input-glow-error`;

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel (decorative) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 gradient-animated relative overflow-hidden flex-col justify-between p-12">
        {/* Floating destination badges */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { top: '12%', left: '8%',  delay: '0s',   size: 'w-40' },
            { top: '28%', right: '6%', delay: '1.5s', size: 'w-36' },
            { top: '55%', left: '12%', delay: '0.8s', size: 'w-44' },
            { top: '72%', right: '10%',delay: '2s',   size: 'w-38' },
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos.size} glass rounded-2xl p-3 anim-float-slow`}
              style={{
                top: pos.top, left: pos.left, right: pos.right,
                animationDelay: pos.delay, animationDuration: `${5 + i}s`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{DESTINATIONS[i % 4].emoji}</span>
                <div>
                  <p className="text-white font-bold text-sm">{DESTINATIONS[i % 4].name}</p>
                  <p className="text-white/60 text-xs">Explore now</p>
                </div>
              </div>
            </div>
          ))}
          {/* Background circles */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 anim-float-slow" style={{ animationDuration: '9s' }} />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5 anim-float-slow" style={{ animationDelay: '3s' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 anim-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1.5" opacity="0.9" />
              <ellipse cx="20" cy="20" rx="7" ry="14" stroke="white" strokeWidth="1" opacity="0.5" />
              <line x1="6" y1="20" x2="34" y2="20" stroke="white" strokeWidth="1" opacity="0.5" />
              <path d="M28 12l-4 2.5L14 13l-1.5 1.5 7 4-1.5 5.5 2.5-1 1.5-4.5 5.5 2.5 1.5-1.5-4-7.5z" fill="white" />
            </svg>
            <span className="text-3xl font-black text-white">TravelBooking</span>
          </div>
          <p className="text-indigo-200 text-sm font-medium">Your journey starts here</p>
        </div>

        {/* Main copy */}
        <div className="relative z-10 anim-fade-up delay-200">
          <h2 className="text-5xl font-black text-white leading-tight mb-4">
            Explore the<br />
            <span className="text-gradient">world</span> your way
          </h2>
          <p className="text-indigo-200 text-lg leading-relaxed max-w-md">
            Book flights and hotels at unbeatable prices. Millions of travelers trust TravelBooking every day.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8 anim-fade-up delay-400">
          {[
            { value: '500+', label: 'Destinations' },
            { value: '2M+',  label: 'Happy travelers' },
            { value: '99%',  label: 'Satisfaction' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-indigo-300 text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md anim-slide-right">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="14" stroke="#4f46e5" strokeWidth="1.5" />
              <ellipse cx="20" cy="20" rx="7" ry="14" stroke="#4f46e5" strokeWidth="1" opacity="0.5" />
              <line x1="6" y1="20" x2="34" y2="20" stroke="#4f46e5" strokeWidth="1" opacity="0.5" />
              <path d="M28 12l-4 2.5L14 13l-1.5 1.5 7 4-1.5 5.5 2.5-1 1.5-4.5 5.5 2.5 1.5-1.5-4-7.5z" fill="#4f46e5" />
            </svg>
            <span className="text-2xl font-black text-indigo-700">TravelBooking</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1">Sign in to continue your journey</p>
          </div>

          {serverError && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 anim-scale-in">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-700 mt-0.5">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  value={form.email} onChange={handleChange} placeholder="you@example.com"
                  className={errors.email ? inputErr : inputOk}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPass ? 'text' : 'password'}
                  autoComplete="current-password" value={form.password}
                  onChange={handleChange} placeholder="••••••••"
                  className={errors.password ? inputErr : inputOk}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="btn-ripple w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting || isLoading ? (
                <><LoadingSpinner size="sm" /><span>Signing in...</span></>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">New to TravelBooking?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Link
            to="/register"
            className="mt-4 w-full flex items-center justify-center py-3 border-2 border-indigo-200 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
          >
            Create a free account
          </Link>

          <p className="mt-6 text-center text-xs text-slate-400">
            By signing in you agree to our{' '}
            <a href="#" className="text-indigo-500 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-indigo-500 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
