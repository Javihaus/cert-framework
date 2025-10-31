"""Test that trajectory analysis is truly optional."""

import sys

def test_core_imports():
    """Test that core features work without trajectory dependencies."""
    print("Testing core imports...")

    try:
        from cert import trace
        from cert.evaluation import Evaluator
        from cert.compliance import generate_report
        print("✓ Core imports successful")
        return True
    except ImportError as e:
        print(f"✗ Core import failed: {e}")
        return False

def test_trajectory_optional():
    """Test that trajectory import fails gracefully."""
    print("\nTesting trajectory optional behavior...")

    try:
        from cert.advanced import TRAJECTORY_AVAILABLE

        if not TRAJECTORY_AVAILABLE:
            print("✓ Trajectory correctly marked as unavailable")

            # Try to use it - should get helpful error
            try:
                from cert.advanced import analyze_trajectory
                result = analyze_trajectory("test", None, "prompt")
                print("✗ Trajectory should have raised ImportError")
                return False
            except ImportError as e:
                if "pip install cert-framework[trajectory]" in str(e):
                    print("✓ Helpful error message provided")
                    return True
                else:
                    print(f"✗ Error message not helpful: {e}")
                    return False
        else:
            print("⚠ Trajectory is available (dependencies installed)")
            return True

    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

def test_coordination_optional():
    """Test that coordination import fails gracefully."""
    print("\nTesting coordination optional behavior...")

    try:
        from cert.advanced import COORDINATION_AVAILABLE

        if not COORDINATION_AVAILABLE:
            print("✓ Coordination correctly marked as unavailable")

            # Try to use it - should get helpful error
            try:
                from cert.advanced import CoordinationOrchestrator
                orchestrator = CoordinationOrchestrator(None)
                print("✗ Coordination should have raised ImportError")
                return False
            except ImportError as e:
                if "pip install cert-framework[coordination]" in str(e):
                    print("✓ Helpful error message provided")
                    return True
                else:
                    print(f"✗ Error message not helpful: {e}")
                    return False
        else:
            print("⚠ Coordination is available (dependencies installed)")
            return True

    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    core_ok = test_core_imports()
    trajectory_ok = test_trajectory_optional()
    coordination_ok = test_coordination_optional()

    if core_ok and trajectory_ok and coordination_ok:
        print("\n✓ All tests passed!")
        sys.exit(0)
    else:
        print("\n✗ Some tests failed")
        sys.exit(1)
