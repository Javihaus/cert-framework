from setuptools import setup, find_packages
import os

# Read README
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="cert-framework",
    version="1.0.0",
    author="CERT Framework Contributors",
    author_email="cert@example.com",
    description="Consistency Evaluation and Reliability Testing for LLM systems",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Javihaus/cert-framework",
    project_urls={
        "Bug Tracker": "https://github.com/Javihaus/cert-framework/issues",
        "Documentation": "https://github.com/Javihaus/cert-framework#readme",
        "Source Code": "https://github.com/Javihaus/cert-framework",
    },
    packages=find_packages(),
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
    ],
    python_requires=">=3.8",
    install_requires=[
        "typing-extensions>=4.0.0",
        "rapidfuzz>=3.0.0",  # For semantic comparison
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
        ],
        "inspector": [
            "flask>=2.0.0",  # Lightweight server for inspector UI
            "jinja2>=3.0.0",  # Template engine
        ],
        "langchain": [
            "langchain>=0.1.0",
            "langchain-core>=0.1.0",
        ],
        "notebook": [
            "ipython>=7.0.0",
            "ipywidgets>=8.0.0",
        ],
        "all": [
            "flask>=2.0.0",
            "jinja2>=3.0.0",
            "langchain>=0.1.0",
            "langchain-core>=0.1.0",
            "ipython>=7.0.0",
            "ipywidgets>=8.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "cert=cert.cli:main",
        ],
    },
    package_data={
        "cert": ["templates/*.html", "static/*"],
    },
    include_package_data=True,
)
