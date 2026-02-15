import React, { useState } from 'react';
import { FiMapPin } from 'react-icons/fi';

const LocationPreview = ({ latitude, longitude, address, name, isOwnMessage }) => {
    const [mapImageError, setMapImageError] = useState(false);

    const lat = latitude != null && latitude !== '' ? Number(latitude) : NaN;
    const lng = longitude != null && longitude !== '' ? Number(longitude) : NaN;
    const hasValidCoords = !Number.isNaN(lat) && !Number.isNaN(lng);

    const googleMapsKey = process.env.REACT_APP_GOOGLE_STATIC_MAPS_API_KEY;
    const staticMapUrl = hasValidCoords && googleMapsKey
        ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=400x200&markers=color:red%7C${lat},${lng}&key=${googleMapsKey}`
        : null;
    const googleMapsUrl = hasValidCoords ? `https://www.google.com/maps?q=${lat},${lng}` : '#';

    const handleImageError = () => setMapImageError(true);

    if (!hasValidCoords) {
        return (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 w-full max-w-xs sm:max-w-sm">
                <FiMapPin className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-1 sm:mb-2">
                    Location unavailable
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    {address || 'Invalid location data'}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 w-full max-w-xs sm:max-w-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Map Image - only shown when we have a URL and it loads; image failure does not hide the card */}
            <div className="relative h-24 sm:h-32 bg-gray-200 dark:bg-gray-700">
                {staticMapUrl && !mapImageError ? (
                    <img
                        src={staticMapUrl}
                        alt="Location Map"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <FiMapPin className="w-10 h-10" />
                    </div>
                )}
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium flex items-center space-x-1">
                    <FiMapPin className="w-2 h-2 sm:w-3 sm:h-3" />
                    <span className="text-xs">Location</span>
                </div>
            </div>

            {/* Location Info */}
            <div className="p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {name || 'Shared Location'}
                </h3>
                {address && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 line-clamp-2">
                        {address}
                    </p>
                )}

                {/* Coordinates */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 truncate">
                    {lat}, {lng}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                        <FiMapPin className="w-2 h-2 sm:w-3 sm:h-3" />
                        <span className="text-xs">Open in Maps</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LocationPreview;

