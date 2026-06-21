#!/usr/bin/env bash
# install.sh — one-liner installer for nats-monitoring
# Usage: curl -fsSL https://raw.githubusercontent.com/amir-baghshahy/nats-monitor/main/install.sh | bash
# Or:    chmod +x install.sh && ./install.sh

set -euo pipefail

REPO="amir-baghshahy/nats-monitor"
VERSION="${NATS_MONITORING_VERSION:-latest}"
INSTALL_DIR="${NATS_MONITORING_INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="nats-monitoring"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Detect OS and architecture
detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case "$OS" in
        linux)  OS="linux" ;;
        darwin) OS="darwin" ;;
        *)      error "Unsupported OS: $OS (supported: linux, darwin)" ;;
    esac

    case "$ARCH" in
        x86_64|amd64) ARCH="amd64" ;;
        arm64|aarch64) ARCH="arm64" ;;
        *)            error "Unsupported architecture: $ARCH (supported: amd64, arm64)" ;;
    esac

    PLATFORM="${OS}-${ARCH}"
    info "Detected platform: ${PLATFORM}"
}

# Resolve version tag
resolve_version() {
    if [ "$VERSION" = "latest" ]; then
        info "Fetching latest release..."
        VERSION=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
            | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' \
            || error "Could not fetch latest release. Use NATS_MONITORING_VERSION=vX.Y.Z")
        info "Latest version: ${VERSION}"
    fi
}

# Download and install
install() {
    detect_platform
    resolve_version

    ARCHIVE="${BINARY_NAME}-${VERSION}-${PLATFORM}.tar.gz"
    URL="https://github.com/${REPO}/releases/download/${VERSION}/${ARCHIVE}"

    info "Downloading ${ARCHIVE}..."
    TMPDIR=$(mktemp -d)
    trap "rm -rf ${TMPDIR}" EXIT

    curl -fsSL "$URL" -o "${TMPDIR}/${ARCHIVE}" \
        || error "Download failed. Check if release ${VERSION} exists for ${PLATFORM}"

    info "Extracting..."
    tar -xzf "${TMPDIR}/${ARCHIVE}" -C "${TMPDIR}"

    info "Installing to ${INSTALL_DIR}/${BINARY_NAME}"
    sudo mkdir -p "${INSTALL_DIR}" 2>/dev/null || mkdir -p "${INSTALL_DIR}"
    sudo cp "${TMPDIR}/${BINARY_NAME}-${PLATFORM}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}" \
        || cp "${TMPDIR}/${BINARY_NAME}-${PLATFORM}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
    sudo chmod +x "${INSTALL_DIR}/${BINARY_NAME}" 2>/dev/null || chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

    info "✅ Installed ${BINARY_NAME} ${VERSION} to ${INSTALL_DIR}/${BINARY_NAME}"
    info ""
    info "Quick start:"
    info "  # Run with Docker (recommended, includes NATS):"
    info "  docker compose up"
    info ""
    info "  # Or run directly (needs NATS server at localhost:4222):"
    info "  ${BINARY_NAME}"
    info ""
    info "  # With custom NATS URL:"
    info "  ${BINARY_NAME} --nats-url nats://your-server:4222"
}

install
