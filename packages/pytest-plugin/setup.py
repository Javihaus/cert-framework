from setuptools import setup, find_packages
import pathlib
import re

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

# Single source of truth for version - read from __init__.py
def get_version():
    init_py = pathlib.Path("cert_pytest/__init__.py").read_text()
    match = re.search(r'^__version__ = ["\']([^"\']+)["\']', init_py, re.M)
    if match:
        return match.group(1)
    raise RuntimeError("Unable to find version string in cert_pytest/__init__.py")

setup(
    name="pytest-cert",
    version=get_version(),
    author="CERT Framework Contributors",
    description="pytest plugin for CERT framework - LLM system reliability testing",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Javihaus/cert-framework",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Framework :: Pytest",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Testing",
    ],
    python_requires=">=3.8",
    install_requires=[
        "pytest>=7.0.0",
        "cert-framework>=0.2.0",  # Match actual cert-framework version
    ],
    entry_points={
        "pytest11": [
            "cert = cert_pytest.plugin",
        ]
    },
)
