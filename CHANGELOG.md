# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features

- Refreshed UI: dark workbench layout for sort jobs (setup, progress, done, history, settings)
- Design system tokens extended (@theme): surface scale, fg scale, semantic colors (warning/success), radius scale
- Source folder scan engine: counts photo, RAW and video files in the chosen folder; skips hidden, system and symlinked entries (UI wiring lands in a follow-up release)
- Pick a source folder from Setup: Browse opens the system folder dialog and shows file count, total size and a photo / RAW / video breakdown for the chosen folder
- Inline scan progress and error toasts when reading the chosen source folder fails

### Bug Fixes

### Performance

### Reverts
