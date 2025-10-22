from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="cert-framework",
    version="0.3.1",
    author="Javier Marin",
    author_email="info@cert-framework.com",
    description="A framework to test your LLM application for reliability",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Javihaus/cert-framework",
    packages=find_packages(exclude=["tests*", "examples*"]),
    python_requires=">=3.8",
    install_requires=[
        "sentence-transformers>=2.2.0,<3.0.0",
        "torch>=1.11.0",
        "transformers>=4.30.0",
        "numpy>=1.21.0",
        "typing-extensions>=4.0.0",
    ],
)
