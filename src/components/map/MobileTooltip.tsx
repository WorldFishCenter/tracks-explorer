import React from 'react';
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
    <div style={{ fontSize: '13px' }}>
      {/* Vessel name and IMEI */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: themeColors.text, marginBottom: '1px' }}>
          {location.boatName || 'Unknown'}
        </div>
        <div style={{ fontSize: '11px', color: themeColors.textMuted }}>
          {location.imei}
        </div>
      </div>
      
      {/* Battery and Last Seen inline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div>
          <span style={{ fontSize: '11px', color: themeColors.textMuted, marginRight: '4px' }}>Battery:</span>
          <span style={{ 
            backgroundColor: themeColors.badge, 
            color: themeColors.badgeText,
            padding: '1px 4px', 
            borderRadius: '3px', 
            fontSize: '11px',
            fontWeight: 500
          }}>
            {location.batteryState || 'Unknown'}
          </span>
        </div>
        <div style={{ fontSize: '11px' }}>
          <span style={{ color: themeColors.textMuted, marginRight: '4px' }}>Last Seen:</span>
          <span style={{ color: themeColors.text }}>{location.lastSeen ? formatTime(location.lastSeen) : 'Never'}</span>
        </div>
      </div>
      
      {/* Community if available */}
      {location.directCustomerName && (
        <div style={{ fontSize: '11px', color: themeColors.textMuted }}>
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
      <div style={{ fontSize: '13px' }}>
        {/* Vessel name */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: themeColors.text }}>
            {firstPoint?.boatName || 'Unknown'}
          </div>
        </div>
        
        {/* Started and Duration inline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div>
            <span style={{ fontSize: '11px', color: themeColors.textMuted, marginRight: '4px' }}>Started:</span>
            <span style={{ fontSize: '11px', color: themeColors.text }}>
              {firstPoint ? formatTime(new Date(firstPoint.time)) : 'Unknown'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: themeColors.textMuted, marginRight: '4px' }}>Duration:</span>
            <span style={{ fontSize: '11px', color: themeColors.text }}>{duration}</span>
          </div>
        </div>
        
        {/* Ended if available */}
        {lastPoint && (
          <div style={{ fontSize: '11px', color: themeColors.textSubtle }}>
            Ended: {formatTime(new Date(lastPoint.time))}
          </div>
        )}
      </div>
    );
  };

  const renderPointContent = (point: TripPoint) => (
    <div style={{ fontSize: '13px' }}>
      {/* Time and Vessel on same line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, color: themeColors.text }}>{formatTime(new Date(point.time))}</span>
        </div>
        <div style={{ fontSize: '12px', color: themeColors.textMuted }}>
          {point.boatName || 'Unknown'}
        </div>
      </div>
      
      {/* Speed and Heading inline */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
        <div>
          <span style={{ fontSize: '11px', color: themeColors.textMuted, marginRight: '4px' }}>Speed:</span>
          <span style={{ 
            backgroundColor: themeColors.badge, 
            color: themeColors.badgeText,
            padding: '1px 4px', 
            borderRadius: '3px', 
            fontSize: '11px',
            fontWeight: 500
          }}>
            {formatSpeed(point.speed)}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: themeColors.textMuted, marginRight: '4px' }}>Heading:</span>
          <span style={{ fontSize: '11px', color: themeColors.text }}>
            {point.heading.toFixed(0)}° {getDirectionFromHeading(point.heading)}
          </span>
        </div>
      </div>
      
      {/* Trip ID */}
      <div style={{ fontSize: '11px', color: themeColors.textSubtle }}>
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
      {/* Bottom Sheet - compact and optimized */}
      <div 
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: themeColors.background,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          boxShadow: isDarkMode 
            ? '0 -2px 20px rgba(0, 0, 0, 0.5)' 
            : '0 -2px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 10000,
          maxHeight: '50vh',
          overflow: 'hidden'
        }}
      >
        {/* Drag handle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          paddingTop: '8px', 
          paddingBottom: '4px' 
        }}>
          <div style={{
            width: '32px',
            height: '3px',
            backgroundColor: themeColors.handle,
            borderRadius: '2px'
          }} />
        </div>
        
        {/* Header with close button */}
        <div style={{
          padding: '6px 12px 8px',
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
            <h6 style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: themeColors.text }}>
              {headerTitle}
            </h6>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              color: themeColors.textMuted,
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '4px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
        
        {/* Content - ultra compact */}
        <div style={{ padding: '8px 12px 12px' }}>
          {content}
        </div>
      </div>
    </>
  );
};

export default MobileTooltipComponent; 