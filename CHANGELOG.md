# Changelog

## [Unreleased]
### Changed
- Replaced Puppeteer with native WebSocket for heart rate monitoring
- Removed socket.io-client dependency
- Updated configuration to use WebSocket access token instead of widget link

### Fixed
- Proper handling of Pulsoid WebSocket message format
- Improved error handling and reconnection logic

## [1.1.0] - 2025-03-27
### Added
- Initial release with all core functionality