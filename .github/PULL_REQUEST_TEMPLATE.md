# Pull Request

## Description

<!-- Provide a clear description of what this PR does -->

## Type of Change

- [ ] 🔌 New connector
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 📚 Documentation
- [ ] 🧪 Tests
- [ ] ♻️ Refactoring
- [ ] ⚡ Performance improvement

## Related Issues

Closes #(issue number)

## Changes Made

<!-- List the specific changes made -->

-
-
-

## Connector Checklist

<!-- If this is a new connector, complete this checklist -->

- [ ] Connector file created in `cert/integrations/`
- [ ] Inherits from `ConnectorAdapter`
- [ ] Implements `activate()`, `extract_metadata()`, `calculate_cost()`
- [ ] Registered with `@register_connector`
- [ ] Test file created in `tests/integration/`
- [ ] All tests pass
- [ ] Error isolation verified (doesn't break user code)
- [ ] Performance acceptable (< 5ms overhead)
- [ ] Documentation updated
- [ ] Pricing table included

## Testing

**Tests added/updated:**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests

**Test coverage:**
```bash
# Paste output of: pytest --cov=cert --cov-report=term-missing
```

**Manual testing performed:**
<!-- Describe manual testing done -->

## Code Quality

- [ ] Code formatted with `black`
- [ ] Linting passes (`ruff check`)
- [ ] Type hints added (`mypy`)
- [ ] Docstrings complete (Google style)
- [ ] No debugging code left in

## Documentation

- [ ] README updated (if needed)
- [ ] CONNECTOR_DEVELOPMENT_GUIDE updated (if connector)
- [ ] Inline code comments added for complex logic
- [ ] Examples provided (if new feature)

## Breaking Changes

<!-- List any breaking changes, or write "None" -->

## Screenshots/Examples

<!-- If applicable, add screenshots or example output -->

```python
# Example usage
```

## Performance Impact

<!-- Describe performance impact, if any -->

- Overhead measured: ___ ms
- Memory impact: ___
- Benchmark results: ___

## Checklist

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
- [ ] Any dependent changes have been merged

## Additional Notes

<!-- Any additional information that reviewers should know -->
