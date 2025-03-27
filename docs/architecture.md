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

## Data Flow
1. Client requests are handled by `index.mjs`
2. Requests are routed to appropriate services
3. Services interact with entities as needed
4. Responses are rendered using EJS templates