# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Implemented real-time JSON extraction fix for the AI Chat to properly update fields regardless of AI output formatting. (Regex extraction update).
- Created `CHANGELOG.md` and `ROADMAP.md` to cleanly track project trajectory.

### Fixed
- Fixed Vercel build failing on missing `components/ui` components by explicitly adding them to Git.
- Handled export and download API errors explicitly. Fixed crash loop during the export sequence.
- Resolved Convex Production Auth variables (`SITE_URL`, `AUTH_SECRET`, `JWT_PRIVATE_KEY`, `JWKS`) to allow login in production. 
- AI prompt now inherits the correct active UI language (English/Arabic) allowing Arabic initialization out of the box.