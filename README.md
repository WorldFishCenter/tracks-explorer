# PESKAS Tracks Explorer

A web application for viewing and analyzing vessel tracking data.

## Version 2.7.0 - Latest Updates

### New Features
- **User Registration System**: New users can now create accounts with username, country, vessel type, main gear type, and boat name
- **User Profile Management**: Users can view and edit their profile information and change passwords
- **Non-PDS User Support**: Full support for users without tracking devices (non-PDS users)
  - GPS device location support with "Get My Location" feature
  - Direct catch reporting without trip selection
  - Dedicated dashboard views for non-PDS users
- **Enhanced Map Visibility**: Map is always visible even when no trips are available, allowing users to explore bathymetry and other map features
- **Flexible Authentication**: Login support using IMEI, Boat name, or Username
- **Catch Events API**: New endpoints for retrieving user catch events by IMEI or username
- **Improved Map UI**: 
  - Removed Mapbox default controls for cleaner interface
  - Subtle "No trips" banner when no data is available
  - Enhanced glassmorphic design for better integration

### Improvements
- Enhanced error handling and validation across registration and login
- Improved data fetching for both PDS and non-PDS users
- Better tooltip content and mobile responsiveness
- Updated localization for English, Portuguese, and Swahili

## Features

- View vessel tracks on an interactive map
- Filter trips by date and vessel
- Analyze vessel speed with color-coded tracks
- User registration and profile management
- Support for both PDS (tracking device) and non-PDS users
- Device GPS location support
- MongoDB-based authentication system using IMEI, boat name, or username

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make sure you have a valid `.env` file with the required environment variables:
   ```
   VITE_MAPBOX_TOKEN=your_mapbox_token
   VITE_MONGODB_URI=your_mongodb_connection_string
   SERVER_PORT=3001
   ```

### Running the Application

#### Development Mode

To run both the frontend and backend servers simultaneously:

```bash
npm run dev:all
```

This will:
- Start the frontend Vite server (usually on port 5173)
- Start the backend Express server (on port 3001)
- Show output from both servers in a single terminal with color coding

#### Running Separately

If you prefer to run the servers separately:

1. Start the backend:
   ```bash
   npm run dev:server
   ```

2. Start the frontend (in a separate terminal):
   ```bash
   npm run dev
   ```

### Authentication

The application authenticates users against a MongoDB database. You can log in using:

- **Vessel IMEI**: The 15-digit IMEI number of a registered vessel
- **Password**: The corresponding password in the MongoDB database

## Deployment

### Vercel Deployment

This application is configured for easy deployment to Vercel. For detailed instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

Quick steps:
1. Push your code to a Git repository
2. Import the project in Vercel Dashboard
3. Set the environment variables (`VITE_MONGODB_URI` and `VITE_MAPBOX_TOKEN`)
4. Deploy

The application uses:
- Vercel Serverless Functions for the backend API
- Vite build for the frontend
- Environment variables for configuration

## Documentation

- [Server Setup Guide](./SERVER_SETUP.md) - Details about the backend API server
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md) - Instructions for deploying to Vercel
- [Production Readiness Report](./PRODUCTION_READINESS_REPORT.md) - Comprehensive production readiness audit

## Version History

### Version 2.7.0 (December 2024)
- User registration and profile management system
- Non-PDS user support with GPS device location
- Enhanced map visibility (always visible, even without trips)
- Flexible authentication (IMEI, boat name, or username)
- User catch events API endpoints
- Improved map UI with cleaner controls
- Enhanced localization (English, Portuguese, Swahili)

### Previous Versions
See git commit history for earlier versions.
