"""Framework integrations for LangChain, AutoGen, and CrewAI."""

# Conditional imports - only import if framework is installed
__all__ = []

# LangChain
try:
    from .langchain import CertChainWrapper, wrap_chain, CERTLangChainCallback  # noqa: F401

    __all__.extend(["CertChainWrapper", "wrap_chain", "CERTLangChainCallback"])
except ImportError:
    pass

# AutoGen
try:
    from .autogen import CERTAutoGenMonitor  # noqa: F401

    __all__.append("CERTAutoGenMonitor")
except ImportError:
    pass

# CrewAI
try:
    from .crewai import CERTCrewAICallback  # noqa: F401

    __all__.append("CERTCrewAICallback")
except ImportError:
    pass
