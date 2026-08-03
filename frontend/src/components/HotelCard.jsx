import React from 'react';
import { formatPrice, getStarArray, truncate } from '../utils/helpers';

const AMENITY_ICONS = {
  'WiFi': '📶', 'wifi': '📶',
  'Pool': '🏊', 'pool': '🏊',
  'Gym': '💪', 'gym': '💪',
  'Spa': '🧖', 'spa': '🧖',
  'Restaurant': '🍽️',
  'Parking': '🅿️',
  'Beach': '🏖️',
  'Bar': '🍹',
  'Air conditioning': '❄️',
  'Room service': '🛎️',
};
const amenityIcon = (a) => AMENITY_ICONS[a] || '✓';

const CITY_GRADIENTS = {
  Paris:    'from-pink-400 via-rose-500 to-red-500',
  Tokyo:    'from-violet-400 via-purple-500 to-indigo-500',
  Bali:     'from-teal-400 via-emerald-500 to-green-500',
  Dubai:    'from-amber-400 via-orange-500 to-yellow-500',
  'New York': 'from-sky-400 via-blue-500 to-indigo-500',
  London:   'from-slate-400 via-gray-500 to-zinc-600',
  default:  'from-indigo-400 via-violet-500 to-purple-600',
};
const cityGradient = (city = '') => CITY_GRADIENTS[city] || CITY_GRADIENTS.default;

const HotelCard = ({ hotel, onBook }) => {
  if (!hotel) return null;
  const { name, city, country, rating, pricePerNight, price, amenities, description, imageUrl, roomsAvailable } = hotel;
  const displayPrice = pricePerNight || price;
  const stars = getStarArray(rating || 0);
  const amenityList = Array.isArray(amenities) ? amenities : [];
  const isLow = roomsAvailable !== undefined && roomsAvailable <= 3;

  return (
    <div className="card-hover bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${cityGradient(city)} flex items-center justify-center`}>
            <div className="text-center text-white/80">
              <div className="text-5xl mb-1">
                {city === 'Paris' ? '🗼' : city === 'Tokyo' ? '🗾' : city === 'Bali' ? '🏝️' :
                 city === 'Dubai' ? '🏙️' : city === 'New York' ? '🗽' : '🏨'}
              </div>
              <p className="font-bold text-sm opacity-70">{city || 'Hotel'}</p>
            </div>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Rating badge */}
        {rating && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-lg flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-black text-slate-800">{Number(rating).toFixed(1)}</span>
          </div>
        )}

        {/* Location badge */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white text-xs font-medium">{[city, country].filter(Boolean).join(', ') || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Name & Stars */}
        <div className="mb-3">
          <h3 className="text-base font-bold text-slate-900 leading-snug">{name || 'Hotel'}</h3>
          {rating !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {stars.map((filled, i) => (
                <svg key={i} className={`w-3.5 h-3.5 ${filled ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-slate-400 ml-0.5">{Number(rating).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">{truncate(description, 90)}</p>
        )}

        {/* Amenities */}
        {amenityList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {amenityList.slice(0, 4).map((a, i) => (
              <span key={i} className="flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                <span className="text-xs">{amenityIcon(a)}</span>
                {a}
              </span>
            ))}
            {amenityList.length > 4 && (
              <span className="text-xs text-slate-400 px-1.5 py-0.5 font-medium">+{amenityList.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100">
          {roomsAvailable !== undefined && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold mb-3 px-2.5 py-1 rounded-full w-fit ${
              roomsAvailable === 0
                ? 'bg-slate-100 text-slate-400'
                : isLow
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${roomsAvailable === 0 ? 'bg-slate-300' : isLow ? 'bg-red-500' : 'bg-emerald-500'}`} />
              {roomsAvailable === 0
                ? 'Fully booked'
                : isLow
                ? `Only ${roomsAvailable} room${roomsAvailable !== 1 ? 's' : ''} left!`
                : `${roomsAvailable} rooms available`}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">per night</p>
              <p className="text-2xl font-black text-indigo-700">{formatPrice(displayPrice)}</p>
            </div>
            <button
              onClick={() => onBook && onBook(hotel)}
              disabled={roomsAvailable === 0}
              className={`btn-ripple px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                roomsAvailable === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-md shadow-indigo-200'
              }`}
            >
              {roomsAvailable === 0 ? 'Unavailable' : 'Book Now →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
