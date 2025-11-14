# Contributing to CERT Framework

Thank you for your interest in contributing to CERT! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Connector Contributions](#connector-contributions)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

---

## Code of Conduct

See [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)

---

## How to Contribute

### Types of Contributions

We welcome:

1. **🔌 New Connectors** - Add support for new AI/LLM platforms
2. **🐛 Bug Fixes** - Fix issues in existing connectors or core
3. **📚 Documentation** - Improve guides, examples, API docs
4. **✨ Features** - Enhance existing functionality
5. **🧪 Tests** - Improve test coverage

### First-Time Contributors

Look for issues labeled `good-first-issue`:
- Simple connector additions
- Documentation improvements
- Test coverage gaps

---

## Development Setup

### Prerequisites

- Python 3.8+
- pip
- git

### Local Setup

```bash
# Clone the repository
git clone https://github.com/Javihaus/cert-framework.git
cd cert-framework

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install

# Run tests
pytest
```

### Development Dependencies

```bash
pip install -e ".[dev]"
```

This installs:
- `pytest` - Testing framework
- `black` - Code formatter
- `ruff` - Linter
- `mypy` - Type checker
- `pre-commit` - Git hooks

---

## Connector Contributions

### Quick Start

See the comprehensive [Connector Development Guide](./CONNECTOR_DEVELOPMENT_GUIDE.md).

### Checklist

Before submitting a connector PR:

- [ ] Connector file created in `cert/integrations/`
- [ ] Tests created in `tests/integration/`
- [ ] All tests pass (`pytest tests/integration/test_your_connector.py`)
- [ ] Code formatted (`black cert/integrations/your_connector.py`)
- [ ] Linting passes (`ruff check cert/integrations/your_connector.py`)
- [ ] Type hints added (`mypy cert/integrations/your_connector.py`)
- [ ] Docstrings complete (Google style)
- [ ] Performance acceptable (< 5ms overhead)
- [ ] Error isolation verified

### Testing

```bash
# Run all tests
pytest

# Run specific connector tests
pytest tests/integration/test_your_connector.py -v

# Run with coverage
pytest --cov=cert --cov-report=html

# Check performance
pytest tests/integration/test_your_connector.py::TestYourConnector::test_overhead_acceptable
```

---

## Code Standards

### Style Guide

We follow PEP 8 with these settings:

- **Line length:** 100 characters
- **Formatter:** Black
- **Linter:** Ruff
- **Type checker:** MyPy (strict mode)

### Type Hints

All public functions must have type hints:

```python
def calculate_cost(
    self,
    model: str,
    input_tokens: int,
    output_tokens: int
) -> Optional[float]:
    """Calculate cost in USD."""
    ...
```

### Docstrings

Use Google-style docstrings:

```python
def extract_metadata(self, call_data: Any) -> Dict[str, Any]:
    """
    Extract platform-specific metadata.

    Args:
        call_data: Platform response object

    Returns:
        Dictionary of metadata key-value pairs

    Example:
        >>> metadata = connector.extract_metadata(response)
        >>> print(metadata["tokens"])
        150
    """
    ...
```

### Error Handling

**Critical:** Connectors must NEVER break user code:

```python
try:
    self.log_call(traced_call)
    self.failure_count = 0
except Exception as e:
    self.failure_count += 1
    if self.failure_count >= self.max_failures:
        self.enabled = False
        logger.error(f"Connector disabled: {e}")
    # DON'T re-raise - isolate the error
```

### Logging

Use structured logging:

```python
import logging

logger = logging.getLogger(__name__)

# Log levels
logger.debug("Detailed diagnostic info")
logger.info("Important state changes")
logger.warning("Recoverable issues")
logger.error("Errors that should be investigated")
```

---

## Pull Request Process

### 1. Fork & Branch

```bash
# Fork the repo on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/cert-framework.git

# Create feature branch
git checkout -b feature/add-cohere-connector
```

### 2. Make Changes

- Write code
- Add tests
- Update documentation

### 3. Test Locally

```bash
# Format code
black cert/ tests/

# Run linter
ruff check cert/ tests/

# Type check
mypy cert/

# Run tests
pytest

# Check coverage
pytest --cov=cert --cov-report=term-missing
```

### 4. Commit

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(connectors): add Cohere API connector

- Implement CoherConnector with API intercept pattern
- Add comprehensive test suite
- Include cost calculation
- Document in connector guide

Closes #123"
```

Commit types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvement

### 5. Push & Create PR

```bash
git push origin feature/add-cohere-connector
```

Create PR on GitHub with our template.

### 6. Review Process

- **Automated checks:** Must pass CI/CD
- **Code review:** Maintainer reviews within 48 hours
- **Changes requested:** Address feedback
- **Approval:** 1 maintainer approval required
- **Merge:** Squash and merge to main

---

## Testing Standards

### Test Coverage Requirements

- **Core modules:** > 90% coverage
- **Connectors:** > 70% coverage
- **Overall:** > 80% coverage

### Test Types

**Unit Tests:**
```python
def test_cost_calculation():
    """Test cost calculation logic."""
    cost = calculate_cost("gpt-4", 1000, 500)
    assert cost == 0.045
```

**Integration Tests:**
```python
def test_connector_traces_call():
    """Test that connector captures calls."""
    connector = MyConnector(tracer)
    connector.activate()

    # Make API call
    response = client.complete(prompt="test")

    # Verify trace
    traces = tracer.get_traces()
    assert len(traces) == 1
    assert traces[0]["platform"] == "my_platform"
```

**Performance Tests:**
```python
def test_overhead_acceptable():
    """Verify connector overhead < 5ms."""
    import time

    start = time.perf_counter()
    # Make call with connector
    duration_ms = (time.perf_counter() - start) * 1000

    assert duration_ms < 5
```

---

## Documentation Standards

### Code Documentation

- All public functions have docstrings
- Complex logic has inline comments
- Examples included in docstrings

### User Documentation

When adding features, update:
- README.md - If user-facing
- CONNECTOR_DEVELOPMENT_GUIDE.md - If connector-related
- API documentation - For new public APIs

### Examples

Provide working examples:

```python
# examples/my_feature_example.py
"""
Example of using the new feature.
"""
from cert import MyFeature

feature = MyFeature()
result = feature.do_something()
print(result)
```

---

## Release Process

(For maintainers)

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in `setup.py`
- [ ] Git tag created
- [ ] PyPI release published
- [ ] GitHub release created

---

## Community

### Communication Channels

- **GitHub Discussions:** General questions, feature requests
- **GitHub Issues:** Bug reports, specific problems
- **Pull Requests:** Code contributions

### Response Times

- **Issues:** Triaged within 24 hours
- **Pull Requests:** Reviewed within 48 hours
- **Discussions:** Responded to within 72 hours

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project README

### Bounty Program

We offer bounties for high-priority connectors. See [WANTED_CONNECTORS.md](./WANTED_CONNECTORS.md).

---

## Questions?

- Read the [Connector Development Guide](./CONNECTOR_DEVELOPMENT_GUIDE.md)
- Check [existing issues](https://github.com/Javihaus/cert-framework/issues)
- Ask in [Discussions](https://github.com/Javihaus/cert-framework/discussions)
- Email: hello@cert-framework.com

Thank you for contributing! 🎉
