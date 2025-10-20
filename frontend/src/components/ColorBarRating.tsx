/**
 * Color Bar Rating Component
 * Horizontal slider with color gradient from red to green
 * Features translucent blocks that fill on hover and become opaque on click
 */

import React, { useState } from 'react';

interface ColorBarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  label: string;
  description?: string;
  error?: string;
}

const ColorBarRating: React.FC<ColorBarRatingProps> = ({
  rating,
  onRatingChange,
  label,
  description,
  error
}) => {
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const ratingLabels = [
    { value: 1, label: 'Poor' },
    { value: 2, label: 'Fair' },
    { value: 3, label: 'Good' },
    { value: 4, label: 'Very Good' },
    { value: 5, label: 'Awesome' }
  ];

  const getSegmentColor = (value: number) => {
    const colors = [
      'bg-red-400',      // 1 - Poor
      'bg-orange-400',   // 2 - Fair
      'bg-yellow-400',   // 3 - Good
      'bg-green-300',    // 4 - Very Good
      'bg-green-500'     // 5 - Awesome
    ];
    return colors[value - 1];
  };

  const isSegmentFilled = (segmentValue: number) => {
    // If hovering, fill up to hovered value
    if (hoveredRating > 0) {
      return segmentValue <= hoveredRating;
    }
    // If rated, fill up to rating value
    return segmentValue <= rating;
  };

  const getSegmentOpacity = (segmentValue: number) => {
    const isFilled = isSegmentFilled(segmentValue);
    const isConfirmed = rating > 0 && segmentValue <= rating;
    
    // Confirmed selection: fully opaque
    if (isConfirmed) {
      return 'opacity-100';
    }
    // Hovered or not selected: translucent
    if (isFilled) {
      return 'opacity-70';
    }
    // Not filled: very translucent
    return 'opacity-20';
  };

  const currentRatingLabel = () => {
    if (hoveredRating > 0) {
      return ratingLabels[hoveredRating - 1];
    }
    if (rating > 0) {
      return ratingLabels[rating - 1];
    }
    return null;
  };

  const displayLabel = currentRatingLabel();

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        <span className="text-red-500 ml-1">*</span>
        {description && <span className="text-gray-500 text-xs block mt-1">{description}</span>}
      </label>
      
      {/* Color Bar Slider */}
      <div className="flex items-center justify-center mb-3">
        <div 
          className="flex items-center rounded-full overflow-hidden shadow-md"
          onMouseLeave={() => setHoveredRating(0)}
        >
          {ratingLabels.map((item, index) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onRatingChange(item.value)}
              onMouseEnter={() => setHoveredRating(item.value)}
              className={`
                relative h-14 w-20
                ${getSegmentColor(item.value)}
                ${getSegmentOpacity(item.value)}
                ${index === 0 ? 'rounded-l-full' : ''}
                ${index === ratingLabels.length - 1 ? 'rounded-r-full' : ''}
                transition-all duration-300 ease-in-out
                transform hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              `}
              aria-label={`Rate ${item.value} - ${item.label}`}
            >
              {/* Separator line between segments */}
              {index < ratingLabels.length - 1 && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-8 bg-white opacity-30"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Rating Display */}
      <div className="text-center">
        {displayLabel ? (
          <p className="text-sm text-gray-600 font-medium transition-all duration-200">
            {displayLabel.value} - {displayLabel.label}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Select a rating
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-xs mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
};

export default ColorBarRating;
