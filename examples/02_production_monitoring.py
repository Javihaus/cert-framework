"""
Example 2: Production Monitoring

Shows how to use CERT in production with database logging.
Demonstrates tracing, measurement, and database storage.
"""

import os
from datetime import datetime
from uuid import uuid4

from cert.measure import measure_detailed


def simulate_llm_call(user_input: str) -> str:
    """Simulate an LLM call (replace with your actual LLM)."""
    # In real code, this would call OpenAI, Anthropic, etc.
    return f"Response to: {user_input}"


def production_example_with_tracing():
    """Example of production usage with tracing."""
    from cert.tracing import get_tracer

    tracer = get_tracer()

    # Start a trace for this request
    trace_id = str(uuid4())
    tracer.start_trace(
        trace_id=trace_id,
        function_name="rag_pipeline",
        metadata={"user_id": "user123", "session_id": "session456"},
    )

    # User query
    user_input = "What was Apple's revenue in 2023?"
    tracer.add_input(trace_id, user_input)

    # Call LLM
    start_time = datetime.now()
    llm_output = simulate_llm_call(user_input)
    duration_ms = (datetime.now() - start_time).total_seconds() * 1000

    tracer.add_response(trace_id, llm_output)

    # Measure accuracy (if you have ground truth)
    ground_truth = "Apple's revenue in 2023 was $89.5 billion"
    result = measure_detailed(llm_output, ground_truth)

    # End trace
    tracer.end_trace(trace_id, status="success", duration_ms=duration_ms)

    print(f"Trace ID: {trace_id}")
    print(f"Confidence: {result.confidence:.2f}")
    print(f"Duration: {duration_ms:.0f}ms")


def production_example_with_database():
    """Example using database for persistent storage."""
    # Check if Supabase credentials are available
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
        print("⚠️  Skipping database example (SUPABASE_URL and SUPABASE_KEY not set)")
        print("Set these environment variables to use database storage:")
        print("  export SUPABASE_URL='https://xxx.supabase.co'")
        print("  export SUPABASE_KEY='your-key-here'")
        return

    from cert.database.client import DatabaseClient

    # Initialize database client
    db = DatabaseClient()

    # Insert a trace
    trace_id = db.insert_trace(
        function_name="rag_pipeline",
        duration_ms=245.3,
        status="success",
        input_text="What was Apple's revenue in 2023?",
        output_text="Apple's revenue in 2023 was $89.5 billion",
        metadata={"model": "gpt-4", "temperature": 0.7},
    )

    print(f"✓ Trace stored in database: {trace_id}")

    # Measure accuracy
    result = measure_detailed(
        "Apple's revenue in 2023 was $89.5 billion",
        "Apple's revenue in 2023 was $89.5 billion",
    )

    # Store measurement
    measurement_id = db.insert_measurement(
        trace_id=trace_id,
        confidence=result.confidence,
        semantic_score=result.semantic_score,
        grounding_score=result.grounding_score,
    )

    print(f"✓ Measurement stored: {measurement_id}")

    # Query recent traces
    traces = db.get_traces(limit=10, status="success")
    print(f"✓ Found {len(traces)} recent successful traces")


if __name__ == "__main__":
    print("=" * 60)
    print("Example 2: Production Monitoring")
    print("=" * 60)
    print()

    print("Tracing Example:")
    print("-" * 60)
    production_example_with_tracing()
    print()

    print("Database Example:")
    print("-" * 60)
    production_example_with_database()
    print()

    print("Next Steps:")
    print("-" * 60)
    print("1. Set up Supabase database (see database/README.md)")
    print("2. Run database/schema.sql in Supabase SQL Editor")
    print("3. Set SUPABASE_URL and SUPABASE_KEY environment variables")
    print("4. Use CERT dashboard to visualize traces and measurements")
