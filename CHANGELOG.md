# Changelog

All notable changes to CERT Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2025-10-29

### Major Architecture Overhaul

This release represents a fundamental redesign of CERT Framework with a focus on modularity, performance, and developer experience.

### Added

#### Core Features
- **New `@trace` decorator**: Lightweight monitoring with zero external dependencies (<1ms overhead)
- **Offline evaluation**: `Evaluator` class for batch processing trace logs
- **CLI tools**: Complete command-line interface for evaluation and reporting
  - `cert evaluate` - Evaluate traces offline
  - `cert report` - Generate compliance reports
  - `cert logs` - View trace logs
  - `cert stats` - Show aggregate statistics
- **Lazy model loading**: ML models load only when needed, improving cold start time
- **Result caching**: LRU cache for repeated evaluations (significant performance improvement)

#### New Modules
- `cert.core.tracer`: Zero-dependency tracer with JSONL logging
- `cert.evaluation.evaluator`: Offline evaluation engine
- `cert.evaluation.engines`: Lazy model loading with singleton pattern
- `cert.evaluation.cache`: Caching utilities for improved performance
- `cert.compliance.reporter`: Class-based compliance report generator
- `cert.cli.main`: Click-based CLI tool

#### Documentation
- Complete migration guide (docs/migration-v2-to-v3.md)
- Updated README with new positioning ("Langfuse for EU AI Act Compliance")
- New examples demonstrating trace API

### Changed

#### Breaking Changes
- **Dependencies now optional**: Core package has zero external dependencies
  - Install extras as needed: `[evaluation]`, `[cli]`, `[compliance]`, etc.
  - Package size reduced from ~1.5GB to ~5MB for core
- **`@monitor` deprecated**: Use `@trace` for monitoring
  - `@monitor` still works but issues deprecation warning
  - Evaluation should be done offline with `Evaluator` class or CLI
- **Evaluation architecture**: Moved from runtime to offline batch processing
  - Runtime overhead reduced from ~100ms+ to <1ms
  - Evaluation runs on your schedule (hourly, daily, on-demand)
- **CLI restructured**: New CLI based on Click framework
  - Old `cert-compare` command removed
  - Replaced with `cert evaluate`, `cert report`, `cert logs`, `cert stats`

#### setup.py Changes
- Moved all ML dependencies to `extras_require`
- New extras categories:
  - `evaluation`: ML models for accuracy measurement
  - `cli`: Click for command-line tools
  - `compliance`: Report generation tools
  - `anthropic`, `openai`, `google`: LLM provider integrations
  - `langchain`, `autogen`, `crewai`: Framework integrations
  - `observability`, `trajectory`, `inspector`: Advanced features
  - `all`: Everything

#### Performance Improvements
- **Cold start**: Instant for core, 2-5s for evaluation (was always 2-5s)
- **Runtime overhead**: <1ms for tracing (was ~100ms+ for monitoring)
- **Throughput**: >1000 traces/s for logging, ~30-50 traces/s for evaluation
- **Memory usage**: <100MB without evaluation, ~600MB with models loaded

### Deprecated

- `@monitor` decorator: Use `@trace` for monitoring, `Evaluator` for evaluation
- Old `cert-compare` CLI command: Use `cert evaluate` instead
- Runtime evaluation: Use offline evaluation with CLI or `Evaluator` class

### Removed

- No functionality removed, but heavy dependencies moved to optional extras
- Old CLI commands replaced with new Click-based CLI

### Fixed

- Import errors when using core package without evaluation dependencies
- Thread safety issues in model loading (now uses singleton pattern)
- Memory leaks in long-running monitoring (now with proper model caching)

### Security

- All data processing now local by default (no external API calls for core functionality)
- Audit trail immutability improved with structured JSONL format
- Better error handling and logging for security-sensitive operations

---

## [3.x.x] - Previous Versions

See git history for changes in v3.x releases.

---

## Migration Guide

For detailed migration instructions from v2.x/v3.x to v4.0, see [docs/migration-v2-to-v3.md](docs/migration-v2-to-v3.md).

### Quick Migration

```bash
# Update installation
pip install --upgrade cert-framework[evaluation,cli]

# Update code
# Old:
from cert import monitor
@monitor(preset="financial")

# New:
from cert import trace
@trace()
```

---

## Upgrade Notes

### For Existing Users

**If you're using `@monitor`:**
1. It still works (with deprecation warning)
2. Consider migrating to `@trace` + offline evaluation
3. Benefits: Better performance, smaller installation, clearer architecture

**If you're generating compliance reports:**
1. Old `export_report()` still works
2. New CLI is more powerful: `cert report traces.jsonl -o report.pdf`
3. Benefits: Better formatting, evaluation integration, CLI automation

**If you have large installations:**
1. Core package now only ~5MB (was ~1.5GB)
2. Install extras only when needed
3. Benefits: Faster deployments, smaller Docker images, reduced attack surface

### For New Users

Start with the lightweight core:
```bash
pip install cert-framework
```

Add evaluation when needed:
```bash
pip install cert-framework[evaluation,cli]
```

---

## Feedback and Issues

- Report bugs: https://github.com/Javihaus/cert-framework/issues
- Discuss features: https://github.com/Javihaus/cert-framework/discussions
- Email: info@cert-framework.com
