# MongoDB Authentication Server Setup

This document explains how to run the backend API server for MongoDB authentication.

## Overview

The application now uses a proper backend API server to securely connect to MongoDB, instead of trying to connect directly from the browser (which is not recommended and causes compatibility issues).

## How to Run

### Option 1: Run Both Frontend and Backend with a Single Command

```bash
# This will start both the frontend and backend servers simultaneously
npm run dev:all
```

The frontend will run on the default Vite port (usually 5173) and the backend will run on port 3001.

### Option 2: Run Frontend and Backend Separately

#### Step 1: Start the Backend Server

```bash
# Install dependencies (if you haven't already)
npm install

# Start the development server with auto-reload
npm run dev:server
```

The server will start on port 3001 (or the port specified in your .env file).

#### Step 2: Start the Frontend Application (in a separate terminal)

```bash
npm run dev
```

The frontend application will start and connect to the backend API server.

## How It Works

1. The backend server connects to MongoDB using the Node.js driver
2. The frontend sends authentication requests to the backend API
3. The backend validates credentials against MongoDB and returns user information
4. The frontend stores the authenticated user information in localStorage

## API Endpoints

- `POST /api/auth/login` - Authenticate a user with IMEI and password

## Environment Variables

Make sure your `.env` file contains:

```
VITE_MONGODB_URI=your_mongodb_connection_string
SERVER_PORT=3001
```

## Authentication

The application authenticates users by:
1. Checking if the provided IMEI exists in the MongoDB users collection
2. Verifying that the password matches
3. Converting the MongoDB user format to the application's user format
4. Storing user information in localStorage

## Troubleshooting

If you encounter issues:

1. Check that both servers are running
2. Verify your MongoDB connection string
3. Check the backend server logs for errors
4. Make sure CORS is properly configured if you're hosting the frontend and backend on different domains 