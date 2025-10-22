"""Test fixtures for benchmark module tests."""

import time
from typing import List

from cert.benchmark.providers.base import ResponseMetadata


def generate_mock_responses(count: int = 10, base_text: str = "Test response") -> List[str]:
    """Generate mock LLM responses for testing.

    Args:
        count: Number of responses to generate
        base_text: Base text to use for responses

    Returns:
        List of mock responses with slight variations
    """
    responses = []
    variations = [
        "analyzing the key factors",
        "examining the main elements",
        "reviewing the primary aspects",
        "assessing the critical components",
        "evaluating the essential features",
    ]

    for i in range(count):
        variation = variations[i % len(variations)]
        response = f"{base_text} {i}: {variation} in the implementation."
        responses.append(response)

    return responses


def generate_mock_metadata(
    count: int = 10,
    mean_latency: float = 1.0,
    error_rate: float = 0.0,
) -> List[ResponseMetadata]:
    """Generate mock ResponseMetadata for testing.

    Args:
        count: Number of metadata objects to generate
        mean_latency: Mean latency in seconds
        error_rate: Proportion of errors (0.0-1.0)

    Returns:
        List of ResponseMetadata objects
    """
    import random

    metadata_list = []

    for i in range(count):
        # Determine if this should be an error
        is_error = random.random() < error_rate

        if is_error:
            metadata = ResponseMetadata(
                response_text="",
                latency_seconds=mean_latency * 0.5,
                model="test-model",
                provider="test-provider",
                error="Simulated API error",
                timeout=random.random() < 0.3,
            )
        else:
            # Add some variance to latency
            latency = mean_latency * (0.8 + random.random() * 0.4)
            tokens_out = random.randint(50, 200)

            metadata = ResponseMetadata(
                response_text=f"Response {i} with some content here.",
                latency_seconds=latency,
                tokens_input=random.randint(20, 50),
                tokens_output=tokens_out,
                tokens_total=random.randint(70, 250),
                model="test-model",
                provider="test-provider",
                timestamp=time.time(),
            )

        metadata_list.append(metadata)

    return metadata_list


def generate_prompt_response_pairs(count: int = 5) -> List[tuple]:
    """Generate mock (prompt, response) pairs for testing.

    Args:
        count: Number of pairs to generate

    Returns:
        List of (prompt, response) tuples
    """
    prompts = [
        "Analyze the key factors in business strategy",
        "Evaluate project management considerations",
        "Assess organizational change elements",
        "Identify market analysis aspects",
        "Examine risk assessment components",
    ]

    responses = [
        "Business strategy requires clear vision, executable plans, and stakeholder alignment.",
        "Project management depends on scope definition, resource allocation, and timeline tracking.",
        "Organizational change needs leadership buy-in, communication, and change management.",
        "Market analysis involves competitive research, customer segmentation, and trend analysis.",
        "Risk assessment includes identification, prioritization, and mitigation planning.",
    ]

    pairs = []
    for i in range(min(count, len(prompts))):
        pairs.append((prompts[i], responses[i]))

    return pairs


# Sample data for consistency testing
SAMPLE_CONSISTENT_RESPONSES = [
    "The key factors are strategic planning and execution.",
    "Strategic planning and execution are the key factors.",
    "Key factors include strategic planning and execution.",
    "Execution and strategic planning are key factors.",
    "The main factors are strategic planning and execution.",
]

SAMPLE_INCONSISTENT_RESPONSES = [
    "The key factors are strategic planning and execution.",
    "User authentication is important for security.",
    "Machine learning models require training data.",
    "The weather is sunny today.",
    "Database optimization improves query performance.",
]

# Sample latency data
SAMPLE_LATENCIES_GOOD = [0.5, 0.6, 0.55, 0.58, 0.52, 0.61, 0.54, 0.59, 0.56, 0.57]
SAMPLE_LATENCIES_BAD = [0.5, 2.1, 0.6, 3.5, 0.55, 1.2, 0.58, 2.8, 0.52, 1.9]
