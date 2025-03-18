# Fishers Tracking Portal

A web application for fishers to visualize and track their vessel movements through an interactive map interface. Built with Vite, React, TypeScript, Tabler UI, and deck.gl.

## Features

- Interactive map visualization of vessel movements using deck.gl with satellite view
- Real-time tracking of fishing vessels with Pelagic Data API integration
- Vessel details and trip information with speed, distance, and duration metrics
- User authentication and IMEI-based vessel filtering
- Modern and responsive user interface built with Tabler UI
- Date range filtering with convenient preset options
- Vessel insights with trip statistics

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Pelagic Data API credentials
- Mapbox account and access token

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/tracks-explorer.git
cd tracks-explorer
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Add your Mapbox access token and Pelagic Data API credentials:
   ```
   VITE_MAPBOX_TOKEN=your_mapbox_token
   VITE_API_BASE_URL=https://analytics.pelagicdata.com/api
   VITE_API_TOKEN=your_pelagic_api_token
   VITE_API_SECRET=your_pelagic_api_secret
   ```

4. Start the development server
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
tracks-explorer/
├── public/            # Static files
├── src/
│   ├── api/           # API services and data fetching
│   │   └── pelagicDataService.ts # Pelagic Data API integration
│   ├── assets/        # Images, fonts, etc.
│   ├── components/    # Reusable React components
│   │   ├── Map.tsx    # deck.gl map visualization
│   │   └── DateRangeSelector.tsx # Date range selection component
│   ├── contexts/      # React contexts for state management
│   │   └── AuthContext.tsx # Authentication context
│   ├── layouts/       # Page layout components
│   ├── pages/         # Page components
│   │   └── Dashboard.tsx # Main dashboard page
│   ├── styles/        # Global styles and Tabler UI customization
│   ├── hooks/         # Custom React hooks
│   ├── App.tsx        # Main App component
│   └── main.tsx       # Entry point
├── .env               # Environment variables (not tracked by git)
├── .env.example       # Example environment variables
├── index.html         # HTML template
├── package.json       # Project dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── vite.config.ts     # Vite configuration
```

## API Integration

The application is integrated with the Pelagic Data API:

- **API Base URL**: `https://analytics.pelagicdata.com/api`
- **Authentication**: Uses API token and secret for secure access
- **Endpoints**:
  - Trip Points: Fetches vessel tracking data points
  - Trips: Retrieves trip information

The API service is implemented in `src/api/pelagicDataService.ts` and includes:
- CSV parsing for converting API responses to structured data
- Error handling and fallback to mock data when needed
- Intelligent data transformation for visualization

## Data Visualization

The application visualizes vessel tracking data using deck.gl:
- **ScatterplotLayer**: Shows vessel positions with color-coded speed indicators
- **LineLayer**: Connects trip points to show vessel routes
- **Interactive features**: Tooltips, vessel selection, and map navigation
- **Satellite view**: Uses Mapbox satellite imagery for accurate geographical context

## User Authentication

- User login with role-based access control
- IMEI-based filtering for vessel owners
- Admin view for accessing all vessel data

## Technologies Used

- [Vite](https://vitejs.dev/) - Fast development environment
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tabler UI](https://tabler.io/) - Modern UI component framework
- [deck.gl](https://deck.gl/) - WebGL-powered visualization framework
- [Mapbox](https://www.mapbox.com/) - Maps and location data
- [date-fns](https://date-fns.org/) - Date utility library

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Environment Variables

This project requires the following environment variables:

- `VITE_MAPBOX_TOKEN`: Your Mapbox access token
- `VITE_API_BASE_URL`: Pelagic Data API base URL
- `VITE_API_TOKEN`: Your Pelagic Data API token
- `VITE_API_SECRET`: Your Pelagic Data API secret

These variables are loaded automatically by Vite during development and build processes.

## Future Enhancements

- Trip replay functionality to visualize vessel movement over time
- Additional filtering options for vessel types and activities
- Enhanced data analytics and reporting features
- Mobile-optimized interface for field use

## License

[MIT](LICENSE)

## Acknowledgements

- [Tabler](https://tabler.io/) for the UI components
- [deck.gl](https://deck.gl/) for the visualization framework
- [Mapbox](https://www.mapbox.com/) for the mapping platform
- [Pelagic Data](https://www.pelagicdata.com/) for the vessel tracking API
