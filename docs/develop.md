# Development Progress

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Done |
| 🔧 | In Progress |
| 📋 | Planned |
| ❌ | Blocked / Deferred |

---

## Phase 1: Core Observability ✅

| Task | Status | Notes |
|---|---|---|
| Real-time dashboard (SSE) | ✅ | Live stream/consumer/cluster stats |
| Stream CRUD | ✅ | Create, edit, delete, purge |
| Consumer CRUD | ✅ | Create, update, delete |
| Consumer replay/pause/resume | ✅ | Full consumer lifecycle |
| KV Store browser | ✅ | Buckets, keys, revisions |
| System metrics (SSE) | ✅ | Memory, connections, bandwidth |
| Cluster topology | ✅ | Node map, health overview |

## Phase 2: Operations & Management ✅

| Task | Status | Notes |
|---|---|---|
| Alerting engine | ✅ | Consumer lag, storage thresholds |
| Webhook/Slack/PagerDuty alerts | ✅ | Multi-channel notification |
| Audit logs | ✅ | Full action trail |
| Security dashboard | ✅ | Users, connections, permissions |
| Multi-tenancy | ✅ | Multiple saved NATS connections |
| Message export (JSON/CSV) | ✅ | Streams, consumers, messages |
| History & usage reports | ✅ | 1h/6h/24h/7d analysis |

## Phase 3: Developer Experience ✅

| Task | Status | Notes |
|---|---|---|
| Message browser | ✅ | JSON formatting, headers |
| Live subject monitor | ✅ | SSE-based real-time subscription |
| Service discovery | ✅ | Active subscriptions, services |
| Swagger/OpenAPI docs | ✅ | Auto-generated, interactive |
| Smart port selection | ✅ | Auto-finds free port |

## Phase 4: Desktop App (Wails) 🔧

### 4.1 Project Setup

| Task | Status | Notes |
|---|---|---|
| Install Wails CLI | ✅ | `wails v2.12.0` installed |
| Verify Linux prerequisites | ✅ | `webkit2gtk-4.1` on Arch Linux |
| Add `wails.json` config | ✅ | `web/wails.json` |
| Add Wails Go dependency | ✅ | `github.com/wailsapp/wails/v2 v2.12.0` |

### 4.2 Desktop Entry Point & Lifecycle

| Task | Status | Notes |
|---|---|---|
| Create `main.go` (project root) | ✅ | Wails app bootstrap, window config (1280x800), frontend dist resolution |
| Create `desktop/app.go` | ✅ | App struct, StartUp/ShutDown lifecycle, NATS connection with retry |
| Create `desktop/converters.go` | ✅ | Model→DTO converters for streams and consumers |
| Wire NATS connection on startup | ✅ | Direct NATS connect with retry, reconnect, ping config |
| Graceful shutdown | ✅ | Closes NATS conn on app quit via ShutDown |

### 4.3 Go Bindings (Backend → Frontend RPC)

| Task | Status | Notes |
|---|---|---|
| Stream bindings | ✅ | `GetStreams`, `GetStream`, `CreateStream`, `DeleteStream`, `PurgeStream` |
| Consumer bindings | ✅ | `GetConsumers`, `GetAllConsumers`, `GetConsumer`, `DeleteConsumer`, `PauseConsumer`, `ResumeConsumer` |
| Message bindings | ✅ | `GetMessages`, `PublishMessage` |
| KV Store bindings | ✅ | `GetKVBuckets`, `GetKVKeys` |
| Dashboard bindings | ✅ | `GetDashboardStats`, `GetServerInfo` |
| Cluster bindings | ✅ | `GetClusterInfo` |
| System metrics bindings | ✅ | `GetSystemMetrics` |
| Connection bindings | ✅ | `GetConnections` |
| Security bindings | ✅ | `GetSecurityInfo` |
| Subject bindings | ✅ | `GetSubjects` |
| History bindings | ✅ | `GetHistory` |
| Alert bindings | ✅ | `GetAlerts` (stub — in-memory handler needs refactoring) |
| Connection switching | ✅ | `SetNATSURL`, `GetNATSURL`, `IsConnected` |

### 4.4 Frontend API Adapter

| Task | Status | Notes |
|---|---|---|
| Create `web/src/adapters/desktop.ts` | 📋 | Wails binding adapter — calls Go methods via `window.go.main.App.*` |
| Create `web/src/adapters/web.ts` | 📋 | REST/SSE adapter — existing behavior (axios/fetch to `/api/*`) |
| Create `web/src/adapters/index.ts` | 📋 | Adapter factory — detects runtime (desktop vs web) and exports correct adapter |
| Create `web/src/types/api.ts` | 📋 | Shared API interface types for both adapters |
| Refactor pages to use adapter | 📋 | Replace direct axios/fetch calls with adapter methods |
| Refactor SSE hook for desktop | 📋 | In desktop mode, use Wails events instead of EventSource |

### 4.5 Desktop Window & UI

| Task | Status | Notes |
|---|---|---|
| Configure window properties | ✅ | Title "nats-horizon", 1280x800, min 900x600 |
| Add app icon | 📋 | PNG/SVG icon for taskbar/dock |
| Desktop settings dialog | 📋 | NATS URL config, saved to `~/.config/nats-horizon/config.json` |
| Window title with connection info | 📋 | Show connected NATS server in title bar |

### 4.6 Build & Distribution

| Task | Status | Notes |
|---|---|---|
| Add Makefile targets | ✅ | `desktop-dev`, `desktop-build`, `desktop-build-linux-amd64`, `desktop-build-linux-arm64` |
| Add `webkit2_41` build tag | ✅ | Required for Arch Linux (webkit2gtk-4.1) |
| Build for Linux amd64 | ✅ | `wails build -platform linux/amd64` |
| Build for Linux arm64 | 📋 | `wails build -platform linux/arm64` |
| AppImage packaging | 📋 | Use appimagetool post-build |
| .deb packaging | 📋 | Use nfpm or dpkg-deb |
| .rpm packaging | 📋 | Use nfpm |

### 4.7 Testing

| Task | Status | Notes |
|---|---|---|
| Desktop smoke test | 📋 | App launches, connects to NATS, shows dashboard |
| Desktop E2E tests | 📋 | Full flow: connect, browse streams, manage consumers |
| Cross-distro test | 📋 | Ubuntu, Fedora, Arch — verify WebKitGTK compat |

## Phase 5: Remaining Features 📋

| Task | Status | Notes |
|---|---|---|
| Consumer-based message inspection deep-dive | 📋 | Advanced message tracing |
| Object Store browser | 📋 | Similar to KV store browser |

---

## Changelog

### 2026-06-22

- Started desktop app packaging with Wails
- Created desktop-packaging.md and develop.md docs
- Detailed Phase 4 tasks (7 sub-phases, 40+ tasks)
- Implemented Wails desktop shell:
  - `main.go` (project root) — Wails entry point with window config and frontend dist resolution
  - `desktop/app.go` — App struct with StartUp/ShutDown lifecycle, NATS connection management
  - `desktop/converters.go` — Model→DTO converters for streams and consumers
  - `wails.json` (project root) — Wails config with `webkit2_41` build tag for Arch Linux
  - Makefile targets: `desktop-dev`, `desktop-build`, `desktop-build-linux-amd64`, `desktop-build-linux-arm64`
  - 15+ Go bindings: streams, consumers, messages, KV, dashboard, cluster, metrics, connections, security, subjects, history, alerts
  - Verified: `wails dev` and `wails build` work, 11MB binary, starts without NATS (non-fatal connection)
