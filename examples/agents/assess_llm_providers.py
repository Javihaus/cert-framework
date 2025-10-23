"""Example: Assess LLM providers using CERT Framework.

This script demonstrates how to use the CERT agents module to assess
multiple language models across providers.

Requirements:
    pip install cert-framework[benchmark]

Environment Variables:
    ANTHROPIC_API_KEY - Anthropic API key
    OPENAI_API_KEY - OpenAI API key
    GOOGLE_API_KEY - Google API key (optional)
    XAI_API_KEY - xAI API key (optional)
    HF_TOKEN - HuggingFace API token (optional)
"""

import asyncio
import json
import os
from datetime import datetime

from cert.agents import (
    AssessmentConfig,
    CERTAgentEngine,
)
from cert.agents.providers import (
    AnthropicProvider,
    GoogleProvider,
    OpenAIProvider,
    XAIProvider,
    HuggingFaceProvider,
)


async def main():
    """Run assessment comparing multiple LLM providers."""

    print("="*70)
    print("CERT Framework - Agentic System Assessment")
    print("="*70)
    print()

    # Load API keys from environment
    api_keys = {}
    provider_classes = {
        'anthropic': (AnthropicProvider, 'ANTHROPIC_API_KEY'),
        'openai': (OpenAIProvider, 'OPENAI_API_KEY'),
        'google': (GoogleProvider, 'GOOGLE_API_KEY'),
        'xai': (XAIProvider, 'XAI_API_KEY'),
        'huggingface': (HuggingFaceProvider, 'HF_TOKEN'),
    }

    # Initialize available providers
    providers = {}
    configured_models = {}

    for provider_name, (provider_class, env_var) in provider_classes.items():
        api_key = os.environ.get(env_var)
        if api_key:
            try:
                providers[provider_name] = provider_class(api_key=api_key, timeout=30)
                print(f"✓ Initialized {provider_name} provider")

                # Add models for this provider
                if provider_name == 'anthropic':
                    configured_models[provider_name] = ['claude-3-5-haiku-20241022']
                elif provider_name == 'openai':
                    configured_models[provider_name] = ['gpt-4o-mini']
                elif provider_name == 'google':
                    configured_models[provider_name] = ['gemini-2.0-flash-exp']
                elif provider_name == 'xai':
                    configured_models[provider_name] = ['grok-2-latest']
                elif provider_name == 'huggingface':
                    configured_models[provider_name] = ['deepseek-ai/DeepSeek-R1-Distill-Qwen-7B']

            except Exception as e:
                print(f"✗ Failed to initialize {provider_name}: {e}")
        else:
            print(f"⊘ Skipping {provider_name} (no API key in {env_var})")

    if not providers:
        print("\n❌ No providers available. Set at least one API key.")
        print("   Example: export ANTHROPIC_API_KEY=your_key_here")
        return

    print()

    # Configure assessment
    config = AssessmentConfig(
        consistency_trials=10,  # Reduce for faster testing
        performance_trials=5,
        providers=configured_models,
        embedding_model_name='all-MiniLM-L6-v2',
        max_tokens=1024,
        temperature=0.7,
        output_dir='./assessment_results',
        enabled_metrics=['consistency', 'performance', 'latency', 'output_quality', 'robustness'],
    )

    print(f"Configuration:")
    print(f"  Consistency trials: {config.consistency_trials}")
    print(f"  Performance trials: {config.performance_trials}")
    print(f"  Enabled metrics: {', '.join(config.enabled_metrics)}")
    print(f"  Output directory: {config.output_dir}")
    print()

    # Initialize assessment engine
    engine = CERTAgentEngine(config=config, providers=providers)

    # Run assessment
    print("Starting assessment...")
    print()

    summary = await engine.run_full_assessment(
        test_consistency=True,
        test_performance=True,
        test_latency=True,
        test_output_quality=True,
        test_robustness=True,
    )

    print()
    print("="*70)
    print("ASSESSMENT RESULTS")
    print("="*70)
    print()

    # Display consistency results
    if summary.consistency_results:
        print("CONSISTENCY SCORES (behavioral reliability):")
        print("-"*70)
        for result in sorted(summary.consistency_results, key=lambda r: r.consistency_score, reverse=True):
            print(f"  {result.provider:12} / {result.model:30} : {result.consistency_score:.3f}")
        print()

    # Display performance results
    if summary.performance_results:
        print("PERFORMANCE SCORES (output quality):")
        print("-"*70)
        for result in sorted(summary.performance_results, key=lambda r: r.mean_score, reverse=True):
            print(f"  {result.provider:12} / {result.model:30} : {result.mean_score:.3f}")
        print()

    # Display latency results
    if summary.latency_results:
        print("LATENCY (response time):")
        print("-"*70)
        for result in sorted(summary.latency_results, key=lambda r: r.mean_latency_seconds):
            print(f"  {result.provider:12} / {result.model:30} : {result.mean_latency_seconds:.2f}s (p95: {result.p95_latency_seconds:.2f}s)")
        print()

    # Display output quality results
    if summary.output_quality_results:
        print("OUTPUT QUALITY:")
        print("-"*70)
        for result in summary.output_quality_results:
            print(
                f"  {result.provider:12} / {result.model:30} : "
                f"diversity={result.semantic_diversity_score:.3f}, "
                f"repetition={result.repetition_score:.3f}"
            )
        print()

    # Display robustness results
    if summary.robustness_results:
        print("ROBUSTNESS (error handling):")
        print("-"*70)
        for result in summary.robustness_results:
            print(
                f"  {result.provider:12} / {result.model:30} : "
                f"error_rate={result.error_rate:.1f}%, "
                f"success={result.successful_trials}/{result.num_trials}"
            )
        print()

    # Save results to JSON
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(config.output_dir, f"assessment_summary_{timestamp}.json")

    with open(output_file, 'w') as f:
        json.dump(summary.to_dict(), f, indent=2)

    print(f"Results saved to: {output_file}")
    print()


if __name__ == "__main__":
    asyncio.run(main())
