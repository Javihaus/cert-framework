# CERT Framework - Google Colab Examples

This directory contains Jupyter notebooks optimized for Google Colab.

## Quick Start

Click the badge below to open the quick start notebook in Google Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Javihaus/cert-framework/blob/master/examples/colab/quickstart.ipynb)

## What's Included

- **quickstart.ipynb**: Complete introduction to CERT Framework
  - Installation
  - Basic consistency testing
  - Accuracy validation
  - LangChain integration
  - Semantic comparison

## Running Locally

You can also run these notebooks locally:

```bash
# Install Jupyter
pip install jupyter

# Install CERT Framework
pip install cert-framework[all]

# Start Jupyter
jupyter notebook quickstart.ipynb
```

## Requirements

- Python 3.8+
- cert-framework (installed automatically in the notebook)

## Optional Dependencies

For specific features, install extras:

```bash
# LangChain support
pip install cert-framework[langchain]

# Inspector UI
pip install cert-framework[inspector]

# Everything
pip install cert-framework[all]
```

## Examples Covered

1. **Basic Consistency Testing**
   - Test a simple function
   - Understand consistency scores
   - Interpret results

2. **Variance Detection**
   - Test an inconsistent LLM
   - Automatic diagnosis
   - Actionable suggestions

3. **LangChain Integration**
   - Wrap LangChain chains
   - Add consistency testing
   - Transparent testing

4. **Semantic Comparison**
   - Handle equivalent outputs
   - Custom comparison rules
   - Number normalization

## Next Steps

After completing the quick start:

1. Try with your own LLM
2. Add more test cases
3. Track metrics over time
4. Use the Inspector UI

## Support

- [GitHub Repository](https://github.com/Javihaus/cert-framework)
- [Documentation](https://github.com/Javihaus/cert-framework#readme)
- [Report Issues](https://github.com/Javihaus/cert-framework/issues)
