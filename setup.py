from setuptools import setup, find_packages
import pathlib
import re

# Read README
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

# Single source of truth for version - read from __init__.py
def get_version():
    init_py = pathlib.Path("cert/__init__.py").read_text()
    match = re.search(r'^__version__ = ["\']([^"\']+)["\']', init_py, re.M)
    if match:
        return match.group(1)
    raise RuntimeError("Unable to find version string in cert/__init__.py")

setup(
    name="cert-framework",
    version=get_version(),
    author="Javier Marin",
    author_email="info@cert-framework.com",
    description="A framework to test your LLM application for reliability",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Javihaus/cert-framework",
    project_urls={
        "Bug Tracker": "https://github.com/Javihaus/cert-framework/issues",
        "Documentation": "https://github.com/Javihaus/cert-framework#readme",
        "Source Code": "https://github.com/Javihaus/cert-framework",
    },
    packages=find_packages(exclude=["tests*", "examples*"]),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Testing",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Text Processing :: Linguistic",
    ],
    python_requires=">=3.8",
    install_requires=[
        # Core ML dependencies
        "sentence-transformers>=2.2.0,<3.0.0",  # Semantic comparison
        "torch>=1.11.0",  # PyTorch for embeddings and NLI
        "transformers>=4.30.0",  # NLI models for hallucination detection
        "numpy>=1.21.0",  # Numerical operations
        "scipy>=1.7.0",  # Scientific computing for metrics
        "typing-extensions>=4.0.0",  # Type hints for older Python
        # LLM Provider SDKs (for agents)
        "anthropic>=0.18.0",  # Anthropic Claude API
        "openai>=1.0.0",  # OpenAI GPT API (also used by xAI)
        "google-generativeai>=0.3.0",  # Google Gemini API
        # Agentic Frameworks
        "langchain>=0.1.0",  # LangChain framework
        "langchain-core>=0.1.0",  # LangChain core
        "pyautogen>=0.2.0",  # AutoGen framework
        "crewai>=0.1.0",  # CrewAI framework
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "ruff>=0.1.0",  # Linting and formatting
            "mypy>=1.0.0",
            "datasets>=2.0.0",  # For STS-Benchmark validation
            "pandas>=1.3.0",  # For data analysis in validation
            "rapidfuzz>=3.0.0",  # For fuzzy text matching in legacy comparators
        ],
        "inspector": [
            "flask>=2.0.0",  # Lightweight server for inspector UI
            "jinja2>=3.0.0",  # Template engine
        ],
        "notebook": [
            "ipython>=7.0.0",
            "ipywidgets>=8.0.0",
        ],
        "all": [
            # Dev tools
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "ruff>=0.1.0",
            "mypy>=1.0.0",
            "datasets>=2.0.0",
            "pandas>=1.3.0",
            "rapidfuzz>=3.0.0",
            # Inspector UI
            "flask>=2.0.0",
            "jinja2>=3.0.0",
            # Notebook support
            "ipython>=7.0.0",
            "ipywidgets>=8.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "cert=cert.cli:main",
            "cert-compare=cert.cli:compare_texts",
        ],
    },
    package_data={
        "cert": ["templates/*.html", "static/*"],
    },
    include_package_data=True,
)
