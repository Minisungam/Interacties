# Changelog

## [Unreleased]
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