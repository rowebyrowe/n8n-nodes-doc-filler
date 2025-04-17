# Changelog

All notable changes to this project will be documented in this file.

## [0.3.3] - 2025-04-17
### Changed
- Removed memory consumption in nodes with continueOnFail enabled by pushing errors to returnData instead of items.
- Minor doc and config cleanups.

### Added
- Unit tests and coverage for all nodes.

## [0.3.1] - 2025-04-16
### Fixed
- Fixed type errors and existence checks for `maxPdfSize` parameter and `docBinaryData` object in all nodes.

## [0.3.0] - 2025-04-16
### Added
- New node: **Doc Get Form Info** – Analyze a PDF and extract information about all form fields present in the document.

### Changed
- README: Now lists all three nodes and documents the `Max PDF Size` parameter for all nodes.

## [0.2.1] - Previous release
- Previous changes before the introduction of Doc Get Form Info node.

