"""
Core monitoring engine for trajectory analysis.

HONEST VALUE:
- Tracks model confidence at each generation step
- Provides pass/fail thresholds for quality control
- Generates metrics for compliance documentation
- Catches potential hallucinations before production

MARKETING LANGUAGE:
- "Hamiltonian trajectory analysis of reasoning processes"
- "Physics-inspired monitoring for advanced AI systems"
"""

from typing import List, Optional

import numpy as np
import torch

from cert.advanced.trajectory.types import (
    ReasoningMetrics,
    TrajectoryAnalysis,
    TrajectoryConfig,
)


class ReasoningTrajectoryMonitor:
    """
    Production monitoring tool for autoregressive LLM generation.

    What it actually does:
    - Per-token perplexity tracking (uncertainty)
    - Entropy monitoring (distribution spread)
    - Cumulative surprise (low-probability tokens)
    - Quality thresholds for production gates
    """

    def __init__(self, model, tokenizer, config: TrajectoryConfig = None, device: str = "cuda"):
        """
        Initialize monitor.

        Args:
            model: HuggingFace model (AutoModelForCausalLM)
            tokenizer: Corresponding tokenizer
            config: TrajectoryConfig instance (uses defaults if None)
            device: 'cuda' or 'cpu'
        """
        self.model = model
        self.tokenizer = tokenizer
        self.config = config or TrajectoryConfig()
        self.device = device

        self.metrics_history: List[ReasoningMetrics] = []

    def monitor_generation(
        self,
        prompt: str,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> TrajectoryAnalysis:
        """
        Generate text while monitoring confidence metrics.

        Args:
            prompt: Input prompt
            max_new_tokens: Override config default
            temperature: Override config default

        Returns:
            TrajectoryAnalysis with complete results
        """
        # Use config defaults if not specified
        max_new_tokens = max_new_tokens or self.config.max_new_tokens
        temperature = temperature or self.config.temperature

        # Reset metrics
        self.metrics_history = []

        # Tokenize input
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        input_length = inputs.input_ids.shape[1]

        # Generate with score tracking
        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=True,
                return_dict_in_generate=True,
                output_scores=True,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        generated_ids = outputs.sequences[0][input_length:]
        generated_text = self.tokenizer.decode(generated_ids, skip_special_tokens=True)

        # Calculate per-step metrics
        cumulative_surprise = 0.0

        for step_idx, (token_id, scores) in enumerate(zip(generated_ids, outputs.scores)):
            # Probability distribution
            probs = torch.softmax(scores[0], dim=-1)

            # Token-level metrics
            token_prob = probs[token_id].item()
            perplexity = 1.0 / token_prob if token_prob > 0 else float("inf")

            # Top-k entropy (standard measure of distribution spread)
            top_k_probs, top_k_indices = torch.topk(probs, k=self.config.top_k)
            top_k_entropy = -torch.sum(top_k_probs * torch.log(top_k_probs + 1e-10)).item()

            # Confidence gap (how decisive is the model?)
            if len(top_k_probs) >= 2:
                logit_gap = (top_k_probs[0] - top_k_probs[1]).item()
            else:
                logit_gap = 0.0

            # Cumulative surprise tracking
            if token_prob < self.config.surprise_probability_threshold:
                cumulative_surprise += -np.log(token_prob + 1e-10)

            # Store metrics
            token_str = self.tokenizer.decode([token_id])
            self.metrics_history.append(
                ReasoningMetrics(
                    step=step_idx,
                    token=token_str,
                    perplexity=perplexity,
                    top_k_entropy=top_k_entropy,
                    logit_gap=logit_gap,
                    cumulative_surprise=cumulative_surprise,
                )
            )

        # Quality assessment
        valid_perplexities = [
            m.perplexity for m in self.metrics_history if m.perplexity != float("inf")
        ]

        avg_perplexity = np.mean(valid_perplexities) if valid_perplexities else float("inf")
        max_perplexity = max(valid_perplexities) if valid_perplexities else float("inf")
        avg_entropy = np.mean([m.top_k_entropy for m in self.metrics_history])
        max_entropy = max([m.top_k_entropy for m in self.metrics_history])
        final_surprise = cumulative_surprise

        # Pass/fail decision
        passed = (
            avg_perplexity < self.config.perplexity_threshold
            and max_entropy < self.config.entropy_threshold
            and final_surprise < self.config.surprise_threshold
        )

        # Create analysis result
        return TrajectoryAnalysis(
            model_name=self.model.config._name_or_path,
            prompt=prompt,
            generated_text=generated_text,
            metrics=self.metrics_history,
            passed_quality_check=passed,
            avg_perplexity=avg_perplexity,
            max_perplexity=max_perplexity,
            avg_entropy=avg_entropy,
            max_entropy=max_entropy,
            final_surprise=final_surprise,
            generation_steps=len(self.metrics_history),
            perplexity_threshold=self.config.perplexity_threshold,
            entropy_threshold=self.config.entropy_threshold,
            surprise_threshold=self.config.surprise_threshold,
        )
