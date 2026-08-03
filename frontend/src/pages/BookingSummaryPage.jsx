import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookFlight, bookHotel } from '../services/bookingService';
import { formatPrice, formatDate, formatTime, formatDuration, calculateTax, calculateTotal } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const BookingSummaryPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { type, item, searchParams } = location.state || {};

  const [form, setForm]             = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!type || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-slate-500 text-lg mb-6">No booking information found.</p>
          <button onClick={() => navigate('/search')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const isFlight = type === 'flight';
  const nights   = !isFlight && searchParams?.checkIn && searchParams?.checkOut
    ? Math.max(1, Math.round((new Date(searchParams.checkOut) - new Date(searchParams.checkIn)) / 86400000))
    : 1;

  const basePrice = isFlight
    ? (item.price || 0) * (searchParams?.passengers || 1)
    : (item.pricePerNight || item.price || 0) * nights;
  const tax   = calculateTax(basePrice);
  const total = calculateTotal(basePrice);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\+?[\d\s\-()]{8,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    setServerError('');
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) { setErrors(ve); return; }
    setSubmitting(true); setServerError('');
    try {
      const contactDetails = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() };
      let booking;
      if (isFlight) {
        booking = await bookFlight({ flightId: item._id || item.id, passengers: searchParams?.passengers || 1, passengerDetails: contactDetails, totalAmount: total, travelDate: searchParams?.date });
      } else {
        booking = await bookHotel({ hotelId: item._id || item.id, checkIn: searchParams?.checkIn, checkOut: searchParams?.checkOut, guests: searchParams?.guests || 1, guestDetails: contactDetails, totalAmount: total });
      }
      const b = booking.booking || booking;
      const paymentState = { bookingId: b.id || b._id || b.bookingId, booking: b, type, item, totalAmount: total, contactDetails };
      sessionStorage.setItem('paymentState', JSON.stringify(paymentState));
      navigate('/payment', { state: paymentState });
    } catch (err) {
      setServerError(err.response?.data?.message || err.response?.data?.error || 'Failed to create booking. Please try again.');
    } finally { setSubmitting(false); }
  };

  const inp = (f) => `w-full px-4 py-3 rounded-xl border text-slate-900 text-sm transition-all duration-200 ${
    errors[f] ? 'border-red-400 bg-red-50 input-glow-error' : 'border-slate-200 bg-white input-glow'
  }`;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back + steps */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </button>

          <div className="flex items-center gap-2">
            {['Search', 'Review', 'Payment'].map((step, i) => (
              <React.Fragment key={step}>
                <div className={`flex items-center gap-1.5`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'step-done' : i === 1 ? 'step-active' : 'step-inactive'}`}>
                    {i === 0 ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${i === 1 ? 'text-indigo-700' : i === 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {step}
                  </span>
                </div>
                {i < 2 && <div className={`h-px w-8 ${i === 0 ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-7 anim-fade-in">Booking Summary</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Details + Form ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Item Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden anim-fade-up">
              <div className={`px-6 py-4 flex items-center gap-3 ${isFlight ? 'bg-gradient-to-r from-indigo-600 to-indigo-700' : 'bg-gradient-to-r from-violet-600 to-purple-700'}`}>
                <span className="text-2xl">{isFlight ? '✈️' : '🏨'}</span>
                <h2 className="text-white font-bold text-lg">{isFlight ? 'Flight Details' : 'Hotel Details'}</h2>
              </div>
              <div className="p-6">
                {isFlight ? (
                  <div className="space-y-0">
                    {/* Flight route visual */}
                    <div className="flex items-center gap-4 mb-5 p-4 bg-indigo-50 rounded-2xl">
                      <div className="text-center">
                        <p className="text-3xl font-black text-slate-800">{item.origin?.code || item.origin}</p>
                        {item.origin?.city && <p className="text-xs text-slate-400 mt-0.5">{item.origin.city}</p>}
                        <p className="text-sm font-bold text-indigo-600 mt-1">{formatTime(item.departureTime)}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        {item.duration && <p className="text-xs text-slate-400 mb-1">{formatDuration(item.duration)}</p>}
                        <div className="flex items-center gap-1 w-full">
                          <div className="h-px flex-1 bg-indigo-300" />
                          <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                          </svg>
                          <div className="h-px flex-1 bg-indigo-300" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-black text-slate-800">{item.destination?.code || item.destination}</p>
                        {item.destination?.city && <p className="text-xs text-slate-400 mt-0.5">{item.destination.city}</p>}
                        <p className="text-sm font-bold text-indigo-600 mt-1">{formatTime(item.arrivalTime)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Airline',      value: item.airline },
                        { label: 'Flight No.',   value: item.flightNumber },
                        { label: 'Passengers',   value: searchParams?.passengers || 1 },
                        { label: 'Cabin Class',  value: item.cabinClass },
                      ].filter(r => r.value).map(row => (
                        <div key={row.label} className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400 font-medium">{row.label}</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    <div className="flex items-center gap-4 mb-5 p-4 bg-violet-50 rounded-2xl">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-3xl">🏨</div>
                      <div>
                        <p className="text-lg font-black text-slate-800">{item.name}</p>
                        <p className="text-sm text-slate-500">{[item.city, item.country].filter(Boolean).join(', ')}</p>
                        {item.rating && <p className="text-sm font-bold text-amber-500 mt-0.5">★ {Number(item.rating).toFixed(1)}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Check-In',  value: formatDate(searchParams?.checkIn) },
                        { label: 'Check-Out', value: formatDate(searchParams?.checkOut) },
                        { label: 'Nights',    value: nights },
                        { label: 'Guests',    value: searchParams?.guests || 1 },
                      ].map(row => (
                        <div key={row.label} className="bg-slate-50 rounded-xl p-3">
                          <p className="text-xs text-slate-400 font-medium">{row.label}</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Passenger/Guest Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden anim-fade-up delay-100">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h2 className="text-slate-800 font-bold text-base">{isFlight ? 'Lead Passenger Details' : 'Primary Guest Details'}</h2>
                <p className="text-slate-400 text-xs mt-0.5">Used for your booking confirmation and e-ticket</p>
              </div>
              <form id="booking-form" onSubmit={handleConfirm} className="p-6">
                {serverError && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 anim-scale-in">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-red-700 mt-0.5">{serverError}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
                    <input name="firstName" type="text" value={form.firstName} onChange={handleChange} placeholder="Jane" className={inp('firstName')} />
                    {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
                    <input name="lastName" type="text" value={form.lastName} onChange={handleChange} placeholder="Doe" className={inp('lastName')} />
                    {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" className={inp('email')} />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900" className={inp('phone')} />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* ── Right: Price + CTA ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24 anim-fade-up delay-200">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                <h2 className="text-white font-bold text-base">Price Breakdown</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {isFlight
                      ? `${formatPrice(item.price)} × ${searchParams?.passengers || 1} pax`
                      : `${formatPrice(item.pricePerNight || item.price)}/night × ${nights}`}
                  </span>
                  <span className="font-semibold text-slate-900">{formatPrice(basePrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Taxes & fees (10%)</span>
                  <span className="font-semibold text-slate-900">{formatPrice(tax)}</span>
                </div>
                <div className="border-t-2 border-dashed border-slate-200 my-1 pt-3 flex items-center justify-between">
                  <span className="font-black text-slate-900">Total</span>
                  <span className="text-2xl font-black text-indigo-700">{formatPrice(total)}</span>
                </div>

                <div className="pt-1">
                  <button type="submit" form="booking-form" disabled={submitting}
                    className="btn-ripple w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 flex items-center justify-center gap-2">
                    {submitting ? (
                      <><LoadingSpinner size="sm" /><span>Confirming…</span></>
                    ) : (
                      <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>Confirm & Pay</>
                    )}
                  </button>
                  <p className="text-xs text-slate-400 text-center mt-3">You'll be redirected to secure payment.</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  {['Free cancellation within 24 hours', 'Instant booking confirmation', 'Secure & encrypted payment'].map(p => (
                    <div key={p} className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummaryPage;
