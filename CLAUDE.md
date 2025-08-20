# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start frontend development server (Vite)
- `npm run dev:server` - Start backend server with auto-reload
- `npm run dev:all` - Start both frontend and backend concurrently (recommended)
- `npm run start` - Alias for dev:all

### Build & Deploy
- `npm run build` - Build production version (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint on codebase

### Server
- `npm run server` - Run backend server in production mode

## Architecture

### Full-Stack Structure
This is a full-stack application with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js server with MongoDB authentication
- **UI Framework**: Tabler CSS with Bootstrap components
- **Maps**: Mapbox GL + Deck.gl for vessel tracking visualization
- **PWA**: Progressive Web App with service worker support

### Key Architectural Patterns

#### Authentication Flow
- IMEI-based authentication against MongoDB users collection
- Global admin password support via environment variables
- Context-based authentication state management
- Protected routes with automatic redirects
- User data stored in localStorage for persistence

#### Component Organization
- **Pages**: Main application screens (Dashboard, Login)
- **Layouts**: MainLayout for consistent app structure
- **Components**: Reusable UI components organized by feature
  - `dashboard/`: Dashboard-specific components
  - `map/`: Map-related components (controls, layers, tooltip)
- **Hooks**: Custom React hooks for shared logic
- **Contexts**: React contexts for global state management

#### Map & Visualization
- Deck.gl layers for vessel track visualization with speed-based coloring
- Mapbox GL for base map rendering
- Responsive design with mobile-optimized tooltips
- Real-time location tracking capabilities
- Map controls for layer management and styling

#### Data Management
- MongoDB integration for user authentication and vessel data
- Custom API service layers for data fetching
- Date range filtering for trip data
- Vessel selection and filtering system

#### Internationalization
- React-i18next for English/Swahili support
- Responsive language switchers (desktop dropdown, mobile toggle)
- Custom useLanguage hook for language management
- Organized translation keys by feature area

### Environment Configuration
Required environment variables:
- `VITE_MONGODB_URI`: MongoDB connection string
- `VITE_MAPBOX_TOKEN`: Mapbox API token
- `SERVER_PORT`: Backend server port (default: 3001)
- `VITE_GLOBAL_PASSW`: Global admin password
- `GLOBAL_PASSW`: Server-side global admin password

### Styling & Design
- SCSS modules with component-specific stylesheets
- Tabler CSS framework for consistent UI components
- Responsive design with mobile-first approach
- Bootstrap utilities for layout and spacing
- Theme-aware color system

### Development Workflow
1. Run `npm run dev:all` to start both frontend and backend
2. Frontend runs on Vite dev server (usually port 5173)
3. Backend API server runs on port 3001
4. Use ESLint for code quality: `npm run lint`
5. TypeScript compilation is part of build process

### Production Deployment
- Configured for Vercel deployment with serverless functions
- API routes in `/api` directory for Vercel integration
- PWA support with offline caching for maps and core functionality
- Optimized build with asset hashing and code splitting