"""
Cost Optimization Engine
=========================

Analyzes traces to identify cost optimization opportunities including
model downgrades, caching, and prompt optimization.
"""

import statistics
from typing import Dict, List, Any, Optional
from collections import Counter, defaultdict
from cert.value.analyzer import CostAnalyzer


class Optimizer:
    """
    Cost optimization recommendations engine.

    This class analyzes traces and suggests ways to reduce costs while
    maintaining quality.
    """

    def __init__(self, traces_path: str):
        """
        Initialize the optimizer.

        Args:
            traces_path: Path to JSONL file containing traces
        """
        self.analyzer = CostAnalyzer(traces_path)

    def recommend_model_changes(
        self,
        confidence_threshold: float = 0.85
    ) -> List[Dict[str, Any]]:
        """
        Suggest cheaper models for tasks with acceptable accuracy.

        Args:
            confidence_threshold: Tasks above this confidence may use cheaper models

        Returns:
            List of model change recommendations
        """
        recommendations = []

        # Group traces by model and task type
        tasks_by_model = self._group_by_model(self.analyzer.traces)

        # Model cost hierarchy (relative costs)
        model_downgrades = {
            "gpt-4": ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
            "gpt-4-turbo": ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
            "gpt-4o": ["gpt-4o-mini", "gpt-3.5-turbo"],
            "claude-3-opus": ["claude-3-sonnet", "claude-3-haiku"],
            "claude-3-sonnet": ["claude-3-haiku"],
        }

        for model, traces in tasks_by_model.items():
            if len(traces) < 10:  # Need sufficient data
                continue

            # Calculate average confidence
            confidences = [
                t.get("metadata", {}).get("confidence", 0.5)
                for t in traces
                if "confidence" in t.get("metadata", {})
            ]

            if not confidences:
                continue

            avg_confidence = statistics.mean(confidences)
            total_cost = sum(t.get("cost", 0) or 0 for t in traces)

            # If confidence is consistently high, might be over-engineering
            if avg_confidence > confidence_threshold:
                cheaper_models = model_downgrades.get(model, [])

                if cheaper_models:
                    # Estimate savings (assume 50-70% cost reduction)
                    estimated_savings = total_cost * 0.6

                    recommendations.append({
                        "type": "model_downgrade",
                        "current_model": model,
                        "recommended_models": cheaper_models,
                        "reason": f"High average confidence ({avg_confidence:.2f}) suggests cheaper model would suffice",
                        "current_cost": round(total_cost, 2),
                        "estimated_savings": round(estimated_savings, 2),
                        "estimated_percentage": 60,
                        "task_count": len(traces),
                        "confidence_level": "high" if avg_confidence > 0.9 else "medium",
                    })

        return sorted(recommendations, key=lambda x: x["estimated_savings"], reverse=True)

    def find_caching_opportunities(
        self,
        min_repetitions: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Identify repeated prompts that could be cached.

        Args:
            min_repetitions: Minimum number of repetitions to recommend caching

        Returns:
            List of caching opportunities
        """
        opportunities = []

        # Count input occurrences
        inputs = []
        for trace in self.analyzer.traces:
            input_data = trace.get("input_data")
            if input_data:
                # Convert to string for comparison
                input_str = str(input_data)
                inputs.append((input_str, trace.get("cost", 0) or 0))

        # Count occurrences
        input_counts = Counter([inp[0] for inp in inputs])

        # Calculate costs per input
        input_costs = defaultdict(float)
        for input_str, cost in inputs:
            input_costs[input_str] += cost

        for input_str, count in input_counts.items():
            if count >= min_repetitions:
                total_cost = input_costs[input_str]
                cost_per_call = total_cost / count

                # Potential savings: all but first call could be cached
                potential_savings = cost_per_call * (count - 1)

                # Truncate long prompts for display
                display_input = input_str[:100] + "..." if len(input_str) > 100 else input_str

                opportunities.append({
                    "type": "caching",
                    "input_preview": display_input,
                    "repetitions": count,
                    "cost_per_call": round(cost_per_call, 4),
                    "total_cost": round(total_cost, 2),
                    "potential_savings": round(potential_savings, 2),
                    "recommendation": "Implement prompt caching or memoization",
                })

        return sorted(opportunities, key=lambda x: x["potential_savings"], reverse=True)

    def suggest_prompt_optimizations(
        self,
        long_prompt_threshold: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Find prompts that could be shortened to reduce costs.

        Args:
            long_prompt_threshold: Token threshold for "long" prompts

        Returns:
            List of prompt optimization suggestions
        """
        suggestions = []

        for trace in self.analyzer.traces:
            input_data = str(trace.get("input_data", ""))
            estimated_tokens = len(input_data) // 4  # Rough estimate

            if estimated_tokens > long_prompt_threshold:
                cost = trace.get("cost", 0) or 0

                # Estimate savings from 30% prompt reduction
                potential_savings = cost * 0.3

                suggestions.append({
                    "type": "prompt_shortening",
                    "trace_id": trace.get("metadata", {}).get("response_id", "unknown"),
                    "current_length_tokens": estimated_tokens,
                    "cost": round(cost, 4),
                    "potential_savings": round(potential_savings, 4),
                    "recommendation": "Consider summarizing context or using retrieval to reduce prompt length",
                })

        return sorted(suggestions, key=lambda x: x["potential_savings"], reverse=True)

    def find_batch_opportunities(self) -> List[Dict[str, Any]]:
        """
        Identify tasks that could be batched for cost savings.

        Returns:
            List of batching opportunities
        """
        opportunities = []

        # Group traces by time windows (hourly)
        hourly_groups = self._group_by_hour(self.analyzer.traces)

        for hour, traces in hourly_groups.items():
            if len(traces) >= 10:  # Significant number of calls
                total_cost = sum(t.get("cost", 0) or 0 for t in traces)

                # Estimate 20% savings from batching
                estimated_savings = total_cost * 0.2

                opportunities.append({
                    "type": "batching",
                    "time_window": hour,
                    "call_count": len(traces),
                    "current_cost": round(total_cost, 2),
                    "potential_savings": round(estimated_savings, 2),
                    "recommendation": "Batch similar requests to reduce API overhead",
                })

        return sorted(opportunities, key=lambda x: x["potential_savings"], reverse=True)

    def get_optimization_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive optimization summary.

        Returns:
            Summary of all optimization opportunities
        """
        model_recommendations = self.recommend_model_changes()
        caching_opportunities = self.find_caching_opportunities()
        prompt_optimizations = self.suggest_prompt_optimizations()
        batch_opportunities = self.find_batch_opportunities()

        total_potential_savings = (
            sum(r["estimated_savings"] for r in model_recommendations) +
            sum(o["potential_savings"] for o in caching_opportunities) +
            sum(s["potential_savings"] for s in prompt_optimizations) +
            sum(o["potential_savings"] for o in batch_opportunities)
        )

        current_total = self.analyzer.total_cost()

        return {
            "current_monthly_cost": round(current_total, 2),
            "total_potential_savings": round(total_potential_savings, 2),
            "potential_savings_percentage": round(
                (total_potential_savings / current_total * 100) if current_total > 0 else 0, 1
            ),
            "optimizations": {
                "model_downgrades": {
                    "count": len(model_recommendations),
                    "savings": round(sum(r["estimated_savings"] for r in model_recommendations), 2),
                    "top_opportunities": model_recommendations[:3],
                },
                "caching": {
                    "count": len(caching_opportunities),
                    "savings": round(sum(o["potential_savings"] for o in caching_opportunities), 2),
                    "top_opportunities": caching_opportunities[:3],
                },
                "prompt_optimization": {
                    "count": len(prompt_optimizations),
                    "savings": round(sum(s["potential_savings"] for s in prompt_optimizations), 2),
                    "top_opportunities": prompt_optimizations[:3],
                },
                "batching": {
                    "count": len(batch_opportunities),
                    "savings": round(sum(o["potential_savings"] for o in batch_opportunities), 2),
                    "top_opportunities": batch_opportunities[:3],
                },
            },
        }

    def _group_by_model(self, traces: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Group traces by model.

        Args:
            traces: List of traces

        Returns:
            Dictionary mapping model names to trace lists
        """
        groups = defaultdict(list)

        for trace in traces:
            model = trace.get("model", "unknown")
            groups[model].append(trace)

        return dict(groups)

    def _group_by_hour(self, traces: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Group traces by hour.

        Args:
            traces: List of traces

        Returns:
            Dictionary mapping hours to trace lists
        """
        from datetime import datetime

        groups = defaultdict(list)

        for trace in traces:
            timestamp_str = trace.get("timestamp")
            if not timestamp_str:
                continue

            try:
                dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                hour_key = dt.strftime("%Y-%m-%d %H:00")
                groups[hour_key].append(trace)
            except (ValueError, AttributeError):
                continue

        return dict(groups)
