# Changelog

## [Unreleased]
### Added
- TTS Replay: Added functionality to replay the last 3 TTS messages.
  - Settings page now lists the last 3 messages with "Replay on Overlay" buttons.
  - List updates in real-time via Socket.IO.
  - Clicking replay triggers playback on the main overlay.
- TTS File Management: Limited saved TTS audio files (`/public/tts/`) to the 3 most recent, automatically deleting older files.

### Changed
- Refactored Text-to-Speech (TTS) to use direct Google Cloud API calls instead of the `@google-cloud/text-to-speech` package.
- Consolidated `youtubeAPIKey` into `googleAPIKey` in `config.json` for use with both YouTube and Google Cloud APIs.
- Updated TTS authentication to use the `googleAPIKey` from `config.json`, removing the need for `google_auth.json`.
- Replaced Puppeteer with native WebSocket for heart rate monitoring
- Removed socket.io-client dependency
- Updated configuration to use WebSocket access token instead of widget link

### Fixed
- Proper handling of Pulsoid WebSocket message format
- Improved error handling and reconnection logic

## [1.1.0] - 2025-03-27
### Added
- Initial release with all core functionality