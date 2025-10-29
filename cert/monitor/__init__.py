"""Monitor module - LLM output monitoring (requires [evaluation] extras)."""

__all__ = ["monitor"]


def __getattr__(name):
    """Lazy load monitor function (requires evaluation extras)."""
    if name == "monitor":
        try:
            from cert.monitor.monitor import monitor

            return monitor
        except ImportError as e:
            raise ImportError(
                f"monitor requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    raise AttributeError(f"module 'cert.monitor' has no attribute '{name}'")
