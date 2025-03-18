# PESKAS Tracks Explorer

A web application for viewing and analyzing vessel tracking data.

## Features

- View vessel tracks on an interactive map
- Filter trips by date and vessel
- Analyze vessel speed with color-coded tracks
- MongoDB-based authentication system using vessel IMEI numbers

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

Admin users can use:
- **IMEI**: admin
- **Password**: admin

## Documentation

For more details about the server setup, see [SERVER_SETUP.md](./SERVER_SETUP.md).
