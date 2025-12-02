import React from 'react';

/**
 * Centered crosshair overlay for waypoint selection mode
 * Displays a fixed crosshair in the center of the map viewport
 */
const WaypointCrosshair: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Crosshair SVG */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
      >
        {/* Center circle */}
        <circle
          cx="20"
          cy="20"
          r="3"
          fill="#dc3545"
          stroke="#fff"
          strokeWidth="1.5"
        />

        {/* Horizontal line - left */}
        <line
          x1="0"
          y1="20"
          x2="13"
          y2="20"
          stroke="#dc3545"
          strokeWidth="2"
        />

        {/* Horizontal line - right */}
        <line
          x1="27"
          y1="20"
          x2="40"
          y2="20"
          stroke="#dc3545"
          strokeWidth="2"
        />

        {/* Vertical line - top */}
        <line
          x1="20"
          y1="0"
          x2="20"
          y2="13"
          stroke="#dc3545"
          strokeWidth="2"
        />

        {/* Vertical line - bottom */}
        <line
          x1="20"
          y1="27"
          x2="20"
          y2="40"
          stroke="#dc3545"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

export default WaypointCrosshair;
