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
├── app.sh              # Management script for the application
├── events.json         # Event data storage
├── images/             # Processed images directory
│   ├── full/          # Full-size images
│   ├── small/         # Small-size images
│   └── thumb/         # Thumbnail images
├── index.html          # Main application UI
├── main.js             # Electron main process
├── preload.js          # Electron preload script
└── renderer.js         # Frontend renderer process
```

## Documentation

The project includes comprehensive documentation in the `docs/` directory:

- 📐 [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Detailed description of the application's architecture, including main and renderer processes, component structure, and data flow
- 📝 [`STYLEGUIDE.md`](docs/STYLEGUIDE.md) - Coding standards and best practices for JavaScript/TypeScript, CSS, and documentation
- 🛠️ [`DEVELOPMENT.md`](docs/DEVELOPMENT.md) - Development environment setup, workflow, and guidelines for contributors
- 🧪 [`TESTING.md`](docs/TESTING.md) - Testing strategy, guidelines, and examples for unit, integration, and end-to-end tests
- 🚀 [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) - Build, packaging, and distribution procedures for different platforms
- 🔒 [`SECURITY.md`](docs/SECURITY.md) - Security best practices, guidelines, and procedures for maintaining application security
- 🔧 [`MAINTENANCE.md`](docs/MAINTENANCE.md) - Regular maintenance tasks, monitoring procedures, and troubleshooting guides

Each document is regularly updated as the application evolves to ensure accurate and current information.

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

You can run the application using the management script:

```bash
./app.sh start
```

### Using the Management Script

The `app.sh` script provides a convenient way to manage the application:

```bash
./app.sh <command>
```

Available commands:

| Command | Description |
|---------|-------------|
| `install` | Install project dependencies |
| `start` | Start the application in background |
| `stop` | Stop the running application |
| `restart` | Restart the application |
| `status` | Show application status and URLs |
| `launch` | Open the application in browser (starts app if needed) |
| `help` | Show detailed help information |

Examples:

```bash
# Install dependencies
./app.sh install

# Start the application
./app.sh start

# Check application status and URLs
./app.sh status

# Restart the application
./app.sh restart

# Open the application in browser (starts app if needed)
./app.sh launch

# Stop the application
./app.sh stop

# Show detailed help
./app.sh help
```

## Dependencies

- electron: ^36.2.1
- @aws-sdk/client-s3: ^3.812.0
- sharp: ^0.34.1
- uuid: ^11.1.0

## License

This project is proprietary software. All rights reserved.

---

Note: This README.md is considered the source of truth for the project's documentation according to project guidelines.
