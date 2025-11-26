from setuptools import setup, find_packages
import pathlib
import re

# Get the directory where setup.py is located
here = pathlib.Path(__file__).parent.resolve()

# Read README - use absolute path to handle different working directories
readme_path = here / "README.md"
if readme_path.exists():
    long_description = readme_path.read_text(encoding="utf-8")
else:
    long_description = "EU AI Act Article 15 compliance monitoring for LLM systems"

# Single source of truth for version - read from __init__.py
def get_version():
    init_path = here / "cert" / "__init__.py"
    init_py = init_path.read_text()
    match = re.search(r'^__version__ = ["\']([^"\']+)["\']', init_py, re.M)
    if match:
        return match.group(1)
    raise RuntimeError("Unable to find version string in cert/__init__.py")

setup(
    name="cert-framework",
    version=get_version(),
    author="Javier Marin",
    author_email="info@cert-framework.com",
    description="EU AI Act Article 15 compliance monitoring for LLM systems",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Javihaus/cert-framework",
    project_urls={
        "Bug Tracker": "https://github.com/Javihaus/cert-framework/issues",
        "Documentation": "https://github.com/Javihaus/cert-framework#readme",
        "Source Code": "https://github.com/Javihaus/cert-framework",
    },
    packages=find_packages(exclude=["tests*", "examples*"]),
    keywords=[
        "EU AI Act",
        "Article 15",
        "compliance",
        "LLM monitoring",
        "accuracy",
        "observability",
        "AI regulation",
        "semantic similarity",
        "grounding",
        "hallucination detection",
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Legal Industry",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Quality Assurance",
        "Topic :: Software Development :: Testing",
        "Topic :: System :: Monitoring",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Text Processing :: Linguistic",
    ],
    python_requires=">=3.8",
    install_requires=[
        # Core has ZERO external dependencies - just standard library
        # For evaluation features: pip install cert-framework[evaluation]
    ],
    extras_require={
        # Evaluation features - ML models for accuracy measurement
        "evaluation": [
            "sentence-transformers>=2.2.0,<3.0.0",  # Semantic similarity
            "torch>=1.11.0",  # PyTorch backend
            "transformers>=4.30.0",  # NLI models
            "tiktoken>=0.5.0",  # Tokenization
            "protobuf>=3.20.0",  # Protobuf support
            "numpy>=1.21.0",  # Numerical operations
            "scipy>=1.7.0",  # Scientific computing
        ],
        # LLM Provider integrations
        "anthropic": ["anthropic>=0.18.0"],
        "openai": ["openai>=1.0.0"],
        "google": ["google-generativeai>=0.3.0"],
        # Framework integrations
        "langchain": [
            "langchain>=0.1.0",
            "langchain-core>=0.1.0",
        ],
        "autogen": ["pyautogen>=0.2.0"],
        "crewai": ["crewai>=0.1.0"],
        # Compliance reporting (templates, PDF generation)
        "compliance": [
            "jinja2>=3.0.0",  # Template engine
            "markdown>=3.3.0",  # Markdown to HTML
            "python-docx>=0.8.11",  # Word document generation
            "docxtpl>=0.16.7",  # Word document templating
        ],
        # Observability exports
        "observability": [
            "prometheus-client>=0.19.0",  # Prometheus metrics
        ],
        # Trajectory monitoring (advanced/experimental)
        "trajectory": [
            "torch>=2.0.0",  # PyTorch for model loading
            "transformers>=4.30.0",  # Transformers models
            "matplotlib>=3.5.0",  # Visualization
        ],
        # Coordination monitoring (requires requests for API calls)
        "coordination": [
            "anthropic>=0.18.0",  # Anthropic API
        ],
        # CLI tool
        "cli": [
            "click>=8.0.0",  # CLI framework
        ],
        # Development tools
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",  # Coverage reporting
            "hypothesis>=6.0.0",  # Property-based testing
            "ruff>=0.1.0",  # Linting and formatting
            "mypy>=1.0.0",  # Type checking
            "datasets>=2.0.0",  # For STS-Benchmark validation
            "pandas>=1.3.0",  # For data analysis
            "rapidfuzz>=3.0.0",  # Fuzzy matching
        ],
        # Inspector UI (web-based log viewer)
        "inspector": [
            "flask>=2.0.0",
            "jinja2>=3.0.0",
        ],
        # Jupyter notebook support
        "notebook": [
            "ipython>=7.0.0",
            "ipywidgets>=8.0.0",
        ],
        # All features
        "all": [
            # Evaluation
            "sentence-transformers>=2.2.0,<3.0.0",
            "torch>=2.0.0",
            "transformers>=4.30.0",
            "tiktoken>=0.5.0",
            "protobuf>=3.20.0",
            "numpy>=1.21.0",
            "scipy>=1.7.0",
            # LLM Providers
            "anthropic>=0.18.0",
            "openai>=1.0.0",
            "google-generativeai>=0.3.0",
            # Frameworks
            "langchain>=0.1.0",
            "langchain-core>=0.1.0",
            "pyautogen>=0.2.0",
            "crewai>=0.1.0",
            # Compliance
            "jinja2>=3.0.0",
            "markdown>=3.3.0",
            # Observability
            "prometheus-client>=0.19.0",
            # Trajectory (advanced)
            "matplotlib>=3.5.0",
            # CLI
            "click>=8.0.0",
            # Inspector
            "flask>=2.0.0",
            # Notebook
            "ipython>=7.0.0",
            "ipywidgets>=8.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "cert=cert.cli.main:main",
        ],
    },
    package_data={
        "cert": ["templates/*.html", "static/*"],
    },
    include_package_data=True,
)
