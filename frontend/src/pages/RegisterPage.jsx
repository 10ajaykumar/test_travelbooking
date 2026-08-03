import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const PERKS = [
  { icon: '✈️', title: 'Flights worldwide',    desc: '500+ destinations covered' },
  { icon: '🏨', title: 'Premium hotels',        desc: 'Curated stays for every budget' },
  { icon: '🔒', title: 'Secure booking',        desc: '256-bit SSL encrypted payments' },
  { icon: '📱', title: 'Instant confirmation',  desc: 'E-tickets delivered instantly' },
];

const RegisterPage = () => {
  const { register, isAuthenticated, isLoading, authError, clearError } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPass, setShowPass]     = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/search', { replace: true }); }, [isAuthenticated, navigate]);
  useEffect(() => { if (authError) setServerError(authError); }, [authError]);
  useEffect(() => () => clearError(), [clearError]);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'At least 8 characters.';
    else if (!/(?=.*[A-Z])/.test(form.password)) e.password = 'Must include an uppercase letter.';
    else if (!/(?=.*\d)/.test(form.password)) e.password = 'Must include a number.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
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
      await register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password });
      navigate('/search', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pwChecks = [
    { ok: form.password.length >= 8,          label: '8+ characters' },
    { ok: /(?=.*[A-Z])/.test(form.password),  label: 'Uppercase letter' },
    { ok: /(?=.*\d)/.test(form.password),     label: 'One number' },
  ];

  const inputBase = 'w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 transition-all duration-200';
  const inputOk   = `${inputBase} border-slate-200 bg-white input-glow`;
  const inputErr  = `${inputBase} border-red-400 bg-red-50 input-glow-error`;

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-2/5 gradient-animated relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-white/5 anim-float-slow" />
          <div className="absolute bottom-1/4 left-0 w-48 h-48 rounded-full bg-white/5 anim-float-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 anim-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1.5" opacity="0.9" />
              <ellipse cx="20" cy="20" rx="7" ry="14" stroke="white" strokeWidth="1" opacity="0.5" />
              <line x1="6" y1="20" x2="34" y2="20" stroke="white" strokeWidth="1" opacity="0.5" />
              <path d="M28 12l-4 2.5L14 13l-1.5 1.5 7 4-1.5 5.5 2.5-1 1.5-4.5 5.5 2.5 1.5-1.5-4-7.5z" fill="white" />
            </svg>
            <span className="text-3xl font-black text-white">TravelBooking</span>
          </div>
          <p className="text-indigo-200 text-sm">Your journey starts here</p>
        </div>

        <div className="relative z-10 anim-fade-up delay-200">
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            Join millions of<br />
            <span className="text-gradient">happy travelers</span>
          </h2>
          <div className="space-y-4">
            {PERKS.map((perk, i) => (
              <div key={perk.title} className={`flex items-center gap-3 glass rounded-xl p-3 anim-fade-up delay-${(i + 3) * 100}`}>
                <span className="text-2xl">{perk.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{perk.title}</p>
                  <p className="text-indigo-300 text-xs">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 glass rounded-2xl p-4 anim-fade-up delay-700">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['from-pink-400 to-rose-500', 'from-violet-400 to-purple-500', 'from-teal-400 to-emerald-500'].map((g, i) => (
                <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2 border-white/20 flex items-center justify-center text-white font-bold text-xs`}>
                  {['A', 'B', 'C'][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white font-bold text-sm">2,000,000+ travelers</p>
              <p className="text-indigo-300 text-xs">already on TravelBooking</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-slate-50 overflow-y-auto">
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

          <div className="mb-7">
            <h1 className="text-3xl font-black text-slate-900">Create account</h1>
            <p className="text-slate-500 mt-1">Start your travel journey today — it's free</p>
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

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                id="name" name="name" type="text" autoComplete="name"
                value={form.name} onChange={handleChange} placeholder="Jane Doe"
                className={errors.name ? inputErr : inputOk}
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                value={form.email} onChange={handleChange} placeholder="you@example.com"
                className={errors.email ? inputErr : inputOk}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPass ? 'text' : 'password'}
                  autoComplete="new-password" value={form.password}
                  onChange={handleChange} placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  className={errors.password ? inputErr : inputOk}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPass
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}

              {/* Password strength */}
              {form.password && (
                <div className="mt-2 flex gap-2">
                  {pwChecks.map(c => (
                    <span key={c.label} className={`flex items-center gap-1 text-xs font-medium transition-colors ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <input
                id="confirmPassword" name="confirmPassword" type="password"
                autoComplete="new-password" value={form.confirmPassword}
                onChange={handleChange} placeholder="••••••••"
                className={errors.confirmPassword ? inputErr : inputOk}
              />
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="btn-ripple w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting || isLoading ? (
                <><LoadingSpinner size="sm" /><span>Creating account...</span></>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Free Account
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-400">
            By creating an account you agree to our{' '}
            <a href="#" className="text-indigo-500 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-indigo-500 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
