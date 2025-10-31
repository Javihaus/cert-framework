# Changelog

## [Unreleased]

### Changed
- **BREAKING:** NLI component now disabled by default in `measure()` function
  - Based on empirical validation showing NLI produced constant scores (no discrimination)
  - Default configuration now uses semantic similarity (weight=0.5) + grounding (weight=0.5)
  - Empirically validated with ROC AUC=0.961 on SQuAD v2 benchmark
  - Users can still enable NLI explicitly with `use_nli=True` if needed

### Added
- Input validation for text length (max 10,000 characters)
  - Clear error messages when texts exceed model limits
  - Prevents cryptic errors from deep in model code
- Comprehensive test suite for `measure()` function
  - Tests for default configuration
  - Tests for input validation
  - Tests for component enable/disable
  - Tests for weight normalization
  - 95%+ coverage of measure.py

### Fixed
- Improved error messages when required packages are missing
  - Now shows multiple installation options
  - Chains exceptions properly with `from e` for better debugging

### Documentation
- Updated `measure()` docstring to reflect new defaults
- Added "Defaults" section explaining empirically validated configuration
- Updated examples to show recommended usage patterns
- Added detailed implementation notes in IMPLEMENTATION_PLAN.md
