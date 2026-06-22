# Desktop App Packaging (Wails)

## Overview

nats-horizon uses [Wails v2](https://wails.io/) to package the web application as a native Linux desktop binary. Wails embeds the React/Vite frontend directly into a Go binary, using the system WebKitGTK webview for rendering.

## Why Wails

| Concern | Wails Advantage |
|---|---|
| Backend | Native Go — reuse existing use-case handlers directly |
| Frontend | React/Vite works as-is, no framework migration |
| Binary size | ~15-25 MB (vs ~150 MB for Electron) |
| Memory | ~30-50 MB idle (vs ~200 MB for Electron) |
| Dependencies | WebKitGTK is pre-installed on most Linux distros |
| Distribution | Single `.deb`, `.rpm`, AppImage, or raw binary |

## Prerequisites

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.0-dev build-essential
```

### Linux (Fedora)

```bash
sudo dnf install -y gtk3-devel webkit2gtk4.0-devel gcc-c++ make
```

### Linux (Arch)

```bash
sudo pacman -S gtk3 webkit2gtk-4.1 base-devel
```

### Go & Wails CLI

```bash
# Go 1.25+ (already required by the project)
go version

# Install Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Verify installation:

```bash
wails doctor
```

## Project Structure

```
nats-horizon/
├── main.go              # Desktop app entry point (Wails)
├── cmd/
│   └── server/          # Existing web server entry point
├── desktop/
│   ├── app.go           # App struct, lifecycle, Go bindings
│   └── converters.go    # Model→DTO converters
├── internal/
│   └── ...              # Shared use-case handlers (unchanged)
├── web/
│   ├── src/             # React frontend (unchanged)
│   └── package.json
├── wails.json           # Wails config (project root)
├── Makefile
└── build/
    └── desktop/         # Build assets (icons, .desktop file)
```

## Wails Integration Steps

### 1. Add Wails dependency

```bash
go get github.com/wailsapp/wails/v2
```

### 2. Create desktop entry point

`main.go` at project root — Wails runtime with window config and frontend dist resolution.

### 3. Create desktop app package

`desktop/app.go` — App struct with StartUp/ShutDown lifecycle, NATS connection management, and Go bindings for all features (streams, consumers, messages, KV, dashboard, cluster, metrics, connections, security, subjects, history).

`desktop/converters.go` — Model→DTO converters.

### 4. Configure Wails

`wails.json` at project root with `build:tags: "webkit2_41"` for Arch Linux (webkit2gtk-4.1).

### 5. Build

```bash
# Development (hot-reload)
make desktop-dev

# Production build
make desktop-build

# Cross-compile for Linux
make desktop-build-linux-amd64
```

Output: `build/bin/nats-horizon-desktop` (single binary, ~20 MB)

## Distribution Formats

### AppImage (universal Linux)

```bash
# After wails build, use appimagetool
./appimagetool build/bin/nats-horizon.AppDir
```

### .deb (Ubuntu/Debian)

```bash
# Use nfpm or dpkg-deb
nfpm package --packager deb --target build/
```

### .rpm (Fedora/RHEL)

```bash
nfpm package --packager rpm --target build/
```

### Flatpak / Snap

Flatpak and Snap manifests can be added for sandboxed distribution.

## Makefile Targets

```makefile
# Desktop development
desktop-dev:
	wails dev

# Desktop production build
desktop-build:
	wails build -o nats-horizon-desktop

# Cross-compile for Linux amd64
desktop-build-linux:
	GOOS=linux GOARCH=amd64 wails build -o nats-horizon-desktop-linux-amd64
```

## Configuration

The desktop app reads the same environment variables as the web server:

| Variable | Default | Description |
|---|---|---|
| `NATS_URL` | `nats://localhost:4222` | NATS server address |
| `PORT` | `3000` | Fallback port (web mode) |

In desktop mode, the NATS URL is configurable from the UI settings dialog (stored in `~/.config/nats-horizon/config.json`).

## Troubleshooting

### WebKitGTK not found

```bash
# Arch Linux (webkit2gtk-4.1)
pkg-config --libs webkit2gtk-4.1

# Ubuntu/Debian (webkit2gtk-4.0)
pkg-config --libs webkit2gtk-4.0
```

If using webkit2gtk-4.1, add `"build:tags": "webkit2_41"` to `wails.json`.

### Build fails with CGO errors

```bash
export CGO_ENABLED=1
export CC=gcc
wails build
```

### Blank window on startup

Ensure the frontend is built before running in production mode:

```bash
cd web && npm run build
wails build
```
