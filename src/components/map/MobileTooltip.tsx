import React, { useEffect, useRef, useState } from 'react';
import { MobileTooltip as MobileTooltipType, TripPoint, LiveLocation } from '../../types';
import { formatTime, formatSpeed, getDirectionFromHeading, formatDuration } from '../../utils/formatters';

interface MobileTooltipProps {
  tooltip: MobileTooltipType;
  onClose: () => void;
  filteredTripById: Record<string, TripPoint[]>;
  selectedTripId?: string;
}

const MobileTooltipComponent: React.FC<MobileTooltipProps> = ({
  tooltip,
  onClose,
  filteredTripById,
  selectedTripId
}) => {
  const { object } = tooltip;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  
  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) && !isDragging.current) {
        handleClose();
      }
    };
    
    // Add listeners with a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);
    
    // Cleanup: restore scrolling on component unmount
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      // Ensure body overflow is restored on unmount
      document.body.style.overflow = '';
    };
  }, []);
  
  // Smooth close animation
  const handleClose = () => {
    // Re-enable background scrolling when closing and restore scroll position
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.overflow = '';
    document.body.style.width = '';
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    isDragging.current = false;
    
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };
  
  // Handle drag gestures with smooth follow
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    isDragging.current = true;
    
    // Prevent background scrolling when dragging tooltip
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.width = '100%';
    
    // Add active cursor effect
    if (tooltipRef.current) {
      tooltipRef.current.style.cursor = 'grabbing';
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    // Prevent default to stop background scrolling
    e.preventDefault();
    e.stopPropagation();
    
    currentY.current = e.touches[0].clientY;
    const deltaY = Math.max(0, currentY.current - startY.current); // Only allow downward drag
    
    // Apply drag offset for real-time feedback
    setDragOffset(deltaY);
    
    // Add resistance effect as you drag further
    const resistance = Math.min(deltaY / 100, 1);
    const resistedOffset = deltaY * (1 - resistance * 0.3);
    setDragOffset(resistedOffset);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const deltaY = currentY.current - startY.current;
    isDragging.current = false;
    
    // Re-enable background scrolling and restore scroll position
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.overflow = '';
    document.body.style.width = '';
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    
    // Reset cursor
    if (tooltipRef.current) {
      tooltipRef.current.style.cursor = 'grab';
    }
    
    // If dragged down more than 80px or with sufficient velocity, close
    if (deltaY > 80) {
      handleClose();
    } else {
      // Snap back to original position
      setDragOffset(0);
    }
  };

  // Detect current theme from document attribute
  const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  
  // Theme-aware colors
  const themeColors = {
    background: isDarkMode ? 'rgba(33, 37, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    text: isDarkMode ? '#f8f9fa' : '#495057',
    textMuted: isDarkMode ? '#adb5bd' : '#6c757d',
    textSubtle: isDarkMode ? '#868e96' : '#9ca3af',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.125)' : 'rgba(0, 0, 0, 0.125)',
    badge: isDarkMode ? '#495057' : '#f8f9fa',
    badgeText: isDarkMode ? '#f8f9fa' : '#495057',
    handle: isDarkMode ? '#495057' : '#dee2e6'
  };

  const renderLiveLocationContent = (location: LiveLocation) => (
    <div style={{ fontSize: '14px' }}>
      {/* Vessel name and IMEI */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 600, fontSize: '16px', color: themeColors.text, marginBottom: '4px' }}>
          {location.boatName || 'Unknown'}
        </div>
        <div style={{ fontSize: '13px', color: themeColors.textMuted }}>
          {location.imei}
        </div>
      </div>
      
      {/* Battery and Last Seen inline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <span style={{ fontSize: '12px', color: themeColors.textMuted, marginRight: '6px' }}>Battery:</span>
          <span style={{ 
            backgroundColor: themeColors.badge, 
            color: themeColors.badgeText,
            padding: '2px 6px', 
            borderRadius: '4px', 
            fontSize: '12px',
            fontWeight: 500
          }}>
            {location.batteryState || 'Unknown'}
          </span>
        </div>
        <div style={{ fontSize: '12px' }}>
          <span style={{ color: themeColors.textMuted, marginRight: '6px' }}>Last Seen:</span>
          <span style={{ color: themeColors.text }}>{location.lastSeen ? formatTime(location.lastSeen) : 'Never'}</span>
        </div>
      </div>
      
      {/* Community if available */}
      {location.directCustomerName && (
        <div style={{ fontSize: '12px', color: themeColors.textMuted }}>
          {location.directCustomerName}
        </div>
      )}
    </div>
  );

  const renderTripContent = (tripData: any) => {
    const tripPoints = filteredTripById[tripData.tripId] || [];
    const firstPoint = tripPoints[0];
    const lastPoint = tripPoints[tripPoints.length - 1];
    
    const duration = firstPoint && lastPoint 
      ? formatDuration(new Date(lastPoint.time).getTime() - new Date(firstPoint.time).getTime())
      : 'Unknown';
      
    return (
      <div style={{ fontSize: '14px' }}>
        {/* Vessel name */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 600, fontSize: '16px', color: themeColors.text }}>
            {firstPoint?.boatName || 'Unknown'}
          </div>
        </div>
        
        {/* Started and Duration inline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '12px', color: themeColors.textMuted, marginRight: '6px' }}>Started:</span>
            <span style={{ fontSize: '12px', color: themeColors.text }}>
              {firstPoint ? formatTime(new Date(firstPoint.time)) : 'Unknown'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: themeColors.textMuted, marginRight: '6px' }}>Duration:</span>
            <span style={{ fontSize: '12px', color: themeColors.text }}>{duration}</span>
          </div>
        </div>
        
        {/* Ended if available */}
        {lastPoint && (
          <div style={{ fontSize: '12px', color: themeColors.textSubtle }}>
            Ended: {formatTime(new Date(lastPoint.time))}
          </div>
        )}
      </div>
    );
  };

  const renderPointContent = (point: TripPoint) => (
    <div style={{ fontSize: '14px' }}>
      {/* Time and Vessel on same line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: '16px', color: themeColors.text }}>{formatTime(new Date(point.time))}</span>
        </div>
        <div style={{ fontSize: '13px', color: themeColors.textMuted }}>
          {point.boatName || 'Unknown'}
        </div>
      </div>
      
      {/* Speed and Heading inline */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        <div>
          <span style={{ fontSize: '12px', color: themeColors.textMuted, marginRight: '6px' }}>Speed:</span>
          <span style={{ 
            backgroundColor: themeColors.badge, 
            color: themeColors.badgeText,
            padding: '2px 6px', 
            borderRadius: '4px', 
            fontSize: '12px',
            fontWeight: 500
          }}>
            {formatSpeed(point.speed)}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: themeColors.textMuted, marginRight: '6px' }}>Heading:</span>
          <span style={{ fontSize: '12px', color: themeColors.text }}>
            {point.heading.toFixed(0)}° {getDirectionFromHeading(point.heading)}
          </span>
        </div>
      </div>
      
      {/* Trip ID */}
      <div style={{ fontSize: '12px', color: themeColors.textSubtle }}>
        Trip: {point.tripId || 'Unknown'}
      </div>
    </div>
  );

  const renderGridContent = (gridData: any) => {
    return (
      <div style={{ fontSize: '13px' }}>
        {/* Times visited and Cell size inline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div>
            <span style={{ fontSize: '11px', color: themeColors.textMuted, marginRight: '4px' }}>Times visited:</span>
            <span style={{ 
              backgroundColor: '#007bff', 
              color: 'white',
              padding: '1px 4px', 
              borderRadius: '3px', 
              fontSize: '11px',
              fontWeight: 500
            }}>
              {gridData.count}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: themeColors.textMuted, marginRight: '4px' }}>Cell size:</span>
            <span style={{ fontSize: '11px', color: themeColors.text }}>500×500m</span>
          </div>
        </div>
        
        {/* Trip if available */}
        {selectedTripId && (
          <div style={{ fontSize: '11px', color: themeColors.textSubtle }}>
            Trip: {selectedTripId}
          </div>
        )}
      </div>
    );
  };

  // Determine content based on object type
  let content;
  let headerTitle = '';
  let headerColor = '#28a745'; // default green
  
  // Debug logging to see what properties are available for heatmap objects
  console.log('MobileTooltip object:', object, 'Keys:', Object.keys(object));
  
  if (object.imei && (object.lat !== undefined && object.lat !== null) && (object.lng !== undefined && object.lng !== null)) {
    content = renderLiveLocationContent(object as LiveLocation);
    headerTitle = 'Live Location';
    headerColor = '#28a745'; // green
  } else if (object.tripId && object.path) {
    content = renderTripContent(object);
    headerTitle = 'Fishing Trip';
    headerColor = '#007bff'; // blue
  } else if (object.time) {
    content = renderPointContent(object as TripPoint);
    headerTitle = 'GPS Position';
    headerColor = '#ffc107'; // yellow/orange
  } else if (object.count) {
    console.log('Rendering grid content for object:', object);
    content = renderGridContent(object);
    headerTitle = 'Visited Location';
    headerColor = '#17a2b8'; // info blue
  } else {
    console.log('No content type matched for object:', object);
    return null;
  }

  return (
    <>
      {/* Bottom Sheet - wider and more accessible with drag effect */}
      <div 
        ref={tooltipRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: '5%',
          right: '5%',
          width: '90%',
          backgroundColor: themeColors.background,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: isDarkMode 
            ? '0 -4px 25px rgba(0, 0, 0, 0.6)' 
            : '0 -4px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          maxHeight: '60vh',
          overflow: 'hidden',
          border: `1px solid ${themeColors.border}`,
          transform: `translateY(${dragOffset}px) ${isClosing ? 'translateY(100%)' : ''}`,
          transition: isDragging.current ? 'none' : isClosing 
            ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
            : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'grab',
          touchAction: 'none'
        }}
      >
        {/* Drag handle - more prominent */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          paddingTop: '12px', 
          paddingBottom: '8px',
          cursor: 'grab'
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: themeColors.handle,
            borderRadius: '3px',
            opacity: 0.6
          }} />
        </div>
        
        {/* Header with close button */}
        <div style={{
          padding: '8px 16px 12px',
          borderBottom: `1px solid ${themeColors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '6px',
              height: '6px',
              backgroundColor: headerColor,
              borderRadius: '50%',
              marginRight: '6px'
            }} />
            <h6 style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: themeColors.text }}>
              {headerTitle}
            </h6>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: themeColors.textMuted,
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '6px',
              lineHeight: 1,
              minHeight: '32px',
              minWidth: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Content - improved spacing */}
        <div style={{ 
          padding: '12px 16px 16px',
          maxHeight: 'calc(60vh - 80px)',
          overflowY: 'auto'
        }}>
          {content}
        </div>
      </div>
    </>
  );
};

export default MobileTooltipComponent; 