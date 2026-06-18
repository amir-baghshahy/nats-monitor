.PHONY: dev dev-backend dev-frontend build clean test fmt deps openapi

# Run both backend and frontend in development
dev:
	@echo "Starting backend and frontend..."
	@make dev-backend & make dev-frontend

# Run Go backend
dev-backend:
	@echo "Starting backend on :3000..."
	@go run cmd/server/main.go

# Run React frontend dev server
dev-frontend:
	@echo "Starting frontend on :5173..."
	@cd web && npm run dev

# Build frontend for production
build-frontend:
	@echo "Building frontend..."
	@cd web && npm run build

# Run backend with built frontend
run:
	@make build-frontend
	@echo "Starting server with built frontend..."
	@go run cmd/server/main.go

# Install dependencies
install:
	@echo "Installing Go dependencies..."
	@go mod download
	@echo "Installing npm dependencies..."
	@cd web && npm install

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf web/dist
	@rm -rf web/node_modules

# Run tests
test:
	@echo "Running tests..."
	@go test ./...

# Format Go code
fmt:
	@echo "Formatting Go code..."
	@go fmt ./...

# Generate Swagger 2.0 and OpenAPI 3.1 specs
openapi:
	@echo "Generating OpenAPI specs..."
	@swag init -g cmd/server/main.go -o api/swagger --parseDependency --parseInternal
	@go run cmd/openapi3gen/main.go

# Download Go dependencies
deps:
	@echo "Downloading Go dependencies..."
	@go mod download
	@go mod tidy
