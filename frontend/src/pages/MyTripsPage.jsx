import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBookings, cancelBooking } from '../services/bookingService';
import { formatDate, formatPrice, getStatusColor } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const TABS = [
  { key: 'all',       label: 'All',       icon: '📋' },
  { key: 'upcoming',  label: 'Upcoming',  icon: '✈️' },
  { key: 'completed', label: 'Completed', icon: '✅' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
];

const isUpcoming  = (b) => {
  const s = (b.status || '').toLowerCase();
  if (s === 'cancelled' || s === 'completed') return false;
  const d = b.travelDate || b.checkIn || b.departureTime || b.createdAt;
  return !d ? (s === 'confirmed' || s === 'pending') : new Date(d) >= new Date();
};
const isCompleted = (b) => {
  const s = (b.status || '').toLowerCase();
  if (s === 'completed') return true;
  const d = b.travelDate || b.checkOut || b.arrivalTime || b.createdAt;
  return d && new Date(d) < new Date() && s !== 'cancelled';
};

const STATUS_CONFIG = {
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  cancelled: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500'     },
  completed: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',     dot: 'bg-blue-500'    },
};

const MyTripsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activeTab, setActiveTab]   = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError]   = useState('');
  const [cancelSuccess, setCancelSuccess] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getUserBookings();
      const list = Array.isArray(data) ? data : data.bookings || [];
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setBookings(list);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load bookings.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    setCancellingId(id); setCancelError(''); setCancelSuccess('');
    try {
      await cancelBooking(id);
      setBookings(prev => prev.map(b => (b._id || b.id) === id ? { ...b, status: 'cancelled' } : b));
      setCancelSuccess('Booking cancelled. Refund processed within 5–7 business days.');
      setTimeout(() => setCancelSuccess(''), 6000);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel. Please try again.');
      setTimeout(() => setCancelError(''), 6000);
    } finally { setCancellingId(null); }
  };

  const getFiltered = () => {
    switch (activeTab) {
      case 'upcoming':  return bookings.filter(isUpcoming);
      case 'completed': return bookings.filter(isCompleted);
      case 'cancelled': return bookings.filter(b => (b.status || '').toLowerCase() === 'cancelled');
      default:          return bookings;
    }
  };
  const filtered = getFiltered();

  const getTitle = (b) => {
    const type = (b.type || b.bookingType || '').toLowerCase();
    if (type === 'flight') {
      const o = b.origin?.code || b.origin || b.flightDetails?.origin || '';
      const d = b.destination?.code || b.destination || b.flightDetails?.destination || '';
      return o && d ? `${o} → ${d}` : b.airline || 'Flight Booking';
    }
    return b.hotelName || b.name || b.hotelDetails?.name || 'Hotel Booking';
  };
  const getSubtitle = (b) => {
    const type = (b.type || b.bookingType || '').toLowerCase();
    if (type === 'flight') {
      const d = b.departureTime || b.travelDate;
      return d ? `Departure: ${formatDate(d)}` : b.airline || 'Flight';
    }
    if (b.checkIn && b.checkOut) return `${formatDate(b.checkIn)} – ${formatDate(b.checkOut)}`;
    return b.city || 'Hotel';
  };

  const countFor = (key) => {
    if (key === 'all') return bookings.length;
    if (key === 'upcoming') return bookings.filter(isUpcoming).length;
    if (key === 'completed') return bookings.filter(isCompleted).length;
    return bookings.filter(b => (b.status || '').toLowerCase() === 'cancelled').length;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="gradient-animated py-10 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="anim-fade-in">
            <h1 className="text-3xl font-black text-white">My Trips</h1>
            <p className="text-indigo-300 text-sm mt-1">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''} in your account
            </p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="btn-ripple flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all duration-200 shadow-lg anim-fade-in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-12">
        {/* Notifications */}
        {cancelSuccess && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 anim-scale-in">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-emerald-700 mt-0.5">{cancelSuccess}</p>
          </div>
        )}
        {cancelError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 anim-scale-in">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-700 mt-0.5">{cancelError}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden anim-fade-up">
          <div className="flex">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/60'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <span className="hidden sm:inline">{tab.icon}</span>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {countFor(tab.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" message="Loading your trips…" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center anim-scale-in">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-red-700 font-semibold mb-4">{error}</p>
            <button onClick={fetchBookings}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 anim-fade-in">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl">{activeTab === 'all' ? '🗺️' : TABS.find(t => t.key === activeTab)?.icon}</span>
            </div>
            <p className="text-slate-600 font-bold text-xl">
              {activeTab === 'all' ? 'No trips yet' : `No ${activeTab} trips`}
            </p>
            <p className="text-slate-400 text-sm mt-2 mb-6">
              {activeTab === 'all' ? "Start planning your next adventure!" : `You have no ${activeTab} bookings.`}
            </p>
            {activeTab === 'all' && (
              <button onClick={() => navigate('/search')}
                className="btn-ripple px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200">
                Explore Flights & Hotels
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking, i) => {
              const id     = booking._id || booking.id;
              const type   = (booking.type || booking.bookingType || '').toLowerCase();
              const status = (booking.status || 'pending').toLowerCase();
              const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
              const canCancel   = status === 'confirmed' || status === 'pending';
              const isCancelling = cancellingId === id;

              return (
                <div key={id} className={`card-hover bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden anim-fade-up delay-${Math.min(i * 100, 500)}`}>
                  {/* Left accent bar */}
                  <div className={`flex`}>
                    <div className={`w-1.5 flex-shrink-0 ${cfg.dot.replace('bg-', 'bg-')}`} style={{ background: status === 'confirmed' ? '#10b981' : status === 'cancelled' ? '#ef4444' : status === 'completed' ? '#3b82f6' : '#f59e0b' }} />

                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        {/* Icon + Info */}
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl ${
                            type === 'flight' ? 'bg-indigo-50' : 'bg-violet-50'
                          }`}>
                            {type === 'flight' ? '✈️' : '🏨'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h3 className="text-base font-bold text-slate-900 truncate">{getTitle(booking)}</h3>
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} flex items-center gap-1`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">{getSubtitle(booking)}</p>
                            {(booking.reference || booking.bookingReference) && (
                              <p className="text-xs text-slate-400 mt-1 font-mono bg-slate-50 px-2 py-0.5 rounded w-fit">
                                Ref: {booking.reference || booking.bookingReference}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Amount + Actions */}
                        <div className="text-right flex-shrink-0">
                          {(booking.totalAmount || booking.amount) && (
                            <p className="text-xl font-black text-indigo-700">
                              {formatPrice(booking.totalAmount || booking.amount)}
                            </p>
                          )}
                          {booking.createdAt && (
                            <p className="text-xs text-slate-400 mt-0.5">Booked {formatDate(booking.createdAt)}</p>
                          )}
                          {canCancel && (
                            <button onClick={() => handleCancel(id)} disabled={isCancelling}
                              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-all ml-auto disabled:opacity-60">
                              {isCancelling ? <><LoadingSpinner size="sm" /><span>Cancelling…</span></> : (
                                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>Cancel</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Meta row */}
                      {(booking.airline || booking.cabinClass || booking.passengers || booking.guests) && (
                        <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap gap-4 text-xs text-slate-400">
                          {booking.airline    && <span><span className="font-semibold text-slate-600">Airline:</span> {booking.airline}</span>}
                          {booking.cabinClass && <span><span className="font-semibold text-slate-600">Class:</span> {booking.cabinClass}</span>}
                          {booking.passengers && <span><span className="font-semibold text-slate-600">Passengers:</span> {booking.passengers}</span>}
                          {booking.guests     && <span><span className="font-semibold text-slate-600">Guests:</span> {booking.guests}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTripsPage;
