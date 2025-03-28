# API Documentation

## Web Endpoints

### Main Pages
- `/` - Main overlay page (renders overlay.ejs)
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
- `replayTTS` - Requests the overlay play a specific recent TTS file (payload: `{ filePath: string }`)
- `getInitialRecentTTS` - Requests the initial list of recent TTS messages upon connection

### From Server to Client (Overlay)
- `initData` - Initial overlay data on connection
- `liveChat` - New live chat messages (contains authorName, message)
- `heartRate` - Heart rate updates (via WebSocket from Pulsoid)
- `ttsReady` - New TTS audio ready (payload: `{ chat: string, mp3: Buffer, recentFiles: Array<{path: string, message: string}> }`)
- `ttsPause` - Pause TTS playback
- `ttsResume` - Resume TTS playback
- `ttsSkip` - Skip current TTS message
- `editOverlayElements` - Updates overlay element visibility
- `playReplayTTS` - Instructs overlay to play a specific recent TTS file (payload: `{ filePath: string }`)

### From Server to Client (Settings)
- `initSettingsData` - Initial settings data on connection
- `ttsStatus` - Current TTS status (contains: currentlyPlaying, isPaused, queueSize, upcomingMessages)
- `recentTTSUpdate` - Sends the updated list of recent TTS messages (payload: `Array<{path: string, message: string}>`)

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