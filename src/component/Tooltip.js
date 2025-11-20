import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ 
  children, 
  content, 
  disabled = false, 
  position = 'top',
  className = '',
  delay = 300,
  maxWidth = '200px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  const showTooltip = () => {
    if (!disabled || !content) return;
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  // Calculate optimal position based on screen boundaries
  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let newPosition = position;

      // Check if tooltip goes outside viewport and adjust position
      if (position === 'top' && containerRect.top - tooltipRect.height < 10) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && containerRect.bottom + tooltipRect.height > viewport.height - 10) {
        newPosition = 'top';
      } else if (position === 'left' && containerRect.left - tooltipRect.width < 10) {
        newPosition = 'right';
      } else if (position === 'right' && containerRect.right + tooltipRect.width > viewport.width - 10) {
        newPosition = 'left';
      }

      // For top/bottom positions, check horizontal overflow
      if ((newPosition === 'top' || newPosition === 'bottom')) {
        const tooltipLeft = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
        if (tooltipLeft < 10) {
          // Tooltip would overflow on the left
          setActualPosition(`${newPosition}-right`);
          return;
        } else if (tooltipLeft + tooltipRect.width > viewport.width - 10) {
          // Tooltip would overflow on the right
          setActualPosition(`${newPosition}-left`);
          return;
        }
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 px-3 py-2 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none break-words';
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'top-left':
        return `${baseClasses} bottom-full right-0 mb-2`;
      case 'top-right':
        return `${baseClasses} bottom-full left-0 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'bottom-left':
        return `${baseClasses} top-full right-0 mt-2`;
      case 'bottom-right':
        return `${baseClasses} top-full left-0 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const baseArrowClasses = 'absolute w-0 h-0 border-solid';
    
    switch (actualPosition) {
      case 'top':
        return `${baseArrowClasses} border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 top-full left-1/2 transform -translate-x-1/2`;
      case 'top-left':
        return `${baseArrowClasses} border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 top-full right-4`;
      case 'top-right':
        return `${baseArrowClasses} border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 top-full left-4`;
      case 'bottom':
        return `${baseArrowClasses} border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900 bottom-full left-1/2 transform -translate-x-1/2`;
      case 'bottom-left':
        return `${baseArrowClasses} border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900 bottom-full right-4`;
      case 'bottom-right':
        return `${baseArrowClasses} border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900 bottom-full left-4`;
      case 'left':
        return `${baseArrowClasses} border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-900 left-full top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseArrowClasses} border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-gray-900 right-full top-1/2 transform -translate-y-1/2`;
      default:
        return `${baseArrowClasses} border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 top-full left-1/2 transform -translate-x-1/2`;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && disabled && content && (
        <div 
          ref={tooltipRef}
          className={getPositionClasses()}
          style={{ maxWidth: maxWidth }}
        >
          {content}
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
