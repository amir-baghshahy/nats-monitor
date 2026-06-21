# Contributing to nats-monitoring

Thank you for your interest in contributing! This document will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback

## How to Contribute

### Reporting Bugs

Open an issue with:
1. A clear, descriptive title
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details (OS, NATS version, Docker version if applicable)

### Suggesting Features

Open an issue with:
1. A clear description of the problem you're solving
2. Your proposed solution
3. Any alternatives you've considered

### Pull Requests

1. Fork the repo
2. Create a branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests and lint:
   ```bash
   go fmt ./...
   npm run lint
   npm run build
   ```
5. Commit with [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` — new feature
   - `fix:` — bug fix
   - `docs:` — documentation
   - `refactor:` — code change
   - `test:` — adding tests
   - `chore:` — maintenance
6. Push and open a PR

## Development Setup

```bash
git clone https://github.com/amir-baghshahy/nats-monitor.git
cd nats-monitoring
make install
make dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API docs: http://localhost:3000/swagger/index.html

## Commit Message Format

```
type(scope): description

[optional body]
```

Examples:
- `feat(streams): add stream creation wizard`
- `fix(consumer): resolve lag calculation edge case`
- `docs(readme): add installation instructions for Windows`

---



## 🙏 Inspired By

These projects set the standard for what a messaging dashboard should look and feel like:

- [Grafana](https://grafana.com/) — The gold standard for observability dashboards
- [Redpanda Console](https://github.com/redpanda-data/console) — Beautiful Kafka UI, design reference
- [AKHQ](https://akhq.io/) — Comprehensive Kafka management, feature inspiration
- [nats-nui](https://github.com/nats-nui/nui) — Fastest NATS UI, benchmark for performance
- [nats-console](https://github.com/KLogicHQ/nats-console) — Most feature-rich, target to beat on simplicity
