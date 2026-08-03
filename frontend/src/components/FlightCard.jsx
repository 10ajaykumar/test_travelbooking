import React from 'react';
import { formatPrice, formatTime, formatDuration } from '../utils/helpers';

const AIRLINE_COLORS = {
  default: 'from-indigo-500 to-violet-600',
  A: 'from-sky-500 to-blue-600',
  B: 'from-violet-500 to-purple-600',
  C: 'from-emerald-500 to-teal-600',
  D: 'from-orange-500 to-red-500',
  E: 'from-pink-500 to-rose-600',
  F: 'from-amber-500 to-orange-600',
};
const airlineGradient = (airline = '') =>
  AIRLINE_COLORS[airline.charAt(0).toUpperCase()] || AIRLINE_COLORS.default;

const FlightCard = ({ flight, onBook }) => {
  if (!flight) return null;
  const { airline, flightNumber, origin, destination, departureTime, arrivalTime, duration, price, seatsAvailable, cabinClass, stops } = flight;
  const isLowSeats = seatsAvailable !== undefined && seatsAvailable <= 5;
  const initial = (airline || 'A').charAt(0).toUpperCase();

  return (
    <div className="card-hover bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3.5 bg-gradient-to-r ${airlineGradient(airline)}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <span className="text-white font-black text-base">{initial}</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">{airline || 'Airline'}</p>
            {flightNumber && <p className="text-white/70 text-xs font-medium">{flightNumber}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stops !== undefined && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${stops === 0 ? 'bg-emerald-400/30 text-white border border-emerald-300/40' : 'bg-white/20 text-white border border-white/30'}`}>
              {stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`}
            </span>
          )}
          {cabinClass && (
            <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-bold border border-white/30">
              {cabinClass}
            </span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-3">
          {/* Origin */}
          <div className="text-center flex-1 min-w-0">
            <p className="text-3xl font-black text-slate-800 leading-none truncate">
              {origin?.code || origin || '---'}
            </p>
            {origin?.city && <p className="text-xs text-slate-400 mt-1 truncate">{origin.city}</p>}
            <p className="text-lg font-bold text-indigo-600 mt-1">{formatTime(departureTime)}</p>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-center flex-shrink-0 px-2 min-w-[90px]">
            {duration && (
              <p className="text-xs text-slate-400 font-medium mb-1.5">{formatDuration(duration)}</p>
            )}
            <div className="flex items-center gap-1 w-full">
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-indigo-300" />
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-indigo-300 to-slate-200" />
            </div>
          </div>

          {/* Destination */}
          <div className="text-center flex-1 min-w-0">
            <p className="text-3xl font-black text-slate-800 leading-none truncate">
              {destination?.code || destination || '---'}
            </p>
            {destination?.city && <p className="text-xs text-slate-400 mt-1 truncate">{destination.city}</p>}
            <p className="text-lg font-bold text-indigo-600 mt-1">{formatTime(arrivalTime)}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-slate-200 my-4" />

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          <div>
            {seatsAvailable !== undefined && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                seatsAvailable === 0
                  ? 'bg-slate-100 text-slate-400'
                  : isLowSeats
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${seatsAvailable === 0 ? 'bg-slate-300' : isLowSeats ? 'bg-red-500' : 'bg-emerald-500'}`} />
                {seatsAvailable === 0
                  ? 'Sold out'
                  : isLowSeats
                  ? `Only ${seatsAvailable} left!`
                  : `${seatsAvailable} seats available`}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">per person</p>
              <p className="text-2xl font-black text-indigo-700">{formatPrice(price)}</p>
            </div>
            <button
              onClick={() => onBook && onBook(flight)}
              disabled={seatsAvailable === 0}
              className={`btn-ripple px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                seatsAvailable === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200'
              }`}
            >
              {seatsAvailable === 0 ? 'Sold Out' : 'Book Now →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
