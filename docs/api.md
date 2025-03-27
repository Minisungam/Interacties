# API Documentation

## Web Endpoints

### Main Pages
- `/` - Main overlay page (renders index.ejs)
- `/settings` - Settings page (renders settings.ejs)

## Socket.IO Events

### From Client to Server (Overlay)
- `ttsEnded` - Notifies server when TTS playback completes
- `getUpcomingTTS` - Requests current TTS queue status

### From Client to Server (Settings)
- `updateOverlayElements` - Updates overlay element visibility settings
- `updateLivestreamSettings` - Updates YouTube livestream settings
- `updateGeneralSettings` - Updates API keys and profile links
- `ttsPause` - Pauses TTS playback
- `ttsResume` - Resumes TTS playback
- `ttsSkip` - Skips current TTS message
- `getUpcomingTTS` - Requests TTS queue status
- `removeFromQueue` - Removes item from TTS queue (with index parameter)

### From Server to Client (Overlay)
- `initData` - Initial overlay data on connection
- `liveChat` - New live chat messages (contains authorName, message)
- `heartRate` - Heart rate updates (via WebSocket from Pulsoid)
- `ttsReady` - New TTS audio ready (contains chat text and mp3 data)
- `ttsPause` - Pause TTS playback
- `ttsResume` - Resume TTS playback
- `ttsSkip` - Skip current TTS message
- `editOverlayElements` - Updates overlay element visibility

### From Server to Client (Settings)
- `initSettingsData` - Initial settings data on connection
- `ttsStatus` - Current TTS status (contains: currentlyPlaying, isPaused, queueSize, upcomingMessages)

## Data Structures

### Overlay Elements Update
```json
{
  "enableBS": boolean,
  "enableHR": boolean,
  "enableSC": boolean,
  "enableLC": boolean,
  "enableCB": boolean
}
```

### Livestream Settings
```json
{
  "subscriberGoal": number,
  "youtubeChannelID": string,
  "youtubeLivestreamId": string
}
```

### General Settings
```json
{
  "googleAPIKey": string,
  "scoreSaberProfileLink": string,
  "pusloidAccessToken": string
}
```

### TTS Status
```json
{
  "currentlyPlaying": boolean,
  "isPaused": boolean,
  "queueSize": number,
  "upcomingMessages": string[]
}