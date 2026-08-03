import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FlightCard from '../components/FlightCard';
import HotelCard from '../components/HotelCard';
import LoadingSpinner, { SkeletonFlightCard, SkeletonHotelCard } from '../components/LoadingSpinner';
import { searchFlights, searchHotels } from '../services/searchService';

const today    = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const AIRPORTS = [
  { code: 'NYC', city: 'New York',  country: 'USA', emoji: '🗽' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA', emoji: '🌴' },
  { code: 'SFO', city: 'San Francisco', country: 'USA', emoji: '🌉' },
  { code: 'ORD', city: 'Chicago',   country: 'USA', emoji: '🏙️' },
  { code: 'DFW', city: 'Dallas',    country: 'USA', emoji: '🤠' },
  { code: 'MIA', city: 'Miami',     country: 'USA', emoji: '🏖️' },
  { code: 'SEA', city: 'Seattle',   country: 'USA', emoji: '☕' },
  { code: 'BOS', city: 'Boston',    country: 'USA', emoji: '🎓' },
  { code: 'LHR', city: 'London',    country: 'UK',  emoji: '🇬🇧' },
  { code: 'CDG', city: 'Paris',     country: 'France', emoji: '🗼' },
];

const HOTEL_CITIES = [
  { city: 'New York',    country: 'USA',       emoji: '🗽' },
  { city: 'Los Angeles', country: 'USA',       emoji: '🌴' },
  { city: 'London',      country: 'UK',        emoji: '🇬🇧' },
  { city: 'Paris',       country: 'France',    emoji: '🗼' },
  { city: 'Dubai',       country: 'UAE',       emoji: '🏙️' },
  { city: 'Singapore',   country: 'Singapore', emoji: '🌆' },
  { city: 'Tokyo',       country: 'Japan',     emoji: '🗾' },
  { city: 'Sydney',      country: 'Australia', emoji: '🦘' },
  { city: 'Miami',       country: 'USA',       emoji: '🏖️' },
  { city: 'Chicago',     country: 'USA',       emoji: '🏙️' },
];

const Dropdown = ({ items, onSelect, visible }) => {
  if (!visible || items.length === 0) return null;
  return (
    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 max-h-56 overflow-y-auto">
      {items.map((item, i) => (
        <button
          key={item.code || item.city}
          type="button"
          onClick={() => onSelect(item)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-indigo-50 transition-colors text-sm ${
            i === 0 ? 'rounded-t-xl' : ''
          } ${i === items.length - 1 ? 'rounded-b-xl' : ''}`}
        >
          <span className="text-lg">{item.emoji}</span>
          <div>
            <p className="font-semibold text-slate-800">
              {item.code ? `${item.code} — ${item.city}` : item.city}
            </p>
            <p className="text-xs text-slate-400">{item.country}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

const POPULAR_FLIGHTS = [
  { from: 'NYC', to: 'LAX', label: 'New York → LA',    emoji: '🗽' },
  { from: 'LHR', to: 'CDG', label: 'London → Paris',   emoji: '🗼' },
  { from: 'DXB', to: 'SIN', label: 'Dubai → Singapore', emoji: '🌆' },
  { from: 'HND', to: 'ICN', label: 'Tokyo → Seoul',    emoji: '🗾' },
  { from: 'SYD', to: 'BKK', label: 'Sydney → Bangkok', emoji: '🦘' },
];

const POPULAR_HOTELS = [
  { city: 'Paris',     emoji: '🗼' },
  { city: 'Bali',      emoji: '🏝️' },
  { city: 'Dubai',     emoji: '🏙️' },
  { city: 'New York',  emoji: '🗽' },
  { city: 'Tokyo',     emoji: '🗾' },
];

const SearchPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('flights');

  const [flightForm, setFlightForm] = useState({ origin: '', destination: '', date: today, passengers: 1 });
  const [flightResults, setFlightResults]   = useState([]);
  const [flightLoading, setFlightLoading]   = useState(false);
  const [flightError, setFlightError]       = useState('');
  const [flightSearched, setFlightSearched] = useState(false);
  const [flightErrors, setFlightErrors]     = useState({});
  const [flightPriceRange, setFlightPriceRange] = useState([0, 5000]);
  const [flightSort, setFlightSort]         = useState('price_asc');

  const [hotelForm, setHotelForm]   = useState({ city: '', checkIn: today, checkOut: tomorrow, guests: 1 });
  const [hotelResults, setHotelResults]     = useState([]);
  const [hotelLoading, setHotelLoading]     = useState(false);
  const [hotelError, setHotelError]         = useState('');
  const [hotelSearched, setHotelSearched]   = useState(false);
  const [hotelErrors, setHotelErrors]       = useState({});
  const [hotelPriceRange, setHotelPriceRange] = useState([0, 2000]);
  const [hotelMinRating, setHotelMinRating] = useState(0);
  const [hotelSort, setHotelSort]           = useState('price_asc');

  const [showOriginDrop, setShowOriginDrop] = useState(false);
  const [showDestDrop, setShowDestDrop]     = useState(false);
  const [showCityDrop, setShowCityDrop]     = useState(false);

  const filterAirports = (query, exclude) => {
    const q = query.toLowerCase();
    return AIRPORTS.filter(a =>
      a.code !== exclude &&
      (a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.country.toLowerCase().includes(q))
    );
  };
  const filterCities = (query) => {
    const q = query.toLowerCase();
    return HOTEL_CITIES.filter(c =>
      c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  };

  const validateFlight = () => {
    const e = {};
    if (!flightForm.origin.trim()) e.origin = 'Origin is required.';
    if (!flightForm.destination.trim()) e.destination = 'Destination is required.';
    if (flightForm.origin.trim().toLowerCase() === flightForm.destination.trim().toLowerCase()) e.destination = 'Origin and destination must differ.';
    if (!flightForm.date) e.date = 'Travel date is required.';
    if (!flightForm.passengers || flightForm.passengers < 1) e.passengers = 'At least 1 passenger.';
    return e;
  };
  const validateHotel = () => {
    const e = {};
    if (!hotelForm.city.trim()) e.city = 'City is required.';
    if (!hotelForm.checkIn) e.checkIn = 'Check-in is required.';
    if (!hotelForm.checkOut) e.checkOut = 'Check-out is required.';
    if (hotelForm.checkIn && hotelForm.checkOut && hotelForm.checkIn >= hotelForm.checkOut) e.checkOut = 'Check-out must be after check-in.';
    if (!hotelForm.guests || hotelForm.guests < 1) e.guests = 'At least 1 guest.';
    return e;
  };

  const handleFlightSearch = useCallback(async (e) => {
    e.preventDefault();
    const errs = validateFlight();
    if (Object.keys(errs).length) { setFlightErrors(errs); return; }
    setFlightErrors({}); setFlightLoading(true); setFlightError(''); setFlightSearched(true);
    try {
      const data = await searchFlights(flightForm);
      const results = Array.isArray(data) ? data : data.flights || [];
      setFlightResults(results);
      if (results.length > 0) {
        const prices = results.map(f => f.price || 0);
        setFlightPriceRange([0, Math.ceil(Math.max(...prices) * 1.1)]);
      }
    } catch (err) {
      setFlightError(err.response?.data?.message || 'Failed to search flights. Please try again.');
      setFlightResults([]);
    } finally { setFlightLoading(false); }
  }, [flightForm]); // eslint-disable-line

  const handleHotelSearch = useCallback(async (e) => {
    e.preventDefault();
    const errs = validateHotel();
    if (Object.keys(errs).length) { setHotelErrors(errs); return; }
    setHotelErrors({}); setHotelLoading(true); setHotelError(''); setHotelSearched(true);
    try {
      const data = await searchHotels(hotelForm);
      const results = Array.isArray(data) ? data : data.hotels || [];
      setHotelResults(results);
      if (results.length > 0) {
        const prices = results.map(h => h.pricePerNight || h.price || 0);
        setHotelPriceRange([0, Math.ceil(Math.max(...prices) * 1.1)]);
      }
    } catch (err) {
      setHotelError(err.response?.data?.message || 'Failed to search hotels. Please try again.');
      setHotelResults([]);
    } finally { setHotelLoading(false); }
  }, [hotelForm]); // eslint-disable-line

  const handleBookFlight = (f) => navigate('/booking-summary', { state: { type: 'flight', item: f, searchParams: flightForm } });
  const handleBookHotel  = (h) => navigate('/booking-summary', { state: { type: 'hotel',  item: h, searchParams: hotelForm  } });

  const filteredFlights = flightResults
    .filter(f => (f.price || 0) >= flightPriceRange[0] && (f.price || 0) <= flightPriceRange[1])
    .sort((a, b) => {
      if (flightSort === 'price_asc')    return (a.price || 0) - (b.price || 0);
      if (flightSort === 'price_desc')   return (b.price || 0) - (a.price || 0);
      if (flightSort === 'duration_asc') return (a.duration || 0) - (b.duration || 0);
      if (flightSort === 'duration_desc')return (b.duration || 0) - (a.duration || 0);
      return 0;
    });

  const filteredHotels = hotelResults
    .filter(h => {
      const p = h.pricePerNight || h.price || 0;
      return p >= hotelPriceRange[0] && p <= hotelPriceRange[1] && (h.rating || 0) >= hotelMinRating;
    })
    .sort((a, b) => {
      const pa = a.pricePerNight || a.price || 0;
      const pb = b.pricePerNight || b.price || 0;
      if (hotelSort === 'price_asc')   return pa - pb;
      if (hotelSort === 'price_desc')  return pb - pa;
      if (hotelSort === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
      if (hotelSort === 'rating_asc')  return (a.rating || 0) - (b.rating || 0);
      return 0;
    });

  const inp = (err) =>
    `w-full px-4 py-3 rounded-xl border text-slate-900 text-sm focus:outline-none transition-all duration-200 ${
      err ? 'border-red-400 bg-red-50 input-glow-error' : 'border-slate-200 bg-white input-glow'
    }`;
  const lbl = 'block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ─── Hero ─── */}
      <div className="relative gradient-animated overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-8 right-10 w-72 h-72 rounded-full bg-white/5 anim-float-slow" />
          <div className="absolute -bottom-20 left-20 w-64 h-64 rounded-full bg-white/5 anim-float-slow" style={{ animationDelay: '3s' }} />
          {/* Animated plane streak */}
          <div className="absolute top-1/2 left-0 right-0 flex items-center justify-center opacity-20">
            <div style={{ animation: 'planeFly 6s ease-in-out infinite' }}>
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-14 pb-24 text-center">
          <div className="anim-fade-in">
            <span className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-indigo-100 text-sm font-medium mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time prices · Instant booking
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 anim-fade-up delay-100">
            Find Your Perfect
            <br />
            <span className="text-gradient">Adventure</span>
          </h1>
          <p className="text-indigo-200 text-lg sm:text-xl max-w-xl mx-auto anim-fade-up delay-200">
            Compare thousands of flights and hotels. Book in minutes.
          </p>
        </div>
      </div>

      {/* ─── Search Panel ─── */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-950/10 border border-slate-100 anim-fade-up delay-300">

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {[
              { key: 'flights', label: 'Flights', icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              )},
              { key: 'hotels', label: 'Hotels', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )},
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                    : 'border-transparent text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─ Flight Form ─ */}
          {activeTab === 'flights' && (
            <form onSubmit={handleFlightSearch} className="p-6">
              {/* Popular routes */}
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Popular routes</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_FLIGHTS.map(r => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setFlightForm(p => ({ ...p, origin: r.from, destination: r.to }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                        flightForm.origin === r.from && flightForm.destination === r.to
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      <span>{r.emoji}</span>{r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={lbl}>From</label>
                  <div className="relative">
                    <input type="text" placeholder="City or airport code" value={flightForm.origin}
                      onChange={e => { setFlightForm(p => ({ ...p, origin: e.target.value })); setFlightErrors(p => ({ ...p, origin: '' })); setShowOriginDrop(true); }}
                      onFocus={() => setShowOriginDrop(true)}
                      onBlur={() => setTimeout(() => setShowOriginDrop(false), 150)}
                      autoComplete="off"
                      className={inp(flightErrors.origin)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-lg">✈</span>
                    <Dropdown
                      items={flightForm.origin ? filterAirports(flightForm.origin, flightForm.destination) : AIRPORTS.filter(a => a.code !== flightForm.destination)}
                      visible={showOriginDrop}
                      onSelect={(a) => { setFlightForm(p => ({ ...p, origin: a.code })); setShowOriginDrop(false); }}
                    />
                  </div>
                  {flightErrors.origin && <p className="mt-1 text-xs text-red-600">{flightErrors.origin}</p>}
                </div>
                <div>
                  <label className={lbl}>To</label>
                  <div className="relative">
                    <input type="text" placeholder="City or airport code" value={flightForm.destination}
                      onChange={e => { setFlightForm(p => ({ ...p, destination: e.target.value })); setFlightErrors(p => ({ ...p, destination: '' })); setShowDestDrop(true); }}
                      onFocus={() => setShowDestDrop(true)}
                      onBlur={() => setTimeout(() => setShowDestDrop(false), 150)}
                      autoComplete="off"
                      className={inp(flightErrors.destination)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-lg">📍</span>
                    <Dropdown
                      items={flightForm.destination ? filterAirports(flightForm.destination, flightForm.origin) : AIRPORTS.filter(a => a.code !== flightForm.origin)}
                      visible={showDestDrop}
                      onSelect={(a) => { setFlightForm(p => ({ ...p, destination: a.code })); setShowDestDrop(false); }}
                    />
                  </div>
                  {flightErrors.destination && <p className="mt-1 text-xs text-red-600">{flightErrors.destination}</p>}
                </div>
                <div>
                  <label className={lbl}>Departure</label>
                  <input type="date" value={flightForm.date} min={today}
                    onChange={e => { setFlightForm(p => ({ ...p, date: e.target.value })); setFlightErrors(p => ({ ...p, date: '' })); }}
                    className={inp(flightErrors.date)} />
                  {flightErrors.date && <p className="mt-1 text-xs text-red-600">{flightErrors.date}</p>}
                </div>
                <div>
                  <label className={lbl}>Passengers</label>
                  <input type="number" min={1} max={9} value={flightForm.passengers}
                    onChange={e => { setFlightForm(p => ({ ...p, passengers: parseInt(e.target.value, 10) || 1 })); setFlightErrors(p => ({ ...p, passengers: '' })); }}
                    className={inp(flightErrors.passengers)} />
                  {flightErrors.passengers && <p className="mt-1 text-xs text-red-600">{flightErrors.passengers}</p>}
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button type="submit" disabled={flightLoading}
                  className="btn-ripple px-10 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 flex items-center gap-2">
                  {flightLoading ? <LoadingSpinner size="sm" /> : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  {flightLoading ? 'Searching…' : 'Search Flights'}
                </button>
              </div>
            </form>
          )}

          {/* ─ Hotel Form ─ */}
          {activeTab === 'hotels' && (
            <form onSubmit={handleHotelSearch} className="p-6">
              {/* Popular destinations */}
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Popular destinations</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_HOTELS.map(d => (
                    <button key={d.city} type="button"
                      onClick={() => setHotelForm(p => ({ ...p, city: d.city }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                        hotelForm.city === d.city
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}>
                      <span>{d.emoji}</span>{d.city}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={lbl}>City</label>
                  <div className="relative">
                    <input type="text" placeholder="Paris, New York…" value={hotelForm.city}
                      onChange={e => { setHotelForm(p => ({ ...p, city: e.target.value })); setHotelErrors(p => ({ ...p, city: '' })); setShowCityDrop(true); }}
                      onFocus={() => setShowCityDrop(true)}
                      onBlur={() => setTimeout(() => setShowCityDrop(false), 150)}
                      autoComplete="off"
                      className={inp(hotelErrors.city)} />
                    <Dropdown
                      items={hotelForm.city ? filterCities(hotelForm.city) : HOTEL_CITIES}
                      visible={showCityDrop}
                      onSelect={(c) => { setHotelForm(p => ({ ...p, city: c.city })); setShowCityDrop(false); }}
                    />
                  </div>
                  {hotelErrors.city && <p className="mt-1 text-xs text-red-600">{hotelErrors.city}</p>}
                </div>
                <div>
                  <label className={lbl}>Check-In</label>
                  <input type="date" value={hotelForm.checkIn} min={today}
                    onChange={e => { setHotelForm(p => ({ ...p, checkIn: e.target.value })); setHotelErrors(p => ({ ...p, checkIn: '' })); }}
                    className={inp(hotelErrors.checkIn)} />
                  {hotelErrors.checkIn && <p className="mt-1 text-xs text-red-600">{hotelErrors.checkIn}</p>}
                </div>
                <div>
                  <label className={lbl}>Check-Out</label>
                  <input type="date" value={hotelForm.checkOut} min={hotelForm.checkIn || today}
                    onChange={e => { setHotelForm(p => ({ ...p, checkOut: e.target.value })); setHotelErrors(p => ({ ...p, checkOut: '' })); }}
                    className={inp(hotelErrors.checkOut)} />
                  {hotelErrors.checkOut && <p className="mt-1 text-xs text-red-600">{hotelErrors.checkOut}</p>}
                </div>
                <div>
                  <label className={lbl}>Guests</label>
                  <input type="number" min={1} max={10} value={hotelForm.guests}
                    onChange={e => { setHotelForm(p => ({ ...p, guests: parseInt(e.target.value, 10) || 1 })); setHotelErrors(p => ({ ...p, guests: '' })); }}
                    className={inp(hotelErrors.guests)} />
                  {hotelErrors.guests && <p className="mt-1 text-xs text-red-600">{hotelErrors.guests}</p>}
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button type="submit" disabled={hotelLoading}
                  className="btn-ripple px-10 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 flex items-center gap-2">
                  {hotelLoading ? <LoadingSpinner size="sm" /> : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                  {hotelLoading ? 'Searching…' : 'Search Hotels'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ─── Results ─── */}
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Flight Results ── */}
        {activeTab === 'flights' && flightSearched && (
          <>
            {flightLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`anim-fade-up delay-${i * 100}`}><SkeletonFlightCard /></div>
                ))}
              </div>
            ) : flightError ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center anim-scale-in">
                <p className="text-4xl mb-3">✈️</p>
                <p className="text-red-700 font-semibold">{flightError}</p>
                <p className="text-sm text-red-400 mt-1">Please check your search and try again.</p>
              </div>
            ) : (
              <>
                {(filteredFlights.length > 0 || flightResults.length > 0) && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5 flex flex-wrap items-center gap-4 anim-fade-in">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <label className="text-xs font-bold text-slate-600">Max Price:</label>
                      <input type="range" min={0} max={Math.max(...flightResults.map(f => f.price || 0), 5000)}
                        value={flightPriceRange[1]} onChange={e => setFlightPriceRange([0, Number(e.target.value)])}
                        className="w-28 accent-indigo-600" />
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">${flightPriceRange[1]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Sort by:</label>
                      <select value={flightSort} onChange={e => setFlightSort(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                        <option value="price_asc">Price: Low → High</option>
                        <option value="price_desc">Price: High → Low</option>
                        <option value="duration_asc">Duration: Shortest</option>
                        <option value="duration_desc">Duration: Longest</option>
                      </select>
                    </div>
                    <span className="ml-auto text-xs text-slate-400 font-medium">
                      <span className="text-indigo-600 font-bold">{filteredFlights.length}</span> of {flightResults.length} flights
                    </span>
                  </div>
                )}

                {filteredFlights.length === 0 ? (
                  <div className="text-center py-20 anim-fade-in">
                    <div className="text-6xl mb-4">✈️</div>
                    <p className="text-slate-600 font-bold text-xl">No flights found</p>
                    <p className="text-slate-400 text-sm mt-2">Try adjusting your search criteria or filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFlights.map((flight, i) => (
                      <div key={flight._id || flight.id || i} className={`anim-fade-up delay-${Math.min(i * 100, 500)}`}>
                        <FlightCard flight={flight} onBook={handleBookFlight} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Hotel Results ── */}
        {activeTab === 'hotels' && hotelSearched && (
          <>
            {hotelLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`anim-fade-up delay-${i * 100}`}><SkeletonHotelCard /></div>
                ))}
              </div>
            ) : hotelError ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center anim-scale-in">
                <p className="text-4xl mb-3">🏨</p>
                <p className="text-red-700 font-semibold">{hotelError}</p>
                <p className="text-sm text-red-400 mt-1">Please check your search and try again.</p>
              </div>
            ) : (
              <>
                {(filteredHotels.length > 0 || hotelResults.length > 0) && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5 flex flex-wrap items-center gap-4 anim-fade-in">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Max Price/night:</label>
                      <input type="range" min={0} max={Math.max(...hotelResults.map(h => h.pricePerNight || h.price || 0), 2000)}
                        value={hotelPriceRange[1]} onChange={e => setHotelPriceRange([0, Number(e.target.value)])}
                        className="w-28 accent-indigo-600" />
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">${hotelPriceRange[1]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Min Rating:</label>
                      <select value={hotelMinRating} onChange={e => setHotelMinRating(Number(e.target.value))}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                        <option value={0}>Any rating</option>
                        <option value={3}>3+ Stars</option>
                        <option value={4}>4+ Stars</option>
                        <option value={4.5}>4.5+ Stars</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Sort by:</label>
                      <select value={hotelSort} onChange={e => setHotelSort(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                        <option value="price_asc">Price: Low → High</option>
                        <option value="price_desc">Price: High → Low</option>
                        <option value="rating_desc">Rating: Highest</option>
                        <option value="rating_asc">Rating: Lowest</option>
                      </select>
                    </div>
                    <span className="ml-auto text-xs text-slate-400 font-medium">
                      <span className="text-indigo-600 font-bold">{filteredHotels.length}</span> of {hotelResults.length} hotels
                    </span>
                  </div>
                )}

                {filteredHotels.length === 0 ? (
                  <div className="text-center py-20 anim-fade-in">
                    <div className="text-6xl mb-4">🏨</div>
                    <p className="text-slate-600 font-bold text-xl">No hotels found</p>
                    <p className="text-slate-400 text-sm mt-2">Try adjusting your search criteria or filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredHotels.map((hotel, i) => (
                      <div key={hotel._id || hotel.id || i} className={`anim-fade-up delay-${Math.min(i * 100, 500)}`}>
                        <HotelCard hotel={hotel} onBook={handleBookHotel} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Initial state ── */}
        {activeTab === 'flights' && !flightSearched && (
          <div className="text-center py-20 anim-fade-in">
            <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-12 h-12 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-500">Where would you like to fly?</p>
            <p className="text-slate-400 text-sm mt-1">Enter your travel details above and hit Search</p>
          </div>
        )}
        {activeTab === 'hotels' && !hotelSearched && (
          <div className="text-center py-20 anim-fade-in">
            <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-500">Find your perfect stay</p>
            <p className="text-slate-400 text-sm mt-1">Enter a city and dates to discover hotels</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
