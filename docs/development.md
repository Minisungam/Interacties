# Development Guide

## Prerequisites
- Node.js (v18+ recommended)
- npm (comes with Node.js)
- Google Cloud credentials (for TTS functionality)
- YouTube API key (for subscriber tracking)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `config.json` file based on `config_template.json`:
```bash
cp config_template.json config.json
```

4. Edit `config.json` with your:
- YouTube API key
- YouTube channel ID
- ScoreSaber profile link
- Pusloid WebSocket access token (required for heart rate monitoring)

5. Place Google Cloud credentials file as `google_auth.json` in project root

## Running the Application
Start the development server:
```bash
npm run devStart
```

The application will be available at:
- Main overlay: http://localhost:5500
- Settings page: http://localhost:5500/settings

## Project Structure

### Main Files
- `index.mjs` - Main application entry point
- `config.json` - Configuration file (sensitive data)
- `config_template.json` - Template for configuration

### Directories
- `public/` - Static files served to clients
  - `script.js` - Overlay client logic
  - `settings.js` - Settings page logic
  - `styles.css` - Main stylesheet
- `views/` - EJS templates
  - `index.ejs` - Overlay template
  - `settings.ejs` - Settings page template
- `services/` - Application services
  - `fetchAPI.js` - YouTube and ScoreSaber API integration
  - `heartRate.js` - Heart rate monitoring via WebSocket connection to Pulsoid
  - `liveChat.js` - Live chat handling
  - `tts.js` - Text-to-speech processing
- `entities/` - Data models
  - `data.js` - Shared application data
  - `queue.js` - TTS queue management

## Environment Variables
- `PORT` - Server port (default: 5500)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Google Cloud credentials

## Deployment
For production deployment:
1. Build any frontend assets if needed
2. Use process manager like PM2:
```bash
pm2 start index.mjs --name "interacties"
```
3. Set up reverse proxy (Nginx/Apache) if needed