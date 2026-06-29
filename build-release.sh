#!/bin/bash
set -e

# Build script for all platforms
# Usage: ./build-release.sh [version]
# Example: ./build-release.sh v1.0.0

VERSION=${1:-dev}
echo "Building nats-horizon ${VERSION}..."

# Create output directories
mkdir -p build dist

# Build frontend first
echo "Building frontend..."
cd web
npm install
npm run build
cd ..

# Function for building backend per platform
build_backend() {
    local os=$1
    local arch=$2
    local output=$3
    local ext=${4:-}
    
    echo "Building backend for ${os}/${arch}..."
    GOOS=${os} GOARCH=${arch} CGO_ENABLED=0 go build \
        -ldflags="-s -w" \
        -o "build/${output}${ext}" \
        ./cmd/server
}

# Build backend for all platforms
build_backend linux amd64 nats-horizon-linux-amd64
build_backend linux arm64 nats-horizon-linux-arm64
build_backend windows amd64 nats-horizon-windows-amd64 .exe
build_backend windows arm64 nats-horizon-windows-arm64 .exe
build_backend darwin amd64 nats-horizon-darwin-amd64
build_backend darwin arm64 nats-horizon-darwin-arm64

# Copy frontend dist to each platform folder and create archives
echo "Creating archives..."

for platform in \
    "linux-amd64" \
    "linux-arm64" \
    "windows-amd64" \
    "windows-arm64" \
    "darwin-amd64" \
    "darwin-arm64"
do
    echo "Packaging ${platform}..."
    
    # Create platform directory
    mkdir -p "dist/${platform}"
    
    # Copy binary
    if [[ "${platform}" == windows* ]]; then
        cp "build/nats-horizon-${platform}.exe" "dist/${platform}/nats-horizon.exe"
    else
        cp "build/nats-horizon-${platform}" "dist/${platform}/nats-horizon"
        chmod +x "dist/${platform}/nats-horizon"
    fi
    
    # Copy frontend
    cp -r web/dist "dist/${platform}/web"
    
    # Copy config files
    cp .env.example "dist/${platform}/.env.example" 2>/dev/null || true
    
    # Create README for the package
    cat > "dist/${platform}/README.txt" << EOF
nats-horizon ${VERSION}
====================

NATS JetStream Monitoring & Management Platform

Quick Start:
1. Run the binary: ./nats-horizon (or nats-horizon.exe on Windows)
2. Open http://localhost:3000 in your browser

Configuration (optional):
- Copy .env.example to .env and edit as needed
- Or set environment variables:
  - NATS_URL: NATS server address (default: nats://localhost:4222)
  - PORT: Web server port (default: 3000)
  - GIN_MODE: debug or release (default: release)

For more information: https://github.com/amir-baghshahy/nats-horizon
EOF
    
    # Create archive
    cd dist
    if [[ "${platform}" == windows* ]]; then
        zip -r "nats-horizon-${VERSION}-${platform}.zip" "${platform}"
    else
        tar czf "nats-horizon-${VERSION}-${platform}.tar.gz" "${platform}"
    fi
    cd ..
done

echo ""
echo "Build complete! Archives in dist/:"
ls -la dist/*.tar.gz dist/*.zip 2>/dev/null || ls -la dist/
