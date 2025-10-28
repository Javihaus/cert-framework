"""
Visualization and reporting for trajectory analysis.

MAPPING (for marketing consistency):
- Perplexity → "Potential Energy" (uncertainty)
- Entropy → "Kinetic Energy" (distribution spread)
- Combined → "Total Hamiltonian Energy"

These are metaphors that create memorable visual artifacts for sales/compliance.
"""

import numpy as np
import matplotlib.pyplot as plt
from typing import Optional

from cert.advanced.trajectory.types import TrajectoryAnalysis


class HamiltonianVisualizer:
    """
    Creates professional visualizations using physics-inspired metaphors.

    This is the marketing layer - sophisticated terminology on solid metrics.
    """

    @staticmethod
    def plot_trajectory(
        analysis: TrajectoryAnalysis,
        save_path: Optional[str] = None,
        show_plot: bool = True,
    ) -> plt.Figure:
        """
        Generate comprehensive trajectory visualization.

        Args:
            analysis: TrajectoryAnalysis result
            save_path: Optional path to save figure
            show_plot: Whether to display plot

        Returns:
            matplotlib Figure object
        """
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        fig.suptitle(
            f"Reasoning Trajectory Analysis: {analysis.model_name}\n"
            f"Status: {'✓ PASSED' if analysis.passed_quality_check else '✗ FAILED'}",
            fontsize=16,
            fontweight="bold",
            color="green" if analysis.passed_quality_check else "red",
        )

        steps = [m.step for m in analysis.metrics]
        perplexities = [
            m.perplexity if m.perplexity != float("inf") else 100
            for m in analysis.metrics
        ]
        entropies = [m.top_k_entropy for m in analysis.metrics]
        surprises = [m.cumulative_surprise for m in analysis.metrics]

        # Plot 1: "Potential Energy" (Perplexity)
        axes[0, 0].plot(steps, perplexities, "b-", linewidth=2.5, label="Perplexity")
        axes[0, 0].axhline(
            y=analysis.perplexity_threshold,
            color="r",
            linestyle="--",
            linewidth=2,
            alpha=0.7,
            label=f"Threshold ({analysis.perplexity_threshold})",
        )
        axes[0, 0].fill_between(steps, perplexities, alpha=0.2, color="blue")
        axes[0, 0].set_xlabel("Generation Step", fontsize=12, fontweight="bold")
        axes[0, 0].set_ylabel(
            "Perplexity (Potential Energy)", fontsize=12, fontweight="bold"
        )
        axes[0, 0].set_title(
            "Model Uncertainty Trajectory", fontsize=13, fontweight="bold"
        )
        axes[0, 0].legend(fontsize=10)
        axes[0, 0].grid(True, alpha=0.3)

        # Plot 2: "Kinetic Energy" (Entropy)
        axes[0, 1].plot(steps, entropies, "g-", linewidth=2.5, label="Top-k Entropy")
        axes[0, 1].axhline(
            y=analysis.entropy_threshold,
            color="r",
            linestyle="--",
            linewidth=2,
            alpha=0.7,
            label=f"Threshold ({analysis.entropy_threshold})",
        )
        axes[0, 1].fill_between(steps, entropies, alpha=0.2, color="green")
        axes[0, 1].set_xlabel("Generation Step", fontsize=12, fontweight="bold")
        axes[0, 1].set_ylabel(
            "Entropy (Kinetic Energy)", fontsize=12, fontweight="bold"
        )
        axes[0, 1].set_title(
            "Distribution Spread Trajectory", fontsize=13, fontweight="bold"
        )
        axes[0, 1].legend(fontsize=10)
        axes[0, 1].grid(True, alpha=0.3)

        # Plot 3: "Total Hamiltonian Energy"
        # Normalize to similar scales for visualization
        norm_perp = np.array(perplexities) / analysis.perplexity_threshold
        norm_entr = np.array(entropies) / analysis.entropy_threshold
        total_energy = norm_perp + norm_entr

        axes[1, 0].plot(
            steps, total_energy, "purple", linewidth=2.5, label="Total Energy"
        )
        axes[1, 0].fill_between(steps, total_energy, alpha=0.3, color="purple")
        axes[1, 0].axhline(
            y=2.0,
            color="r",
            linestyle="--",
            linewidth=2,
            alpha=0.7,
            label="Critical Threshold",
        )
        axes[1, 0].set_xlabel("Generation Step", fontsize=12, fontweight="bold")
        axes[1, 0].set_ylabel("Normalized Total Energy", fontsize=12, fontweight="bold")
        axes[1, 0].set_title(
            "Hamiltonian Energy Trajectory (Combined Metric)",
            fontsize=13,
            fontweight="bold",
        )
        axes[1, 0].legend(fontsize=10)
        axes[1, 0].grid(True, alpha=0.3)

        # Plot 4: Cumulative Surprise (Hallucination Risk)
        axes[1, 1].plot(
            steps, surprises, "orange", linewidth=2.5, label="Cumulative Surprise"
        )
        axes[1, 1].fill_between(steps, surprises, alpha=0.3, color="orange")
        axes[1, 1].axhline(
            y=analysis.surprise_threshold,
            color="r",
            linestyle="--",
            linewidth=2,
            alpha=0.7,
            label=f"Threshold ({analysis.surprise_threshold})",
        )
        axes[1, 1].set_xlabel("Generation Step", fontsize=12, fontweight="bold")
        axes[1, 1].set_ylabel("Cumulative Surprise", fontsize=12, fontweight="bold")
        axes[1, 1].set_title(
            "Hallucination Risk Indicator", fontsize=13, fontweight="bold"
        )
        axes[1, 1].legend(fontsize=10)
        axes[1, 1].grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            fig.savefig(save_path, dpi=300, bbox_inches="tight")
            print(f"Trajectory plot saved to: {save_path}")

        if show_plot:
            plt.show()

        return fig

    @staticmethod
    def generate_compliance_report(
        analysis: TrajectoryAnalysis, save_path: Optional[str] = None
    ) -> str:
        """
        Generate EU AI Act compliance-ready report.

        This is what you show auditors and compliance officers.
        """
        status_symbol = "✓" if analysis.passed_quality_check else "✗"
        status_text = "PASSED" if analysis.passed_quality_check else "FAILED"

        report = f"""
{"=" * 80}
REASONING TRAJECTORY QUALITY ASSESSMENT
Hamiltonian Framework Analysis Report
{"=" * 80}

MODEL INFORMATION:
------------------
Model: {analysis.model_name}
Timestamp: {analysis.timestamp}

OVERALL ASSESSMENT: {status_symbol} {status_text}

{"=" * 80}

INPUT PROMPT:
-------------
{analysis.prompt}

GENERATED OUTPUT:
-----------------
{analysis.generated_text}

{"=" * 80}

QUALITY METRICS SUMMARY:
-------------------------

1. UNCERTAINTY ANALYSIS (Perplexity / "Potential Energy"):
   - Average Perplexity: {analysis.avg_perplexity:.2f}
   - Maximum Perplexity: {analysis.max_perplexity:.2f}
   - Threshold: {analysis.perplexity_threshold:.2f}
   - Status: {status_symbol if analysis.avg_perplexity < analysis.perplexity_threshold else "✗"}
   - Interpretation: {"Model shows acceptable confidence levels" if analysis.avg_perplexity < analysis.perplexity_threshold else "Model shows elevated uncertainty"}

2. DISTRIBUTION ANALYSIS (Entropy / "Kinetic Energy"):
   - Average Entropy: {analysis.avg_entropy:.2f}
   - Maximum Entropy: {analysis.max_entropy:.2f}
   - Threshold: {analysis.entropy_threshold:.2f}
   - Status: {status_symbol if analysis.max_entropy < analysis.entropy_threshold else "✗"}
   - Interpretation: {"Token selection shows focused decision-making" if analysis.max_entropy < analysis.entropy_threshold else "Token selection shows scattered distribution"}

3. HALLUCINATION RISK (Cumulative Surprise):
   - Final Cumulative Surprise: {analysis.final_surprise:.2f}
   - Threshold: {analysis.surprise_threshold:.2f}
   - Status: {status_symbol if analysis.final_surprise < analysis.surprise_threshold else "✗"}
   - Interpretation: {"Output within expected probability ranges" if analysis.final_surprise < analysis.surprise_threshold else "Output contains unexpected low-probability tokens"}

4. GENERATION STATISTICS:
   - Total Steps: {analysis.generation_steps}
   - Tokens Generated: {analysis.generation_steps}

{"=" * 80}

COMPLIANCE INTERPRETATION:
--------------------------

Quality Status: {status_text}
Deployment Recommendation: {"Approved for automated deployment" if analysis.passed_quality_check else "Requires human review before deployment"}
Risk Level: {"LOW - Meets quality thresholds" if analysis.passed_quality_check else "ELEVATED - Quality concerns detected"}

EU AI ACT CONSIDERATIONS:
- This analysis provides quantitative monitoring of model output quality (Article 15)
- Metrics track confidence and uncertainty throughout generation
- Pass/fail thresholds enable systematic quality control
- Audit trail documents model behavior for compliance purposes (Article 19)

{"=" * 80}

TECHNICAL NOTES:
----------------
Framework: Hamiltonian Trajectory Analysis (Physics-Inspired Monitoring)
Monitoring Approach: Real-time per-token confidence tracking
Thresholds: Configurable based on risk tolerance and use case
Visualization: Energy-based trajectory plots available

{"=" * 80}
"""

        if save_path:
            with open(save_path, "w") as f:
                f.write(report)
            print(f"Compliance report saved to: {save_path}")

        return report
