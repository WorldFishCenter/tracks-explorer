# Vercel Deployment Guide

This guide explains how to deploy the PESKAS Tracks Explorer application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) (optional but recommended)
   ```bash
   npm install -g vercel
   ```
3. Git repository with your code (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Prepare your repository

Make sure all your changes are committed and pushed to your repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2. Deploy with Vercel Dashboard

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." > "Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Configure Environment Variables:
   - Click "Environment Variables" and add the following:
     - `VITE_MONGODB_URI`: Your MongoDB connection string
     - `VITE_MAPBOX_TOKEN`: Your Mapbox access token

6. Click "Deploy"

### 3. Deploy with Vercel CLI (Alternative)

If you prefer using the command line:

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy from your project directory:
   ```bash
   vercel
   ```

3. Follow the interactive prompts to configure your project.

4. Set environment variables:
   ```bash
   vercel env add VITE_MONGODB_URI
   vercel env add VITE_MAPBOX_TOKEN
   ```

5. Redeploy with environment variables:
   ```bash
   vercel --prod
   ```

## Project Structure for Vercel

The project has been prepared for Vercel deployment with:

1. **Serverless API Functions**: Located in the `/api` directory
2. **Vercel Configuration**: `vercel.json` at the project root
3. **Frontend Code**: Standard Vite structure in the `src` directory

## Post-Deployment

After deployment:

1. Vercel will provide you with a unique URL for your application
2. Verify that authentication works correctly
3. Check that the map and vessel data load properly

## Troubleshooting

If you encounter issues:

1. **API connection errors**:
   - Check that environment variables are properly set in Vercel
   - Verify CORS settings in the API handlers

2. **MongoDB connection issues**:
   - Ensure your MongoDB connection string is correct
   - Check that your MongoDB Atlas cluster allows connections from Vercel's IPs
   - You may need to configure Network Access in MongoDB Atlas to allow connections from anywhere (`0.0.0.0/0`)

3. **Login problems**:
   - Check the serverless function logs in Vercel dashboard
   - Verify that the API endpoints are working by testing them directly

## Updating Your Deployment

To update your deployed application:

1. Push changes to your Git repository
2. Vercel will automatically redeploy (if using Git integration)
3. Or manually redeploy with:
   ```bash
   vercel --prod
   ```

## Custom Domains

To use a custom domain:

1. Go to your project in the Vercel dashboard
2. Click "Settings" > "Domains"
3. Add your domain and follow the verification instructions 