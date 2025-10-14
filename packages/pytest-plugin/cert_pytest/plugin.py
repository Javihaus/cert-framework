"""pytest plugin for CERT framework."""

import asyncio
import pytest
from typing import Any, Callable, Optional
from cert import TestRunner, GroundTruth, TestConfig, TestResult


# Shared test runner for all tests in session
_test_runner: Optional[TestRunner] = None


def pytest_configure(config):
    """Register CERT markers."""
    config.addinivalue_line(
        "markers",
        "cert_accuracy(ground_truth): mark test for accuracy validation"
    )
    config.addinivalue_line(
        "markers",
        "cert_consistency(threshold, n_trials): mark test for consistency checking"
    )


@pytest.fixture(scope="session")
def cert_runner() -> TestRunner:
    """Provide shared TestRunner instance."""
    global _test_runner
    if _test_runner is None:
        _test_runner = TestRunner()
    return _test_runner


@pytest.fixture
def cert_ground_truth(request, cert_runner: TestRunner):
    """
    Fixture to register ground truth from test marker.

    Usage:
        @pytest.mark.cert_accuracy(
            id="test-1",
            question="What is 2+2?",
            expected="4"
        )
        def test_my_agent(cert_ground_truth):
            result = my_agent()
            assert result == "4"
    """
    marker = request.node.get_closest_marker("cert_accuracy")
    if marker:
        # Extract ground truth from marker kwargs
        ground_truth = GroundTruth(**marker.kwargs)
        cert_runner.add_ground_truth(ground_truth)
        return ground_truth
    return None


@pytest.fixture
async def cert_test_accuracy(request, cert_runner: TestRunner, cert_ground_truth):
    """
    Automatically run accuracy test after the test function.

    Usage:
        @pytest.mark.cert_accuracy(
            id="test-1",
            question="What is 2+2?",
            expected="4"
        )
        async def test_my_agent(cert_test_accuracy):
            async def agent():
                return "4"

            result = await cert_test_accuracy(agent)
            assert result.status == "pass"
    """
    if not cert_ground_truth:
        pytest.skip("No ground truth defined for this test")

    async def run_accuracy_test(agent_fn: Callable):
        """Run accuracy test on the agent function."""
        result = await cert_runner.test_accuracy(
            cert_ground_truth.id,
            agent_fn
        )
        return result

    return run_accuracy_test


@pytest.fixture
async def cert_test_consistency(request, cert_runner: TestRunner):
    """
    Run consistency test on an agent function.

    Usage:
        @pytest.mark.cert_consistency(threshold=0.9, n_trials=10)
        async def test_consistency(cert_test_consistency):
            async def agent():
                return "result"

            result = await cert_test_consistency("test-id", agent)
            assert result.consistency >= 0.9
    """
    marker = request.node.get_closest_marker("cert_consistency")

    if not marker:
        pytest.skip("No consistency config defined for this test")

    # Extract config from marker
    threshold = marker.kwargs.get("threshold", 0.9)
    n_trials = marker.kwargs.get("n_trials", 10)
    timeout = marker.kwargs.get("timeout", 30000)

    config = TestConfig(
        n_trials=n_trials,
        consistency_threshold=threshold,
        timeout=timeout
    )

    async def run_consistency_test(test_id: str, agent_fn: Callable):
        """Run consistency test on the agent function."""
        result = await cert_runner.test_consistency(
            test_id,
            agent_fn,
            config
        )
        return result

    return run_consistency_test


def pytest_collection_modifyitems(config, items):
    """Add asyncio marker to async test functions."""
    for item in items:
        if asyncio.iscoroutinefunction(item.function):
            item.add_marker(pytest.mark.asyncio)


class CERTReporter:
    """Custom test reporter for CERT results."""

    def __init__(self):
        self.results = []

    def pytest_runtest_logreport(self, report):
        """Collect test results."""
        if report.when == "call":
            self.results.append(report)

    def pytest_terminal_summary(self, terminalreporter, exitstatus, config):
        """Display CERT test summary."""
        global _test_runner
        if not _test_runner:
            return

        results = _test_runner.get_results()
        if not results:
            return

        terminalreporter.section("CERT Test Results")

        for result in results:
            status_icon = "✓" if result.status == "pass" else "✗"
            color = "green" if result.status == "pass" else "red"

            terminalreporter.write_line(
                f"{status_icon} {result.test_id}",
                **{color: True}
            )

            if result.consistency is not None:
                terminalreporter.write_line(
                    f"  Consistency: {result.consistency:.1%}"
                )

            if result.accuracy is not None:
                terminalreporter.write_line(
                    f"  Accuracy: {result.accuracy:.1%}"
                )

            if result.status == "fail" and result.diagnosis:
                terminalreporter.write_line(
                    f"  Diagnosis: {result.diagnosis}",
                    yellow=True
                )

                if result.suggestions:
                    terminalreporter.write_line("  Suggestions:", yellow=True)
                    for suggestion in result.suggestions:
                        terminalreporter.write_line(
                            f"    - {suggestion}",
                            yellow=True
                        )


def pytest_configure(config):
    """Register the CERT reporter plugin."""
    config.pluginmanager.register(CERTReporter(), "cert_reporter")
