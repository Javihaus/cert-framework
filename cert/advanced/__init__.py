"""Advanced features for cert-framework.

These features require additional dependencies and are not needed for core functionality.
"""

# Make trajectory optional
try:
    from cert.advanced.trajectory import (
        TrajectoryConfig,
        analyze_trajectory,
        load_model_for_monitoring,
        unload_model,
    )

    TRAJECTORY_AVAILABLE = True
except ImportError as e:
    TRAJECTORY_AVAILABLE = False
    _trajectory_import_error = str(e)

    def _trajectory_not_available(*args, **kwargs):
        raise ImportError(
            "Trajectory analysis requires additional dependencies. "
            "Install with: pip install cert-framework[trajectory]\n"
            f"Original error: {_trajectory_import_error}"
        )

    # Create stub functions that raise helpful errors
    TrajectoryConfig = _trajectory_not_available
    analyze_trajectory = _trajectory_not_available
    load_model_for_monitoring = _trajectory_not_available
    unload_model = _trajectory_not_available


# Make coordination optional
try:
    from cert.advanced.coordination import (
        CoordinationMetrics,
        CoordinationOrchestrator,
    )

    COORDINATION_AVAILABLE = True
except ImportError as e:
    COORDINATION_AVAILABLE = False
    _coordination_import_error = str(e)

    def _coordination_not_available(*args, **kwargs):
        raise ImportError(
            "Coordination monitoring requires additional dependencies. "
            "Install with: pip install cert-framework[coordination]\n"
            f"Original error: {_coordination_import_error}"
        )

    CoordinationOrchestrator = _coordination_not_available
    CoordinationMetrics = _coordination_not_available


__all__ = [
    "TRAJECTORY_AVAILABLE",
    "TrajectoryConfig",
    "analyze_trajectory",
    "load_model_for_monitoring",
    "unload_model",
    "COORDINATION_AVAILABLE",
    "CoordinationOrchestrator",
    "CoordinationMetrics",
]
