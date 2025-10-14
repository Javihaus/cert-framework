from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="pytest-cert",
    version="1.0.0",
    author="CERT Framework Contributors",
    description="pytest plugin for CERT framework - LLM system reliability testing",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/cert-framework",
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
        "cert-framework>=1.0.0",
    ],
    entry_points={
        "pytest11": [
            "cert = cert_pytest.plugin",
        ]
    },
)
