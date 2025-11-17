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
- Context-based authentication state management ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx))
- Protected routes with automatic redirects
- User data stored in localStorage for persistence
- Demo mode support with special credentials

#### Component Organization
- **Pages**: Main application screens ([Dashboard](src/pages/Dashboard.tsx), [Login](src/pages/Login.tsx))
- **Layouts**: [MainLayout](src/layouts/MainLayout.tsx) for consistent app structure
- **Components**: Reusable UI components organized by feature
  - `dashboard/`: Dashboard-specific components
  - `map/`: Map-related components (controls, layers, tooltip)
  - `catch-form/`: Catch reporting form components
- **Hooks**: Custom React hooks for shared logic (useTripData, useLiveLocations, useVesselSelection, useLanguage)
- **Contexts**: React contexts for global state management

#### Data Layer
- **Pelagic Data Service**: Main data source for vessel tracking ([src/api/pelagicDataService.ts](src/api/pelagicDataService.ts))
  - Implements request caching (5-minute cache duration)
  - Fetches trip data, trip points, live locations from Pelagic Analytics API
  - Requires VITE_PELAGIC_* environment variables for API access
- **Auth Service**: Handles login requests ([src/api/authService.ts](src/api/authService.ts))
- **Catch Events Service**: Manages catch reporting ([src/api/catchEventsService.ts](src/api/catchEventsService.ts))

#### Map & Visualization
- Deck.gl layers for vessel track visualization with speed-based coloring
- Mapbox GL for base map rendering
- Responsive design with mobile-optimized tooltips
- Real-time location tracking capabilities
- Map controls for layer management and styling
- Offline tile caching via service worker

#### Catch Reporting System
- Multi-step catch reporting workflow (trip selection, catch details, photo upload)
- Supports both "catch" and "no catch" outcomes
- Photo upload with GPS metadata extraction
- Network-aware with offline submission support
- Admin mode with anonymization for demo/test submissions

#### Internationalization
- React-i18next for English/Swahili/Portuguese support
- Responsive language switchers (desktop dropdown, mobile toggle)
- Custom useLanguage hook for language management
- Organized translation keys in [src/i18n/locales/](src/i18n/locales/)

### Environment Configuration
Required environment variables:
- `VITE_MONGODB_URI`: MongoDB connection string
- `VITE_MAPBOX_TOKEN`: Mapbox API token
- `VITE_PELAGIC_API_BASE_URL`: Pelagic Analytics API base URL
- `VITE_PELAGIC_USERNAME`: Pelagic API username
- `VITE_PELAGIC_PASSWORD`: Pelagic API password
- `VITE_PELAGIC_CUSTOMER_ID`: Pelagic customer ID
- `SERVER_PORT`: Backend server port (default: 3001)
- `GLOBAL_PASSW`: Server-side global admin password
- `DEMO_IMEI`: Demo mode IMEI (optional)
- `DEMO_PASSWORD`: Demo mode password (optional)

### Backend API
Express server ([server/server.js](server/server.js)) provides:
- `POST /api/auth/login` - IMEI/boat name + password authentication
- `POST /api/auth/demo-login` - Demo mode login
- `GET /api/users` - Fetch all users/boats
- `POST /api/catch-events` - Create catch event
- `GET /api/catch-events/trip/:tripId` - Get catch events by trip
- `GET /api/catch-events/user/:imei` - Get catch events by user
- `GET /api/test-db` - Database connection test (development only)

MongoDB collections:
- `users` - User accounts with IMEI, Boat name, Community, Region
- `catch-events` - Catch reporting data with trip associations

### Styling & Design
- SCSS modules with component-specific stylesheets
- Tabler CSS framework for consistent UI components
- Responsive design with mobile-first approach
- Bootstrap utilities for layout and spacing
- Theme-aware color system
- **Important**: Always stick to the Tabler theme context. Avoid custom element styling unless strictly necessary.

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
- See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for deployment instructions

## Development Guidelines

### CRITICAL RULES - ALWAYS FOLLOW BEFORE EDITING

#### 1. Pre-Edit Checklist
Before making ANY code changes:
- [ ] Read the relevant documentation in `docs/` directory
- [ ] Check existing patterns in similar components
- [ ] Verify the change aligns with architecture (see docs/ARCHITECTURE.md)
- [ ] Ensure consistency with Tabler CSS theme (NO custom styling unless necessary)
- [ ] Read the file you're about to edit completely first

