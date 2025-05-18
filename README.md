# Event Editor

An Electron-based desktop application for managing and processing event images.

## Overview

This application allows users to:
- Load and manage event data from `events.json`
- Process and organize images for events
- Create different image sizes (full, small, thumb)
- Store processed images in organized directories

## Features

- Electron-based desktop application
- Image processing capabilities using Sharp library
- AWS S3 integration for cloud storage
- UUID-based unique image naming
- Organized image storage with date-based naming

## Project Structure

```
├── events.json          # Event data storage
├── images/             # Processed images directory
│   ├── full/          # Full-size images
│   ├── small/         # Small-size images
│   └── thumb/         # Thumbnail images
├── index.html          # Main application UI
├── main.js             # Electron main process
├── preload.js          # Electron preload script
└── renderer.js         # Frontend renderer process
```

## Getting Started

### Prerequisites

- Node.js (version compatible with Electron 36.2.1)
- npm (Node Package Manager)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

```bash
npm start
```

## Dependencies

- electron: ^36.2.1
- @aws-sdk/client-s3: ^3.812.0
- sharp: ^0.34.1
- uuid: ^11.1.0

## Documentation

- Project documentation is stored in the `docs` directory
- Agent history: `docs/AGENT-HISTORY.md`
- Agent rules: `docs/AGENT-RULES.md`
- Tasks: `docs/TASKS.md`
- Architecture: `docs/ARCHITECTURE.md`

## License

This project is proprietary software. All rights reserved.

---

Note: This README.md is considered the source of truth for the project's documentation according to project guidelines.
