"""
ROI Calculator Module
=====================

Calculates return on investment for AI/LLM systems by comparing
costs with business value generated.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from cert.value.analyzer import CostAnalyzer


class ROICalculator:
    """
    Calculator for AI/LLM return on investment.

    This class combines cost data with business value metrics to
    calculate ROI and other financial metrics.
    """

    def __init__(
        self,
        traces_path: str,
        business_value_per_task: Optional[float] = None
    ):
        """
        Initialize the ROI calculator.

        Args:
            traces_path: Path to JSONL file containing traces
            business_value_per_task: Value generated per successful task (in USD)
        """
        self.analyzer = CostAnalyzer(traces_path)
        self.business_value_per_task = business_value_per_task

    def calculate_roi(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        accuracy_threshold: float = 0.7
    ) -> Dict[str, Any]:
        """
        Calculate return on investment.

        Args:
            start_date: Start of period
            end_date: End of period
            accuracy_threshold: Minimum accuracy for task success

        Returns:
            Dictionary with ROI metrics
        """
        # Get cost data
        total_cost = self.analyzer.total_cost(start_date, end_date)

        # Filter traces by date
        filtered_traces = self.analyzer._filter_by_date(
            self.analyzer.traces,
            start_date,
            end_date
        )

        # Count successful tasks
        successful_tasks = sum(
            1 for t in filtered_traces
            if self._is_successful_task(t, accuracy_threshold)
        )

        # Calculate business value
        if self.business_value_per_task is None:
            return {
                "total_cost": round(total_cost, 2),
                "successful_tasks": successful_tasks,
                "cost_per_task": round(
                    total_cost / successful_tasks, 4
                ) if successful_tasks > 0 else None,
                "note": "Set business_value_per_task to calculate ROI",
            }

        total_value = successful_tasks * self.business_value_per_task

        # Calculate ROI: ((Value - Cost) / Cost) * 100
        roi_percentage = (
            ((total_value - total_cost) / total_cost) * 100
            if total_cost > 0 else 0
        )

        # Calculate payback period (months to break even)
        if total_value > total_cost and start_date and end_date:
            days = (end_date - start_date).days
            if days > 0:
                daily_value = total_value / days
                daily_cost = total_cost / days
                if daily_value > daily_cost:
                    days_to_breakeven = total_cost / (daily_value - daily_cost)
                    payback_months = days_to_breakeven / 30
                else:
                    payback_months = None
            else:
                payback_months = None
        else:
            payback_months = None

        return {
            "period": {
                "start": start_date.isoformat() + "Z" if start_date else "N/A",
                "end": end_date.isoformat() + "Z" if end_date else "N/A",
            },
            "costs": {
                "total": round(total_cost, 2),
                "per_task": round(
                    total_cost / successful_tasks, 4
                ) if successful_tasks > 0 else 0,
            },
            "value": {
                "total": round(total_value, 2),
                "per_task": self.business_value_per_task,
                "successful_tasks": successful_tasks,
            },
            "roi": {
                "percentage": round(roi_percentage, 2),
                "net_value": round(total_value - total_cost, 2),
                "payback_months": round(payback_months, 1) if payback_months else None,
            },
            "metrics": {
                "value_cost_ratio": round(
                    total_value / total_cost, 2
                ) if total_cost > 0 else 0,
                "margin_percentage": round(
                    ((total_value - total_cost) / total_value) * 100, 2
                ) if total_value > 0 else 0,
            },
        }

    def calculate_lifetime_value(
        self,
        monthly_tasks: int,
        months: int = 12,
        accuracy_rate: float = 0.85
    ) -> Dict[str, Any]:
        """
        Project lifetime value over a period.

        Args:
            monthly_tasks: Expected number of tasks per month
            months: Number of months to project
            accuracy_rate: Expected success rate

        Returns:
            Lifetime value projection
        """
        if self.business_value_per_task is None:
            return {"error": "business_value_per_task must be set"}

        # Estimate monthly cost from current data
        summary = self.analyzer.get_summary(days=30)
        monthly_cost = summary["costs"]["monthly_projection"]

        # Calculate monthly value
        successful_monthly_tasks = monthly_tasks * accuracy_rate
        monthly_value = successful_monthly_tasks * self.business_value_per_task
        monthly_net = monthly_value - monthly_cost

        # Project over period
        total_value = monthly_value * months
        total_cost = monthly_cost * months
        net_value = monthly_net * months

        return {
            "projection_period_months": months,
            "assumptions": {
                "monthly_tasks": monthly_tasks,
                "accuracy_rate": round(accuracy_rate, 2),
                "value_per_task": self.business_value_per_task,
            },
            "monthly": {
                "value": round(monthly_value, 2),
                "cost": round(monthly_cost, 2),
                "net": round(monthly_net, 2),
                "roi_percentage": round(
                    ((monthly_value - monthly_cost) / monthly_cost) * 100, 2
                ) if monthly_cost > 0 else 0,
            },
            "lifetime": {
                "total_value": round(total_value, 2),
                "total_cost": round(total_cost, 2),
                "net_value": round(net_value, 2),
                "roi_percentage": round(
                    ((total_value - total_cost) / total_cost) * 100, 2
                ) if total_cost > 0 else 0,
            },
        }

    def compare_scenarios(
        self,
        scenarios: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Compare ROI across different scenarios.

        Args:
            scenarios: List of scenario dicts with keys:
                      name, business_value_per_task, monthly_tasks, accuracy_rate

        Returns:
            List of scenario comparisons
        """
        results = []

        for scenario in scenarios:
            # Temporarily set business value
            original_value = self.business_value_per_task
            self.business_value_per_task = scenario.get("business_value_per_task")

            ltv = self.calculate_lifetime_value(
                monthly_tasks=scenario.get("monthly_tasks", 1000),
                months=12,
                accuracy_rate=scenario.get("accuracy_rate", 0.85),
            )

            results.append({
                "name": scenario.get("name", "Unnamed"),
                "assumptions": ltv.get("assumptions", {}),
                "monthly_net": ltv.get("monthly", {}).get("net", 0),
                "annual_roi_percentage": ltv.get("lifetime", {}).get("roi_percentage", 0),
                "annual_net_value": ltv.get("lifetime", {}).get("net_value", 0),
            })

            # Restore original value
            self.business_value_per_task = original_value

        # Sort by annual net value
        results.sort(key=lambda x: x["annual_net_value"], reverse=True)

        return results

    def _is_successful_task(self, trace: Dict[str, Any], threshold: float) -> bool:
        """
        Determine if a trace represents a successful task.

        Args:
            trace: Trace dictionary
            threshold: Accuracy threshold

        Returns:
            True if task was successful
        """
        # Check for errors
        if trace.get("error"):
            return False

        # Check for output
        if not trace.get("output_data"):
            return False

        # Check confidence if available
        confidence = trace.get("metadata", {}).get("confidence", 1.0)
        if confidence < threshold:
            return False

        return True


