"""Dataset versioning for CERT Framework evaluation.

Provides tools for creating, managing, and versioning evaluation datasets
with gold-standard answers for benchmarking accuracy over time.
"""

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class EvaluationExample:
    """Single evaluation example with query, context, and expected answer.

    Attributes:
        query: User query or input
        context: Context/source material
        expected_answer: Gold-standard correct answer
        metadata: Optional metadata (tags, difficulty, etc.)
    """

    query: str
    context: str
    expected_answer: str
    metadata: Optional[Dict] = None


@dataclass
class EvaluationDataset:
    """Versioned evaluation dataset.

    Attributes:
        name: Dataset name
        version: Dataset version (semantic versioning recommended)
        created_at: Creation timestamp
        examples: List of evaluation examples
        metadata: Optional dataset-level metadata
    """

    name: str
    version: str
    created_at: datetime
    examples: List[EvaluationExample]
    metadata: Optional[Dict] = None

    def save(self, path: str):
        """Save dataset to JSON file.

        Args:
            path: File path to save dataset

        Example:
            >>> dataset = EvaluationDataset(...)
            >>> dataset.save("datasets/healthcare_v1.0.json")
        """
        data = {
            "name": self.name,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "examples": [
                {
                    "query": ex.query,
                    "context": ex.context,
                    "expected_answer": ex.expected_answer,
                    "metadata": ex.metadata,
                }
                for ex in self.examples
            ],
            "metadata": self.metadata,
        }

        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f, indent=2)

    @classmethod
    def load(cls, path: str) -> "EvaluationDataset":
        """Load dataset from JSON file.

        Args:
            path: File path to load dataset from

        Returns:
            Loaded EvaluationDataset

        Example:
            >>> dataset = EvaluationDataset.load("datasets/healthcare_v1.0.json")
        """
        with open(path) as f:
            data = json.load(f)

        examples = [EvaluationExample(**ex) for ex in data["examples"]]

        return cls(
            name=data["name"],
            version=data["version"],
            created_at=datetime.fromisoformat(data["created_at"]),
            examples=examples,
            metadata=data.get("metadata"),
        )


def create_dataset_from_audit_log(
    audit_log_path: str,
    name: str,
    version: str,
    sample_size: int = 100,
    filter_compliant: bool = True,
) -> EvaluationDataset:
    """Create evaluation dataset from production audit log.

    Samples queries from audit log for manual review and annotation.
    Useful for creating evaluation datasets from real production data.

    Args:
        audit_log_path: Path to CERT audit log (JSONL format)
        name: Dataset name
        version: Dataset version
        sample_size: Number of examples to sample
        filter_compliant: Only include compliant requests (default: True)

    Returns:
        EvaluationDataset with sampled examples

    Example:
        >>> dataset = create_dataset_from_audit_log(
        ...     "cert_audit.jsonl",
        ...     name="production_sample",
        ...     version="1.0",
        ...     sample_size=50
        ... )
        >>> # Review and edit expected_answer fields
        >>> dataset.save("datasets/production_sample_v1.0.json")
    """
    examples = []

    with open(audit_log_path) as f:
        for line in f:
            if not line.strip():
                continue

            entry = json.loads(line)

            # Skip non-request entries
            if entry.get("type") != "request":
                continue

            # Filter by compliance status if requested
            if filter_compliant and not entry.get("is_compliant"):
                continue

            # Extract fields (handle different audit log formats)
            query = entry.get("query", entry.get("function", ""))
            context = entry.get("context", "")
            answer = entry.get("answer", "")

            if not context or not answer:
                continue

            example = EvaluationExample(
                query=query,
                context=context,
                expected_answer=answer,  # User should review/edit this
                metadata={
                    "timestamp": entry.get("timestamp"),
                    "accuracy_score": entry.get("accuracy_score"),
                    "source": "audit_log",
                },
            )
            examples.append(example)

            if len(examples) >= sample_size:
                break

    return EvaluationDataset(
        name=name,
        version=version,
        created_at=datetime.now(),
        examples=examples,
        metadata={
            "source": audit_log_path,
            "filter_compliant": filter_compliant,
            "sample_size": len(examples),
        },
    )


def merge_datasets(datasets: List[EvaluationDataset], name: str, version: str) -> EvaluationDataset:
    """Merge multiple datasets into one.

    Args:
        datasets: List of datasets to merge
        name: Name for merged dataset
        version: Version for merged dataset

    Returns:
        Merged EvaluationDataset

    Example:
        >>> dataset1 = EvaluationDataset.load("datasets/healthcare_v1.0.json")
        >>> dataset2 = EvaluationDataset.load("datasets/healthcare_v1.1.json")
        >>> merged = merge_datasets([dataset1, dataset2], "healthcare", "2.0")
    """
    all_examples = []
    for dataset in datasets:
        all_examples.extend(dataset.examples)

    return EvaluationDataset(
        name=name,
        version=version,
        created_at=datetime.now(),
        examples=all_examples,
        metadata={
            "merged_from": [f"{d.name}_v{d.version}" for d in datasets],
            "total_examples": len(all_examples),
        },
    )
