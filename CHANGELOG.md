# Changelog

All notable changes to the CERT Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-XX

### Added

#### Agentic Benchmarking Module (`cert.benchmark`)

**Major new feature**: Comprehensive benchmarking framework for comparing language models across multiple providers.

- **Provider Support**: Anthropic Claude, OpenAI GPT, Google Gemini, xAI Grok
- **Core Metrics**:
  - **Consistency**: Behavioral reliability across multiple trials using semantic embeddings
  - **Performance**: Output quality assessment across diverse prompts
  - **Latency**: Response time analysis including P50/P95/P99 percentiles and throughput
  - **Output Quality**: Length, semantic diversity, and repetition pattern analysis
  - **Robustness**: Error rate, timeout tracking, and exception classification

- **Pluggable Architecture**:
  - `MetricBase` abstract class for custom metric development
  - `MetricRegistry` for dynamic metric registration
  - `ProviderInterface` for adding new LLM providers

- **Configuration System**:
  - `BenchmarkConfig` dataclass with validation
  - Configurable trial counts, prompts, and enabled metrics
  - Random seed support for reproducibility

- **Results & Export**:
  - Structured result dataclasses for all metrics
  - `BenchmarkSummary` aggregating all results with metadata
  - JSON/CSV export capabilities
  - Timestamped results for longitudinal analysis

#### New Components

- `cert.benchmark.CERTBenchmarkEngine`: Main orchestration engine
- `cert.benchmark.providers`: Provider implementations (Anthropic, OpenAI, Google, xAI)
- `cert.benchmark.metrics`: Pluggable metric system with 5 core metrics
- `cert.benchmark.config.BenchmarkConfig`: Configuration management
- `cert.benchmark.types`: Result dataclasses for all metrics

#### Examples & Documentation

- `examples/benchmark_llm_providers.py`: Complete benchmarking example
- Documentation on pluggable architecture and custom metrics

### Changed

- **Version bump**: 0.3.1 → 1.1.0
- **Package description**: Updated to reflect dual capabilities (RAG testing + benchmarking)
- **Dependencies**:
  - Added `scipy>=1.7.0` for statistical analysis
  - New optional dependency group `benchmark` with provider SDKs

### Enhanced

- Existing RAG/hallucination detection features remain unchanged and fully compatible
- `cert.compare()` and `cert.TestRunner` APIs unchanged (backward compatible)

### Installation

```bash
# Core installation (RAG testing only)
pip install cert-framework

# With benchmarking capabilities
pip install cert-framework[benchmark]

# Full installation
pip install cert-framework[all]
```

### Breaking Changes

**None** - This release is fully backward compatible with v0.3.1.

### Migration Guide

No migration required. Existing code using `cert` for RAG testing continues to work unchanged.

New benchmarking functionality is accessed via the `cert.benchmark` subpackage:

```python
# Existing RAG testing (unchanged)
from cert import compare, TestRunner

# New benchmarking (v1.1.0+)
from cert.benchmark import BenchmarkConfig, CERTBenchmarkEngine
```

### Known Limitations

- Benchmark module requires provider API keys (Anthropic, OpenAI, Google, xAI)
- Coordination and Cost metrics defined but not yet fully implemented
- Advanced statistics metrics (CV, skewness, kurtosis) defined but not integrated into engine

### Roadmap

Future releases will include:
- Advanced statistical metrics implementation
- Cost tracking integration with provider APIs
- Coordination/multi-agent metrics
- Web-based visualization dashboard
- CI/CD integration examples

---

## [0.3.1] - 2024-10-XX

### Fixed
- Minor bug fixes and stability improvements

## [0.3.0] - 2024-10-XX

### Added
- NLI-based contradiction detection
- Production energy scorer
- Improved hallucination detection

## [0.2.0] - 2024-09-XX

### Added
- Initial RAG testing capabilities
- Semantic comparison with embeddings
- TestRunner framework

## [0.1.0] - 2024-08-XX

### Added
- Initial release
- Basic consistency testing
- Simple semantic comparison
