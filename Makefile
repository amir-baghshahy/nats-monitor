.PHONY: dev dev-backend dev-frontend build clean test test-e2e test-e2e-nats fmt deps openapi docker-build docker-run install-binary generate-api desktop-dev desktop-build

# ── Development ─────────────────────────────────────────────────────────────

dev:
	@echo "Starting backend (:3000) and frontend (:5173)..."
	@make dev-backend & make dev-frontend

dev-backend:
	@echo "Starting backend on :3000..."
	@go run cmd/server/main.go

dev-frontend:
	@echo "Starting frontend on :5173..."
	@cd web && npm run dev

# ── Production ──────────────────────────────────────────────────────────────

build: build-frontend build-backend

build-frontend:
	@echo "Building frontend..."
	@cd web && npm run build

build-backend:
	@echo "Building backend..."
	@go build -o out/server ./cmd/server

run: build-frontend
	@echo "Starting server with built frontend..."
	@go run cmd/server/main.go

# ── Dependencies ─────────────────────────────────────────────────────────────

install:
	@echo "Installing dependencies..."
	@go mod download
	@cd web && npm install

deps:
	@go mod download && go mod tidy

clean:
	@echo "Cleaning..."
	@rm -rf out web/dist web/node_modules

test:
	@echo "Running unit tests..."
	@go test ./...

test-e2e:
	@echo "Running E2E tests (requires server running on :3000 with NATS)..."
	@go test ./tests/e2e/ -v -timeout 120s

test-e2e-nats:
	@echo "Starting NATS for E2E tests..."
	@docker compose -f docker-compose.test.yml up -d nats
	@echo "Waiting for NATS to be ready..."
	@sleep 3
	@echo "Running E2E tests..."
	@go test ./tests/e2e/ -v -timeout 120s; \
		RESULT=$$?; \
		docker compose -f docker-compose.test.yml down; \
		exit $$RESULT

fmt:
	@echo "Formatting Go code..."
	@go fmt ./...

openapi:
	@echo "Generating OpenAPI spec..."
	@swag init --dir cmd/server --output api/swagger --parseDependency --parseDependencyLevel 2 --useStructName
	@go run cmd/openapi3gen/main.go
	@rm -f api/swagger/swagger.json api/swagger/swagger.yaml api/swagger/openapi.yaml

generate-api: openapi
	@echo "Generating TypeScript API client..."
	@cd web && npm run generate:api

# ── Docker ──────────────────────────────────────────────────────────────────

docker-build:
	@echo "Building Docker image..."
	@docker build -t nats-horizon .

docker-run:
	@echo "Starting with Docker Compose..."
	@docker compose up

docker-run-detached:
	@docker compose up -d

docker-stop:
	@docker compose down

docker-logs:
	@docker compose logs -f

# ── Binary Release ──────────────────────────────────────────────────────────

install-binary:
	@echo "Downloading latest nats-horizon binary..."
	@bash install.sh

# ── Desktop (Wails) ────────────────────────────────────────────────────────

desktop-dev:
	@echo "Starting desktop app in dev mode..."
	@wails dev

desktop-build:
	@echo "Building desktop app..."
	@wails build

desktop-build-linux-amd64:
	@echo "Building desktop app for Linux amd64..."
	@wails build -platform linux/amd64 -o build/nats-horizon-linux-amd64

desktop-build-linux-arm64:
	@echo "Building desktop app for Linux arm64..."
	@wails build -platform linux/arm64 -o build/nats-horizon-linux-arm64

desktop-build-windows-amd64:
	@echo "Building desktop app for Windows amd64..."
	@wails build -platform windows/amd64 -o build/nats-horizon-windows-amd64.exe

desktop-build-windows-arm64:
	@echo "Building desktop app for Windows arm64..."
	@wails build -platform windows/arm64 -o build/nats-horizon-windows-arm64.exe

desktop-build-darwin-amd64:
	@echo "Building desktop app for macOS amd64..."
	@wails build -platform darwin/amd64 -o build/nats-horizon-darwin-amd64

desktop-build-darwin-arm64:
	@echo "Building desktop app for macOS arm64..."
	@wails build -platform darwin/arm64 -o build/nats-horizon-darwin-arm64

desktop-build-all: desktop-build-linux-amd64 desktop-build-linux-arm64 desktop-build-windows-amd64 desktop-build-windows-arm64 desktop-build-darwin-amd64 desktop-build-darwin-arm64
	@echo "Building all platforms..."
	@mkdir -p dist
	@cd build && zip -r ../dist/nats-horizon-linux-amd64.zip nats-horizon-linux-amd64
	@cd build && zip -r ../dist/nats-horizon-linux-arm64.zip nats-horizon-linux-arm64
	@cd build && zip -r ../dist/nats-horizon-windows-amd64.zip nats-horizon-windows-amd64.exe
	@cd build && zip -r ../dist/nats-horizon-windows-arm64.zip nats-horizon-windows-arm64.exe
	@cd build && zip -r ../dist/nats-horizon-darwin-amd64.zip nats-horizon-darwin-amd64
	@cd build && zip -r ../dist/nats-horizon-darwin-arm64.zip nats-horizon-darwin-arm64
	@echo "All builds complete in dist/"
