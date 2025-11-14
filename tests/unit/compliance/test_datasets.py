"""Tests for compliance datasets module."""

import json
from datetime import datetime

from cert.compliance.datasets import (
    EvaluationDataset,
    EvaluationExample,
    create_dataset_from_audit_log,
    merge_datasets,
)


def test_evaluation_example_creation():
    """Test creating an evaluation example."""
    example = EvaluationExample(
        query="What is the capital of France?",
        context="France is a country in Europe. Its capital is Paris.",
        expected_answer="Paris",
        metadata={"difficulty": "easy"},
    )

    assert example.query == "What is the capital of France?"
    assert example.context == "France is a country in Europe. Its capital is Paris."
    assert example.expected_answer == "Paris"
    assert example.metadata["difficulty"] == "easy"


def test_evaluation_dataset_creation():
    """Test creating an evaluation dataset."""
    examples = [
        EvaluationExample(query="Question 1", context="Context 1", expected_answer="Answer 1"),
        EvaluationExample(query="Question 2", context="Context 2", expected_answer="Answer 2"),
    ]

    dataset = EvaluationDataset(
        name="test_dataset",
        version="1.0",
        created_at=datetime.now(),
        examples=examples,
        metadata={"source": "manual"},
    )

    assert dataset.name == "test_dataset"
    assert dataset.version == "1.0"
    assert len(dataset.examples) == 2
    assert dataset.metadata["source"] == "manual"


def test_dataset_save_and_load(tmp_path):
    """Test saving and loading datasets."""
    examples = [
        EvaluationExample(query="Question 1", context="Context 1", expected_answer="Answer 1")
    ]

    original = EvaluationDataset(
        name="test", version="1.0", created_at=datetime.now(), examples=examples
    )

    # Save
    file_path = tmp_path / "test_dataset.json"
    original.save(str(file_path))

    # Verify file exists
    assert file_path.exists()

    # Load
    loaded = EvaluationDataset.load(str(file_path))

    assert loaded.name == original.name
    assert loaded.version == original.version
    assert len(loaded.examples) == len(original.examples)
    assert loaded.examples[0].query == original.examples[0].query


def test_create_dataset_from_audit_log(tmp_path):
    """Test creating dataset from audit log."""
    # Create test audit log
    audit_log = tmp_path / "test_audit.jsonl"

    entries = [
        {
            "type": "request",
            "timestamp": "2024-01-01T00:00:00",
            "query": "Test query 1",
            "context": "Test context 1",
            "answer": "Test answer 1",
            "is_compliant": True,
            "accuracy_score": 0.95,
        },
        {
            "type": "request",
            "timestamp": "2024-01-01T00:01:00",
            "query": "Test query 2",
            "context": "Test context 2",
            "answer": "Test answer 2",
            "is_compliant": False,
            "accuracy_score": 0.65,
        },
        {
            "type": "request",
            "timestamp": "2024-01-01T00:02:00",
            "query": "Test query 3",
            "context": "Test context 3",
            "answer": "Test answer 3",
            "is_compliant": True,
            "accuracy_score": 0.92,
        },
    ]

    with open(audit_log, "w") as f:
        for entry in entries:
            f.write(json.dumps(entry) + "\n")

    # Create dataset (only compliant)
    dataset = create_dataset_from_audit_log(
        str(audit_log),
        name="test",
        version="1.0",
        sample_size=10,
        filter_compliant=True,
    )

    assert dataset.name == "test"
    assert dataset.version == "1.0"
    assert len(dataset.examples) == 2  # Only compliant ones

    # Create dataset (all)
    dataset_all = create_dataset_from_audit_log(
        str(audit_log),
        name="test_all",
        version="1.0",
        sample_size=10,
        filter_compliant=False,
    )

    assert len(dataset_all.examples) == 3  # All entries


def test_create_dataset_respects_sample_size(tmp_path):
    """Test that sample_size parameter is respected."""
    audit_log = tmp_path / "test_audit.jsonl"

    # Create 10 entries
    with open(audit_log, "w") as f:
        for i in range(10):
            entry = {
                "type": "request",
                "query": f"Query {i}",
                "context": f"Context {i}",
                "answer": f"Answer {i}",
                "is_compliant": True,
            }
            f.write(json.dumps(entry) + "\n")

    # Request only 5
    dataset = create_dataset_from_audit_log(
        str(audit_log), name="test", version="1.0", sample_size=5
    )

    assert len(dataset.examples) == 5


def test_merge_datasets():
    """Test merging multiple datasets."""
    dataset1 = EvaluationDataset(
        name="dataset1",
        version="1.0",
        created_at=datetime.now(),
        examples=[EvaluationExample(query="Q1", context="C1", expected_answer="A1")],
    )

    dataset2 = EvaluationDataset(
        name="dataset2",
        version="1.0",
        created_at=datetime.now(),
        examples=[EvaluationExample(query="Q2", context="C2", expected_answer="A2")],
    )

    merged = merge_datasets([dataset1, dataset2], name="merged", version="2.0")

    assert merged.name == "merged"
    assert merged.version == "2.0"
    assert len(merged.examples) == 2
    assert merged.examples[0].query == "Q1"
    assert merged.examples[1].query == "Q2"
    assert merged.metadata["total_examples"] == 2


def test_dataset_with_empty_audit_log(tmp_path):
    """Test creating dataset from empty audit log."""
    audit_log = tmp_path / "empty_audit.jsonl"
    audit_log.touch()

    dataset = create_dataset_from_audit_log(str(audit_log), name="empty", version="1.0")

    assert len(dataset.examples) == 0


def test_dataset_skips_incomplete_entries(tmp_path):
    """Test that entries without context or answer are skipped."""
    audit_log = tmp_path / "incomplete_audit.jsonl"

    entries = [
        {
            "type": "request",
            "query": "Complete",
            "context": "Has context",
            "answer": "Has answer",
            "is_compliant": True,
        },
        {
            "type": "request",
            "query": "No context",
            "context": "",  # Empty
            "answer": "Has answer",
            "is_compliant": True,
        },
        {
            "type": "request",
            "query": "No answer",
            "context": "Has context",
            "answer": "",  # Empty
            "is_compliant": True,
        },
    ]

    with open(audit_log, "w") as f:
        for entry in entries:
            f.write(json.dumps(entry) + "\n")

    dataset = create_dataset_from_audit_log(str(audit_log), name="test", version="1.0")

    # Only complete entry should be included
    assert len(dataset.examples) == 1
    assert dataset.examples[0].query == "Complete"
