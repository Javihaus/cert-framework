#!/usr/bin/env python3
"""Quick verification script for temperature configuration changes."""

import sys

try:
    from cert.agents import AssessmentConfig, TemperatureMode

    print("✓ Imports successful")
    print()

    # Test default config
    config = AssessmentConfig()
    assert config.temperature == 0.0, f"Expected temperature=0.0, got {config.temperature}"
    print(f"✓ Default temperature: {config.temperature}")

    # Test TemperatureMode enum
    assert TemperatureMode.DETERMINISTIC.value == 0.0
    assert TemperatureMode.FACTUAL.value == 0.3
    assert TemperatureMode.BALANCED.value == 0.7
    assert TemperatureMode.CREATIVE.value == 1.0
    print(f"✓ Temperature modes: {[m.name + '=' + str(m.value) for m in TemperatureMode]}")

    # Test from_temperature_mode
    config_det = AssessmentConfig.from_temperature_mode(TemperatureMode.DETERMINISTIC, consistency_trials=10)
    assert config_det.temperature == 0.0
    assert config_det.consistency_trials == 10
    print(f"✓ from_temperature_mode works correctly")

    # Test validation
    try:
        bad_config = AssessmentConfig(temperature=1.5)
        print("✗ Temperature validation failed - should have raised ValueError")
        sys.exit(1)
    except ValueError as e:
        print(f"✓ Temperature validation works: {str(e)[:50]}...")

    print()
    print("=" * 60)
    print("ALL TESTS PASSED")
    print("=" * 60)

except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