#### 2. Styling Rules (STRICT)
- ✅ ALWAYS use Tabler CSS classes first
- ✅ ALWAYS use Bootstrap utilities for layout
- ❌ NEVER add custom CSS when Tabler equivalent exists
- ❌ NEVER use inline styles except for dynamic values (e.g., positioning based on state)
- 🔍 If you need custom styles, check if Tabler has a solution first
- 📝 Document why custom styles are necessary if you must use them

#### 3. Component Rules
- ✅ ALWAYS use functional components with hooks
- ✅ ALWAYS define TypeScript interfaces for props
- ✅ ALWAYS follow the component structure in docs/COMPONENTS.md
- ❌ NEVER create class components
- ❌ NEVER use `any` type (use proper TypeScript types)
- 📁 Place new components in appropriate directory (dashboard/, map/, catch-form/)

#### 4. State Management Rules
- ✅ Use `useState` for local component state only
- ✅ Use `useContext` (AuthContext) for global state
- ✅ Use custom hooks for reusable data fetching logic
- ❌ NEVER duplicate data fetching logic across components
- ❌ NEVER lift state higher than necessary

#### 5. API Integration Rules
- ✅ ALWAYS use service layer functions (src/api/)
- ✅ ALWAYS implement error handling with try/catch
- ✅ ALWAYS show user-friendly error messages
- ❌ NEVER make direct fetch calls from components
- ❌ NEVER expose API credentials in frontend code

#### 6. Code Quality Rules
- ✅ ALWAYS run `npm run lint` before committing
- ✅ ALWAYS use meaningful variable names
- ✅ ALWAYS add comments for complex logic
- ✅ ALWAYS handle loading and error states in UI
- ❌ NEVER leave console.logs in production code (except intentional logging)
- ❌ NEVER ignore TypeScript errors

#### 7. Testing Before Committing
- ✅ Test in browser (desktop + mobile view)
- ✅ Test all user interactions affected by your change
- ✅ Verify no console errors
- ✅ Check that existing functionality still works
- ✅ Test error scenarios (network failures, invalid input)

### Workflow for Making Changes

```
1. READ relevant documentation (docs/)
2. UNDERSTAND existing patterns (check similar components)
3. PLAN your changes (consider impact)
4. IMPLEMENT following guidelines above
5. TEST thoroughly (see testing checklist)
6. LINT your code (npm run lint)
7. COMMIT with meaningful message
```

### Common Patterns to Follow

#### Adding a New Component
```typescript
// 1. Create file in appropriate directory
// src/components/feature/MyComponent.tsx

import React, { useState } from 'react';

// 2. Define props interface
interface MyComponentProps {
  data: DataType;
  onAction: (id: string) => void;
}

// 3. Functional component with typed props
const MyComponent: React.FC<MyComponentProps> = ({ data, onAction }) => {
  // 4. Hooks at top
  const [state, setState] = useState<StateType>();

  // 5. Event handlers
  const handleClick = () => {
    // ...
  };

  // 6. Return JSX with Tabler classes
  return (
    <div className="card">
      <div className="card-body">
        <button className="btn btn-primary" onClick={handleClick}>
          Click Me
        </button>
      </div>
    </div>
  );
};

export default MyComponent;
```

#### Making API Calls
```typescript
// Use service layer
import { fetchTripData } from '../api/pelagicDataService';

const MyComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchTripData(params);
        setData(result);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dependencies]);

  // Show loading state
  if (loading) return <div className="spinner-border" />;

  // Show error state
  if (error) return <div className="alert alert-danger">{error}</div>;

  // Show data
  return <div>{/* render data */}</div>;
};
```

### When to Ask Questions

Ask the user before proceeding if:
- ❓ Multiple valid approaches exist (e.g., which pattern to use)
- ❓ Unclear requirements or acceptance criteria
- ❓ Breaking changes would affect existing functionality
- ❓ Architectural decision needed (e.g., new external dependency)
- ❓ Design/UX decision required

### Documentation to Reference

Before making changes, check:
- **Architecture decisions**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Data flow patterns**: [docs/DATA_FLOW.md](docs/DATA_FLOW.md)
- **Component patterns**: [docs/COMPONENTS.md](docs/COMPONENTS.md)
- **Development conventions**: [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)