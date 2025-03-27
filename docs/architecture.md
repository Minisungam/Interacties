# Application Architecture

## Overview
The Interacties application follows a modular architecture with these main components:

### Frontend
- Views: EJS templates in `views/` directory
- Public assets: Static files in `public/` directory
  - JavaScript files
  - CSS styles
  - Fonts

### Backend
- Main entry point: `index.mjs`
- Services: Modular services in `services/` directory
  - fetchAPI.js
  - heartRate.js  
  - liveChat.js
  - tts.js
- Entities: Data models in `entities/` directory
  - data.js
  - queue.js

## Real-Time Components
- Heart rate monitoring via WebSocket connection to Pulsoid
- Live chat integration through YouTube API
- Socket.io for real-time client updates

## Data Flow
1. Client requests are handled by `index.mjs`
2. Real-time data streams (WebSocket/APIs) are managed by services
3. Services interact with entities as needed
4. Updates are pushed to clients via Socket.io
5. Static content is rendered using EJS templates