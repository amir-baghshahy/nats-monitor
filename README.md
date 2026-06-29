<div align="center">

# nats-horizon

### 🔵 Modern NATS Monitoring & Management Platform

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.25-blue.svg)](https://go.dev)
[![Wails](https://img.shields.io/badge/Wails-2.0-00B4AB.svg)](https://wails.io)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](Dockerfile)
[![i18n](https://img.shields.io/badge/i18n-6%20languages-blue.svg)]()
[![Stars](https://img.shields.io/github/stars/amir-baghshahy/nats-horizon?style=social)](https://github.com/amir-baghshahy/nats-horizon)

A comprehensive, open-source monitoring and management platform for NATS JetStream infrastructure.

**🌍 6 Languages | 🖥️ Native Desktop | 🔌 Zero Dependencies | 📦 Single Binary**

![Dashboard](docs/images/dashboard.png)

---

| [🚀 Quick Start](#-quick-start) | [📦 Installation](#-installation) | [📊 Features](#-features) | [🖼️ Screenshots](#️-screenshots) | [⚖️ Compare](#️-vs-others) | [🏗️ Architecture](#️-architecture) |

</div>

---

## What is nats-horizon?

NATS is fast. NATS scales well. But managing a production NATS JetStream cluster shouldn't require memorizing CLI flags or running five infrastructure services just to see what's happening.

**nats-horizon** is a **native desktop application** that gives you full observability and control over your NATS JetStream infrastructure:

- **See everything** — Real-time dashboard with live metrics for streams, consumers, KV stores, and cluster health
- **Control everything** — Create, edit, delete, replay, and pause consumers directly from the UI
- **Debug everything** — Message inspector, header viewer, JSON formatter, subject explorer, and audit logs
- **Alert on everything** — Get notified when consumer lag spikes, storage fills up, or any threshold is breached
- **Deploy anywhere** — Native desktop app for Windows, macOS, and Linux. Single binary, zero dependencies.
- **Zero config** — No `.env` files, no complex setup. Just run and configure via the built-in wizard.

### Why we built this

We run NATS JetStream in production. We tried every existing tool and hit the same wall:

- **nats-console** — Powerful, but needs 5 services (PostgreSQL, ClickHouse, Redis, Fastify, Next.js). Overkill for most teams.
- **nats-nui** — Fast and popular, but it's a *browser*, not a *command center*. No alerts, no audit, no history.
- **nats-dashboard** — Beautiful, but read-only. You can watch, but you can't act.

So we built **nats-horizon** — a native desktop app that fits in a single binary with no external dependencies.

---



## 🚀 Quick Start

### Option 1: Run Desktop App ⭐ (Recommended)

Build and run the native desktop application:

```bash
# Clone the repository
git clone https://github.com/amir-baghshahy/nats-horizon.git
cd nats-horizon

# Install dependencies
make install

# Run in development mode (with hot reload)
make dev

# Or build for production
make build
```

The desktop app will open as a native window. No browser needed!

### Option 2: Download Pre-built Binary

Download a pre-built binary for your platform from the [Releases](https://github.com/amir-baghshahy/nats-horizon/releases) page:

- **Windows**: `nats-horizon-windows-amd64.exe`
- **macOS**: `nats-horizon-darwin-amd64` (or `darwin-arm64` for Apple Silicon)
- **Linux**: `nats-horizon-linux-amd64`

### Option 3: Docker Compose (Web Mode)

Zero local dependencies. Starts nats-horizon **and** a JetStream-enabled NATS server automatically.

```bash
git clone https://github.com/amir-baghshahy/nats-horizon.git
cd nats-horizon
docker compose up
```

Open **http://localhost:3000**. Done.

---



## 📦 Installation

### Desktop App (Wails v2)

| Platform | Command |
|----------|---------|
| **Development** | `make dev` |
| **Build** | `make build` |
| **Run** | `./build/nats-horizon` |

#### Requirements

- **Go 1.25+**
- **Node.js 18+** (for frontend build)
- **Wails CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

#### Platform-specific dependencies

**Linux:**
```bash
# Debian/Ubuntu
sudo apt install libgtk-3-dev libwebkit2gtk-4.0-dev

# Fedora
sudo dnf install gtk3-devel webkit2gtk3-devel
```

**macOS:**
- Xcode Command Line Tools

**Windows:**
- WebView2 Runtime (included with Windows 11)

### Web Mode (Docker)

| Method | Time | When to use |
|---|---|---|
| `docker compose up` | 30s | Production, staging, quick demo |
| `helm install` | 1 min | Kubernetes clusters |
| Binary download | 15s | No Docker, want native performance |
| `make dev` | 2 min | Contributing, local changes |

#### Docker Image

```bash
docker build -t nats-horizon .
docker run -p 3000:3000 \
  -e NATS_URL=nats://your-server:4222 \
  --rm nats-horizon
```

#### Kubernetes (Helm)

Deploy to any Kubernetes cluster using the included Helm chart:

```bash
# Build and push your image
docker build -t your-registry/nats-horizon:latest .
docker push your-registry/nats-horizon:latest

# Install the chart
helm install nats-horizon ./helm/nats-horizon \
  --set image.repository=your-registry/nats-horizon \
  --set app.natsUrl="nats://nats.production.svc.cluster.local:4222"
```

Full documentation in [`helm/README.md`](helm/README.md).

### Configuration

| Variable | Default | Description |
|---|---|---|
| `NATS_URL` | `nats://localhost:4222` | NATS server address |
| `PORT` | `3000` | Web server port (web mode only) |
| `CORS_ALLOWED_ORIGINS` | `*` | Allowed CORS origins (web mode only) |
| `GIN_MODE` | `release` | `debug` or `release` |

See `.env.example` for the full list.

---



## ✨ Features

### 🔍 Observability
| | |
|---|---|
| 🔴 **Real-time Dashboard** | Stream stats, consumer health, active connections, instant overview |
| 📈 **System Metrics** | Memory, connections, bandwidth, messages/sec (live streaming via SSE) |
| 🔌 **Cluster Topology** | Node map, cluster health, server info at a glance |
| 📊 **History & Reports** | Usage trends, min/max/avg analysis, 1h/6h/24h/7d windows |

### 🛠️ Management
| | |
|---|---|
| 🛠️ **Stream CRUD** | Create, edit, delete, and purge JetStream streams |
| 👥 **Consumer CRUD** | Full lifecycle: create, update, delete, replay, pause/resume, lag reset |
| 📨 **Message Operations** | Publish, request/reply, browse messages with JSON formatting, export to JSON/CSV |
| 🔑 **KV Store Browser** | Browse buckets, keys, revision history, purge |

### 🚨 Operations
| | |
|---|---|
| 🚨 **Alerting** | Consumer lag, storage thresholds, custom checks. Slack, webhook, PagerDuty ready |
| 📝 **Audit Logs** | Full audit trail of all management actions |
| 🔒 **Security Dashboard** | Users, connections, permissions, compliance status |
| 📤 **Export** | Streams, consumers, messages — all exportable |

### 💻 Developer Experience
| | |
|---|---|
| 🏢 **Multi-tenancy** | Save and switch between multiple NATS connections |
| 📡 **Live Subject Monitor** | Subscribe to subjects, watch traffic in real-time (SSE) |
| 🎯 **Service Discovery** | Active subscriptions, services, core NATS traffic monitor |
| ⚡ **SSE-powered** | Real-time updates without WebSocket overhead |
| 🌍 **Internationalization (i18n)** | 6 languages: English, Persian (فارسی), French (Français), German (Deutsch), Turkish (Türkçe), Arabic (العربية) with RTL support |

---



## 🖼️ Screenshots

### Dashboard Overview

![Dashboard](docs/images/dashboard.png)

### Stream Management

![Streams](docs/images/stream.png)

### Message Browser

![Messages](docs/images/message.png)

### Cluster Topology

![Cluster](docs/images/cluster.png)

### Multi-tenancy

![Tenancy](docs/images/tenancy.png)

---



## ⚖️ Vs. Others

|  | nats-console | nats-nui | nats-dashboard | cobra-nats | **nats-horizon** |
|---|---|---|---|---|---|
| **Backend** | Fastify/Node | Go | None (static) | Next.js | **Go + Gin** |
| **Database** | Postgres + ClickHouse + Redis | None | None | None | **None** |
| **Frontend** | Next.js + shadcn/ui | Static/Nginx | Astro | Next.js + shadcn/ui | **React + Vite + Tailwind** |
| **Deploy** | 🔴 5 services | 🟢 Single | 🟢 Static | 🟡 Node server | **🟢 1 binary** |
| **Streams** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Consumers** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Consumer Replay** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Consumer Pause/Resume** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **KV Store** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Real-time** | WebSocket | WebSocket | ❌ | SSE | **SSE** |
| **Alerting** | ✅ Multi-channel | ❌ | ❌ | ❌ | ✅ |
| **Audit Logs** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Security Dashboard** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **History & Reports** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Multi-tenancy** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Message Export** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Cluster Topology** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **License** | Apache-2.0 | Unlicense | MIT | — | **Apache-2.0** |

### How the competition stacks up

#### nats-console (KLogicHQ) — The "Enterprise" Choice
Feature-complete with ClickHouse time-series, dashboard builder, Slack/PagerDuty alerts, and multi-cluster support. But you're managing **five services** — PostgreSQL, ClickHouse, Redis, Fastify, and Next.js. Great if you have a dedicated platform team. Overkill if you want one binary.

**What nats-horizon does better**: Zero-database deployment. Same core alerting, multi-tenancy, and cluster topology — without the operational overhead.

#### nats-nui (589 ⭐) — The "Popular" Choice
Fast, clean, truly open-source (Unlicense). But it's fundamentally a **browser**, not a **command center**. Missing alerts, audit logs, security dashboards, history reports, consumer replay/pause, and multi-tenancy.

**What nats-horizon does better**: Complete observability: alerts, audit trails, history, and security — everything needed for production operations.

#### nats-dashboard (213 ⭐) — The "Monitor"
Beautiful read-only monitoring surface. No backend, just a static app hitting the NATS monitoring endpoint. Can watch, but can't manage: no CRUD, no KV store, no consumer ops, no alerts.

**What nats-horizon does better**: Not just watching — acting. Real-time metrics + full management plane in one cohesive tool.

#### cobra-nats — The "Newcomer"
Modern Next.js 16 + shadcn/ui stack. Object Store support, command palette, dark mode. Only 1 ⭐, no alerting, no audit, requires Node.js.

**What nats-horizon does better**: Go backend performance, mature feature depth, zero Node dependency.

---

## 🏗️ Architecture

### Desktop Mode (Wails v2)

```
┌─────────────────────────────────────────────────────────────┐
│                   nats-horizon Desktop App                  │
│                   (Wails v2 + WebView2)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React Frontend (Vite + Tailwind)        │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ │   │
│  │  │  Dashboard  │ │   Streams    │ │  Consumers  │ │   │
│  │  └─────────────┘ └──────────────┘ └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                    Wails Runtime Bridge                     │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Go Backend (Gin + NATS)                 │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ │   │
│  │  │   REST      │ │   SSE Hub    │ │   Use Cases │ │   │
│  │  │   Handlers  │ │   (events)   │ │   Layer     │ │   │
│  │  └─────────────┘ └──────────────┘ └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    NATS Server                               │
│                   (JetStream enabled)                        │
└──────────────────────────────────────────────────────────────┘
```

### Web Mode (Docker)

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                            │
│                  http://localhost:3000                       │
└──────────────────────────┬──────────────────────────────────┘
                           │  REST API  │  SSE (events)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  nats-horizon Server                        │
│                    (Go 1.25 + Gin)                          │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │   REST      │ │   SSE Hub    │ │   Static Assets    │  │
│  │   Handlers  │ │   (events)   │ │   (React build)    │  │
│  │  └──────┬──────┘ └──────┬───────┘ └────────────────────┘  │
│  │         │                │                                  │
│  │  ┌──────▼────────────────▼──────┐                          │
│  │  │     Use Cases Layer          │                          │
│  │  │  (Stream / Consumer / KV /  │                          │
│  │  │   Messages / Metrics / ...) │                          │
│  │  └──────────────┬──────────────┘                          │
│  │                 │                                         │
│  │  ┌──────────────▼──────────────┐                          │
│  │  │     NATS Go Client          │                          │
│  │  │     (nats.go v1.x)          │                          │
│  │  └──────────────┬──────────────┘                          │
│  └─────────────────┼─────────────────────────────────────────┘
│                    │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    NATS Server                               │
│                   (JetStream enabled)                        │
└──────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Desktop Framework** | Wails v2 | Native desktop apps with Go + web frontend |
| **Backend** | Go 1.25 + Gin | Single binary, minimal memory (~15MB), fast compile |
| **Frontend** | React 18 + Vite + TailwindCSS | Fast dev, small bundle, modern DX |
| **Charts** | Recharts | Responsive, composable, no bloat |
| **Data Fetching** | TanStack Query (v5) | Caching, refetch, optimistic updates |
| **Real-time** | Server-Sent Events (SSE) | Simpler than WebSocket, auto-reconnect, perfect for server→client streams |
| **Icons** | Lucide React | Tree-shakeable, consistent design |
| **API Docs** | Swagger / OpenAPI | Auto-generated, interactive |
| **Docker** | Multi-stage | Frontend builds inside backend builder; final image is ~28MB Alpine |
| **i18n** | react-i18next | 6 languages with RTL support (Persian, Arabic) |

### Why Go + SSE?

We chose Go for the backend because:
- **Single binary** — no runtime dependencies, just copy and run
- **Low memory** — ~15MB idle, compared to 200MB+ for Node.js
- **Fast** — NATS client is native Go, minimal GIL concerns

We chose **SSE over WebSocket** because:
- **Simpler protocol** — uses plain HTTP, no framing overhead
- **Auto-reconnect** — browsers handle SSE reconnection natively
- **Firewall-friendly** — works through most corporate proxies
- **Perfect fit** — server→client streaming (metrics, logs, events) is all we need; no client→server streaming required

---




## 🔌 NATS Compatibility

### Supported NATS Versions

| NATS Server Version | Supported | Notes |
|---------------------|-----------|-------|
| 2.10.x | ✅ Yes | Fully tested and compatible |
| 2.9.x | ✅ Yes | Compatible (JetStream features required) |
| 2.8.x | ⚠️ Partial | Basic monitoring works, some JetStream features may be limited |
| < 2.8 | ❌ No | Not supported, missing critical JetStream APIs |

**Minimum Required:** NATS Server 2.8.0 with JetStream enabled  
**Recommended:** NATS Server 2.10.x or later

### Client Libraries

- **nats.go**: v1.52.0
- **Go**: 1.25.0

### Tested Configurations

| Configuration | Status |
|----------------|--------|
| Single-node NATS with JetStream | ✅ |
| NATS Cluster (3-node) with JetStream | ✅ |
| TLS-enabled connections | ✅ |
| Username/Password authentication | ✅ |
| NKEYS authentication | ✅ |
| JWT-based authentication | ✅ |

For detailed security information, see [SECURITY.md](SECURITY.md).

---

## 🚧 Roadmap

- [x] Real-time dashboard with SSE
- [x] Stream/consumer management (CRUD)
- [x] Consumer replay, pause, resume, lag reset
- [x] KV Store browser with history
- [x] Alerting engine
- [x] Audit logs & security dashboard
- [x] Multi-tenancy (multiple saved connections)
- [x] Export streams, consumers, messages
- [x] History & usage analysis
- [x] Cluster topology
- [x] Native desktop app (Wails v2)
- [x] Internationalization (i18n) with 6 languages
- [x] RTL support for Persian and Arabic
- [ ] Consumer-based message inspection deep-dive
- [x] Kubernetes Helm chart
- [ ] Object Store browser

---



## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
git clone https://github.com/amir-baghshahy/nats-horizon.git
cd nats-horizon
make install
make dev
```

We use:
- **Go 1.25** — `go fmt ./...` before committing
- **React 18 + Vite** — `npm run lint` and `npm run build` before PRs
- **Conventional Commits** — `feat:`, `fix:`, `docs:`, etc.

---



## 📄 License

Apache 2.0 — see [LICENSE](LICENSE) for details.

---



## 🙏 Inspired By

These projects set the standard for what a messaging dashboard should look and feel like:

- [Grafana](https://grafana.com/) — The gold standard for observability dashboards
- [Redpanda Console](https://github.com/redpanda-data/console) — Beautiful Kafka UI, design reference
- [AKHQ](https://akhq.io/) — Comprehensive Kafka management, feature inspiration
- [nats-nui](https://github.com/nats-nui/nui) — Fastest NATS UI, benchmark for performance
- [nats-console](https://github.com/KLogicHQ/nats-console) — Most feature-rich, target to beat on simplicity
