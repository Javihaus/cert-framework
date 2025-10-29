"""Measure module - Text consistency measurement (requires [evaluation] extras)."""

__all__ = ["measure"]


def __getattr__(name):
    """Lazy load measure function (requires evaluation extras)."""
    if name == "measure":
        try:
            from cert.measure.measure import measure

            return measure
        except ImportError as e:
            raise ImportError(
                f"measure requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    raise AttributeError(f"module 'cert.measure' has no attribute '{name}'")