def calculate_cost_savings(
    current_costs: Dict[str, float],
    optimized_costs: Dict[str, float]
) -> Dict[str, Any]:
    """
    Calculate cost savings from optimization.

    Args:
        current_costs: Dictionary of current costs by category
        optimized_costs: Dictionary of optimized costs by category

    Returns:
        Savings analysis
    """
    total_current = sum(current_costs.values())
    total_optimized = sum(optimized_costs.values())
    total_savings = total_current - total_optimized

    savings_by_category = {}
    for category in current_costs:
        current = current_costs.get(category, 0)
        optimized = optimized_costs.get(category, 0)
        savings = current - optimized
        savings_percentage = (savings / current * 100) if current > 0 else 0

        savings_by_category[category] = {
            "current": round(current, 2),
            "optimized": round(optimized, 2),
            "savings": round(savings, 2),
            "percentage": round(savings_percentage, 1),
        }

    return {
        "total": {
            "current": round(total_current, 2),
            "optimized": round(total_optimized, 2),
            "savings": round(total_savings, 2),
            "percentage": round(
                (total_savings / total_current * 100) if total_current > 0 else 0, 1
            ),
        },
        "by_category": savings_by_category,
        "annual_savings": round(total_savings * 12, 2),  # Assuming monthly costs
    }
