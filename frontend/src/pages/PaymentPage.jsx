import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { processPayment } from '../services/paymentService';
import { formatPrice, formatDate, formatDateTime, generateBookingRef } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const CARD_BRANDS = {
  visa:       { name: 'VISA',       color: 'from-blue-700 to-blue-900',   pattern: /^4/ },
  mastercard: { name: 'Mastercard', color: 'from-rose-600 to-red-800',    pattern: /^5[1-5]/ },
  amex:       { name: 'AMEX',       color: 'from-emerald-700 to-teal-900',pattern: /^3[47]/ },
};
const detectBrand = (num) => {
  const d = num.replace(/\s/g, '');
  for (const [k, v] of Object.entries(CARD_BRANDS)) if (v.pattern.test(d)) return { key: k, ...v };
  return { key: 'default', name: '💳', color: 'from-slate-600 to-slate-800' };
};

const getPaymentState = (locationState) => {
  if (locationState && locationState.bookingId) return locationState;
  try {
    const saved = sessionStorage.getItem('paymentState');
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
};

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, booking, type, item, totalAmount, contactDetails } = getPaymentState(location.state);

  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [cardErrors, setCardErrors]   = useState({});
  const [status, setStatus]           = useState('idle');
  const [paymentResult, setPaymentResult] = useState(null);
  const [serverError, setServerError] = useState('');
  const [flipped, setFlipped]         = useState(false);

  if (!bookingId && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-4xl mb-4">💳</p>
          <p className="text-slate-500 text-lg mb-6">No payment information found.</p>
          <button onClick={() => navigate('/search')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const formatCardNumber = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry     = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let fmt = value;
    if (name === 'number') fmt = formatCardNumber(value);
    if (name === 'expiry') fmt = formatExpiry(value);
    if (name === 'cvv')    fmt = value.replace(/\D/g, '').slice(0, 4);
    setCard(p => ({ ...p, [name]: fmt }));
    if (cardErrors[name]) setCardErrors(p => ({ ...p, [name]: '' }));
    setServerError('');
  };

  const validateCard = () => {
    const e = {};
    const raw = card.number.replace(/\s/g, '');
    if (!raw) e.number = 'Card number is required.';
    else if (raw.length < 13 || raw.length > 16) e.number = 'Must be 13–16 digits.';
    if (!card.expiry) { e.expiry = 'Expiry is required.'; }
    else {
      const [mm, yy] = card.expiry.split('/');
      const month = parseInt(mm, 10), year = parseInt(`20${yy}`, 10), now = new Date();
      if (!mm || !yy || month < 1 || month > 12) e.expiry = 'Invalid expiry (MM/YY).';
      else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) e.expiry = 'Card has expired.';
    }
    if (!card.cvv) e.cvv = 'CVV is required.';
    else if (card.cvv.length < 3) e.cvv = 'CVV must be 3–4 digits.';
    if (!card.name.trim()) e.name = 'Cardholder name is required.';
    return e;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    const ve = validateCard();
    if (Object.keys(ve).length) { setCardErrors(ve); return; }
    setStatus('processing'); setServerError('');
    const delay = 1500 + Math.random() * 500;
    try {
      const [mm, yy] = card.expiry.split('/');
      const [result] = await Promise.all([
        processPayment({
          bookingId: bookingId || booking?._id || booking?.id,
          amount: totalAmount,
          currency: 'USD',
          cardNumber: card.number.replace(/\s/g, ''),
          expiryMonth: mm?.trim(),
          expiryYear: `20${yy?.trim()}`,
          cvv: card.cvv,
        }),
        new Promise(r => setTimeout(r, delay)),
      ]);
      setPaymentResult(result); setStatus('success');
    } catch (err) {
      await new Promise(r => setTimeout(r, delay));
      setServerError(err.response?.data?.message || err.response?.data?.error || 'Payment failed. Please try again.');
      setStatus('failure');
    }
  };

  const handleDownloadInvoice = () => {
    const ref = paymentResult?.reference || generateBookingRef();
    const bookingRef = booking?.reference || booking?.bookingReference || ref;
    const isFlight = type === 'flight';
    const lines = [
      '═══════════════════════════════════════════════',
      '         TRAVELBOOKING — TRAVEL INVOICE',
      '═══════════════════════════════════════════════',
      `Invoice Date    : ${formatDateTime(new Date())}`,
      `Booking Ref     : ${bookingRef}`,
      `Payment Ref     : ${ref}`,
      '───────────────────────────────────────────────',
      `BOOKING TYPE    : ${isFlight ? 'Flight' : 'Hotel'}`,
      ...(isFlight
        ? [`Airline         : ${item?.airline || 'N/A'}`, `Flight No.      : ${item?.flightNumber || 'N/A'}`,
           `Route           : ${item?.origin?.code || item?.origin} → ${item?.destination?.code || item?.destination}`]
        : [`Hotel           : ${item?.name || 'N/A'}`, `Location        : ${[item?.city, item?.country].filter(Boolean).join(', ') || 'N/A'}`]),
      '───────────────────────────────────────────────',
      'PASSENGER / GUEST INFORMATION',
      `Name            : ${contactDetails?.firstName || ''} ${contactDetails?.lastName || ''}`.trim(),
      `Email           : ${contactDetails?.email || 'N/A'}`,
      `Phone           : ${contactDetails?.phone || 'N/A'}`,
      '───────────────────────────────────────────────',
      'PAYMENT SUMMARY',
      `Base Amount     : ${formatPrice((totalAmount || 0) / 1.1)}`,
      `Tax (10%)       : ${formatPrice((totalAmount || 0) - (totalAmount || 0) / 1.1)}`,
      `Total Charged   : ${formatPrice(totalAmount)}`,
      `Payment Status  : CONFIRMED`,
      `Card            : **** **** **** ${card.number.replace(/\s/g,'').slice(-4)}`,
      '═══════════════════════════════════════════════',
      '   Thank you for choosing TravelBooking!',
      '   support@travelbooking.com',
      '═══════════════════════════════════════════════',
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `TravelBooking_Invoice_${ref}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const brand = detectBrand(card.number);
  const last4 = card.number.replace(/\s/g,'').slice(-4).padStart(4, '•');
  const inp = (f) => `w-full px-4 py-3 rounded-xl border text-slate-900 text-sm transition-all duration-200 ${
    cardErrors[f] ? 'border-red-400 bg-red-50 input-glow-error' : 'border-slate-200 bg-white input-glow'
  }`;

  // ── Processing ──
  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-animated">
        <div className="glass rounded-3xl p-12 text-center max-w-sm mx-4 anim-scale-in">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <LoadingSpinner size="lg" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Processing Payment</h2>
          <p className="text-indigo-200 text-sm">Please wait while we securely process your payment…</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            256-bit SSL encrypted
          </div>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === 'success') {
    const ref = paymentResult?.reference || paymentResult?.paymentId || generateBookingRef();
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden anim-bounce-in">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-lg anim-bounce-in delay-200">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-white">Payment Confirmed!</h1>
            <p className="text-emerald-100 mt-1">Your booking is confirmed and ready to go ✈️</p>
          </div>
          <div className="p-8">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-3 mb-6">
              {[
                { label: 'Payment Reference', value: ref, mono: true },
                { label: 'Amount Charged',    value: formatPrice(totalAmount), highlight: true },
                { label: 'Card',              value: `**** **** **** ${card.number.replace(/\s/g,'').slice(-4)}` },
                { label: 'Date',              value: formatDate(new Date()) },
                ...(type           ? [{ label: 'Booking Type', value: type.charAt(0).toUpperCase() + type.slice(1) }] : []),
                ...(contactDetails?.email ? [{ label: 'Confirmation sent to', value: contactDetails.email }] : []),
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={`font-bold ${row.highlight ? 'text-emerald-700 text-base' : 'text-slate-900'} ${row.mono ? 'font-mono text-xs' : ''}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleDownloadInvoice}
                className="btn-ripple flex-1 py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md shadow-indigo-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Invoice
              </button>
              <button onClick={() => navigate('/my-trips')}
                className="flex-1 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all">
                My Trips
              </button>
            </div>
            <button onClick={() => navigate('/search')}
              className="w-full mt-3 py-2.5 text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
              Book another trip →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Failure ──
  if (status === 'failure') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden anim-scale-in">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white">Payment Failed</h1>
            <p className="text-red-100 mt-1">Your payment could not be processed</p>
          </div>
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <p className="text-sm text-red-700 font-medium">{serverError || 'An unexpected error occurred.'}</p>
            </div>
            <p className="text-sm text-slate-500 mb-6 text-center">Please check your card details and try again.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setStatus('idle'); setServerError(''); setPaymentResult(null); }}
                className="btn-ripple w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md shadow-indigo-200">
                Try Again
              </button>
              <button onClick={() => navigate('/search')}
                className="w-full py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all">
                Back to Search
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Form ──
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Booking Summary
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 anim-fade-in">
          {['Search', 'Review', 'Payment'].map((step, i) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 ${i === 2 ? '' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 2 ? 'step-done' : 'step-active'}`}>
                  {i < 2 ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-semibold ${i === 2 ? 'text-indigo-700' : 'text-emerald-600'}`}>{step}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-emerald-300 max-w-12" />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Payment Form ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interactive card preview */}
            <div
              className={`relative h-48 rounded-3xl bg-gradient-to-br ${brand.color} p-6 cursor-pointer select-none shadow-xl transition-transform duration-500 ${flipped ? 'scale-x-[-1]' : ''} anim-fade-up`}
              onClick={() => setFlipped(f => !f)}
            >
              {!flipped ? (
                <>
                  <div className="flex justify-between items-start">
                    <svg width="48" height="36" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1.5" opacity="0.6" />
                      <path d="M28 12l-4 2.5L14 13l-1.5 1.5 7 4-1.5 5.5 2.5-1 1.5-4.5 5.5 2.5 1.5-1.5-4-7.5z" fill="white" />
                    </svg>
                    <span className="text-white font-black text-lg opacity-90">{brand.name}</span>
                  </div>
                  <div className="absolute bottom-16 left-6">
                    <div className="flex gap-3 text-white font-mono text-base tracking-widest">
                      {card.number ? card.number.padEnd(19, '•').split(' ').map((g, i) => <span key={i}>{g}</span>) : ['••••', '••••', '••••', '••••'].map((g, i) => <span key={i}>{g}</span>)}
                    </div>
                  </div>
                  <div className="absolute bottom-5 left-6 right-6 flex justify-between items-end">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Cardholder</p>
                      <p className="text-white font-bold text-sm">{card.name || 'YOUR NAME'}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide">Expires</p>
                      <p className="text-white font-bold text-sm">{card.expiry || 'MM/YY'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ transform: 'scale(-1, 1)' }} className="h-full flex flex-col justify-center items-center">
                  <div className="w-full h-10 bg-black/40 mb-4" />
                  <div className="bg-white/20 rounded px-4 py-2 text-white font-mono text-lg tracking-widest">
                    {card.cvv ? card.cvv.replace(/./g, '•') : '•••'}
                  </div>
                  <p className="text-white/60 text-xs mt-2">CVV</p>
                </div>
              )}
              <p className="absolute top-3 right-3 text-white/30 text-xs">tap to flip</p>
            </div>

            {/* Card form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden anim-fade-up delay-100">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">Card Details</h2>
                <div className="flex items-center gap-2">
                  {['VISA', 'MC', 'AMEX'].map(b => (
                    <span key={b} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded font-bold border border-white/20">{b}</span>
                  ))}
                </div>
              </div>
              <form onSubmit={handlePayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Card Number</label>
                  <div className="relative">
                    <input name="number" type="text" inputMode="numeric" value={card.number}
                      onChange={handleCardChange} placeholder="1234 5678 9012 3456" maxLength={19}
                      className={inp('number')} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                  {cardErrors.number && <p className="mt-1 text-xs text-red-600">{cardErrors.number}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cardholder Name</label>
                  <input name="name" type="text" value={card.name} onChange={handleCardChange}
                    placeholder="JANE DOE" className={inp('name')} />
                  {cardErrors.name && <p className="mt-1 text-xs text-red-600">{cardErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expiry (MM/YY)</label>
                    <input name="expiry" type="text" inputMode="numeric" value={card.expiry}
                      onChange={handleCardChange} placeholder="MM/YY" maxLength={5} className={inp('expiry')} />
                    {cardErrors.expiry && <p className="mt-1 text-xs text-red-600">{cardErrors.expiry}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">CVV</label>
                    <input name="cvv" type="password" inputMode="numeric" value={card.cvv}
                      onChange={handleCardChange} onFocus={() => setFlipped(true)} onBlur={() => setFlipped(false)}
                      placeholder="•••" maxLength={4} className={inp('cvv')} />
                    {cardErrors.cvv && <p className="mt-1 text-xs text-red-600">{cardErrors.cvv}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Your payment is encrypted with 256-bit SSL. We never store your full card number.
                </div>

                <button type="submit"
                  className="btn-ripple w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pay {formatPrice(totalAmount)} Securely
                </button>
              </form>
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24 anim-fade-up delay-200">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
                <h2 className="text-white font-bold text-base">Order Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                {item && (
                  <div className="pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                        {type === 'flight' ? '✈️' : '🏨'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {type === 'flight'
                            ? `${item.origin?.code || item.origin} → ${item.destination?.code || item.destination}`
                            : item.name}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">{type} booking</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatPrice((totalAmount || 0) / 1.1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax (10%)</span>
                  <span className="font-semibold text-slate-900">{formatPrice((totalAmount || 0) - (totalAmount || 0) / 1.1)}</span>
                </div>
                <div className="border-t-2 border-dashed border-slate-200 pt-3 flex justify-between items-center">
                  <span className="font-black text-slate-900">Total Due</span>
                  <span className="font-black text-indigo-700 text-2xl">{formatPrice(totalAmount)}</span>
                </div>

                <div className="pt-2 space-y-2.5">
                  {['Free cancellation within 24 hours', 'Instant booking confirmation', 'Secure & encrypted payment', '24/7 customer support'].map(p => (
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

export default PaymentPage;
